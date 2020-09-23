import * as cp from 'child_process';
import * as vscode from "vscode";
export enum ProgressMsgType {
    Error, Message, Exit
}
export interface ChildProcessExt extends cp.ChildProcess {
    isDestroy?: boolean;
}
export type OutPutFun = ((ProgressMsgType: number, msg: string) => void) | undefined
export type EgretRes = {
    url: string;
    type: string;
    name: string;
}
export type EgretResMap = { [key: string]: EgretRes }
export enum EgretServiceStatus {
    Starting, Running, Destroying, Free
}
export enum EgretServiceExtStatus {
    Building, Syncing, Free
}
export type ConfigObjWatch = {
	[key: string]: {
		tail: string,
		type: string
	}
}
export interface ConfigObj extends vscode.WorkspaceConfiguration {
	/**插件是否可用*/
	enable: boolean;
	/**打印详细日志*/
	devlog: boolean;
	/**default.res.json要监测的资源*/
	resWatch: ConfigObjWatch,
	/**default.res.json监测忽略的资源*/
	resWatchIgnore: string[],
}