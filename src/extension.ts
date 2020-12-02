import * as vscode from 'vscode';
import { getLogger, Logger } from './common/Logger';
import EgretServer from "./egret-server/EgretServer";
import Exml from "./exml/Exml";
import * as helper from './helper';
import EgretTreeView from './project/EgretTreeView';

let _treeView: EgretTreeView | undefined;
let _exml: Exml | undefined;
let _egretServer: EgretServer | undefined;
let isInit = false;
let logger: Logger;

export function activate({ subscriptions }: vscode.ExtensionContext) {
	logger = getLogger("extension");
	logger.devlog("activate");
	subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(e => {
		logger.devlog("WorkspaceFolderChange", e);
		init(subscriptions);
	}));
	subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		logger.devlog("ConfigChange");
		if (helper.valConfIsChange(e, "enable")) {
			logger.log("egret-helper.enable change")
			init(subscriptions);
		}
	}))
	init(subscriptions);
}
function init(subscriptions: vscode.Disposable[]) {
	let enabled = helper.getConfigObj().enable;
	logger.devlog(`enabled=`, enabled);
	if (!enabled) {
		destroy();
		return;
	}
	
	logger.devlog("init");

	if (!_treeView) {
		_treeView = new EgretTreeView(subscriptions);
	} else {
		_treeView.update();
	}


	let isEgretProject = helper.isEgretProject();
	logger.devlog(`init isEgretProject=`, isEgretProject);
	if (!isEgretProject) {
		destroy();
		return;
	} else {
		logger.devlog("init isInit=", isInit);
		if (!isInit) {
			isInit = true;
			_exml = new Exml(subscriptions);
			_egretServer = new EgretServer(subscriptions);
		}
	}
}

export async function deactivate() {
	logger.devlog("deactivate");
	if (_treeView) {
		_treeView.destroy();
		_treeView = undefined;
	}
	await destroy();
}
async function destroy() {
	if (isInit) {
		logger.devlog("destroy");
	}
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