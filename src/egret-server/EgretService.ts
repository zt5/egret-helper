import * as fs from "fs";
import * as path from "path";
import * as vscode from 'vscode';
import Progress from '../common/Progress';
import * as helper from "../helper";
import { toasterr } from "../helper";
import EgretServer from './EgretServer';
import { ProgressMsgType, EgretServiceStatus } from "../define";
import { getLogger, Logger } from "../common/Log";
export default class EgretService {
    private progress: Progress;
    private _urlStr: string | undefined;
    private isDestroy = false;
    private logger: Logger;
    constructor(private father: EgretServer) {
        this.logger = getLogger(this);
        this.logger.devlog(`constructor`)
        this.progress = new Progress();
    }
    public async start(debug = false) {
        return this._start(debug).catch(err => {
            this.logger.log(err);
            this.logger.devlog(`exec err=`, err)
            if (this.progress) this.progress.clear();
        });
    }
    private async _start(debug: boolean) {
        this.logger.devlog(`start debug=`, debug)
        const workspaceFolder = helper.getCurRootPath();
        if (!workspaceFolder) return;
        this.logger.devlog(`start workspaceFolder=`, workspaceFolder)
        let launchPath = helper.getLaunchJsonPath();
        if (!launchPath) return;//判断是否返回了路径
        this.logger.devlog(`start launchPath=`, launchPath)
        //检查launch.json是否存在
        if (!fs.existsSync(launchPath)) this.writeTemplateLaunchJson(launchPath);
        let launchstr = fs.readFileSync(launchPath, { encoding: "UTF-8" });
        //检查launch中的#replace是否存在 不存在就覆盖掉
        if (launchstr.indexOf("#replace") == -1) this.writeTemplateLaunchJson(launchPath);
        //检查tsconfig的sourceMap是否存在 不存在就设置
        let ts_config_Path = path.join(workspaceFolder.uri.fsPath, "tsconfig.json");
        this.logger.devlog(`start ts_config_Path=`, ts_config_Path)
        let ts_config_str = fs.readFileSync(ts_config_Path, { encoding: "UTF-8" });
        let ts_config_json = JSON.parse(ts_config_str);
        if (!ts_config_json.compilerOptions.sourceMap) {
            ts_config_json.compilerOptions.sourceMap = true;
            await helper.writeFile(ts_config_Path, JSON.stringify(ts_config_json, null, "\t"));
        }

        const folderString = workspaceFolder.uri.fsPath;

        await this.progress.clear()
        this.exec(folderString, debug);
    }
    private exec(folderString: string, debug: boolean) {
        if (this.isDestroy) return;
        this.logger.devlog(`exec folderString=${folderString} debug=${debug}`)
        this.father.bar.status = EgretServiceStatus.Starting;
        if (debug) vscode.commands.executeCommand("workbench.action.debug.stop")
        this.progress.exec('egret run --serverOnly', folderString, (type: ProgressMsgType, data: string) => {
            switch (type) {
                case ProgressMsgType.Error:
                    toasterr(data);
                    this.logger.log(data);
                    this.logger.devlog(`exec error=`, data)
                    break;
                case ProgressMsgType.Message:
                    this.logger.log(data);
                    this.logger.devlog(`exec message=`, data)
                    let urlMsg = `${data}`.match(/(?<=Url:)\S+(?=\s*)/g);
                    if (urlMsg) {
                        //替换路径
                        this._urlStr = urlMsg[0];
                        let launchPath = helper.getLaunchJsonPath();
                        if (!launchPath) return;//判断是否返回了路径
                        let launchstr = fs.readFileSync(launchPath, { encoding: "UTF-8" });
                        launchstr = launchstr.replace(/(?<="url":\s*")\S+(?="\s*,\/\/\#replace)/g, urlMsg[0]);//替换成新的cmd打印的路径
                        fs.writeFileSync(launchPath, launchstr, { encoding: "UTF-8" });
                        if (debug) vscode.commands.executeCommand("workbench.action.debug.start");
                        this.father.bar.status = EgretServiceStatus.Running;
                    }
                    break;
                case ProgressMsgType.Exit:
                    this.father.bar.status = EgretServiceStatus.Free;
                    this.logger.log(`exit code=${data}`);
                    this.logger.devlog(`exec exit=`, data)
                    break;
            }
        });
    }
    private writeTemplateLaunchJson(launchPath: string) {
        let parentPath = path.dirname(launchPath);
        if (!fs.existsSync(parentPath)) fs.mkdirSync(parentPath);
        fs.writeFileSync(launchPath,
            `{
    // 使用 IntelliSense 了解相关属性。 
    // 悬停以查看现有属性的描述。
    // 欲了解更多信息，请访问: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "type": "chrome",
            "request": "launch",
            "name": "Egret Debug",
            "url": "http://localhost:8080",//#replace
            "webRoot": "\${workspaceFolder}"
        }
    ]
}`);
    }

    public async destroy() {
        this.logger.devlog(`destroy`)
        this.isDestroy = true;
        await this.progress.clear();
    }
    public get urlStr() {
        return this._urlStr;
    }
}