import * as vscode from 'vscode';
import { Command } from '../common/Command';
import { EgretConfig } from '../common/EgretConfig';
import Helper from '../common/Helper';
import Listener from "../common/Listener";
import { getLogger, Logger, showLog } from '../common/Logger';
import { OpenEgretServerType } from '../define';
import EgretBuild from './EgretBuild';
import EgretDebugServer from './EgretDebugServer';
import EgretResSync from './EgretResSync';
import EgretServerBar from './EgretServerBar';

export default class EgretController extends Listener {
    private _debugServer: EgretDebugServer;
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
        this._debugServer = new EgretDebugServer(this, this._egretJson);

        this._build = new EgretBuild(this);
        this._resSync = new EgretResSync(this);

        this.addListener(vscode.commands.registerCommand(Command.EGRET_RESTART, () => {
            this.logger.debug(`call ${Command.EGRET_RESTART}`);
            this._debugServer.start();
        }));

        this.addListener(vscode.commands.registerCommand(Command.EGRET_BUILD, () => {
            this.logger.debug(`call ${Command.EGRET_BUILD}`);
            this._build.start();
        }));

        this.addListener(vscode.commands.registerCommand(Command.EGRET_BUILD_DEBUG, () => {
            this.logger.debug(`call ${Command.EGRET_BUILD_DEBUG}`);
            this._build.start(true);
        }));

        this.addListener(vscode.commands.registerCommand(Command.EGRET_BUILD_ENGINE, () => {
            this.logger.debug(`call ${Command.EGRET_BUILD_DEBUG}`);
            this._build.start(false, "-e");
        }));

        this.addListener(vscode.commands.registerCommand(Command.EGRET_RES_SYNC, () => {
            this.logger.debug(`call ${Command.EGRET_RES_SYNC}`);
            this._resSync.start()
        }));
        this.addListener(vscode.commands.registerCommand(Command.EGRET_SHOW_LOG, () => {
            this.logger.debug(`call ${Command.EGRET_SHOW_LOG}`);
            showLog();
        }));

        this.addListener(vscode.workspace.onDidChangeConfiguration(e => {
            if (Helper.valConfIsChange(e, "debugBrowser")) {
                this.logger.debug("egret-helper.debugBrowser change")
                if (this._debugServer.urlStr) {
                    this._egretJson.step(this._debugServer.urlStr).catch(err => {
                        this.logger.error(err);
                    })
                }
            } else if (Helper.valConfIsChange(e, "hostType")) {
                this.logger.debug("egret-helper.hostType change")
                this._debugServer.start();
            } else if (Helper.valConfIsChange(e, "egretCompileType")) {
                this.logger.debug("egret-helper.egretCompileType change")
                this._debugServer.start();
            }
        }))

        let openEgretType = Helper.getConfigObj().openEgretServer;
        switch (openEgretType) {
            case OpenEgretServerType.auto:
                this._debugServer.start();
                break;
            case OpenEgretServerType.alert:
                let menus = [{ title: "确定", v: "ok" }, { title: "取消", v: "cancel" }]
                vscode.window.showInformationMessage("是否启动Egret服务器?", ...menus).then(result => {
                    if (!this._debugServer || this._debugServer.isDestroy) return;
                    if (result && result.v == "ok") {
                        this._debugServer.start();
                    }
                });
                break;
        }
        // this._resSync.start();//刚初始化时同步一次
    }
    public get service() {
        return this._debugServer;
    }
    public get urlStr() {
        if (this._debugServer) {
            return this._debugServer.urlStr;
        }
        return undefined;
    }
    public get bar() {
        return this._bar;
    }
    public async destroy() {
        super.destroy();
        this.logger.debug("destroy");
        if (this._bar) {
            this._bar.destroy();
        }
        if (this._build) {
            await this._build.destroy();
        }
        if (this._debugServer) {
            await this._debugServer.destroy();
        }
        if (this._resSync) {
            this._resSync.destroy();
        }
        if (this._egretJson) {
            this._egretJson.destroy();
        }
    }
}