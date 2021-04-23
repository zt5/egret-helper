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
        showLog(true);
        return this._start(debug, extCmdArgs).catch(err => {
            this.logger.devlog(`start err=`, err);
            this.logger.log(err);
            if (this.progress) this.progress.clear();
        })
    }
    private async _start(debug: boolean, extCmdArgs: string[]) {
        const folderString = Helper.getCurRootPath();
        this.logger.devlog(`start workspaceFolder=`, folderString);
        if (debug) vscode.commands.executeCommand("workbench.action.debug.stop")

        // const writeEmitter = new vscode.EventEmitter<string>();
        // const closeEmitter = new vscode.EventEmitter<number | void>();
        // const pty: vscode.Pseudoterminal = {
        //     onDidWrite: writeEmitter.event,
        //     onDidClose: closeEmitter.event,
        //     open: () => { /** writeEmitter.fire('Press y to exit successfully')*/ },
        //     close: () => { vscode.window.showInformationMessage('close') },
        //     handleInput: data => {
        //         if (data == 'y') {
        //             vscode.window.showInformationMessage('exit');
        //             closeEmitter.fire(0);
        //         } else {
        //             if (data === "\r") {
        //                 writeEmitter.fire("\r\n");
        //             } else {
        //                 writeEmitter.fire(data);
        //             }
        //         }
        //     }
        // };
       
        // // vscode.window.onDidCloseTerminal(t => {
        // //     if (t.exitStatus && t.exitStatus.code) {
        // //         vscode.window.showInformationMessage(`Exit code: ${t.exitStatus.code}`);
        // //     }
        // // });
        // let cmd = vscode.window.createTerminal({
        //     name: "egret", pty
        // })
        // cmd.sendText("egret build");
        // cmd.show();



        await this.progress.exec(`egret build ${extCmdArgs.join(" ")}`, folderString, (type: ProgressMsgType, data: string) => {
            switch (type) {
                case ProgressMsgType.Error:
                    Helper.toasterr(data);
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