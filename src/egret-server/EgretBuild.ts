import * as vscode from 'vscode';
import Helper from '../common/Helper';
import { getLogger, Logger, showLog } from '../common/Logger';
import Progress from '../common/Progress';
import { EgretServiceExtStatus, ProgressMsgType } from "../define";
import EgretServer from './EgretServer';
export default class EgretBuild {
    private progress: Progress;
    private _urlStr: string | undefined;
    private logger: Logger;
    constructor(private father: EgretServer) {
        this.logger = getLogger(this);
        this.progress = new Progress();
    }
    public async start(debug = false, ...extCmdArgs: string[]) {
        this.father.bar.extStatus = EgretServiceExtStatus.Building;
        showLog();
        return this._start(debug, extCmdArgs).catch(err => {
            this.logger.error(err);
            if (this.progress) this.progress.clear();
        })
    }
    private checkLogHasError(data:string){
        if (data.toLocaleLowerCase().indexOf("error") != -1) {
            Helper.toasterr("编译出错", {
                "查看log": () => {
                    showLog();
                }
            });
        }
    }
    private async _start(debug: boolean, extCmdArgs: string[]) {
        const folderString = Helper.getCurRootPath();
        this.logger.debug(`start workspaceFolder=`, folderString);
        if (debug) vscode.commands.executeCommand("workbench.action.debug.stop")


        await this.progress.exec(`egret build ${extCmdArgs.join(" ")}`, folderString, (type: ProgressMsgType, data: string) => {
            switch (type) {
                case ProgressMsgType.Error:
                    this.logger.error(data);
                    this.checkLogHasError(data);
                    break;
                case ProgressMsgType.Message:
                    this.logger.raw(data);
                    this.checkLogHasError(data);
                    break;
                case ProgressMsgType.Exit:
                    this.father.bar.extStatus = EgretServiceExtStatus.Free;
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