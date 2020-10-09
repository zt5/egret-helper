import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import Progress from './common/Progress';
import { ConfigObj, Platform, ProgressMsgType } from "./define";

export function valNeedAutoComplete(text: string) {
	return !!text.match(/\S+\s*\.skinName\s*=\s*(.*?)/);
}
export function getSkinExmlDefine(text: string) {
	return text.match(/(?<=("|'|`))\s*(.*?)\.exml\s*(?=("|'|`))/);
}

export function openExmlEditor(exmlPath: string): Promise<Progress> {
	return new Promise((resolve, reject) => {
		const prgress = new Progress();
		prgress.exec(`eui "${exmlPath}"`, undefined, (type, data) => {
			switch (type) {
				case ProgressMsgType.Error:
					log("openExmlEditor error=", data);
					devlog("openExmlEditor", `exec error=`, data)
					reject(data);
					break;
				case ProgressMsgType.Message:
					log("openExmlEditor", data);
					devlog("openExmlEditor", `exec message=`, data)
					break;
				case ProgressMsgType.Exit:
					log("openExmlEditor", `exit code=${data}`);
					devlog("openExmlEditor", `exec exit=`, data)
					if (prgress) prgress.clear();
					if (data != "0") {
						reject("exit code:" + data);
					}
					break;
			}
		})

		resolve(prgress);
	});
}
export function getPlatform() {
	const platform = os.platform();
	switch (platform) {
		case 'darwin':
			return Platform.OSX;
		case 'win32':
			return Platform.Windows;
		default:
			return Platform.Unknown;
	}
}

export function convertFullPath(cur: string) {
	let rootPath = getCurRootPath()
	if (rootPath) {
		return path.normalize(path.join(rootPath.uri.fsPath, cur));
	}
	return null;
}

export function getConfigObj() {
	return <ConfigObj>vscode.workspace.getConfiguration("egret-helper");
}
export function getCurRootPath() {
	let configs = getConfigObj();
	if (configs.egretPropertiesPath) {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (workspaceFolders && workspaceFolders.length > 0) {
			for (const workspaceFolder of workspaceFolders) {
				const folderString = workspaceFolder.uri.fsPath;
				if (!folderString) {
					continue;
				}
				const egretConfig = path.join(folderString, configs.egretPropertiesPath);
				if (!fs.existsSync(egretConfig)) {
					continue;
				}
				return workspaceFolder;
			}
		}
	}

	return null;
}
export function getDefaultResJsonPath() {
	let configs = getConfigObj();
	if (configs.egretResourceJsonPath) {
		const workspaceFolder = getCurRootPath();
		if (workspaceFolder) {
			return path.normalize(path.join(workspaceFolder.uri.fsPath, configs.egretResourceJsonPath));
		}
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
	let configs = getConfigObj();
	if (configs.egretResourcePath) {
		const workspaceFolder = getCurRootPath();
		if (workspaceFolder) {
			return path.normalize(path.join(workspaceFolder.uri.fsPath, configs.egretResourcePath));
		}
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

export function toasterr(err: any) {
	let configObj = getConfigObj();
	if (!configObj.alertErrorWin) return;
	vscode.window.showErrorMessage(typeof err == "object" ? JSON.stringify(err) : err);
}
let _channel: vscode.OutputChannel;
export function log(target: any, ...msg: any[]) {
	_log(target, false, ...msg);
}
export function showLog() {
	if (!_channel) _channel = vscode.window.createOutputChannel('Egret');/**日志窗口名*/
	_channel.show(true);
}

export function devlog(target: any, ...msg: any[]) {
	let configObj = getConfigObj();
	if (!configObj.devlog) return;
	_log(target, true, ...msg);
}
function _log(target: any, isDebug: boolean, ...msg: any[]) {
	if (!_channel) showLog();
	let str: string = "";
	if (isDebug) {
		let time = new Date();
		str += `[${fillNum(time.getHours())}:${fillNum(time.getMinutes())}:${fillNum(time.getSeconds())}.${time.getMilliseconds()}]`
		if (target) {
			let className: string;
			if (typeof target == "string") className = target;
			else className = getClassName(target);
			if (className) str += `[${className}]`
		}
		str += `[DEBUG]: `
	}

	for (let i = 0; i < msg.length; i++) {
		str += _logstr(_channel, msg[i]);
	}
	if (str && !str.endsWith("\n")) _channel.appendLine(str);
	else _channel.append(str);
}

function _logstr(_channel: vscode.OutputChannel, msg: any) {
	if (typeof msg == "string") return msg;
	else if (typeof msg == "number") return `${msg}`;
	else if (typeof msg == "boolean") return `${msg}`;
	else if (msg === null || msg === undefined) return `${msg}`;
	else return JSON.stringify(msg);
}
function getClassName(target: any) {
	if (target && target.constructor && target.constructor.toString) {
		if (target.constructor.name) {
			return target.constructor.name;
		}
		var str = target.constructor.toString();
		if (str.charAt(0) == '[') {
			var arr = str.match(/\[\w+\s*(\w+)\]/);
		} else {
			var arr = str.match(/function\s*(\w+)/);
		}
		if (arr && arr.length == 2) {
			return arr[1];
		}
	}
	return undefined;
}
function fillNum(num: string | number) {
	let _num = +num;
	if (isNaN(_num)) return `${num}`;
	else if (_num < 10) return `0${_num}`;
	else return `${_num}`;
}