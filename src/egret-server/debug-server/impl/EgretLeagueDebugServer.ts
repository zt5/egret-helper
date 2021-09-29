import Helper from '../../../common/Helper';
import { EgretHostType, EgretServiceStatus, ProgressMsgType, Platform } from "../../../define";
import EgretDebugServerImpl from "../EgretDebugServerImpl";
export default class EgretLeagueDebugServer extends EgretDebugServerImpl {
    public async exec(folderString: string) {
        if (this.host.isDestroy) return;
        this.logger.debug(`exec folderString: ${folderString}`)
        this.host.controller.bar.status = EgretServiceStatus.Starting;
        await this.progress.exec(`egret run --serverOnly --port ${Helper.getConfigObj().port}`, folderString, (type: ProgressMsgType, data: string) => {
            switch (type) {
                case ProgressMsgType.Error:
                    if (Helper.getPlatform() == Platform.Windows) {
                        data = this.binaryToGBK(data);
                    } else {
                        data = this.binaryToUTF8(data);
                    }
                    Helper.checkHasError(data);
                    this.logger.error(data);
                    break;
                case ProgressMsgType.Message:
                    data = this.binaryToUTF8(data);
                    Helper.checkHasError(data);
                    this.logger.log(data);
                    const urlMsg = this.getEgretUrl(data);
                    if (urlMsg) {
                        this.logger.debug(`egret http url: `, urlMsg)
                        this._urlStr = urlMsg;
                        this.host.egretJson.step(this._urlStr).then(() => {
                            this.host.controller.bar.status = EgretServiceStatus.Running;
                        })
                    }
                    break;
                case ProgressMsgType.Exit:
                    this.host.controller.bar.status = EgretServiceStatus.Free;
                    this.logger.warn(`exit code: ${data}`);
                    this._urlStr = undefined;
                    break;
            }
        }, "binary");
    }
    private getEgretUrl(data: string): string {
        let urlMsg: string = "";

        let urls = `${data}`.match(/(?<=Url\s*:\s*)\S+(?=\s*)/g);

        switch (Helper.getConfigObj().hostType) {
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
}