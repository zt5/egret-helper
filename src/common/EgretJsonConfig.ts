import * as helper from "../helper";
import * as fs from "fs";
import * as vscode from "vscode";
import { LaunchJsonConfType } from "../define";
import { getLogger, Logger } from "./Logger";
const json5Writer = require('json5-writer')
const JSON5 = require('json5')

export class EgretJsonConfig {
    private launchPath: string = "";
    private url: string = "";
    private logger: Logger;
    constructor() {
        this.logger = getLogger(this);
    }
    public async step(url: string) {
        this.url = url;
        this.changeVSConfig();
        await this.changeTSConfig();
        this.launchPath = helper.getLaunchJsonPath();
        this.logger.devlog("step launchPath=" + this.launchPath)
        await this.changeLaunchJson();
    }
    private changeVSConfig() {
        let conf = vscode.workspace.getConfiguration("debug.javascript");
        if (!conf.usePreview) {
            this.logger.devlog("modify debug.javascript.usePreview = true")
            conf.update("usePreview", true);
        }
    }
    private async changeTSConfig() {
        //检查tsconfig的sourceMap是否存在 不存在就设置
        let ts_config_path = helper.getTSConfigPath();
        this.logger.devlog("changeTSConfig ts_config_path=", ts_config_path)
        let ts_config_str = await helper.readFile(ts_config_path);
        const writer = json5Writer.load(ts_config_str);
        this.logger.devlog(writer)
        if (!writer.compilerOptions || !writer.compilerOptions.sourceMap) {
            this.logger.devlog("changeTSConfig modify sourceMap=true")
            writer.write({ compilerOptions: { sourceMap: true } })
            helper.writeFile(ts_config_path, writer.toSource());
        }
    }
    private async changeLaunchJson() {
        const CONF_KEY = "configurations";
        if (!this.launchPath || !fs.existsSync(this.launchPath)) {
            this.logger.devlog("changeLaunchJson create launchJson")
            await helper.writeFile(this.launchPath, this.getTemplate());
        }
        const config = await helper.readFile(this.launchPath);
        const writer = json5Writer.load(config);
        const prevJson = writer.toSource()
        const prevJsonObj = JSON5.parse(prevJson);



        let finalConfs: LaunchJsonConfType[];

        if (!prevJsonObj[CONF_KEY]) {
            this.logger.devlog("changeLaunchJson create configurations")
            finalConfs = [this.configTemplate()];

        } else {
            finalConfs = <LaunchJsonConfType[]>prevJsonObj[CONF_KEY];
            const curType = helper.getDebugBrowser()
            let findIndex = finalConfs.findIndex(val => val.type == curType);
            if (findIndex == -1) {
                this.logger.devlog("changeLaunchJson push configurations")
                finalConfs.unshift(this.configTemplate());
            } else {
                if (findIndex != 0) {
                    this.logger.devlog("changeLaunchJson sort configurations")
                    finalConfs.unshift(finalConfs.splice(findIndex, 1)[0]);
                }
                if (finalConfs[0].url != this.url) {
                    finalConfs[0].url = this.url
                }
            }
        }

        this.logger.devlog("changeLaunchJson seturl configurations" + this.url);

        let obj: { [key: string]: unknown } = { [CONF_KEY]: finalConfs };
        Object.keys(JSON5.parse(writer.toSource())).filter(item => item != CONF_KEY).forEach(args => obj[args] = undefined);

        writer.write(obj);


        const newJSON = writer.toJSON();
        if (newJSON == prevJson) {
            this.logger.devlog("changeLaunchJson skip configurations");
        } else {
            this.logger.devlog("changeLaunchJson save configurations");
            helper.writeFile(this.launchPath, newJSON);
        }

    }
    private getTemplate() {
        return `{
    // 使用 IntelliSense 了解相关属性。 
    // 悬停以查看现有属性的描述。
    // 欲了解更多信息，请访问: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        ${JSON.stringify(this.configTemplate(), undefined, "\t\t\t")}
    ]
}`
    }
    private configTemplate() {
        const curType = helper.getDebugBrowser()
        return <LaunchJsonConfType>{
            type: curType,
            request: "launch",
            name: "Egret Debug",
            url: this.url,
            webRoot: "${workspaceFolder}"
        }
    }
}