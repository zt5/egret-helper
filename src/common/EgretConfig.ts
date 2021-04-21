import * as vscode from "vscode";
import ConfigWriterFactory from "./config-writer/ConfigWriterFactory";
import Listener from "./Listener";
import { getLogger, Logger } from "./Logger";

export class EgretConfig extends Listener {
    private logger: Logger;
    private isRunning = false;
    private factory: ConfigWriterFactory;
    constructor(protected subscriptions: vscode.Disposable[]) {
        super();
        this.logger = getLogger(this);
        this.factory = new ConfigWriterFactory(subscriptions);
    }
    public async step(url: string) {
        if (this.isRunning) return;
        this.isRunning = true;
        return this.factory.run(url).catch(err => {
            this.logger.devlog(err);
        }).finally(() => {
            this.isRunning = false;
        });
    }
}