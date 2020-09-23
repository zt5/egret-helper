import * as vscode from 'vscode';
import Listener from '../common/Listener';
import { devlog } from '../helper';
import EgretServer, { EgretServiceExtStatus, EgretServiceStatus } from './EgretServer';
export default class EgretServerBar extends Listener {
    private statusBar: vscode.StatusBarItem;
    private _status = EgretServiceStatus.Free;
    private _extStatus = EgretServiceExtStatus.Free;
    public constructor(protected subscriptions: vscode.Disposable[], private server: EgretServer) {
        super();
        devlog("EgretServerBar constructor")
        const myCommandId = 'egret-helper.barClick';
        this.addListener(vscode.commands.registerCommand(myCommandId, () => {
            devlog(`EgretServerBar constructor receive cmd ${myCommandId}`)
            let pickItems = ["编译", "编译调试", "重启调试", "重启", "同步default.res.json"];
            vscode.window.showQuickPick(pickItems).then(result => {
                devlog(`EgretServerBar constructor pick ${result}`)
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
        devlog(`EgretServerBar constructor register cmd ${myCommandId}`)
        this.statusBar.show();
        subscriptions.push(this.statusBar);
    }
    public get status() {
        return this._status;
    }
    public set status(status: EgretServiceStatus) {
        devlog(`EgretServerBar status=${status}`)
        this._status = status;
        this.updateBarTxt();
    }
    public get extStatus() {
        return this._extStatus;
    }
    public set extStatus(exStatus: EgretServiceExtStatus) {
        devlog(`EgretServerBar extStatus=${exStatus}`)
        this._extStatus = exStatus;
        this.updateBarTxt();
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
                _statusTxt = `$(vm-outline) Egret空闲中`;
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
        devlog(`EgretServerBar destroy`)
        if (this.statusBar) {
            this.statusBar.dispose();
        }
    }
}