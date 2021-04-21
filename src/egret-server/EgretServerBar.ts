import * as vscode from 'vscode';
import Listener from '../common/Listener';
import EgretServer from './EgretServer';
import { EgretServiceExtStatus, EgretServiceStatus } from "../define";
import { getLogger, Logger } from '../common/Logger';
import { Command } from '../common/Command';
import Helper from '../common/Helper';
export default class EgretServerBar extends Listener {
    private statusBar: vscode.StatusBarItem;
    private reCompileBar: vscode.StatusBarItem;
    private _status = EgretServiceStatus.Free;
    private _extStatus = EgretServiceExtStatus.Free;
    private logger: Logger;
    public constructor(private server: EgretServer, protected subscriptions: vscode.Disposable[]) {
        super();
        this.logger = getLogger(this);
        const barCommandId = 'egret-helper.showEgretMenu';
        const pickItems = ["$(server) 编译", "$(debug) 编译调试", "$(refresh) 重启", `$(sync) 同步[${Helper.getConfigObj().egretResourceJsonPath}]`];
        this.addListener(vscode.commands.registerCommand(barCommandId, () => {
            this.logger.devlog(`constructor receive cmd ${barCommandId}`)
            vscode.window.showQuickPick(pickItems).then(result => {
                this.logger.devlog(`constructor pick ${result}`)
                switch (result) {
                    case pickItems[0]:
                        vscode.commands.executeCommand(Command.EGRET_BUILD);
                        break;
                    case pickItems[1]:
                        vscode.commands.executeCommand(Command.EGRET_BUILD_DEBUG);
                        break;
                    case pickItems[2]:
                        vscode.commands.executeCommand(Command.EGRET_RESTART);
                        break;
                    case pickItems[3]:
                        vscode.commands.executeCommand(Command.EGRET_RES_SYNC);
                        break;
                }
            })
        }));

        this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this.statusBar.command = barCommandId;
        this.statusBar.show();
        subscriptions.push(this.statusBar);

        this.reCompileBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        this.reCompileBar.command = Command.EGRET_BUILD_DEBUG;
        subscriptions.push(this.reCompileBar);

        this.updateView();
    }
    public get status() {
        return this._status;
    }
    public set status(status: EgretServiceStatus) {
        this.logger.devlog(`status=${status}`)
        this._status = status;
        this.updateView();
    }
    public get extStatus() {
        return this._extStatus;
    }
    public set extStatus(exStatus: EgretServiceExtStatus) {
        this.logger.devlog(`extStatus=${exStatus}`)
        this._extStatus = exStatus;
        this.updateView();
    }
    private updateView() {
        this.updateBarTxt();
        this.updateReCompileBar();
    }
    private updateReCompileBar() {
        if (this.status === EgretServiceStatus.Running) {
            this.reCompileBar.show();
        } else {
            this.reCompileBar.hide();
        }
        switch (this.extStatus) {
            case EgretServiceExtStatus.Building:
            case EgretServiceExtStatus.Syncing:
                this.reCompileBar.text = "$(repo-sync~spin) Egret编译调试"
                break;
            default:
                this.reCompileBar.text = "$(debug) Egret编译调试"
                break;
        }
    }
    private updateBarTxt() {
        let _statusTxt: string, _extStatusTxt: string = "";
        switch (this._status) {
            case EgretServiceStatus.Destroying:
                _statusTxt = `$(loading~spin) Egret关闭中`;
                break;
            case EgretServiceStatus.Running:
                if (this.server && this.server.service && this.server.service.urlStr) {
                    _statusTxt = `$(vm-active) ${this.server.service.urlStr}`;
                } else {
                    _statusTxt = `$(vm-active) Egret运行中`;
                }
                break;
            case EgretServiceStatus.Free:
                _statusTxt = `$(vm-outline) Egret已停止`;
                break;
            case EgretServiceStatus.Starting:
                _statusTxt = `$(repo-sync~spin) Egret启动中`;
                break;
        }
        switch (this._extStatus) {
            case EgretServiceExtStatus.Building:
                _extStatusTxt = `$(repo-sync~spin) Egret编译中`;
                break;
            case EgretServiceExtStatus.Free:
                break;
            case EgretServiceExtStatus.Syncing:
                _extStatusTxt = `$(repo-sync~spin) Egret同步资源中`;
                break;
        }
        if (_extStatusTxt != "") {
            this.statusBar.text = `${_statusTxt} | ${_extStatusTxt}`;
        } else {
            this.statusBar.text = `${_statusTxt}`;
        }
    }
    public destroy() {
        super.destroy();
        this.logger.devlog(`destroy`)
        if (this.statusBar) {
            this.statusBar.dispose();
        }
        if (this.reCompileBar) {
            this.reCompileBar.dispose();
        }
    }
}