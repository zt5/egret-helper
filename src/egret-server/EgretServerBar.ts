import * as vscode from 'vscode';
import Listener from '../common/Listener';
import EgretServer from './EgretServer';
import { EgretServiceExtStatus, EgretServiceStatus } from "../define";
import * as helper from "../helper";
import { getLogger, Logger } from '../common/Log';
import { localize } from '../common/Language';
export default class EgretServerBar extends Listener {
    private statusBar: vscode.StatusBarItem;
    private _status = EgretServiceStatus.Free;
    private _extStatus = EgretServiceExtStatus.Free;
    private logger: Logger
    public constructor(protected subscriptions: vscode.Disposable[], private server: EgretServer) {
        super();
        this.logger = getLogger(this);
        this.logger.devlog("constructor")
        const myCommandId = 'egret-helper.showEgretMenu';
        this.addListener(vscode.commands.registerCommand(myCommandId, () => {
            this.logger.devlog(`constructor receive cmd ${myCommandId}`)
            let pickItems = [
                localize("bar.menu.complete"),
                localize("bar.menu.completeDebug"),
                localize("bar.menu.restartDebug"),
                localize("bar.menu.restart"),
                localize("bar.menu.syncResource", helper.getConfigObj().egretResourceJsonPath),
            ];
            vscode.window.showQuickPick(pickItems).then(result => {
                this.logger.devlog(`constructor pick ${result}`)
                switch (result) {
                    case pickItems[0]:
                        vscode.commands.executeCommand("egret-helper.egretBuild");
                        break;
                    case pickItems[1]:
                        vscode.commands.executeCommand("egret-helper.egretBuildAndDebug");
                        break;
                    case pickItems[2]:
                        vscode.commands.executeCommand("egret-helper.egretRestartAndDebug");
                        break;
                    case pickItems[3]:
                        vscode.commands.executeCommand("egret-helper.egretRestart");
                        break;
                    case pickItems[4]:
                        vscode.commands.executeCommand("egret-helper.egretResSync");
                        break;
                }
            })
        }));

        this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this.statusBar.command = myCommandId;
        this.logger.devlog(`constructor register cmd=${myCommandId}`)
        this.statusBar.show();
        subscriptions.push(this.statusBar);
    }
    public get status() {
        return this._status;
    }
    public set status(status: EgretServiceStatus) {
        this.logger.devlog(`status=${status}`)
        this._status = status;
        this.updateBarTxt();
    }
    public get extStatus() {
        return this._extStatus;
    }
    public set extStatus(exStatus: EgretServiceExtStatus) {
        this.logger.devlog(`extStatus=${exStatus}`)
        this._extStatus = exStatus;
        this.updateBarTxt();
    }
    private updateBarTxt() {
        let _statusTxt: string, _extStatusTxt: string = "";
        switch (this._status) {
            case EgretServiceStatus.Destroying:
                _statusTxt = `$(loading~spin) ${localize("bar.status.destroying")}`;
                break;
            case EgretServiceStatus.Running:
                if (this.server && this.server.service && this.server.service.urlStr) {
                    _statusTxt = `$(vm-active) ${localize("bar.status.running", this.server.service.urlStr)}`;
                } else {
                    _statusTxt = `$(vm-active) ${localize("bar.status.running_default")}`;
                }
                break;
            case EgretServiceStatus.Free:
                _statusTxt = `$(vm-outline) ${localize("bar.status.free")}`;
                break;
            case EgretServiceStatus.Starting:
                _statusTxt = `$(repo-sync~spin) ${localize("bar.status.starting")}`;
                break;
        }
        switch (this._extStatus) {
            case EgretServiceExtStatus.Building:
                _extStatusTxt = `$(repo-sync~spin) ${localize("bar.exstatus.building")}`;
                break;
            case EgretServiceExtStatus.Free:
                break;
            case EgretServiceExtStatus.Syncing:
                _extStatusTxt = `$(repo-sync~spin) ${localize("bar.exstatus.syncing")}`;
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
    }
}