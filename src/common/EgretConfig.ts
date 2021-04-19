import * as fs from "fs";
import * as jju from "jju";
import { ParseOptions, StringifyOptions } from "jju";
import * as vscode from "vscode";
import { LaunchJsonConfType } from "../define";
import * as helper from "../helper";
import Listener from "./Listener";
import { getLogger, Logger } from "./Logger";
import WebpackStrConfig from "./WebpackStrConfig";

export class EgretConfig extends Listener {
    private launchPath: string = "";
    private url: string = "";
    private logger: Logger;
    private jsobjParam: ParseOptions & StringifyOptions;
    private isRunning = false;
    constructor(protected subscriptions: vscode.Disposable[]) {
        super();
        this.logger = getLogger(this);
        this.jsobjParam = { reserved_keys: 'replace', quote: '"', quote_keys: true }
    }
    public async step(url: string) {
        if (this.isRunning) return;
        this.isRunning = true;
        return this._step(url).catch(err => {
            this.logger.devlog(err);
        }).finally(() => {
            this.isRunning = false;
        });
    }
    private async _step(url: string) {
        this.url = url;
        this.changeVSConfig();
        if (helper.getConfigObj().webpackMode) {
            await this.changeWebpackConfig();
        } else {
            await this.changeTSConfig();
        }
        this.launchPath = helper.getLaunchJsonPath();
        this.logger.devlog("step launchPath=" + this.launchPath)
        await this.changeLaunchJson();
    }
    private async changeWebpackConfig() {
        let webpack_path = helper.getWebpackConfigPath();
        if (fs.existsSync(webpack_path)) {
            let webpackstr = await helper.readFile(webpack_path);
            webpackstr = new WebpackStrConfig().replace(webpackstr);
            await helper.writeFile(webpack_path, webpackstr);
        } else {
            helper.toasterr(`file ${webpack_path} not exist!!!`);
        }
    }
    private changeVSConfig() {
        let conf = vscode.workspace.getConfiguration("debug.javascript");
        if (!conf.usePreview) {
            this.logger.devlog("changeVSConfig modify debug.javascript.usePreview = true")
            conf.update("usePreview", true);
        }
    }
    private async changeTSConfig() {
        //检查tsconfig的sourceMap是否存在 不存在就设置
        let ts_config_path = helper.getTSConfigPath();
        this.logger.devlog("changeTSConfig ts_config_path=", ts_config_path)
        let ts_config_str = await helper.readFile(ts_config_path);

        let jsObj = jju.parse(ts_config_str, this.jsobjParam)

        this.logger.devlog(jsObj)
        if (!jsObj.compilerOptions || !jsObj.compilerOptions.sourceMap) {
            this.logger.devlog("changeTSConfig modify sourceMap=true")
            if (!jsObj.compilerOptions) jsObj.compilerOptions = {};
            jsObj.compilerOptions.sourceMap = true;
            let output = jju.update(ts_config_str, jsObj, this.jsobjParam)
            helper.writeFile(ts_config_path, output);
        }
    }
    private async changeLaunchJson() {
        const CONF_KEY = "configurations";
        if (!this.launchPath || !fs.existsSync(this.launchPath)) {
            this.logger.devlog("changeLaunchJson create launchJson")
            await helper.writeFile(this.launchPath, this.getTemplate());
        }
        const prevJsonStr = await helper.readFile(this.launchPath);
        const jsObj = jju.parse(prevJsonStr, this.jsobjParam)

        let finalConfs: LaunchJsonConfType[];
        const curType = helper.getDebugBrowser()

        if (!jsObj[CONF_KEY]) {
            this.logger.devlog(`changeLaunchJson create configurations ${curType}`)
            finalConfs = [this.configTemplate()];

        } else {
            finalConfs = <LaunchJsonConfType[]>jsObj[CONF_KEY];

            let findIndex = finalConfs.findIndex(val => val.type == curType);
            if (findIndex == -1) {
                this.logger.devlog(`changeLaunchJson push configurations ${curType}`)
                finalConfs.push(this.configTemplate());
            } else {
                this.logger.devlog(`changeLaunchJson url replace configurations ${curType}`)
                if (finalConfs[findIndex].url != this.url) {
                    finalConfs[findIndex].url = this.url
                }
            }
        }

        this.logger.devlog("changeLaunchJson seturl configurations：" + this.url);
        if (finalConfs.length > 1) {
            //先保存成一个 让vscode默认选中这个 之后在恢复之前的列表

            let findItem = finalConfs.find(val => val.type == curType);
            jsObj[CONF_KEY] = [findItem]
            let output = jju.update(prevJsonStr, jsObj, this.jsobjParam)

            this.logger.devlog("changeLaunchJson temp save one configurations");

            helper.writeFile(this.launchPath, output);
            await this.waitConfigSaveOk();
        }

        this.logger.devlog("changeLaunchJson save all configurations");

        jsObj[CONF_KEY] = finalConfs;
        let output = jju.update(prevJsonStr, jsObj, this.jsobjParam)
        helper.writeFile(this.launchPath, output);
        this.logger.devlog("changeLaunchJson save all configurations ok");
    }
    private waitConfigSaveOk() {
        return new Promise<void>((resolve, reject) => {
            let dispose = vscode.workspace.onDidChangeConfiguration((e) => {
                this.removeListener(dispose);
                resolve();
            });
            this.addListener(dispose);
        });
    }
    private getTemplate() {
        return `{
    // 使用 IntelliSense 了解相关属性。 
    // 悬停以查看现有属性的描述。
    // 欲了解更多信息，请访问: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        ${JSON.stringify(this.configTemplate(), undefined, "\t\t\t").trimEnd().slice(0, -1)}        }
    ]
}`
    }
    private configTemplate() {
        const curType = helper.getDebugBrowser()
        return <LaunchJsonConfType>{
            type: curType,
            request: "launch",
            name: helper.getDebugName(),
            url: this.url,
            webRoot: "${workspaceFolder}"
        }
    }
}