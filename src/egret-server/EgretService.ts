import * as vscode from 'vscode';
import { EgretJsonConfig } from "../common/EgretJsonConfig";
import { getLogger, Logger, showLog } from "../common/Logger";
import Progress from '../common/Progress';
import { EgretHostType, EgretServiceStatus, ProgressMsgType } from "../define";
import * as helper from "../helper";
import { toasterr } from "../helper";
import EgretServer from './EgretServer';
export default class EgretService {
    private progress: Progress;
    private _urlStr: string | undefined;
    private _isDestroy = false;
    private logger: Logger;
    private egretJson: EgretJsonConfig;
    constructor(private father: EgretServer) {
        this.logger = getLogger(this);
        this.logger.devlog(`constructor`)
        this.progress = new Progress();
        this.egretJson = new EgretJsonConfig();
    }
    public async start(debug = false) {
        showLog(true);
        return this._start(debug).catch(err => {
            this.logger.log(err);
            this.logger.devlog(`exec err=`, err)
            if (this.progress) this.progress.clear();
        });
    }
    private async _start(debug: boolean) {
        this.logger.devlog(`start debug=`, debug)
        const folderString = helper.getCurRootPath();
        this.logger.devlog(`start workspaceFolder=`, folderString)
        await this.progress.clear()
        this.exec(folderString, debug);
    }
    private exec(folderString: string, debug: boolean) {
        if (this._isDestroy) return;
        this.logger.devlog(`exec folderString=${folderString} debug=${debug}`)
        this.father.bar.status = EgretServiceStatus.Starting;
        if (debug) vscode.commands.executeCommand("workbench.action.debug.stop")
        this.progress.exec('egret run --serverOnly', folderString, (type: ProgressMsgType, data: string) => {
            switch (type) {
                case ProgressMsgType.Error:
                    toasterr(data);
                    this.logger.log(data);
                    this.logger.devlog(`exec error=`, data)
                    break;
                case ProgressMsgType.Message:
                    this.logger.log(data);
                    this.logger.devlog(`exec message=`, data)
                    const urlMsg = this.getEgretUrl(data);
                    this.logger.devlog(`egret http url`, urlMsg)
                    if (urlMsg) {
                        this._urlStr = urlMsg;
                        this.egretJson.step(this._urlStr).then(()=>{
                            if (debug) vscode.commands.executeCommand("workbench.action.debug.start");
                            this.father.bar.status = EgretServiceStatus.Running;
                        }).catch(err => {
                            this.logger.devlog(err);
                        })
                    }
                    break;
                case ProgressMsgType.Exit:
                    this.father.bar.status = EgretServiceStatus.Free;
                    this.logger.log(`exit code=${data}`);
                    this.logger.devlog(`exec exit=`, data)
                    break;
            }
        });
    }
    private getEgretUrl(data: string): string {
        let urlMsg: string = "";

        let urls = `${data}`.match(/(?<=Url\s*:\s*)\S+(?=\s*)/g);

        switch (helper.getConfigObj().hostType) {
            case EgretHostType.ip:
                if (urls) {
                    urlMsg = urls[0];
                }
                break;
            case EgretHostType.localhost:
                if (urls) {
                    urlMsg = urls[0].replace(/(\d+\s*\.\s*){3}\d+/g, "127.0.0.1");
                }
                break;
        }
        return urlMsg;
    }

    public async destroy() {
        this.logger.devlog(`destroy`)
        this._isDestroy = true;
        await this.progress.clear();
    }
    public get isDestroy() {
        return this._isDestroy;
    }
    public get urlStr() {
        return this._urlStr;
    }
}