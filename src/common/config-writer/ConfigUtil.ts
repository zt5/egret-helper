import * as fs from "fs";
import Helper from "../Helper";
export default class ConfigUtil {
    private static _instance: ConfigUtil;
    public static get instance() {
        if (!this._instance) this._instance = new ConfigUtil();
        return this._instance;
    }
    private _webpackEnabled: boolean = false;
    public async init() {
        let webpack_path = Helper.getWebpackConfigPath();
        if (fs.existsSync(webpack_path)) {
            let webpackstr = await Helper.readFile(webpack_path);
            this._webpackEnabled = this.getWebpackIsEnabled(webpackstr);
        } else {
            this._webpackEnabled = false;
        }
    }
    public get webpackEnabled() {
        return this._webpackEnabled;
    }
    public getBuildCmd(str: string) {
        let buildCmdStartIndex = str.search(/command\s*\=\=\s*['|"]build['|"]\s*\)\s*/g)//匹配build命令
        if (buildCmdStartIndex == -1) {
            return { errMsg: `find "command == 'build')" error` };
        }
        let buildCmdEndIndex = this.findNextBrance(str, buildCmdStartIndex, str.length);
        if (buildCmdEndIndex == -1) {
            return { errMsg: `find "command == 'build')" right brace error` };
        }
        return { buildCmdStartIndex, buildCmdEndIndex }
    }
    public getWebpackIsEnabled(str: string) {
        if (!str) return false;
        const { buildCmdStartIndex, buildCmdEndIndex, errMsg } = this.getBuildCmd(str);
        if (errMsg || buildCmdStartIndex === undefined || buildCmdEndIndex === undefined) {
            return false;
        }
        let webpackBundlePluginIndex = str.search(/^\s*(,)?\s*new\s+WebpackBundlePlugin((\s*\(.*)|\s*)$/g)//匹配new WebpackBundlePlugin (仅以空格，换行，逗号开头的。跳过注释//的)
        if (webpackBundlePluginIndex == -1) {
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
}