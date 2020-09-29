import * as vscode from 'vscode';
import Progress from '../common/Progress';
import { EgretServiceExtStatus, ProgressMsgType } from "../define";
import * as helper from "../helper";
import { devlog, log, toasterr } from "../helper";
import EgretServer from './EgretServer';
export default class EgretBuild {
    private progress: Progress;
    private _urlStr: string | undefined;
    constructor(private father: EgretServer) {
        devlog(this, "constructor");
        this.progress = new Progress();
    }
    public async start(debug = false) {
        this.father.bar.extStatus = EgretServiceExtStatus.Building;
        helper.showLog();
        return this._start(debug).catch(err => {
            devlog(this, `start err=`, err);
            log(this, err);
            if (this.progress) this.progress.clear();
        })
    }
    private async _start(debug: boolean) {
        const workspaceFolder = helper.getCurRootPath();
        devlog(this, `start workspaceFolder=`, workspaceFolder);
        if (!workspaceFolder) return;
        const folderString = workspaceFolder.uri.fsPath;
        if (debug) vscode.commands.executeCommand("workbench.action.debug.stop")
        await this.progress.exec('egret build', folderString, (type: ProgressMsgType, data: string) => {
            switch (type) {
                case ProgressMsgType.Error:
                    toasterr(data);
                    devlog(this, `start error=`, data);
                    log(this, data);
                    break;
                case ProgressMsgType.Message:
                    devlog(this, `start message=`, data);
                    log(this, data);
                    break;
                case ProgressMsgType.Exit:
                    this.father.bar.extStatus = EgretServiceExtStatus.Free;
                    devlog(this, `start exit=`, data);
                    if (data == "0") {
                        if (debug) vscode.commands.executeCommand("workbench.action.debug.start");
                    }
                    break;
            }
        });
    }
    public async destroy() {
        devlog(this, "destroy");
        if (this.progress) {
            await this.progress.clear();
        }
    }
    public get urlStr() {
        return this._urlStr;
    }
}