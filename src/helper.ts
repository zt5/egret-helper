import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { getLogger, Logger } from "./common/Logger";
import Progress from './common/Progress';
import { ConfigObj, Platform, ProgressMsgType } from "./define";

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
			return workspaceFolder;
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

export function fillNum(num: string | number) {
	let _num = +num;
	if (isNaN(_num)) return `${num}`;
	else if (_num < 10) return `0${_num}`;
	else return `${_num}`;
}