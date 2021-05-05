import Helper from "./Helper";
import * as fs from "fs";
import { getLogger, Logger, showLog } from "./Logger";
import DebugConfigWriterUtil from "../egret-server/debug-server/DebugConfigWriterUtil";
import { EgretCompileType } from "../define";

export default class EgretConfigPrepare {
    private logger: Logger;
    constructor() {
        this.logger = getLogger(this);
    }
    public async start() {
        const compileType = await DebugConfigWriterUtil.instance.getEgretCompileMode();
        if (compileType == EgretCompileType.webpack) await this.disableDebugServerWatch();
    }
    public async disableDebugServerWatch() {
        let devJs_path = Helper.getDevServerIndexJs();
        if (fs.existsSync(devJs_path)) {
            let devJsStr = await Helper.readFile(devJs_path);
            devJsStr = this.replaceDevJsStr(devJsStr);
            await Helper.writeFile(devJs_path, devJsStr);
        } else {
            Helper.toasterr(`file ${devJs_path} not exist!!!`, {
                "查看log": () => {
                    showLog();
                }
            });
        }
    }
    private replaceDevJsStr(str: string) {
        let { errMsg, startIndex, endIndex } = this.getDevJsStartDevServerIndex(str);
        if (errMsg || startIndex === undefined || endIndex === undefined) {
            this.logger.error(errMsg);
            return str;
        }
        let cutStr = str.slice(startIndex, endIndex);
        const useAppExp = /compilerApp\s*\.\s*use\s*\(\s*middleware\s*\(\s*compiler\s*,\s*middlewareOptions\s*\)\s*\)(;)?/g
        let useAppIndex = cutStr.search(useAppExp)//匹配 compilerApp.use(middleware(compiler, middlewareOptions)) 命令
        if (useAppIndex == -1) {
            this.logger.debug(`not find "compilerApp.use(middleware(compiler, middlewareOptions))" , skip`);
            return str;
        }
        cutStr = cutStr.replace(useAppExp, `
        //--------egret-helper unwatch change begin--------
        const devMiddleware = middleware(compiler, middlewareOptions);
        devMiddleware.waitUntilValid(()=>{devMiddleware.close();});
        compilerApp.use(devMiddleware);
        //--------egret-helper unwatch change end--------
        `)
        return str.slice(0, startIndex) + cutStr + str.slice(endIndex);
    }
    private getDevJsStartDevServerIndex(str: string) {
        let startIndex = str.search(/\s*EgretWebpackBundler\s*\.\s*prototype\s*\.\s*startDevServer\s*\=\s*function\s*\(\s*options\s*\)\s*\{/g)//匹配build命令
        if (startIndex == -1) {
            return { errMsg: `find "EgretWebpackBundler.prototype.startDevServer = function (options) {" error` };
        }
        let endIndex = DebugConfigWriterUtil.instance.findNextBrance(str, startIndex, str.length);
        if (endIndex == -1) {
            return { errMsg: `find "EgretWebpackBundler.prototype.startDevServer = function (options) {" right brace error` };
        }
        return { startIndex, endIndex }
    }

}