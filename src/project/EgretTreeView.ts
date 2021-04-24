import * as cp from "child_process";
import * as fs from "fs";
import * as vscode from "vscode";
import Helper from "../common/Helper";
import Listener from "../common/Listener";
import { getLogger, Logger, showLog } from "../common/Logger";
import Launcher from "../native-launcher/launcher";
import EgretTreeProvider from "./EgretTreeProvider";

export default class EgretTreeView extends Listener {
    private provider: EgretTreeProvider;
    private logger: Logger;
    public constructor(protected subscriptions: vscode.Disposable[]) {
        super();
        this.logger = getLogger(this);
        this.provider = new EgretTreeProvider();
        this.addListener(
            vscode.window.registerTreeDataProvider('egretProject', this.provider)
        )
        this.addListener(
            vscode.commands.registerCommand('egret-helper.createProject', () => {
                showLog();
                Launcher.createProject().then(result => {
                    if (result == "cancel") {
                        //取消了
                    } else if (fs.existsSync(result)) {
                        //创建了并返回了路径
                        this.logger.debug("open:" + result);
                        const spawnObj = cp.exec(`code .`, { cwd: result }, (err, stdout, stderr) => {
                        })
                        if (spawnObj.stdout) {
                            spawnObj.stdout.on('data', (chunk) => {
                                this.logger.debug(chunk);
                            });
                        }
                        if (spawnObj.stderr) {
                            spawnObj.stderr.on('data', (data) => {
                                this.logger.error(data);
                            });
                        }
                        spawnObj.on('close', (code) => {
                            this.logger.debug('close code : ' + code);
                        });
                        spawnObj.on('exit', (code, signal) => {
                            this.logger.debug("exit code:" + code);
                        });
                    }
                }).catch(err => this.logger.error(err));
            })
        )
        this.addListener(
            vscode.commands.registerCommand('egret-helper.publishProject', () => {
                showLog();
                Launcher.publishProject(Helper.getCurRootPath()).catch(err => vscode.window.showErrorMessage(err));
            })
        )
    }
    public update() {
        if (this.provider) {
            this.provider.refresh();
        }
    }
}