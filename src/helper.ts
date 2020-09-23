import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";

export const SKIN_EXP = /\s*resource\s*.*\.exml\s*/;
export const AUTO_COMPLETE_EXP = /this\.skinName\s*=\s*(.*)/;
export const CONFG_NAME = "egret-helper";


export function convertPath(cur: string, total: string, pos: vscode.Position, result: RegExpMatchArray) {
	let curStr = total.slice(result.index, pos.character);
	let splitIndex = cur.indexOf("/", curStr.length);
	let fileExt = ".exml";
	if (splitIndex == -1) splitIndex = cur.indexOf(fileExt, curStr.length) + fileExt.length;
	curStr = cur.slice(0, splitIndex);
	return convertFullPath(curStr);
}
export function convertFullPath(cur: string) {
	let rootPath = getCurRootPath()
	if (rootPath) {
		return path.normalize(path.join(rootPath.uri.fsPath, cur));
	}
	return null;
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
export function getConfigObj() {
	return <ConfigObj>vscode.workspace.getConfiguration(CONFG_NAME);
}
export function getCurRootPath() {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (workspaceFolders && workspaceFolders.length > 0) {
		for (const workspaceFolder of workspaceFolders) {
			const folderString = workspaceFolder.uri.fsPath;
			if (!folderString) {
				continue;
			}
			const egretConfig = path.join(folderString, 'egretProperties.json');
			if (!fs.existsSync(egretConfig)) {
				continue;
			}
			return workspaceFolder;
		}
	}
	return null;
}
export function getDefaultResJsonPath() {
	const workspaceFolder = getCurRootPath();
	if (workspaceFolder) {
		return path.join(workspaceFolder.uri.fsPath, "resource", "default.res.json");
	}
	return null;
}
export function getLaunchJsonPath() {
	const workspaceFolder = getCurRootPath();
	if (workspaceFolder) {
		return path.join(workspaceFolder.uri.fsPath, ".vscode", "launch.json");
	}
	return null;
}
export function getEgretResPath() {
	const workspaceFolder = getCurRootPath();
	if (workspaceFolder) {
		return path.join(workspaceFolder.uri.fsPath, "resource");
	}
	return null;
}

export function loopFile(file: string, fileFun: (file: string) => void) {
	let state = fs.statSync(file);
	if (state.isDirectory()) {
		let dirs = fs.readdirSync(file);
		for (let i = 0; i < dirs.length; i++) {
			loopFile(path.join(file, dirs[i]), fileFun);
		}
	} else {
		fileFun(file);
	}
};
export function writeFile(file: string, data: string): Promise<void> {
	return new Promise((resolve, reject) => {
		fs.writeFile(file, data, (err) => {
			if (err) reject(err);
			else resolve();
		})
	})
}


let _channel: vscode.OutputChannel;
export function log(...msg: any[]) {
	if (!_channel) _channel = vscode.window.createOutputChannel('Egret');/**日志窗口名*/
	let str = "";
	for (let i = 0; i < msg.length; i++) {
		str += _log(_channel, msg[i]);
	}
	if (str && !str.endsWith("\n")) {
		_channel.appendLine(str);
	} else {
		_channel.append(str);
	}
}

export function devlog(...msg: any[]) {
	// if (!getConfigObj().devlog) return;
	log(...msg);
}
function _log(_channel: vscode.OutputChannel, msg: any) {
	if (typeof msg == "string") return msg;
	else if (typeof msg == "number") return `${msg}`;
	else if (typeof msg == "boolean") return `${msg}`;
	else if (msg === null || msg === undefined) return `${msg}`;
	else return JSON.stringify(msg);
}
