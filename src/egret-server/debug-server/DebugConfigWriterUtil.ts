import * as fs from "fs";
import { EgretCompileType } from "../../define";
import Helper from "../../common/Helper";
export default class DebugConfigWriterUtil {
    private static _instance: DebugConfigWriterUtil;
    public static get instance() {
        if (!this._instance) this._instance = new DebugConfigWriterUtil();
        return this._instance;
    }
    public async checkWebpackEnabled() {
        let webpack_path = Helper.getWebpackConfigPath();
        if (fs.existsSync(webpack_path)) {
            let webpackstr = await Helper.readFile(webpack_path);
            return this.getWebpackIsEnabled(webpackstr);
        } else {
            return false;
        }
    }
    public getRunCmd(str: string) {
        let runCmdStartIndex = str.search(/command\s*\=\=\s*['|"]run['|"]\s*\)\s*/g)//匹配run命令
        if (runCmdStartIndex == -1) {
            return { errMsg: `find "command == 'run')" error` };
        }
        let runCmdEndIndex = this.findNextBrance(str, runCmdStartIndex, str.length);
        if (runCmdEndIndex == -1) {
            return { errMsg: `find "command == 'run')" right brace error` };
        }
        return { runCmdStartIndex, runCmdEndIndex }
    }
    public getWebpackIsEnabled(str: string) {
        if (!str) return false;
        const { runCmdStartIndex, runCmdEndIndex, errMsg } = this.getRunCmd(str);
        if (errMsg || runCmdStartIndex === undefined || runCmdEndIndex === undefined) {
            return false;
        }
        const buildCmdStr = str.slice(runCmdStartIndex, runCmdEndIndex + 1);
        let WebpackDevServerPluginIndex = buildCmdStr.search(/^\s*(,)?\s*new\s+WebpackDevServerPlugin((\s*\(.*)|\s*)$/gm)//匹配new WebpackDevServerPlugin (仅以空格，换行，逗号开头的。跳过注释//的)
        if (WebpackDevServerPluginIndex == -1) {
            return false;
        }
        return true;
    }
    //找寻起点第一个大括号后的 对应的第一个关闭大括号
    public findNextBrance(str: string, startIndex: number, endIndex: number) {
        let leftBraceNums = 0;
        let rightBraceNums = 0;
        for (let i = startIndex; i < endIndex; i++) {
            if (str.charAt(i) == "{") {
                leftBraceNums++;
            } else if (str.charAt(i) == "}") {
                rightBraceNums++;
            }

            if (leftBraceNums != 0 && leftBraceNums == rightBraceNums) {
                return i;
            }
        }
        return -1;
    }
    public async getEgretCompileMode() {
        const compileMode = Helper.getConfigObj().egretCompileType;
        switch (compileMode) {
            case EgretCompileType.auto:
                const webpackEnabled = await this.checkWebpackEnabled();
                if (webpackEnabled) return EgretCompileType.webpack;
                else return EgretCompileType.legacy;
        }
        return compileMode;
    }
}