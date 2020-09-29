import * as vscode from 'vscode';
import EgretServer from "./egret-server/EgretServer";
import Exml from "./exml/Exml";
import * as helper from './helper';
import { devlog } from './helper';
let _exml: Exml | undefined;
let _egretServer: EgretServer | undefined;
let isInit = false;
export function activate({ subscriptions }: vscode.ExtensionContext) {
	devlog("extension", "activate");
	subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(e => {
		devlog("extension", "WorkspaceFolderChange", e);
		init(subscriptions);
	}));
	subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		devlog("extension", "ConfigChange", e);
		init(subscriptions);
	}))
	init(subscriptions);
}
function init(subscriptions: { dispose(): any }[]) {
	devlog("extension", "init");
	let enabled = helper.getConfigObj().enable;
	devlog("extension", `init enabled=`, enabled);
	if (!enabled) {
		destroy();
		return;
	}
	let curRootPath = helper.getCurRootPath();
	devlog("extension", `init curRootPath=`, curRootPath);
	if (curRootPath == null) {
		destroy();
		return;
	} else {
		devlog("extension", "init isInit=", isInit);
		if (!isInit) {
			isInit = true;
			_exml = new Exml(subscriptions);
			_egretServer = new EgretServer(subscriptions);
		}
	}
}

export async function deactivate() {
	devlog("extension", "deactivate");
	await destroy();
}
async function destroy() {
	devlog("extension", "destroy");
	isInit = false;
	if (_exml) {
		_exml.destroy();
		_exml = undefined;
	}
	if (_egretServer) {
		await _egretServer.destroy();
		_egretServer = undefined;
	}
}