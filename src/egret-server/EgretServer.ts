import * as vscode from 'vscode';
import Listener from "../common/Listener";
import { getLogger, Logger } from '../common/Logger';
import EgretBuild from './EgretBuild';
import EgretResSync from './EgretResSync';
import EgretServerBar from './EgretServerBar';
import EgretService from './EgretService';
import * as helper from "../helper";
import { OpenEgretServerType } from '../define';

export default class EgretServer extends Listener {
    private _service: EgretService;
    private _bar: EgretServerBar;
    private _build: EgretBuild;

    private _resSync: EgretResSync;
    private logger: Logger;
    public constructor(protected subscriptions: vscode.Disposable[]) {
        super();
        this.logger = getLogger(this);
        this.logger.devlog("constructor");
        this._bar = new EgretServerBar(subscriptions, this);
        this._service = new EgretService(this);
        this._build = new EgretBuild(this);
        this._resSync = new EgretResSync(this);

        this.addListener(vscode.commands.registerCommand("egret-helper.egretRestart", () => {
            this.logger.devlog("constructor egret-helper.egretRestart");
            this._service.start();
        }));

        this.addListener(vscode.commands.registerCommand("egret-helper.egretRestartAndDebug", () => {
            this.logger.devlog("sconstructor egret-helper.egretRestartAndDebug");
            this._service.start(true);
        }));
        this.addListener(vscode.commands.registerCommand("egret-helper.egretBuild", () => {
            this.logger.devlog("constructor egret-helper.egretBuild");
            this._build.start();
        }));

        this.addListener(vscode.commands.registerCommand("egret-helper.egretBuildAndDebug", () => {
            this.logger.devlog("constructor egret-helper.egretBuildAndDebug");
            this._build.start(true);
        }));
        
        this.addListener(vscode.commands.registerCommand("egret-helper.egretBuildEngine", () => {
            this.logger.devlog("constructor egret-helper.egretBuildEngine");
            this._build.start(false,"-e");
        }));

        this.addListener(vscode.commands.registerCommand("egret-helper.egretResSync", () => {
            this.logger.devlog("constructor egret-helper.egretResSync");
            this._resSync.start()
        }));
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
    public get bar(): EgretServerBar {
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
        if (this._service) {
            await this._service.destroy();
        }
        if (this._resSync) {
            this._resSync.destroy();
        }
    }
}