import * as vscode from 'vscode';
import Progress from '../common/Progress';
import { ProgressMsgType } from "../define";
import * as helper from "../helper";
import { devlog, log } from "../helper";
import EgretServer from './EgretServer';
import { EgretServiceExtStatus } from "../define";
export default class EgretBuild {
    private progress: Progress;
    private _urlStr: string | undefined;
    constructor(private father: EgretServer) {
        devlog("EgretBuild constructor");
        this.progress = new Progress();
    }
    public async start(debug = false) {
        this.father.bar.extStatus = EgretServiceExtStatus.Building;
        return this._start(debug).catch(err => {
            devlog(`EgretBuild start err=`, err);
            log(err);
            if (this.progress) this.progress.clear();
        })
    }
    private async _start(debug: boolean) {
        const workspaceFolder = helper.getCurRootPath();
        devlog(`EgretBuild start workspaceFolder=`, workspaceFolder);
        if (!workspaceFolder) return;
        const folderString = workspaceFolder.uri.fsPath;
        await this.progress.exec('egret build', folderString, (type: ProgressMsgType, data: string) => {
            switch (type) {
                case ProgressMsgType.Error:
                    devlog(`EgretBuild start error=`, data);
                    log(data);
                    break;
                case ProgressMsgType.Message:
                    devlog(`EgretBuild start message=`, data);
                    log(data);
                    break;
                case ProgressMsgType.Exit:
                    this.father.bar.extStatus = EgretServiceExtStatus.Free;
                    devlog(`EgretBuild start exit=`, data);
                    if (data == "0") {
                        if (debug) vscode.commands.executeCommand("workbench.action.debug.start");
                    }
                    break;
            }
        });
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