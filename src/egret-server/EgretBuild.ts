import * as vscode from 'vscode';
import Progress, { ProgressMsgType } from '../common/Progress';
import EgretServer, { EgretServiceStatus } from './EgretServer';
import * as helper from "../helper";
import { devlog, log } from "../helper";
export default class EgretBuild {
    private progress: Progress;
    private _urlStr: string | undefined;
    constructor(private father: EgretServer) {
        devlog("EgretBuild constructor");
        this.progress = new Progress();
    }
    public async start(debug = false) {
        const workspaceFolder = helper.getCurRootPath();
        devlog(`EgretBuild start workspaceFolder=`, workspaceFolder);
        if (!workspaceFolder) return;
        const folderString = workspaceFolder.uri.fsPath;
        try {
            this.father.bar.status = EgretServiceStatus.Building;
            await this.progress.exec('egret build', folderString, (type: ProgressMsgType, data: string) => {
                switch (type) {
                    case ProgressMsgType.Error:
                        this.father.bar.status = EgretServiceStatus.Running;
                        devlog(`EgretBuild start error=`, data);
                        log(data);
                        break;
                    case ProgressMsgType.Message:
                        devlog(`EgretBuild start message=`, data);
                        log(data);
                        break;
                    case ProgressMsgType.Exit:
                        devlog(`EgretBuild start exit=`, data);
                        this.father.bar.status = EgretServiceStatus.Running;
                        if (data == "0") {
                            if (debug) vscode.commands.executeCommand("workbench.action.debug.start");
                        }
                        break;
                }
            });
        } catch (err) {
            log(err);
            devlog(`EgretBuild start err=`, err);
            if (this.progress) this.progress.clear();
        }
    }
    public async destroy() {
        devlog("egret build destroy");
        if (this.progress) {
            await this.progress.clear();
        }
    }
    public get urlStr() {
        return this._urlStr;
    }
}