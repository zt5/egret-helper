import * as vscode from 'vscode';
import EgretRes from './egret-res/EgretRes';
import EgretServer from "./egret-server/EgretServer";
import Exml from "./exml/Exml";
import * as helper from './helper';
import { devlog } from './helper';
let _exml: Exml | undefined;
let _egretServer: EgretServer | undefined;
let _egretRes: EgretRes | undefined;
let isInit = false;
export function activate({ subscriptions }: vscode.ExtensionContext) {
	devlog("extension activate");
	subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders((e: vscode.WorkspaceFoldersChangeEvent) => {
		devlog("extension WorkspaceFolderChange", e);
		init(subscriptions);
	}));
	init(subscriptions);
}
function init(subscriptions: { dispose(): any }[]) {
	devlog("extension init");
	let enabled = helper.getConfigObj().enable;
	devlog(`extension init enabled=`, enabled);
	if (!enabled) return;
	let curRootPath = helper.getCurRootPath();
	devlog(`extension init curRootPath`, curRootPath);
	if (curRootPath == null) {
		destroy();
		return;
	} else {
		devlog("extension init isInit", isInit);
		if (!isInit) {
			isInit = true;
			_exml = new Exml(subscriptions);
			_egretServer = new EgretServer(subscriptions);
			_egretRes = new EgretRes(subscriptions);
		}
	}
}

export async function deactivate() {
	devlog("extension init deactivate");
	await destroy();
}
async function destroy() {
	devlog("extension init destroy");
	isInit = false;
	if (_exml) {
		_exml.destroy();
		_exml = undefined;
	}
	if (_egretServer) {
		await _egretServer.destroy();
		_egretServer = undefined;
	}
	if (_egretRes) {
		_egretRes.destroy();
		_egretRes = undefined;
	}
}