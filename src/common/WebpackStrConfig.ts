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
        let buildCmdStartIndex = str.search(/command\s*\=\=\s*['|"]build['|"]\s*\)\s*/g)//匹配build命令
        if (buildCmdStartIndex == -1) {
            this.logger.log(`find "command == 'build')" error`);
            return str;
        }
        let buildCmdEndIndex = this.findNextBrance(str, buildCmdStartIndex, str.length);
        if (buildCmdEndIndex == -1) {
            this.logger.log(`find "command == 'build')" right brace error`);
            return str;
        }

        let webpackBundlePluginIndex = str.search(/new\s+WebpackBundlePlugin\s*\(\s*{/g)//匹配new WebpackBundlePlugin
        if (webpackBundlePluginIndex == -1) {
            this.logger.log(`find "new WebpackBundlePlugin({" error`);
            return str;
        }
        let webpackBranceLeftIndex = str.indexOf("{", webpackBundlePluginIndex);
        let webpackBranceRightIndex = this.findNextBrance(str, webpackBranceLeftIndex, str.length);
        if (webpackBranceRightIndex == -1) {
            this.logger.log(`find "new WebpackBundlePlugin({" right brace error`);
            return str;
        }
        let webpackStr = str.slice(webpackBranceLeftIndex, webpackBranceRightIndex + 1);
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
            let finalStr = str.slice(0, webpackBranceLeftIndex) + output + str.slice(webpackBranceRightIndex + 1);
            this.logger.devlog(finalStr);
            return finalStr;
        }
        return str;
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