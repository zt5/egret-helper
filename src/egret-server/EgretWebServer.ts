import { EgretConfig } from "../common/EgretConfig";
import { getLogger, Logger, showLog } from "../common/Logger";
import { EgretCompileType, EgretServiceStatus, HttpMsgType } from "../define";
import * as helper from "../helper";
import EgretServer from './EgretServer';
import HttpServer from '../common/HttpServer';

export default class EgretWebServer {
    private server: HttpServer;
    private _urlStr: string | undefined;
    private _isDestroy = false;
    private logger: Logger;
    constructor(private father: EgretServer, private egretJson: EgretConfig) {
        this.logger = getLogger(this);
        this.server = new HttpServer();
    }
    public async start() {
        showLog(true);
        return this._start().catch(err => {
            this.logger.log(err);
            this.logger.devlog(`exec err=`, err)
            if (this.server) this.server.clear();
        });
    }
    private async _start() {
        this.logger.devlog(`start`)
        let folderString = helper.getCurRootPath();

        switch (helper.getConfigObj().egretCompileType) {
            case EgretCompileType.auto:
                let isWebpackMode = await helper.isWebpackMode();
                if (isWebpackMode) folderString = helper.getWebpackDebugPath();
                break;
            case EgretCompileType.webpack:
                folderString = helper.getWebpackDebugPath();
                break;
            case EgretCompileType.legacy:
                break;
        }


        this.logger.devlog(`start workspaceFolder=`, folderString)
        await this.server.clear()
        this.exec(folderString);
    }
    private exec(folderString: string) {
        if (this._isDestroy) return;
        this.logger.devlog(`exec folderString=${folderString}`)
        this.father.bar.status = EgretServiceStatus.Starting;

        this.server.start(folderString, (type: HttpMsgType, data: string) => {
            switch (type) {
                case HttpMsgType.Error:
                    this.logger.log(data);
                    this.logger.devlog(`exec error=`, data)
                    break;
                case HttpMsgType.Message:
                    this.logger.log(data);
                    this.logger.devlog(`exec message=`, data)
                    break;
                case HttpMsgType.Exit:
                    this.father.bar.status = EgretServiceStatus.Free;
                    this.logger.log(`exit code=${data}`);
                    this.logger.devlog(`exec exit=`, data)
                    break;
                case HttpMsgType.Url:
                    this._urlStr = data;
                    this.egretJson.step(this._urlStr).then(() => {
                        this.father.bar.status = EgretServiceStatus.Running;
                    })
                    break;
            }
        })
    }
    public async destroy() {
        this.logger.devlog(`destroy`)
        this._isDestroy = true;
        await this.server.clear();
    }
    public get isDestroy() {
        return this._isDestroy;
    }
    public get urlStr() {
        return this._urlStr;
    }
}