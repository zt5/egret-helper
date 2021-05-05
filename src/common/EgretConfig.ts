import * as vscode from "vscode";
import EgretConfigImpl from "./EgretConfigImpl";
import EgretConfigPrepare from "./EgretConfigPrepare";
import Listener from "./Listener";
import { getLogger, Logger } from "./Logger";

export class EgretConfig extends Listener {
    private logger: Logger;
    private isRunning = false;
    private writer: EgretConfigImpl | undefined;
    private url: string | undefined;
    public prepare: EgretConfigPrepare;
    constructor(protected subscriptions: vscode.Disposable[]) {
        super();
        this.logger = getLogger(this);
        this.prepare = new EgretConfigPrepare();
    }
    public async step(url: string) {
        if (this.isRunning) return;
        this.isRunning = true;
        return this._step(url).catch(err => {
            this.logger.error(err);
        }).finally(() => {
            this.isRunning = false;
        });
    }
    private async _step(url: string) {
        this.url = url;
        this.writer = new EgretConfigImpl(this.subscriptions);
        await this.writer.changeVSConfig();
        await this.writer.changeLaunchJson(this.url);
        await this.writer.changeTsConfig();
    }

}