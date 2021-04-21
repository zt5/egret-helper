import * as cp from 'child_process';
import * as vscode from "vscode";
export enum ProgressMsgType {
	Message, Error, Exit
}
export enum HttpMsgType {
	Message, Error, Exit, Url
}
export interface ChildProcessExt extends cp.ChildProcess {
	isDestroy?: boolean;
}
export type OutPutFun = ((progressMsgType: ProgressMsgType, msg: string) => void) | undefined
export type HttpOutPutFun = ((httpMsgType: HttpMsgType, msg: string) => void) | undefined
export type EgretRes = {
	url: string;
	type: string;
	name: string;
}
export type EgretGroups = {
	keys: string;
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
export enum Platform {
	OSX, Windows, Unknown
}
export enum OpenEgretServerType {
	auto = "auto",
	alert = "alert"
}
export enum EgretCompileType {
	auto = "auto",
	legacy = "legacy",
	webpack = "webpack"
}
export enum EgretHostType {
	localhost = "127.0.0.1",
	ip = "ip"
}
export type LaunchJsonConfType = {
	type: string;
	request: string;
	name: string;
	url: string;
	webRoot: string;
}
export enum DebugBrowserType {
	chrome = "chrome",
	edge = "edge",
}
export interface ConfigObj extends vscode.WorkspaceConfiguration {
	/**插件是否可用*/
	enable: boolean;
	/**打印详细日志*/
	devlog: boolean;
	/**是否弹出错误弹窗*/
	alertErrorWin: boolean;
	/**egret资源配置default.res.json的路径(相对于项目根目录)*/
	egretResourceJsonPath: string;
	/**要同步到default.res.json资源文件夹路径(相对于项目根目录)*/
	egretResourcePath: string;
	/**同步default.res.json的资源*/
	resMap: ConfigSyncMap,
	/**同步default.res.json忽略的资源*/
	resMapIgnore: string[],
	/**打开项目时怎么开启Egret服务器*/
	openEgretServer: OpenEgretServerType,
	/**Egret服务器http地址的格式*/
	hostType: EgretHostType;
	/**Egret调试的浏览器*/
	debugBrowser: DebugBrowserType;
	/**Egret服务器首选端口*/
	port: number;
	/**Egret的编译代码方式*/
	egretCompileType: EgretCompileType;
}