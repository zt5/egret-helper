import * as vscode from 'vscode';
import Listener from "../common/Listener";
import { getLogger, Logger } from '../common/Logger';
import EgretBuild from './EgretBuild';
import EgretResSync from './EgretResSync';
import EgretServerBar from './EgretServerBar';
import EgretService from './EgretService';
import * as helper from "../helper";
import { OpenEgretServerType } from '../define';
import { EgretConfig } from '../common/EgretConfig';
import { Command } from '../common/Command';
import EgretBuildEngine from './EgretBuildEngine';

export default class EgretServer extends Listener {
    private _service: EgretService;
    private _bar: EgretServerBar;
    private _build: EgretBuild;
    private _buildEngined: EgretBuildEngine;

    private _resSync: EgretResSync;
    private logger: Logger;
    private _egretJson: EgretConfig;
    public constructor(protected subscriptions: vscode.Disposable[]) {
        super();
        this.logger = getLogger(this);

        this._egretJson = new EgretConfig(subscriptions);

        this._bar = new EgretServerBar(this, subscriptions);
        this._service = new EgretService(this, this._egretJson);
        this._build = new EgretBuild(this);
        this._buildEngined = new EgretBuildEngine(this);
        this._resSync = new EgretResSync(this);

        this.addListener(vscode.commands.registerCommand(Command.EGRET_RESTART, () => {
            this.logger.devlog(`call ${Command.EGRET_RESTART}`);
            this._service.start();
        }));

        this.addListener(vscode.commands.registerCommand(Command.EGRET_RESTART_DEBUG, () => {
            this.logger.devlog(`call ${Command.EGRET_RESTART_DEBUG}`);
            this._service.start(true);
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
            this.logger.devlog(`call ${Command.EGRET_BUILD_ENGINE}`);
            this._buildEngined.start(false);
        }));

        this.addListener(vscode.commands.registerCommand(Command.EGRET_RES_SYNC, () => {
            this.logger.devlog(`call ${Command.EGRET_RES_SYNC}`);
            this._resSync.start()
        }));

        this.addListener(vscode.workspace.onDidChangeConfiguration(e => {
            if (helper.valConfIsChange(e, "debugBrowser")) {
                this.logger.log("egret-helper.debugBrowser change")
                if (this._service.urlStr) {
                    this._egretJson.step(this._service.urlStr).catch(err => {
                        this.logger.log(err);
                    })
                }
            } else if (helper.valConfIsChange(e, "hostType")) {
                this.logger.log("egret-helper.hostType change")
                this._service.start();
            }else if (helper.valConfIsChange(e, "serverCmd")) {
                this.logger.log("egret-helper.serverCmd change")
                this._service.start();
            }
        }))

        let openEgretType = helper.getConfigObj().openEgretServer;
        switch (openEgretType) {
            case OpenEgretServerType.auto:
                this._service.start();
                break;
            case OpenEgretServerType.alert:
                let menus = [{ title: "确定", v: "ok" }, { title: "取消", v: "cancel" }]
                vscode.window.showInformationMessage("是否启动Egret服务器?", ...menus).then(result => {
                    if (!this._service || this._service.isDestroy) return;
                    if (result && result.v == "ok") {
                        this._service.start();
                    }
                });
                break;
        }
        // this._resSync.start();//刚初始化时同步一次
    }
    public get service() {
        return this._service;
    }
    public get urlStr() {
        if (this._service) {
            return this._service.urlStr;
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
        if (this._buildEngined) {
            await this._buildEngined.destroy();
        }
        if (this._service) {
            await this._service.destroy();
        }
        if (this._resSync) {
            this._resSync.destroy();
        }
        if (this._egretJson) {
            this._egretJson.destroy();
        }
    }
}