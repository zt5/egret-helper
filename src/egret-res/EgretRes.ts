import Listener from "../common/Listener";
import * as fs from "fs";
import * as helper from "../helper";
import * as vscode from "vscode";
import * as path from "path";
import { ConfigObjWatch, devlog, log } from "../helper";

type Res = {
    url: string;
    type: string;
    name: string;
}
type ResMap = { [key: string]: Res }
export default class EgretRes extends Listener {
    public constructor(protected subscriptions: vscode.Disposable[]) {
        super();
        devlog("EgretRes constructor");
        this.addListener(vscode.workspace.onDidCreateFiles(e => {
            devlog("EgretRes start onDidCreateFiles", e);
            // this.syncRes();
        }))
        this.addListener(vscode.workspace.onDidDeleteFiles(e => {
            devlog("EgretRes start onDidDeleteFiles", e);
            // this.syncRes();
        }))
        this.addListener(vscode.workspace.onDidRenameFiles(e => {
            devlog("EgretRes start onDidRenameFiles", e);
            // this.syncRes();
        }))
        // this.syncRes();
    }
    private async syncRes() {
        const jsonPath = helper.getDefaultResJsonPath();
        if (!jsonPath || !fs.existsSync(jsonPath)) {
            devlog("EgretRes " + jsonPath + "不存在")
            log("EgretRes " + jsonPath + "不存在")
            return;
        }
        let jsonStr = fs.readFileSync(jsonPath, { encoding: "utf-8" });
        let json = JSON.parse(jsonStr);
        const resources: Res[] = json["resources"];
        if (!resources) {
            devlog("EgretRes json中没有resources节点");
            log("EgretRes json中没有resources节点")
            return;
        }
        let resMap: ResMap = {};
        for (let val of resources) {
            if (resMap[val.name] != undefined) {
                devlog(`EgretRes 资源中存在重复的key:${val.name} 直接退出 不会做任何处理`);
                log(`EgretRes 资源中存在重复的key:${val.name} 直接退出 不会做任何处理`);
                return;
            }
            resMap[val.name] = val;
        }
        const rootPath = path.dirname(jsonPath);
        await this.checkResExists(resMap, rootPath);

        helper.loopFile(rootPath, file => this.addFile(file, resMap, rootPath));

        let arr: Res[] = [];
        for (let key in resMap) {
            arr.push(resMap[key]);
        }
        json["resources"] = arr;
        fs.writeFileSync(jsonPath, JSON.stringify(json, undefined, "\t"), { encoding: "utf-8" });
    }
    private blockFile(ignores: string[], resWatch: ConfigObjWatch, file: string): boolean {
        const extName = path.extname(file).toLocaleLowerCase();
        const fileName = path.basename(file);
        for (let i = 0; i < ignores.length; i++) {
            //以.开头的是类型判断
            if (ignores[i].startsWith(".")) {

                if (extName.toLocaleLowerCase() == ignores[i].toLocaleLowerCase()) {
                    return true;
                }
            } else if (ignores[i] == fileName) {
                //忽略指定名字
                return true;
            }
        }
        //没有定义的转换类型
        if (!resWatch[extName]) {
            return true;
        }
        //过滤掉中文
        if (/.*[\u4e00-\u9fa5]+.*$/.test(file)) {
            console.log("过滤掉中文" + file);
            return true;
        }

        return false;
    };
    private converEgretName(file: string, resWatch: ConfigObjWatch) {
        const fileName = path.basename(file);
        const extName = path.extname(file);
        return fileName.replace(extName, resWatch[extName.toLocaleLowerCase()].tail);
    };
    private addFile(file: string, resMap: ResMap, rootPath: string) {
        const ignores = helper.getConfigObj().resWatchIgnore;
        const resWatch = helper.getConfigObj().resWatch;
        if (this.blockFile(ignores, resWatch, file)) return;
        const FntTail = resWatch[".fnt"].tail;
        const PngTail = resWatch[".png"].tail;
        const resName = this.converEgretName(file, resWatch);
        if (!resMap[resName]) {
            const extName = path.extname(file).toLocaleLowerCase();

            if (extName == ".fnt") {
                const fileName = path.basename(file, path.extname(file));
                if (resMap[fileName + PngTail]) {
                    //fnt字体不需要图片
                    delete resMap[fileName + PngTail];
                    return;
                }
            } else if (extName == ".png") {
                const fileName = path.basename(file, path.extname(file));
                if (resMap[fileName + FntTail]) {
                    //fnt字体不需要图片
                    return;
                }
            }

            const resType = resWatch[extName].type;
            const resUrl = path.normalize(file).replace(path.normalize(rootPath), "").replace(/\\/g, "/").slice(1);
            resMap[resName] = {
                name: resName,
                type: resType,
                url: resUrl
            };
            log(`添加新的${resName}`)
            devlog(`添加新的${resName}`)
        }
    };
    private checkResExists(resMap: { [key: string]: Res }, rootPath: string) {
        return new Promise((resolve, reject) => {
            let totalCount = Object.keys(resMap).length;
            let curCount = 0;
            const timerId = setTimeout(() => {
                reject("超时");
            }, 20000);
            for (let key in resMap) {
                const val: Res = resMap[key];
                const tmpPath = path.join(rootPath, val.url);
                fs.exists(tmpPath, exists => {
                    curCount++;
                    if (exists) {
                        //文件存在
                    } else {
                        //文件不存在;
                        devlog(`EgretRes 文件不存在 移除key:${key}`);
                        log(`EgretRes 文件不存在 移除key:${key}`);
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
        super.destroy();
    }
}