import * as vscode from 'vscode';
import Listener from "../common/Listener";
import { devlog } from '../helper';
import EgretBuild from './EgretBuild';
import EgretServerBar from './EgretServerBar';
import EgretService from './EgretService';
export enum EgretServiceStatus {
    Starting, Running, Destroying, Free, Building
}
export default class EgretServer extends Listener {
    private _service: EgretService;
    private _bar: EgretServerBar;
    private _build: EgretBuild;
    public constructor(protected subscriptions: vscode.Disposable[]) {
        super();
        devlog("EgretServer constructor");
        this._bar = new EgretServerBar(subscriptions, this);
        this._service = new EgretService(this);
        this._build = new EgretBuild(this);

        this.addListener(vscode.workspace.onDidChangeWorkspaceFolders((e: vscode.WorkspaceFoldersChangeEvent) => {
            devlog("EgretServer constructor onDidChangeWorkspaceFolders", e);
            this._service.start();
        }))

        this.addListener(vscode.commands.registerCommand("egret-helper.egretRestart", () => {
            devlog("EgretServer constructor egret-helper.egretRestart");
            this._service.start();
        }));

        this.addListener(vscode.commands.registerCommand("egret-helper.egretRestartAndDebug", () => {
            devlog("EgretServer constructor egret-helper.egretRestartAndDebug");
            this._service.start(true);
        }));
        this.addListener(vscode.commands.registerCommand("egret-helper.egretBuild", () => {
            devlog("EgretServer constructor egret-helper.egretBuild");
            this._build.start();
        }));

        this.addListener(vscode.commands.registerCommand("egret-helper.egretBuildAndDebug", () => {
            devlog("EgretServer constructor egret-helper.egretBuildAndDebug");
            this._build.start(true);
        }));

        this._service.start();
    }
    public get service() {
        return this._service;
    }
    public get bar(): EgretServerBar {
        return this._bar;
    }
    public async destroy() {
        super.destroy();
        devlog("EgretServer destroy");
        if (this._bar) {
            this._bar.destroy();
        }
        if (this._build) {
            await this._build.destroy();
        }
        if (this._service) {
            await this._service.destroy();
        }
    }
}