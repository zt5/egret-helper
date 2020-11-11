import * as cp from "child_process";
import * as fs from "fs";
import * as vscode from "vscode";
import Listener from "../common/Listener";
import { getLogger, Logger, showLog } from "../common/Logger";
import * as helper from "../helper";
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
                showLog(true);
                Launcher.createProject().then(result => {
                    if (result == "cancel") {
                        //取消了
                    } else if (fs.existsSync(result)) {
                        //创建了并返回了路径
                        this.logger.devlog("open:" + result);
                        const spawnObj = cp.exec(`code .`, { cwd: result }, (err, stdout, stderr) => {
                            if (err) {
                                this.logger.devlog(err);
                            }
                            if (stdout) {
                                this.logger.devlog(stdout);
                            }
                            if (stderr) {
                                this.logger.devlog(stderr);
                            }
                        })
                        if (spawnObj.stdout) {
                            spawnObj.stdout.on('data', (chunk) => {
                                this.logger.devlog(chunk);
                            });
                        }
                        if (spawnObj.stderr) {
                            spawnObj.stderr.on('data', (data) => {
                                this.logger.log(data);
                            });
                        }
                        spawnObj.on('close', (code) => {
                            this.logger.devlog('close code : ' + code);
                        });
                        spawnObj.on('exit', (code, signal) => {
                            this.logger.devlog("exit code:" + code);
                        });
                    }
                }).catch(err => vscode.window.showErrorMessage(err));
            })
        )
        this.addListener(
            vscode.commands.registerCommand('egret-helper.publishProject', () => {
                showLog(true);
                let curRootPath = helper.getCurRootPath();
                if (curRootPath) {
                    Launcher.publishProject(curRootPath.uri.fsPath).catch(err => vscode.window.showErrorMessage(err));
                }
            })
        )
    }
    public update() {
        if (this.provider) {
            this.provider.refresh();
        }
    }
}