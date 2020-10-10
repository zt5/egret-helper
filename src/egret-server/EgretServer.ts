import * as vscode from 'vscode';
import Listener from "../common/Listener";
import { getLogger, Logger } from '../common/Log';
import EgretBuild from './EgretBuild';
import EgretResSync from './EgretResSync';
import EgretServerBar from './EgretServerBar';
import EgretService from './EgretService';

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

        this.addListener(vscode.workspace.onDidChangeWorkspaceFolders((e: vscode.WorkspaceFoldersChangeEvent) => {
            this.logger.devlog("constructor onDidChangeWorkspaceFolders", e);
            this._service.start();
        }))

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

        this.addListener(vscode.commands.registerCommand("egret-helper.egretResSync", () => {
            this.logger.devlog("constructor egret-helper.egretResSync");
            this._resSync.start()
        }));

        this._service.start();
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