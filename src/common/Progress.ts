import * as cp from 'child_process';
import * as treekill from "tree-kill";
import { ChildProcessExt, OutPutFun, ProgressMsgType } from "../define";
import Helper from './Helper';
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
            this.logger.debug(`exec cmd: `, cmd, ` cwd: `, cwdstr)
            execOption.cwd = cwdstr;
        } else {
            this.logger.debug(`exec cmd: `, cmd)
        }
        const progress: ChildProcessExt = cp.exec(cmd, execOption, (error, stdout, stderr) => {
            //这里只有进程彻底结束后才会回调
            if (progress.isDestroy) return;
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
        this.logger.debug(`clear cmd: ${this.cmd}`)
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
        this.logger.debug(`killProgress pid: ${pid}`)

        return new Promise<void>((resolve, reject) => {
            treekill(pid, (err) => {
                this.logger.debug(`killProgress pid: ${pid} success!`)
                resolve();
            });
        });
    }
    private getErrorHandler = (err: any) => {
        if (this.outputFun) this.outputFun(ProgressMsgType.Error, Helper.convertObjStr(err));
    }
    private exitHandler = (code: number) => {
        if (this.outputFun) this.outputFun(ProgressMsgType.Exit, `${code}`);
    }
    private getDataHandler = (data: any) => {
        if (this.outputFun) this.outputFun(ProgressMsgType.Message, Helper.convertObjStr(data));
    }
}