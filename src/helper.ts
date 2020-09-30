import * as cp from 'child_process';
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { ConfigObj, Platform } from "./define";
import * as stringDecoder from "string_decoder";

export const SKIN_EXP = /\s*resource\s*.*\.exml\s*/;
export const AUTO_COMPLETE_EXP = /this\.skinName\s*=\s*(.*)/;

export const EXML_EGRET_UI_EDITOR_Path = {
	MAC: "/Applications/Egret UI Editor.app/Contents/MacOS/Egret UI Editor",
	WIN: "C:\\Program Files\\Egret\\Egret UI Editor\\Egret UI Editor.exe",
	WINx86: "C:\\Program Files (x86)\\Egret\\Egret UI Editor\\Egret UI Editor.exe",
}
export function openExmlEditor(exmlPath: string): Promise<cp.ChildProcess> {
	return new Promise((resolve, reject) => {
		if (!fs.existsSync(exmlPath)) reject(`${exmlPath}文件不存在`);
		let editorPath: string;
		switch (getPlatform()) {
			case Platform.OSX:
				editorPath = EXML_EGRET_UI_EDITOR_Path.MAC;
				if (!fs.existsSync(editorPath)) {
					reject(`${editorPath}编辑器不存在`);
					return;
				}
				break;
			case Platform.Windows:
				editorPath = EXML_EGRET_UI_EDITOR_Path.WIN;
				if (!fs.existsSync(editorPath)) {
					editorPath = EXML_EGRET_UI_EDITOR_Path.WINx86;
					if (!fs.existsSync(editorPath)) {
						reject(`${editorPath}编辑器不存在`);
						return;
					}
				}
				break;
			default:
				reject(`不支持的平台${os.platform()}`);
				return;
		}
		const editorProc = cp.spawn(editorPath, [exmlPath], {
			detached: true,
			cwd: path.dirname(editorPath),
			env: process.env
		});
		editorProc.stdout.on('data', data => {
			let outBuffer = new stringDecoder.StringDecoder("utf-8");
			if (data instanceof Buffer) {
				devlog("openExmlEditor", " stdout ", outBuffer.write(data));
			} else {
				devlog("openExmlEditor", " stdout ", data);
			}
		});
		editorProc.stderr.on('data', data => {
			let errBuffer = new stringDecoder.StringDecoder("utf-8");
			if (data instanceof Buffer) {
				devlog("openExmlEditor", " stderr ", errBuffer.write(data));
			} else {
				devlog("openExmlEditor", " stderr ", data);
			}
		});

		editorProc.on('exit', (code, signal) => devlog(`openExmlEditor`, " exit ", code, signal));
		editorProc.on('disconnect', () => devlog(`openExmlEditor`, " disconnect "));
		editorProc.on('close', (code, signal) => devlog(`openExmlEditor`, " close ", code, signal));
		editorProc.on('message', data => devlog(`openExmlEditor`, " message ", data));
		editorProc.on('error', err => devlog('openExmlEditor', ' error ', err));

		editorProc.unref();
		resolve(editorProc);
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