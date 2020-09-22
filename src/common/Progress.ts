import * as cp from 'child_process';
import * as treekill from "tree-kill";
import { devlog } from '../helper';

export enum ProgressMsgType {
    Error, Message, Exit
}
interface ChildProcessExt extends cp.ChildProcess {
    isDestroy?: boolean;
}
type OutPutFun = ((ProgressMsgType: number, msg: string) => void) | undefined
export default class Progress {
    private _progress: ChildProcessExt | undefined;
    private outputFun: OutPutFun;
    private cmd: string | undefined;
    public async exec(cmd: string, cwdstr?: string, outputFun?: OutPutFun) {
        await this.clear();

        this.cmd = cmd;
        devlog(`Progress exec cmd=`, cmd, ` cwd=`, cwdstr)
        this.outputFun = outputFun;
        const progress: ChildProcessExt = cp.exec(cmd, { encoding: "utf-8", cwd: cwdstr ? cwdstr : undefined }, (error, stdout, stderr) => {
            if (progress.isDestroy) return;
            if (error && this.outputFun) {
                devlog(`Progress exec cmd=`, cmd, ` cwd=`, cwdstr, ` error=`, error)
                this.outputFun(ProgressMsgType.Error, JSON.stringify(error));
            }
            // if (stdout && this.outputFun) {
            //     devlog(`Progress exec cmd=`, cmd, ` cwd=`, cwdstr, ` stdout=`, stdout)
            //     this.outputFun(ProgressMsgType.Message, stdout);
            // }
            if (stderr && this.outputFun) {
                devlog(`Progress exec cmd=`, cmd, ` cwd=`, cwdstr, ` stdout=`, stderr)
                this.outputFun(ProgressMsgType.Error, stderr);
            }
        });
        if (progress.stdout) {
            progress.stdout.on('data', this.getDataHandler);
        }
        progress.on('exit', this.exitHandler);
        this._progress = progress;
    }
    public get progress() {
        return this._progress;
    }
    public async clear() {
        devlog(`Progress clear cmd=${this.cmd}`)
        if (this._progress) {
            if (this._progress.stdout) {
                this._progress.stdout.off('data', this.getDataHandler);
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
        devlog(`killProgress pid:${pid}`)

        return new Promise((resolve, reject) => {
            treekill(pid, (err) => {
                if (err) devlog(`killProgress pid:${pid} `, err);
                else devlog(`killProgress pid:${pid} success!`)
                resolve();
            });
        });
    }
    private exitHandler = (code: number) => {
        devlog(`Progress exitHandler cmd=${this.cmd} code=${code}`)
        if (this.outputFun) this.outputFun(ProgressMsgType.Exit, `${code}`);
    }
    private getDataHandler = (data: any) => {
        devlog(`Progress getDataHandler data=`, data)
        if (this.outputFun) this.outputFun(ProgressMsgType.Message, `${data}`);
    }
}