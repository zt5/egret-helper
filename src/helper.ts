import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { getLogger, Logger } from "./common/Logger";
import Progress from './common/Progress';
import { ConfigObj, DebugBrowserType, EgretHostType, Platform, ProgressMsgType } from "./define";

export function convertObjStr(msg: string | number | boolean | Error | unknown) {
	if (typeof msg == "string") return msg;
	else if (typeof msg == "number") return `${msg}`;
	else if (typeof msg == "boolean") return `${msg}`;
	else if (msg instanceof Error) {
		if (msg.stack) return msg.stack;
		else return msg.message;
	}
	else if (msg === null || msg === undefined) return `${msg}`;
	else return JSON.stringify(msg);
}

export function valNeedAutoComplete(text: string) {
	return !!text.match(/\S+\s*\.skinName\s*=\s*(.*?)/);
}
export function getSkinExmlDefine(text: string) {
	return text.match(/(?<=("|'|`))\s*(.*?)\.exml\s*(?=("|'|`))/);
}
let openExmlEditorLogger: Logger;
export function openExmlEditor(exmlPath: string): Promise<Progress> {
	if (!openExmlEditorLogger) openExmlEditorLogger = getLogger("openExmlEditor");
	return new Promise((resolve, reject) => {
		const prgress = new Progress();
		openExmlEditorLogger.devlog("open " + exmlPath);
		prgress.exec(`eui "${exmlPath}"`, undefined, (type, data) => {
			switch (type) {
				case ProgressMsgType.Error:
					openExmlEditorLogger.log("error=", data);
					openExmlEditorLogger.devlog(`exec error=`, data)
					reject(data);
					break;
				case ProgressMsgType.Message:
					openExmlEditorLogger.devlog(`exec message=`, data)
					break;
				case ProgressMsgType.Exit:
					openExmlEditorLogger.devlog(`exec exit=`, data)
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
export function getIp() {
	let ip: string[] = [];
	switch (getConfigObj().hostType) {
		case EgretHostType.ip:

			var interfaces = os.networkInterfaces();
			for (var devName in interfaces) {
				var iface = interfaces[devName];
				for (var i = 0; i < iface.length; i++) {
					var alias = iface[i];
					if (alias.family === 'IPv4' && !alias.internal) {
						ip.push(alias.address)
					}
				}
			}
			break;

		case EgretHostType.localhost:
			ip.push("127.0.0.1")
			break;
	}
	return ip;
}

export function convertFullPath(cur: string) {
	let rootPath = getCurRootPath()
	if (rootPath) {
		return path.normalize(path.join(rootPath, cur));
	}
	return null;
}

export function getConfigObj() {
	return <ConfigObj>vscode.workspace.getConfiguration("egret-helper");
}
export function isEgretProject() {
	if (getCurRootPath().trim() == "") {
		return false;
	} else {
		return true;
	}
}
export function valConfIsChange(e: vscode.ConfigurationChangeEvent, key: string) {
	return e.affectsConfiguration("egret-helper." + key, getCurRootUri())
}
export function getCurRootUri() {
	let result: vscode.WorkspaceFolder | undefined;
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (workspaceFolders && workspaceFolders.length > 0) {
		for (const workspaceFolder of workspaceFolders) {
			const folderString = workspaceFolder.uri.fsPath;
			if (!folderString) {
				continue;
			}
			const egretConfig = path.join(folderString, "egretProperties.json");
			if (!fs.existsSync(egretConfig)) {
				continue;
			}
			result = workspaceFolder;
			break;
		}
	}
	return result;
}
export function getCurRootPath() {
	let result: string = "";
	let folder = getCurRootUri();
	if (folder) result = folder.uri.fsPath
	return result;
}
export function getDefaultResJsonPath() {
	let configs = getConfigObj();
	if (configs.egretResourceJsonPath) {
		const workspaceFolder = getCurRootPath();
		if (workspaceFolder) {
			return path.normalize(path.join(workspaceFolder, configs.egretResourceJsonPath));
		}
	}
	return null;
}
export function getDebugName() {
	return "Egret Debug(" + getDebugBrowser() + ")";
}
export function getLaunchJsonPath() {
	return path.join(getCurRootPath(), ".vscode", "launch.json");
}
export function getTSConfigPath() {
	return path.join(getCurRootPath(), "tsconfig.json");
}
export function getWebpackConfigPath() {
	return path.join(getCurRootPath(), "scripts", "config.ts");
}
export function getWebpackDebugPath() {
	return path.join(getCurRootPath(), "bin-debug");
}
export function getDebugBrowser() {
	let conf = getConfigObj();
	switch (conf.debugBrowser) {
		case DebugBrowserType.chrome:
			return "pwa-chrome";
		case DebugBrowserType.edge:
			return "pwa-msedge";
	}
	return null;
}
export function getEgretResPath() {
	let configs = getConfigObj();
	if (configs.egretResourcePath) {
		const workspaceFolder = getCurRootPath();
		if (workspaceFolder) {
			return path.normalize(path.join(workspaceFolder, configs.egretResourcePath));
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
		let parentPath = path.dirname(file);
		if (!fs.existsSync(parentPath)) fs.mkdirSync(parentPath);
		fs.writeFile(file, data, (err) => {
			if (err) reject(err);
			else resolve();
		})
	})
}
export function readFile(file: string): Promise<string> {
	return new Promise((resolve, reject) => {
		fs.readFile(file, { encoding: "utf-8" }, (err, data) => {
			if (err) reject(err);
			else resolve(data);
		})
	})
}

export function toasterr(err: unknown) {
	let configObj = getConfigObj();
	if (!configObj.alertErrorWin) return;
	vscode.window.showErrorMessage(convertObjStr(err));
}

export function fillNum(num: string | number) {
	let _num = +num;
	if (isNaN(_num)) return `${num}`;
	else if (_num < 10) return `0${_num}`;
	else return `${_num}`;
}