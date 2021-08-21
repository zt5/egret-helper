import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { ConfigObj, DebugBrowserType, EgretHostType, Platform } from "../define";
import { showLog } from "./Logger";
import * as iconv from "iconv-lite";

export default class Helper {
	public static convertObjStr(msg: string | number | boolean | Error | unknown) {
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

	public static valNeedAutoComplete(text: string) {
		return !!text.match(/\S+\s*\.skinName\s*=\s*(.*?)/);
	}
	public static getSkinExmlDefine(text: string) {
		return text.match(/(?<=("|'|`))\s*(.*?)\.exml\s*(?=("|'|`))/);
	}

	public static getPlatform() {
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
	public static getIp() {
		let ip: string[] = [];
		switch (this.getConfigObj().hostType) {
			case EgretHostType.ip:

				var interfaces = os.networkInterfaces();
				for (var devName in interfaces) {
					var iface = interfaces[devName];
					if (!iface) continue;
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
	public static createMarkTxt(str?: string) {
		const mark = new vscode.MarkdownString(str, true);
		mark.isTrusted = true;
		return mark;
	}

	public static convertFullPath(cur: string) {
		let rootPath = this.getCurRootPath()
		if (rootPath) {
			return path.normalize(path.join(rootPath, cur));
		}
		return null;
	}

	public static getConfigObj() {
		return <ConfigObj>vscode.workspace.getConfiguration("egret-helper");
	}
	public static isEgretProject() {
		if (this.getCurRootPath().trim() == "") {
			return false;
		} else {
			return true;
		}
	}
	public static valConfIsChange(e: vscode.ConfigurationChangeEvent, key: string) {
		return e.affectsConfiguration("egret-helper." + key, this.getCurRootUri())
	}
	public static getCurRootUri() {
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
	public static getCurRootPath() {
		let result: string = "";
		let folder = this.getCurRootUri();
		if (folder) result = folder.uri.fsPath
		return result;
	}
	public static getDefaultResJsonPath() {
		let configs = this.getConfigObj();
		if (configs.egretResourceJsonPath) {
			const workspaceFolder = this.getCurRootPath();
			if (workspaceFolder) {
				return path.normalize(path.join(workspaceFolder, configs.egretResourceJsonPath));
			}
		}
		return null;
	}
	public static getDebugName() {
		return "Egret Debug(" + this.getDebugBrowser() + ")";
	}
	public static getLaunchJsonPath() {
		return path.join(this.getCurRootPath(), ".vscode", "launch.json");
	}
	public static getTSConfigPath() {
		return path.join(this.getCurRootPath(), "tsconfig.json");
	}
	public static getWebpackConfigPath() {
		return path.join(this.getCurRootPath(), "scripts", "config.ts");
	}
	public static getWebpackDebugPath() {
		return path.join(this.getCurRootPath(), "bin-debug");
	}
	public static getDevServerIndexJs() {
		return path.join(this.getCurRootPath(), "scripts", "plugins", "node_modules", "@egret", "egret-webpack-bundler", "lib", "index.js");
	}
	public static getDebugBrowser() {
		let conf = this.getConfigObj();
		switch (conf.debugBrowser) {
			case DebugBrowserType.chrome:
				return "pwa-chrome";
			case DebugBrowserType.edge:
				return "pwa-msedge";
		}
		return null;
	}
	public static getEgretResPath() {
		let configs = this.getConfigObj();
		if (configs.egretResourcePath) {
			const workspaceFolder = this.getCurRootPath();
			if (workspaceFolder) {
				return path.normalize(path.join(workspaceFolder, configs.egretResourcePath));
			}
		}
		return null;
	}

	public static loopFile(file: string, fileFun: (file: string) => void) {
		let state = fs.statSync(file);
		if (state.isDirectory()) {
			let dirs = fs.readdirSync(file);
			for (let i = 0; i < dirs.length; i++) {
				this.loopFile(path.join(file, dirs[i]), fileFun);
			}
		} else {
			fileFun(file);
		}
	};
	public static writeFile(file: string, data: string): Promise<void> {
		return new Promise((resolve, reject) => {
			let parentPath = path.dirname(file);
			if (!fs.existsSync(parentPath)) fs.mkdirSync(parentPath);
			fs.writeFile(file, data, (err) => {
				if (err) reject(err);
				else resolve();
			})
		})
	}
	public static readFile(file: string): Promise<string> {
		return new Promise((resolve, reject) => {
			fs.readFile(file, { encoding: "utf-8" }, (err, data) => {
				if (err) reject(err);
				else resolve(data);
			})
		})
	}
	public static checkHasError(data: string) {
		if (data.toLocaleLowerCase().indexOf("error") != -1) {
			Helper.toasterr("编译出错", {
				"查看log": () => {
					showLog();
				}
			});
		}
	}
	public static toasterr(err: unknown, btn?: { [label: string]: Function }) {
		let configObj = this.getConfigObj();
		if (!configObj.alertErrorWin) {
			showLog();// 如果不弹窗 让log显示出来
			return;
		}
		let btns = btn ? Object.keys(btn) : [];
		vscode.window.showErrorMessage(this.convertObjStr(err), ...btns).then(pickItem => {
			if (pickItem && btn) {
				btn[pickItem]();
			}
		});
	}

	public static fillNum(num: string | number) {
		let _num = +num;
		if (isNaN(_num)) return `${num}`;
		else if (_num < 10) return `0${_num}`;
		else return `${_num}`;
	}
	public static binaryToGBK(str: string) {
        return iconv.decode(Buffer.from(str, 'binary'), "gbk");
    }
	public static binaryToUTF8(str: string) {
        return iconv.decode(Buffer.from(str, 'binary'), "utf-8");
    }
	public static stripAnsiColorStr(str: string) {
		return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]/g, '')
	}
}
