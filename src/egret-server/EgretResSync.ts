import * as fs from "fs";
import * as path from "path";
import EgretController from "./EgretController";
import { EgretRes, EgretResMap, ConfigSyncMap, EgretServiceExtStatus, EgretGroups } from "../define";
import { getLogger, Logger, showLog } from "../common/Logger";
import Helper from "../common/Helper";

export default class EgretResSync {
    private logger: Logger;
    constructor(private controller: EgretController) {
        this.logger = getLogger(this);
    }
    public async start() {
        this.controller.bar.extStatus = EgretServiceExtStatus.Syncing;
        showLog();
        return this._start().catch(err => {
            this.logger.error(err);
        }).finally(() => {
            this.controller.bar.extStatus = EgretServiceExtStatus.Free;
        })
    }
    private async _start() {
        const jsonPath = Helper.getDefaultResJsonPath();
        if (!jsonPath || !fs.existsSync(jsonPath)) {
            this.logger.warn("EgretRes " + jsonPath + "不存在")
            return;
        }
        let jsonStr = fs.readFileSync(jsonPath, { encoding: "utf-8" });
        let json = JSON.parse(jsonStr);
        const resources: EgretRes[] = json["resources"];
        if (!resources) {
            this.logger.warn("EgretRes json中没有resources节点")
            return;
        }
        let resMap: EgretResMap = {};
        for (let val of resources) {
            if (resMap[val.name] != undefined) {
                this.logger.warn(`资源中存在重复的key:${val.name} 直接退出 不会做任何处理`);
                return;
            }
            resMap[val.name] = val;
        }

        const groups: EgretGroups[] = json["groups"];


        const rootPath = path.dirname(jsonPath);
        await this.checkResExists(groups, resMap, rootPath);

        Helper.loopFile(rootPath, file => this.addFile(file, resMap, rootPath));

        let arr: EgretRes[] = [];
        for (let key in resMap) {
            arr.push(resMap[key]);
        }
        json["resources"] = arr;
        if (groups) json["groups"] = groups;
        await Helper.writeFile(jsonPath, JSON.stringify(json, undefined, "\t"))
        this.logger.log("default.res.json同步完成")
    }
    private blockFile(resSyncMap: ConfigSyncMap, file: string): boolean {
        const ignores = Helper.getConfigObj().resMapIgnore;
        const extName = path.extname(file).toLocaleLowerCase();
        const fileName = path.basename(file);
        let normalFilePath = path.normalize(file);
        while (normalFilePath.indexOf(path.sep) != -1) normalFilePath = normalFilePath.replace(path.sep, "/");
        for (let i = 0; i < ignores.length; i++) {
            let igonreLowItem = ignores[i].toLocaleLowerCase();
            if (igonreLowItem.startsWith(".")) {
                //以.开头的类型
                if (extName == igonreLowItem) {
                    this.logger.debug("过滤掉指定扩展名" + " " + extName + " " + file);
                    return true;
                }
            } else if (igonreLowItem == fileName.toLocaleLowerCase()) {
                //忽略指定名字
                this.logger.debug("过滤掉指定名字" + " " + fileName + " " + file);
                return true;
            } else if (igonreLowItem.indexOf("/") != -1) {
                //路径格式 判断末尾是否相等
                if (normalFilePath.toLocaleLowerCase().endsWith(igonreLowItem)) {
                    this.logger.debug("过滤掉路径末尾" + " " + ignores[i] + " " + file);
                    return true;
                }
            }
        }
        //没有定义的转换类型
        if (!resSyncMap[extName]) {
            this.logger.debug("过滤掉没有定义的类型" + " " + extName + " " + file);
            return true;
        }
        //过滤掉中文
        if (/.*[\u4e00-\u9fa5]+.*$/.test(file)) {
            this.logger.debug("过滤掉中文" + file);
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
        const resSyncMap = Helper.getConfigObj().resMap;
        if (this.blockFile(resSyncMap, file)) return;
        const FntTail = resSyncMap[".fnt"].tail;
        const PngTail = resSyncMap[".png"].tail;

        const resName = this.converEgretName(file, resSyncMap);
        if (!resMap[resName]) {
            const extName = path.extname(file).toLocaleLowerCase();


            if (extName == ".fnt") {
                const fileName = path.basename(file, path.extname(file));
                const fntPng = fileName + PngTail;
                if (resMap[fntPng]) {
                    //fnt字体不需要图片
                    delete resMap[fntPng];
                    this.logger.debug(`fnt字体不需要添加图片,已经存在png，移除key:${fntPng}`)
                }
            } else if (extName == ".png") {
                const fileName = path.basename(file, path.extname(file));
                if (resMap[fileName + FntTail]) {
                    //fnt字体不需要图片
                    this.logger.debug(`fnt字体不需要添加图片,已经存在fnt,跳过key:${resName}`)
                    return;
                }
            }


            const resType = resSyncMap[extName].type;
            const resUrl = path.normalize(file).replace(path.normalize(rootPath), "").replace(/\\/g, "/").slice(1);
            resMap[resName] = {
                name: resName,
                type: resType,
                url: resUrl
            };
            this.logger.log(`添加新的${resName}`)
        }
    };
    private checkResExists(groups: EgretGroups[], resMap: { [key: string]: EgretRes }, rootPath: string) {
        return new Promise<void>((resolve, reject) => {
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
                        this.logger.warn(`文件不存在 移除key:${key}`);
                        if (groups && groups.length) {
                            for (let i = 0; i < groups.length; i++) {
                                let keys = groups[i].keys.split(",");
                                let isChange = false;
                                for (let j = keys.length - 1; j >= 0; j--) {
                                    if (keys[j].trim() == key) {
                                        isChange = true;
                                        keys.splice(j, 1);
                                        this.logger.warn(`移除group:${groups[i].name}中的key:${key}`);
                                    }
                                }
                                groups[i].keys = keys.join(",");
                            }
                        }
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
        this.logger.debug("destroy");
    }
}