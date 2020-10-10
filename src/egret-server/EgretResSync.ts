import * as fs from "fs";
import * as path from "path";
import * as helper from "../helper";
import { toasterr } from "../helper";
import EgretServer from "./EgretServer";
import { EgretRes, EgretResMap, ConfigSyncMap, EgretServiceExtStatus } from "../define";
import { getLogger, Logger, showLog } from "../common/Log";
import { localize } from "../common/Language";

export default class EgretResSync {
    private logger: Logger;
    constructor(private father: EgretServer) {
        this.logger = getLogger(this);
        this.logger.devlog("constructor");
    }
    public async start() {
        this.father.bar.extStatus = EgretServiceExtStatus.Syncing;
        showLog();
        return this._start().catch(err => {
            toasterr(err);
            this.logger.log(err);
            this.logger.devlog(`[start] err=`, err);
        }).finally(() => {
            this.father.bar.extStatus = EgretServiceExtStatus.Free;
        })
    }
    private async _start() {
        const jsonPath = helper.getDefaultResJsonPath();
        if (!jsonPath || !fs.existsSync(jsonPath)) {
            this.logger.log(localize("sync.json.notExist", `${jsonPath}`));
            toasterr(localize("sync.json.notExist", `${jsonPath}`));
            return;
        }
        let jsonStr = fs.readFileSync(jsonPath, { encoding: "utf-8" });
        let json = JSON.parse(jsonStr);
        const resources: EgretRes[] = json["resources"];
        if (!resources) {
            this.logger.log(localize("sync.json.resourcesNotExist"))
            toasterr(localize("sync.json.resourcesNotExist"));
            return;
        }
        let resMap: EgretResMap = {};
        for (let val of resources) {
            if (resMap[val.name] != undefined) {
                this.logger.log(localize("sync.json.hasSameKey", val.name));
                toasterr(localize("sync.json.hasSameKey", val.name));
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
        this.logger.log(localize("sync.json.complete", jsonPath));
    }
    private blockFile(resSyncMap: ConfigSyncMap, file: string): boolean {
        const ignores = helper.getConfigObj().resMapIgnore;
        const extName = path.extname(file).toLocaleLowerCase();
        const fileName = path.basename(file);
        let normalFilePath = path.normalize(file);
        while (normalFilePath.indexOf(path.sep) != -1) normalFilePath = normalFilePath.replace(path.sep, "/");
        for (let i = 0; i < ignores.length; i++) {
            let igonreLowItem = ignores[i].toLocaleLowerCase();
            if (igonreLowItem.startsWith(".")) {
                //以.开头的类型
                if (extName == igonreLowItem) {
                    this.logger.log(localize("sync.filter.dotStart", extName, file));
                    return true;
                }
            } else if (igonreLowItem == fileName.toLocaleLowerCase()) {
                //忽略指定名字
                this.logger.log(localize("sync.filter.name", fileName, file));
                return true;
            } else if (igonreLowItem.indexOf("/") != -1) {
                //路径格式 判断末尾是否相等
                if (normalFilePath.toLocaleLowerCase().endsWith(igonreLowItem)) {
                    this.logger.log(localize("sync.filter.pathend", ignores[i], file));
                    return true;
                }
            }
        }
        //没有定义的转换类型
        if (!resSyncMap[extName]) {
            this.logger.log(localize("sync.filter.undefined", extName, file));
            return true;
        }
        //过滤掉中文
        if (/.*[\u4e00-\u9fa5]+.*$/.test(file)) {
            this.logger.log(localize("sync.filter.cn", file));
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
            this.logger.log(localize("sync.new", resName))
        }
    };
    private checkResExists(resMap: { [key: string]: EgretRes }, rootPath: string) {
        return new Promise((resolve, reject) => {
            let totalCount = Object.keys(resMap).length;
            let curCount = 0;
            const timerId = setTimeout(() => {
                reject(localize("sync.timeout"));
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
                        this.logger.log(localize("sync.removeKey", key));
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
        this.logger.devlog("destroy");
    }
}