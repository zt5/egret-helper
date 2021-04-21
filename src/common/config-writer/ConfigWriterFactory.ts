import ConfigWriterImpl from "./ConfigWriterImpl";
import * as vscode from "vscode";
import { EgretCompileType } from "../../define";
import ConfigWebpackWriter from "./impl/ConfigWebpackWriter";
import ConfigLegacyWriter from "./impl/ConfigLegacyWriter";
import Helper from "../Helper";
export default class ConfigWriterFactory {
    private writer: ConfigWriterImpl | undefined;
    private url: string | undefined;
    constructor(private subscriptions: vscode.Disposable[]) {
    }
    public async run(url: string,) {
        this.url = url;
        const compileType = await this.getCompileType();
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
    private async getCompileType() {
        switch (Helper.getConfigObj().egretCompileType) {
            case EgretCompileType.auto:
                let isWebpackMode = await Helper.isWebpackMode();
                if (isWebpackMode) return EgretCompileType.webpack;
                else return EgretCompileType.legacy;
            case EgretCompileType.webpack:
                return EgretCompileType.webpack;
            case EgretCompileType.legacy:
                return EgretCompileType.legacy;
        }
    }
}