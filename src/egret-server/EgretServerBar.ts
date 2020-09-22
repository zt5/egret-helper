import * as vscode from 'vscode';
import Listener from '../common/Listener';
import { devlog } from '../helper';
import EgretServer, { EgretServiceStatus } from './EgretServer';
export default class EgretServerBar extends Listener {
    private statusBar: vscode.StatusBarItem;
    private _status = EgretServiceStatus.Free;
    public constructor(protected subscriptions: vscode.Disposable[], private server: EgretServer) {
        super();
        devlog("EgretServerBar constructor")
        const myCommandId = 'egret-helper.barClick';
        this.addListener(vscode.commands.registerCommand(myCommandId, () => {
            devlog(`EgretServerBar constructor receive cmd ${myCommandId}`)
            let pickItems = ["编译", "编译调试", "重启调试", "重启"];
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
        this.statusBar.tooltip = undefined;
        devlog(`EgretServerBar status=${status}`)
        switch (status) {
            case EgretServiceStatus.Destroying:
                this.statusBar.text = `$(loading~spin) Egret关闭中`;
                break;
            case EgretServiceStatus.Running:
                if (this.server && this.server.service && this.server.service.urlStr) {
                    this.statusBar.text = `$(vm-active) ${this.server.service.urlStr}`;
                } else {
                    this.statusBar.text = `$(vm-active) Egret运行中`;
                }
                break;
            case EgretServiceStatus.Building:
                if (this.server && this.server.service && this.server.service.urlStr) {
                    this.statusBar.text = `$(repo-sync~spin) ${this.server.service.urlStr}`;
                } else {
                    this.statusBar.text = `$(repo-sync~spin) Egret编译中`;
                }
                break;
            case EgretServiceStatus.Free:
                this.statusBar.text = `$(vm-outline) Egret空闲中`;
                break;
            case EgretServiceStatus.Starting:
                this.statusBar.text = `$(repo-sync~spin) Egret启动中`;
                break;
        }
        this._status = status;
    }
    public destroy() {
        super.destroy();
        devlog(`EgretServerBar destroy`)
        if (this.statusBar) {
            this.statusBar.dispose();
        }
    }
}