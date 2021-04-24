import ConfigWriterImpl from "../ConfigWriterImpl";
import * as fs from "fs";
import * as jju from "jju";
import ConfigWriterUtil from "../ConfigWriterUtil";
import Helper from "../../Helper";
import { showLog } from "../../Logger";

export default class ConfigWebpackWriter extends ConfigWriterImpl {
    public static readonly SOURCE_MAP_NAME = "main.js.map";
    public async changeExt() {
        let webpack_path = Helper.getWebpackConfigPath();
        if (fs.existsSync(webpack_path)) {
            let webpackstr = await Helper.readFile(webpack_path);
            webpackstr = this.replace(webpackstr);
            await Helper.writeFile(webpack_path, webpackstr);
        } else {
            Helper.toasterr(`file ${webpack_path} not exist!!!`, {
                "查看log": () => {
                    showLog();
                }
            });
        }
    }
    public replace(str: string) {
        const { leftIndex, rightIndex, errMsg } = this.getWebpackIndex(str);
        if (errMsg || leftIndex === undefined || rightIndex === undefined) {
            this.logger.error(errMsg);
            return str;
        }
        let webpackStr = str.slice(leftIndex, rightIndex + 1);

        const jsobjParam: jju.ParseOptions & jju.StringifyOptions = { reserved_keys: 'replace', quote: '"' };

        let jsObj = jju.parse(webpackStr, jsobjParam)
        if (!jsObj.webpackConfig) {
            jsObj.webpackConfig = {}
        }
        if (!jsObj.webpackConfig.output) {
            jsObj.webpackConfig.output = {};
        }
        //覆盖这些
        jsObj.webpackConfig.devtool = "source-map";
        jsObj.webpackConfig.output.sourceMapFilename = ConfigWebpackWriter.SOURCE_MAP_NAME;

        let output = jju.update(webpackStr, jsObj, jsobjParam)
        if (webpackStr != output) {
            let finalStr = str.slice(0, leftIndex) + output + str.slice(rightIndex + 1);
            this.logger.debug("webpack config changed");
            return finalStr;
        }
        return str;
    }
    private getWebpackIndex(str: string) {
        let { errMsg } = ConfigWriterUtil.instance.getBuildCmd(str);
        if (errMsg) {
            return { errMsg };
        }

        let webpackBundlePluginIndex = str.search(/new\s+WebpackBundlePlugin\s*\(\s*{/g)//匹配new WebpackBundlePlugin
        if (webpackBundlePluginIndex == -1) {
            return { errMsg: `find "new WebpackBundlePlugin({" error` };
        }
        let leftIndex = str.indexOf("{", webpackBundlePluginIndex);
        let rightIndex = ConfigWriterUtil.instance.findNextBrance(str, leftIndex, str.length);
        if (rightIndex == -1) {
            return { errMsg: `find "new WebpackBundlePlugin({" right brace error` };
        }
        return { leftIndex, rightIndex };
    }
}