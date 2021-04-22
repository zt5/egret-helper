import * as vscode from 'vscode';
import Listener from "../common/Listener";
import { getLogger, Logger } from '../common/Logger';
import EgretBuild from './EgretBuild';
import EgretResSync from './EgretResSync';
import EgretServerBar from './EgretServerBar';
import EgretWebServer from './EgretWebServer';
import { OpenEgretServerType } from '../define';
import { EgretConfig } from '../common/EgretConfig';
import { Command } from '../common/Command';
import Helper from '../common/Helper';

export default class EgretServer extends Listener {
    private _webServer: EgretWebServer;
    private _bar: EgretServerBar;
    private _build: EgretBuild;

    private _resSync: EgretResSync;
    private logger: Logger;
    private _egretJson: EgretConfig;
    public constructor(protected subscriptions: vscode.Disposable[]) {
        super();
        this.logger = getLogger(this);

        this._egretJson = new EgretConfig(subscriptions);

        this._bar = new EgretServerBar(this, subscriptions);
        this._webServer = new EgretWebServer(this, this._egretJson);
        this._build = new EgretBuild(this);
        this._resSync = new EgretResSync(this);

        this.addListener(vscode.commands.registerCommand(Command.EGRET_RESTART, () => {
            this.logger.devlog(`call ${Command.EGRET_RESTART}`);
            this._webServer.start();
        }));

        this.addListener(vscode.commands.registerCommand(Command.EGRET_BUILD, () => {
            this.logger.devlog(`call ${Command.EGRET_BUILD}`);
            this._build.start();
        }));

        this.addListener(vscode.commands.registerCommand(Command.EGRET_BUILD_DEBUG, () => {
            this.logger.devlog(`call ${Command.EGRET_BUILD_DEBUG}`);
            this._build.start(true);
        }));

        this.addListener(vscode.commands.registerCommand(Command.EGRET_BUILD_ENGINE, () => {
            this.logger.devlog(`call ${Command.EGRET_BUILD_DEBUG}`);
            this._build.start(false, "-e");
        }));

        this.addListener(vscode.commands.registerCommand(Command.EGRET_RES_SYNC, () => {
            this.logger.devlog(`call ${Command.EGRET_RES_SYNC}`);
            this._resSync.start()
        }));

        this.addListener(vscode.workspace.onDidChangeConfiguration(e => {
            if (Helper.valConfIsChange(e, "debugBrowser")) {
                this.logger.log("egret-helper.debugBrowser change")
                if (this._webServer.urlStr) {
                    this._egretJson.step(this._webServer.urlStr).catch(err => {
                        this.logger.log(err);
                    })
                }
            } else if (Helper.valConfIsChange(e, "hostType")) {
                this.logger.log("egret-helper.hostType change")
                this._webServer.start();
            } else if (Helper.valConfIsChange(e, "egretCompileType")) {
                this.logger.log("egret-helper.egretCompileType change")
                this._webServer.start().catch(err => {
                    this.logger.log(err);
                })
            }
        }))

        let openEgretType = Helper.getConfigObj().openEgretServer;
        switch (openEgretType) {
            case OpenEgretServerType.auto:
                this._webServer.start();
                break;
            case OpenEgretServerType.alert:
                let menus = [{ title: "确定", v: "ok" }, { title: "取消", v: "cancel" }]
                vscode.window.showInformationMessage("是否启动Egret服务器?", ...menus).then(result => {
                    if (!this._webServer || this._webServer.isDestroy) return;
                    if (result && result.v == "ok") {
                        this._webServer.start();
                    }
                });
                break;
        }
        // this._resSync.start();//刚初始化时同步一次
    }
    public get service() {
        return this._webServer;
    }
    public get urlStr() {
        if (this._webServer) {
            return this._webServer.urlStr;
        }
        return undefined;
    }
    public get bar() {
        return this._bar;
    }
    public async destroy() {
        super.destroy();
        this.logger.devlog("destroy");
        if (this._bar) {
            this._bar.destroy();
        }
        if (this._build) {
            await this._build.destroy();
        }
        if (this._webServer) {
            await this._webServer.destroy();
        }
        if (this._resSync) {
            this._resSync.destroy();
        }
        if (this._egretJson) {
            this._egretJson.destroy();
        }
    }
}