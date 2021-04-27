import * as vscode from 'vscode';
import Helper from '../common/Helper';
import { getLogger, Logger, showLog } from '../common/Logger';
import Progress from '../common/Progress';
import { EgretServiceExtStatus, ProgressMsgType } from "../define";
import EgretController from './EgretController';
export default class EgretBuild {
    private progress: Progress;
    private _urlStr: string | undefined;
    private logger: Logger;
    constructor(private controller: EgretController) {
        this.logger = getLogger(this);
        this.progress = new Progress();
    }
    public async start(debug = false, ...extCmdArgs: string[]) {
        this.controller.bar.extStatus = EgretServiceExtStatus.Building;
        showLog();
        return this._start(debug, extCmdArgs).catch(err => {
            this.logger.error(err);
            if (this.progress) this.progress.clear();
        })
    }
    private async _start(debug: boolean, extCmdArgs: string[]) {
        const folderString = Helper.getCurRootPath();
        this.logger.debug(`start workspaceFolder=`, folderString);
        if (debug) vscode.commands.executeCommand("workbench.action.debug.stop")


        await this.progress.exec(`egret build ${extCmdArgs.join(" ")}`, folderString, (type: ProgressMsgType, data: string) => {
            switch (type) {
                case ProgressMsgType.Error:
                    this.logger.error(data);
                    Helper.checkHasError(data);
                    break;
                case ProgressMsgType.Message:
                    this.logger.log(data);
                    Helper.checkHasError(data);
                    break;
                case ProgressMsgType.Exit:
                    this.controller.bar.extStatus = EgretServiceExtStatus.Free;
                    this.logger.debug(`exit: `, data);
                    if (data == "0") {
                        if (debug) vscode.commands.executeCommand("workbench.action.debug.start");
                    }
                    break;
            }
        });
    }
    public async destroy() {
        this.logger.debug("destroy");
        if (this.progress) {
            await this.progress.clear();
        }
    }
    public get urlStr() {
        return this._urlStr;
    }
}