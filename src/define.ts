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
export type ConfigSyncMap = {
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
	/**egret项目文件egretProperties.json文件路径(相对于项目根目录)*/
	egretPropertiesPath:string;
	/**egret资源配置default.res.json的路径(相对于项目根目录)*/
	egretResourceJsonPath:string;
	/**要同步到default.res.json资源文件夹路径(相对于项目根目录)*/
	egretResourcePath:string;
	/**exml搜索路径(glob字符串格式)*/
	exmlSearchGlob:string;
	/**是否使用外部编辑器打开exml(目前仅支持在ts文件快捷键打开)*/
	exmlOpenExternal:boolean;
	/**同步default.res.json的资源*/
	resMap: ConfigSyncMap,
	/**同步default.res.json忽略的资源*/
	resMapIgnore: string[],
}