import Helper from '../../../common/Helper';
import { EgretHostType, EgretServiceStatus, ProgressMsgType } from "../../../define";
import EgretDebugServerImpl from "../EgretDebugServerImpl";
export default class EgretLeagueDebugServer extends EgretDebugServerImpl {
    public async exec(folderString: string) {
        if (this.host.isDestroy) return;
        this.logger.debug(`exec folderString: ${folderString}`)
        this.host.server.bar.status = EgretServiceStatus.Starting;
        await this.progress.exec(`egret run --serverOnly --port ${Helper.getConfigObj().port}`, folderString, (type: ProgressMsgType, data: string) => {
            switch (type) {
                case ProgressMsgType.Error:
                    Helper.toasterr(data);
                    this.logger.error(data);
                    break;
                case ProgressMsgType.Message:
                    this.logger.raw(data);
                    const urlMsg = this.getEgretUrl(data);
                    this.logger.debug(`egret http url: `, urlMsg)
                    if (urlMsg) {
                        this._urlStr = urlMsg;
                        this.host.egretJson.step(this._urlStr).then(() => {
                            this.host.server.bar.status = EgretServiceStatus.Running;
                        })
                    }
                    break;
                case ProgressMsgType.Exit:
                    this.host.server.bar.status = EgretServiceStatus.Free;
                    this.logger.warn(`exit code: ${data}`);
                    break;
            }
        });
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