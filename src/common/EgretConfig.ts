import * as vscode from "vscode";
import { EgretCompileType } from "../define";
import ConfigWriterImpl from "./config-writer/ConfigWriterImpl";
import ConfigWriterUtil from "./config-writer/ConfigWriterUtil";
import ConfigLegacyWriter from "./config-writer/impl/ConfigLegacyWriter";
import ConfigWebpackWriter from "./config-writer/impl/ConfigWebpackWriter";
import Listener from "./Listener";
import { getLogger, Logger } from "./Logger";

export class EgretConfig extends Listener {
    private logger: Logger;
    private isRunning = false;
    private writer: ConfigWriterImpl | undefined;
    private url: string | undefined;
    constructor(protected subscriptions: vscode.Disposable[]) {
        super();
        this.logger = getLogger(this);
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
        const compileType = await ConfigWriterUtil.instance.getEgretCompileMode();
        switch (compileType) {
            case EgretCompileType.webpack:
                this.writer = new ConfigWebpackWriter(this.subscriptions);
                break;
            case EgretCompileType.legacy:
                this.writer = new ConfigLegacyWriter(this.subscriptions);
                break;
        }
        if (!this.writer) throw new Error("unsupport egret compile type" + compileType);
        await this.writer.changeVSConfig();
        await this.writer.changeLaunchJson(this.url);
        await this.writer.changeExt();
    }
}