import * as cp from 'child_process';
import * as treekill from "tree-kill";
import { ChildProcessExt, OutPutFun, ProgressMsgType } from "../define";
import { getLogger, Logger } from './Logger';

export default class Progress {
    private _progress: ChildProcessExt | undefined;
    private outputFun: OutPutFun;
    private cmd: string | undefined;
    private logger: Logger;
    constructor() {
        this.logger = getLogger(this);
    }
    public async exec(cmd: string, cwdstr?: string, outputFun?: OutPutFun) {
        await this.clear();

        this.cmd = cmd;
        this.outputFun = outputFun;
        let execOption: { encoding: BufferEncoding } & cp.ExecOptions = { encoding: "utf-8" };
        if (cwdstr) {
            this.logger.devlog(`exec cmd=`, cmd, ` cwd=`, cwdstr)
            execOption.cwd = cwdstr;
        } else {
            this.logger.devlog(`exec cmd=`, cmd)
        }
        const progress: ChildProcessExt = cp.exec(cmd, execOption, (error, stdout, stderr) => {
            //这里只有进程彻底结束后才会回调
            if (progress.isDestroy) return;
            if (error && this.outputFun) {
                this.logger.devlog(`exec cmd=`, cmd, ` cwd=`, cwdstr, ` error=`, error)
            }
            if (stdout && this.outputFun) {
                this.logger.devlog(`exec cmd=`, cmd, ` cwd=`, cwdstr, ` stdout=`, stdout)
            }
            if (stderr && this.outputFun) {
                this.logger.devlog(`exec cmd=`, cmd, ` cwd=`, cwdstr, ` stderr=`, stderr)
            }
        });
        if (progress.stdout) {
            progress.stdout.on('data', this.getDataHandler);
        }
        if (progress.stderr) {
            progress.stderr.on('data', this.getErrorHandler);
        }
        progress.on('exit', this.exitHandler);
        this._progress = progress;
    }
    public get progress() {
        return this._progress;
    }
    public async clear() {
        this.logger.devlog(`clear cmd=${this.cmd}`)
        if (this._progress) {
            if (this._progress.stdout) {
                this._progress.stdout.off('data', this.getDataHandler);
            }
            if (this._progress.stderr) {
                this._progress.stderr.off('data', this.getErrorHandler);
            }
            this._progress.off('exit', this.exitHandler);
            const pid = this._progress.pid;//先保留pid
            this._progress.isDestroy = true;
            this._progress = undefined;//确保执行了就把进程信息删除掉 防止重复调用
            await this.killProgress(pid)
        }
        this.outputFun = undefined;
    }
    private killProgress(pid: number) {
        this.logger.devlog(`killProgress pid=${pid}`)

        return new Promise((resolve, reject) => {
            treekill(pid, (err) => {
                if (err) this.logger.devlog(`killProgress pid=${pid} `, err);
                else this.logger.devlog(`killProgress pid=${pid} success!`)
                resolve();
            });
        });
    }
    private getErrorHandler = (err: any) => {
        this.logger.devlog(`getErrorHandler cmd=`, this.cmd, ` error=`, err)
        if (this.outputFun) {
            this.outputFun(ProgressMsgType.Error, typeof err == "object" ? `${JSON.stringify(err)}` : err);
        }
    }
    private exitHandler = (code: number) => {
        this.logger.devlog(`exitHandler cmd=${this.cmd} code=${code}`)
        if (this.outputFun) this.outputFun(ProgressMsgType.Exit, `${code}`);
    }
    private getDataHandler = (data: any) => {
        this.logger.devlog(`getDataHandler data=`, data)
        if (this.outputFun) this.outputFun(ProgressMsgType.Message, typeof data == "object" ? `${JSON.stringify(data)}` : data);
    }
}