import * as fs from "fs";
import * as path from "path";
import * as helper from "../helper";
import { devlog, log } from "../helper";
import EgretServer from "./EgretServer";
import { EgretRes, EgretResMap, ConfigSyncMap, EgretServiceExtStatus } from "../define";

export default class EgretResSync {
    constructor(private father: EgretServer) {
        devlog("EgretResSync constructor");
    }
    public async start() {
        this.father.bar.extStatus = EgretServiceExtStatus.Syncing;
        return this._start().catch(err => {
            log(err);
            devlog(`EgretResSync start err=`, err);
        }).finally(() => {
            this.father.bar.extStatus = EgretServiceExtStatus.Free;
        })
    }
    private async _start() {
        const jsonPath = helper.getDefaultResJsonPath();
        if (!jsonPath || !fs.existsSync(jsonPath)) {
            devlog("EgretRes " + jsonPath + "不存在")
            return;
        }
        let jsonStr = fs.readFileSync(jsonPath, { encoding: "utf-8" });
        let json = JSON.parse(jsonStr);
        const resources: EgretRes[] = json["resources"];
        if (!resources) {
            devlog("EgretRes json中没有resources节点")
            return;
        }
        let resMap: EgretResMap = {};
        for (let val of resources) {
            if (resMap[val.name] != undefined) {
                devlog(`EgretRes 资源中存在重复的key:${val.name} 直接退出 不会做任何处理`);
                log(`资源中存在重复的key:${val.name} 直接退出 不会做任何处理`);
                return;
            }
            resMap[val.name] = val;
        }
        const rootPath = path.dirname(jsonPath);
        await this.checkResExists(resMap, rootPath);

        helper.loopFile(rootPath, file => this.addFile(file, resMap, rootPath));

        let arr: EgretRes[] = [];
        for (let key in resMap) {
            arr.push(resMap[key]);
        }
        json["resources"] = arr;
        await helper.writeFile(jsonPath, JSON.stringify(json, undefined, "\t"))
        log("default.res.json同步完成")
    }
    private blockFile(resSyncMap: ConfigSyncMap, file: string): boolean {
        const ignores = helper.getConfigObj().resMapIgnore;
        const extName = path.extname(file).toLocaleLowerCase();
        const fileName = path.basename(file);
        for (let i = 0; i < ignores.length; i++) {
            //以.开头的是类型判断
            if (ignores[i].startsWith(".")) {

                if (extName == ignores[i].toLocaleLowerCase()) {
                    devlog("过滤掉指定扩展名" + " " + extName + " " + file);
                    return true;
                }
            } else if (ignores[i] == fileName) {
                //忽略指定名字
                devlog("过滤掉指定名字" + " " + fileName + " " + file);
                return true;
            }
        }
        //没有定义的转换类型
        if (!resSyncMap[extName]) {
            devlog("过滤掉没有定义的类型" + " " + extName + " " + file);
            return true;
        }
        //过滤掉中文
        if (/.*[\u4e00-\u9fa5]+.*$/.test(file)) {
            devlog("过滤掉中文" + file);
            return true;
        }

        return false;
    };
    private converEgretName(file: string, resSyncMap: ConfigSyncMap) {
        const fileName = path.basename(file);
        const extName = path.extname(file);
        return fileName.replace(extName, resSyncMap[extName.toLocaleLowerCase()].tail);
    };
    private addFile(file: string, resMap: EgretResMap, rootPath: string) {
        const resSyncMap = helper.getConfigObj().resMap;
        if (this.blockFile(resSyncMap, file)) return;
        const resName = this.converEgretName(file, resSyncMap);
        if (!resMap[resName]) {
            const extName = path.extname(file).toLocaleLowerCase();

            const resType = resSyncMap[extName].type;
            const resUrl = path.normalize(file).replace(path.normalize(rootPath), "").replace(/\\/g, "/").slice(1);
            resMap[resName] = {
                name: resName,
                type: resType,
                url: resUrl
            };
            log(`添加新的${resName}`)
        }
    };
    private checkResExists(resMap: { [key: string]: EgretRes }, rootPath: string) {
        return new Promise((resolve, reject) => {
            let totalCount = Object.keys(resMap).length;
            let curCount = 0;
            const timerId = setTimeout(() => {
                reject("超时");
            }, 20000);
            for (let key in resMap) {
                const val: EgretRes = resMap[key];
                const tmpPath = path.join(rootPath, val.url);
                fs.exists(tmpPath, exists => {
                    curCount++;
                    if (exists) {
                        //文件存在
                    } else {
                        //文件不存在;
                        log(`文件不存在 移除key:${key}`);
                        delete resMap[key];
                    }
                    if (curCount == totalCount) {
                        clearTimeout(timerId);
                        resolve();
                    }
                });
            }
        })
    };
    public destroy() {

    }
}