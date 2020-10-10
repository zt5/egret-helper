import * as vscode from 'vscode';
import * as language from "./common/Language";
import { getLogger, Logger } from './common/Log';
import EgretServer from "./egret-server/EgretServer";
import Exml from "./exml/Exml";
import * as helper from './helper';

let _exml: Exml | undefined;
let _egretServer: EgretServer | undefined;
let isInit = false;
let logger: Logger
export function activate(context: vscode.ExtensionContext) {
	logger = getLogger("extension");
	let { subscriptions } = context;
	logger.devlog("activate");
	
	language.init(context);

	subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(e => {
		logger.devlog("WorkspaceFolderChange", e);
		init(subscriptions);
	}));
	subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		logger.devlog("ConfigChange", e);
		init(subscriptions);
	}))
	init(subscriptions);
}
function init(subscriptions: { dispose(): any }[]) {
	logger.devlog("init");
	let enabled = helper.getConfigObj().enable;
	logger.devlog(`init enabled=`, enabled);
	if (!enabled) {
		destroy();
		return;
	}
	let curRootPath = helper.getCurRootPath();
	logger.devlog(`init curRootPath=`, curRootPath);
	if (curRootPath == null) {
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
	await destroy();
}
async function destroy() {
	logger.devlog("destroy");
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