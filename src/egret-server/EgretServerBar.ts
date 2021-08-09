import * as vscode from 'vscode';
import Listener from '../common/Listener';
import EgretController from './EgretController';
import { EgretServiceExtStatus, EgretServiceStatus } from "../define";
import { getLogger, Logger, showLog } from '../common/Logger';
import { Command } from '../common/Command';
import Helper from '../common/Helper';
export default class EgretServerBar extends Listener {
    private statusBar: vscode.StatusBarItem;
    private reCompileBar: vscode.StatusBarItem;
    private _status = EgretServiceStatus.Free;
    private _extStatus = EgretServiceExtStatus.Free;
    private logger: Logger;
    public constructor(private controller: EgretController, protected subscriptions: vscode.Disposable[]) {
        super();
        this.logger = getLogger(this);
        const barCommandId = 'egret-helper.showEgretMenu';
        const pickItems = ["$(server) 编译", "$(debug) 编译调试", "$(refresh) 重启", `$(sync) 同步[${Helper.getConfigObj().egretResourceJsonPath}]`, `$(output) 显示日志窗口`];
        const pickItemCmds = [Command.EGRET_BUILD, Command.EGRET_BUILD_DEBUG, Command.EGRET_RESTART, Command.EGRET_RES_SYNC, Command.EGRET_SHOW_LOG];
        this.addListener(vscode.commands.registerCommand(barCommandId, () => {
            this.logger.debug(`receive cmd: ${barCommandId}`)
            vscode.window.showQuickPick(pickItems).then(result => {
                this.logger.debug(`select cmd: ${result}`)
                if (result) {
                    let pickIndex = pickItems.indexOf(result);
                    if (pickIndex != -1) vscode.commands.executeCommand(pickItemCmds[pickIndex]);
                }
            })
        }));

        this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this.statusBar.command = barCommandId;
        this.statusBar.show();
        subscriptions.push(this.statusBar);
        let menus = Helper.createMarkTxt();
        for (let i = 0; i < pickItems.length; i++) {
            menus.appendMarkdown(`[${pickItems[i]}](command:${pickItemCmds[i]})  \n`);
        }
        this.statusBar.tooltip = menus;

        this.reCompileBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        this.reCompileBar.command = Command.EGRET_BUILD_DEBUG;
        subscriptions.push(this.reCompileBar);

        this.updateView();
    }
    public get status() {
        return this._status;
    }
    public set status(status: EgretServiceStatus) {
        this.logger.debug(`status: ${status}`)
        this._status = status;
        this.updateView();
    }
    public get extStatus() {
        return this._extStatus;
    }
    public set extStatus(exStatus: EgretServiceExtStatus) {
        this.logger.debug(`extStatus: ${exStatus}`)
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
                if (this.controller && this.controller.service && this.controller.service.urlStr) {
                    _statusTxt = `$(vm-active) ${this.controller.service.urlStr}`;
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
        this.logger.debug(`destroy`)
        if (this.statusBar) {
            this.statusBar.dispose();
        }
        if (this.reCompileBar) {
            this.reCompileBar.dispose();
        }
    }
}