import DebugConfigWriterUtil from "./debug-server/DebugConfigWriterUtil";
import { EgretConfig } from "../common/EgretConfig";
import Helper from "../common/Helper";
import { getLogger, Logger, showLog } from "../common/Logger";
import { EgretCompileType } from "../define";
import EgretServer from './EgretServer';
import EgretDebugServerImpl from './debug-server/EgretDebugServerImpl';
import EgretLeagueDebugServer from "./debug-server/impl/EgretLeagueDebugServer";
import EgretWebpackDebugServer from "./debug-server/impl/EgretWebpackDebugServer";
export default class EgretDebugHost {
    protected _isDestroy = false;
    private logger: Logger;
    private debugServer: EgretDebugServerImpl | undefined;
    constructor(public server: EgretServer, public egretJson: EgretConfig) {
        this.logger = getLogger(this);
    }
    public async step() {
        return this._step().catch(err => {
            this.logger.error(err);
            if (this.debugServer) return this.debugServer.clear();
        });
    }
    private async _step() {
        showLog();
        const compileType = await DebugConfigWriterUtil.instance.getEgretCompileMode();
        await this.createServer(compileType);
        if (!this.debugServer) throw new Error("unsupport egret compile type: " + compileType);
        await this.debugServer.changeConfig();
        const folderString = Helper.getCurRootPath();
        this.logger.debug(`start workspaceFolder: `, folderString);
        await this.debugServer.exec(folderString);
    }
    public get urlStr() {
        return this.debugServer?.urlStr;
    }
    public get isDestroy() {
        return this._isDestroy;
    }
    public async destroy() {
        this._isDestroy = true;
        this.logger.debug("destroy");
        if (this.debugServer) return this.debugServer.clear();
        this.debugServer = undefined;
    }
    private async createServer(compileType: EgretCompileType) {

        if (this.debugServer) {
            await this.debugServer.clear();
            if (this.debugServer.CompileType == compileType) {
                this.logger.debug("server type already init: " + compileType)
                return;
            }
        }

        switch (compileType) {
            case EgretCompileType.webpack:
                this.debugServer = new EgretWebpackDebugServer(this);
                break;
            case EgretCompileType.legacy:
                this.debugServer = new EgretLeagueDebugServer(this);
                break;
        }
    }
}