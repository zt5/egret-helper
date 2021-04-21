import { getLogger, Logger } from "./Logger";
import * as jju from "jju";

export default class WebpackStrConfig {
    public static readonly SOURCE_MAP_NAME = "main.js.map";
    private logger: Logger;
    private jsobjParam: jju.ParseOptions & jju.StringifyOptions;
    constructor() {
        this.logger = getLogger(this);
        this.jsobjParam = { reserved_keys: 'replace', quote: '"' }
    }
    public replace(str: string) {
        const { leftIndex, rightIndex, errMsg } = this.getWebpackIndex(str);
        if (errMsg || leftIndex === undefined || rightIndex === undefined) {
            this.logger.log(errMsg);
            return str;
        }
        let webpackStr = str.slice(leftIndex, rightIndex + 1);

        let jsObj = jju.parse(webpackStr, this.jsobjParam)
        if (!jsObj.webpackConfig) {
            jsObj.webpackConfig = {}
        }
        if (!jsObj.webpackConfig.output) {
            jsObj.webpackConfig.output = {};
        }
        //覆盖这些
        jsObj.webpackConfig.devtool = "source-map";
        jsObj.webpackConfig.output.sourceMapFilename = WebpackStrConfig.SOURCE_MAP_NAME;

        let output = jju.update(webpackStr, jsObj, this.jsobjParam)
        if (webpackStr != output) {
            let finalStr = str.slice(0, leftIndex) + output + str.slice(rightIndex + 1);
            this.logger.devlog(finalStr);
            return finalStr;
        }
        return str;
    }
    private getWebpackIndex(str: string) {
        let { errMsg } = this.getBuildCmd(str);
        if (errMsg) {
            return { errMsg };
        }

        let webpackBundlePluginIndex = str.search(/new\s+WebpackBundlePlugin\s*\(\s*{/g)//匹配new WebpackBundlePlugin
        if (webpackBundlePluginIndex == -1) {
            return { errMsg: `find "new WebpackBundlePlugin({" error` };
        }
        let leftIndex = str.indexOf("{", webpackBundlePluginIndex);
        let rightIndex = this.findNextBrance(str, leftIndex, str.length);
        if (rightIndex == -1) {
            return { errMsg: `find "new WebpackBundlePlugin({" right brace error` };
        }
        return { leftIndex, rightIndex };
    }
    private getBuildCmd(str: string) {
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
    private findNextBrance(str: string, startIndex: number, endIndex: number) {
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