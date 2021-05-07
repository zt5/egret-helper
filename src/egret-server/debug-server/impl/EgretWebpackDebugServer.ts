import * as fs from "fs";
import * as jju from "jju";
import * as net from "net";
import Helper from '../../../common/Helper';
import { showLog } from '../../../common/Logger';
import { EgretServiceStatus, ProgressMsgType } from "../../../define";
import DebugConfigWriterUtil from '../DebugConfigWriterUtil';
import EgretDebugServerImpl from "../EgretDebugServerImpl";
export default class EgretWebpackDebugServer extends EgretDebugServerImpl {
    private myPort: number | undefined;
    private serverCanUse = false;
    public async exec(folderString: string) {
        if (this.host.isDestroy) return;
        await this.changeConfig();
        this.logger.debug(`exec folderString: ${folderString}`)
        this.host.controller.bar.status = EgretServiceStatus.Starting;
        this.serverCanUse = false;
        await this.progress.exec(`egret run`, folderString, (type: ProgressMsgType, data: string) => {
            switch (type) {
                case ProgressMsgType.Error:
                    Helper.checkHasError(this.stripAnsiColor(data));
                    this.logger.error(data);
                    break;
                case ProgressMsgType.Message:
                    const str = this.stripAnsiColor(data);
                    Helper.checkHasError(str);
                    this.logger.log(data);
                    if (!this.serverCanUse) {//webpack现在没法关闭自动编译 这里只要代码改变了就会多次调用 所以加了重复判断
                        const urlMsg = this.getEgretUrl(str);
                        if (urlMsg) {
                            this.logger.debug(`egret http url: `, urlMsg)
                            this._urlStr = urlMsg;
                            this.host.egretJson.step(this._urlStr).then(() => {
                                this.host.controller.bar.status = EgretServiceStatus.Running;
                                this.serverCanUse = true;
                            })
                        }
                    }

                    break;
                case ProgressMsgType.Exit:
                    this.serverCanUse = false;
                    this.host.controller.bar.status = EgretServiceStatus.Free;
                    this.logger.warn(`exit code: ${data}`);
                    break;
            }
        });
    }



    private checkPortInUse(port: number) {
        return new Promise<number>((resolve, reject) => {
            let server = net.createServer().listen(port);
            server.on('listening', () => {
                server.close();
                resolve(port);
            });
            server.on('error', (err) => {
                if ((<NodeJS.ErrnoException>err).code == 'EADDRINUSE') {
                    resolve(-1);
                }
            });
        });
    }

    private async findCanUsePort(port: number) {
        let myPort = await this.checkPortInUse(port);
        while (myPort == -1) {
            this.logger.debug(`port：${port} bind error`);
            port++;
            myPort = await this.checkPortInUse(port);
        }
        return myPort;
    }

    public async changeConfig() {
        this.myPort = await this.findCanUsePort(Helper.getConfigObj().port);
        let webpack_path = Helper.getWebpackConfigPath();
        if (fs.existsSync(webpack_path)) {
            let webpackstr = await Helper.readFile(webpack_path);
            webpackstr = this.replace(webpackstr);
            await Helper.writeFile(webpack_path, webpackstr);
        } else {
            Helper.toasterr(`file ${webpack_path} not exist!!!`, {
                "查看log": () => {
                    showLog();
                }
            });
        }
    }
    private replace(str: string) {
        const { leftIndex, rightIndex, errMsg } = this.getWebpackIndex(str);
        if (errMsg || leftIndex === undefined || rightIndex === undefined) {
            this.logger.error(errMsg);
            return str;
        }
        let webpackStr = str.slice(leftIndex, rightIndex + 1);

        const jsobjParam: jju.ParseOptions & jju.StringifyOptions = { reserved_keys: 'replace', quote: '"' };

        let jsObj = jju.parse(webpackStr, jsobjParam)
        jsObj.open = false;
        jsObj.port = this.myPort;
        let output = jju.update(webpackStr, jsObj, jsobjParam)
        if (webpackStr != output) {
            let finalStr = str.slice(0, leftIndex) + output + str.slice(rightIndex + 1);
            this.logger.debug("webpack config changed");
            return finalStr;
        }
        return str;
    }
    private stripAnsiColor(str: string) {
        return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]/g, '')
    }
    private getWebpackIndex(str: string) {
        let { errMsg } = DebugConfigWriterUtil.instance.getRunCmd(str);
        if (errMsg) {
            return { errMsg };
        }

        let WebpackDevServerPluginIndex = str.search(/new\s+WebpackDevServerPlugin\s*\(\s*{/g)//匹配new WebpackDevServerPlugin
        if (WebpackDevServerPluginIndex == -1) {
            return { errMsg: `find "new WebpackDevServerPlugin({" error` };
        }
        let leftIndex = str.indexOf("{", WebpackDevServerPluginIndex);
        let rightIndex = DebugConfigWriterUtil.instance.findNextBrance(str, leftIndex, str.length);
        if (rightIndex == -1) {
            return { errMsg: `find "new WebpackDevServerPlugin({" right brace error` };
        }
        return { leftIndex, rightIndex };
    }
    private getEgretUrl(data: string): string {
        let urlMsg: string = "";
        if (data.indexOf("Compiled successfully") != -1 || data.indexOf("Failed to compile") != -1) {
            const ip = Helper.getIp()[0];
            if (ip) {
                return `http://${ip}:${this.myPort}/index.html`;
            }
        }
        return urlMsg;
    }
}