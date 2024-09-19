import * as fs from "fs";
import * as jju from "jju";
import * as vscode from "vscode";
import { DebugNameHeader, LaunchJsonConfType } from "../define";
import Helper from "./Helper";
import Listener from "./Listener";
import { getLogger, Logger } from "./Logger";
export default class EgretConfigImpl extends Listener {
    protected logger: Logger;
    public constructor(protected subscriptions: vscode.Disposable[]) {
        super();
        this.logger = getLogger(this);
    }
    public async changeVSConfig() {
        let conf = vscode.workspace.getConfiguration("debug.javascript");
        if (!conf.usePreview) {
            this.logger.debug("changeVSConfig modify debug.javascript.usePreview = true")
            conf.update("usePreview", true);
        }
    }
    public async changeLaunchJson(url: string) {
        const CONF_KEY = "configurations";
        const launchPath = Helper.getLaunchJsonPath();
        const jsobjParam: jju.ParseOptions & jju.StringifyOptions = { reserved_keys: 'replace', quote: '"', quote_keys: true };
        if (!launchPath || !fs.existsSync(launchPath)) {
            this.logger.debug("changeLaunchJson create launchJson")
            await Helper.writeFile(launchPath, this.getTemplate(url));
        }
        const prevJsonStr = await Helper.readFile(launchPath);
        const jsObj = jju.parse(prevJsonStr, jsobjParam)

        let finalConfs: LaunchJsonConfType[];
        const curType = Helper.getDebugBrowser()

        if (!jsObj[CONF_KEY]) {
            this.logger.debug(`changeLaunchJson create configurations ${curType}`)
            finalConfs = [this.configTemplate(url)];

        } else {
            finalConfs = <LaunchJsonConfType[]>jsObj[CONF_KEY];

            let findIndex = finalConfs.findIndex(val => val.type == curType);
            if (findIndex == -1) {
                this.logger.debug(`changeLaunchJson push configurations ${curType}`)
                finalConfs.push(this.configTemplate(url));
            } else {
                this.logger.debug(`changeLaunchJson url replace configurations ${curType}`)
                if (finalConfs[findIndex].url != url) {
                    finalConfs[findIndex].url = url
                }
            }
        }
        let debugGroupName = "egret-helper";
        //设置选中项
        for (let conf of finalConfs) {
            let isZt5HelperConfig = false;
            //处理旧版本
            if (conf.name.indexOf(DebugNameHeader) == 0) {
                isZt5HelperConfig = true;
            }
            //处理调试配置
            if (conf.presentation) {
                if (conf.presentation.group == debugGroupName) {
                    isZt5HelperConfig = true;
                }
            }
            if (isZt5HelperConfig) {
                conf.presentation = {
                    hidden: conf.type !== curType,
                    group: debugGroupName,
                }
            }
        }

        this.logger.debug("changeLaunchJson save all configurations");
        jsObj[CONF_KEY] = finalConfs;
        let output = jju.update(prevJsonStr, jsObj, jsobjParam)
        await Helper.writeFile(launchPath, output);
        this.logger.debug("changeLaunchJson save all configurations ok");
    }
    private getTemplate(url: string) {
        return `{
    // 使用 IntelliSense 了解相关属性。 
    // 悬停以查看现有属性的描述。
    // 欲了解更多信息，请访问: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        ${JSON.stringify(this.configTemplate(url), undefined, "\t\t\t").trimEnd().slice(0, -1)}        }
    ]
}`
    }
    private configTemplate(url: string) {
        const curType = Helper.getDebugBrowser()
        return <LaunchJsonConfType>{
            type: curType,
            request: "launch",
            name: Helper.getDebugName(),
            url: url,
            webRoot: "${workspaceFolder}"
        }
    }
    public async changeTsConfig() {
        //检查tsconfig的sourceMap是否存在 不存在就设置
        const jsobjParam: jju.ParseOptions & jju.StringifyOptions = { reserved_keys: 'replace', quote: '"', quote_keys: true }
        let ts_config_path = Helper.getTSConfigPath();
        this.logger.debug("changeTSConfig ts_config_path=", ts_config_path)
        let ts_config_str = await Helper.readFile(ts_config_path);

        let jsObj = jju.parse(ts_config_str, jsobjParam)

        this.logger.debug(jsObj)
        if (!jsObj.compilerOptions || !jsObj.compilerOptions.sourceMap) {
            this.logger.debug("changeTSConfig modify sourceMap=true")
            if (!jsObj.compilerOptions) jsObj.compilerOptions = {};
            jsObj.compilerOptions.sourceMap = true;
            let output = jju.update(ts_config_str, jsObj, jsobjParam)
            Helper.writeFile(ts_config_path, output);
        }
    }
}
