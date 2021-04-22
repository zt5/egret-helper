import * as vscode from "vscode";
import { EgretConfig } from "../common/EgretConfig";
import { getLogger, Logger, showLog } from "../common/Logger";
import { EgretCompileType, EgretServiceStatus, HttpMsgType } from "../define";
import EgretServer from './EgretServer';
import HttpServer from '../common/HttpServer';
import Helper from "../common/Helper";
import ConfigWriterUtil from "../common/config-writer/ConfigWriterUtil";
import ConfigWebpackWriter from "../common/config-writer/impl/ConfigWebpackWriter";
import { Command } from "../common/Command";

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
        let folderString = Helper.getCurRootPath();
        const compileMode = await ConfigWriterUtil.instance.getEgretCompileMode();
        this.logger.devlog("egret compile mode=", compileMode);
        let mapUrl: { [key: string]: string } | undefined = undefined;
        switch (compileMode) {
            case EgretCompileType.webpack:
                folderString = Helper.getWebpackDebugPath();
                // 因为白鹭打包脚本限制 webpack的main.js.map文件特殊处理路径 
                mapUrl = { ["/js/" + ConfigWebpackWriter.SOURCE_MAP_NAME]: ConfigWebpackWriter.SOURCE_MAP_NAME };
                break;
            case EgretCompileType.legacy:
                break;
        }

        this.logger.devlog(`start workspaceFolder=`, folderString)
        await this.server.clear()
        this.exec(folderString, mapUrl);
    }
    private exec(folderString: string, mapUrl?: { [key: string]: string }) {
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
                        vscode.commands.executeCommand(Command.EGRET_BUILD);
                    })
                    break;
            }
        }, mapUrl)
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