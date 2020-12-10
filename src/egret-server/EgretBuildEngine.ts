import * as vscode from 'vscode';
import { getLogger, Logger, showLog } from '../common/Logger';
import Progress from '../common/Progress';
import { EgretServiceExtStatus, ProgressMsgType } from "../define";
import * as helper from "../helper";
import EgretServer from './EgretServer';
export default class EgretBuildEngine {
    private progress: Progress;
    private _urlStr: string | undefined;
    private logger: Logger;
    constructor(private father: EgretServer) {
        this.logger = getLogger(this);
        this.progress = new Progress();
    }
    public async start(debug = false) {
        this.father.bar.extStatus = EgretServiceExtStatus.Building;
        showLog(true);
        return this._start(debug).catch(err => {
            this.logger.devlog(`start err=`, err);
            this.logger.log(err);
            if (this.progress) this.progress.clear();
        })
    }
    private async _start(debug: boolean) {
        const folderString = helper.getCurRootPath();
        this.logger.devlog(`start workspaceFolder=`, folderString);
        if (debug) vscode.commands.executeCommand("workbench.action.debug.stop")
        await this.progress.exec(helper.getConfigObj().buildEngineCmd, folderString, (type: ProgressMsgType, data: string) => {
            switch (type) {
                case ProgressMsgType.Error:
                    this.logger.devlog(`start error=`, data);
                    this.logger.log(data);
                    break;
                case ProgressMsgType.Message:
                    this.logger.devlog(`start message=`, data);
                    this.logger.log(data);
                    break;
                case ProgressMsgType.Exit:
                    this.father.bar.extStatus = EgretServiceExtStatus.Free;
                    this.logger.devlog(`start exit=`, data);
                    if (data == "0") {
                        if (debug) vscode.commands.executeCommand("workbench.action.debug.start");
                    }
                    break;
            }
        });
    }
    public async destroy() {
        this.logger.devlog("destroy");
        if (this.progress) {
            await this.progress.clear();
        }
    }
    public get urlStr() {
        return this._urlStr;
    }
}