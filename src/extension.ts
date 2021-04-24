import * as vscode from 'vscode';
import Helper from './common/Helper';
import { getLogger, Logger } from './common/Logger';
import EgretServer from "./egret-server/EgretServer";
import Exml from "./exml/Exml";
import EgretTreeView from './project/EgretTreeView';

let _treeView: EgretTreeView | undefined;
let _exml: Exml | undefined;
let _egretServer: EgretServer | undefined;
let isInit = false;
let logger: Logger;

export function activate({ subscriptions }: vscode.ExtensionContext) {

	logger = getLogger("extension");
	logger.debug("activate");

	// logger._debug("测试1");
	// logger._warn("测试2");
	// logger._log("测试3");
	// logger._error("测试4");
	// logger._raw("测试5");

	subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(e => {
		logger.debug("WorkspaceFolderChange", e);
		init(subscriptions);
	}));
	subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		logger.debug("ConfigChange");
		if (Helper.valConfIsChange(e, "enable")) {
			logger.debug("egret-helper.enable change")
			init(subscriptions);
		}
	}))
	init(subscriptions);
}
async function init(subscriptions: vscode.Disposable[]) {
	let enabled = Helper.getConfigObj().enable;
	logger.debug(`enabled=`, enabled);
	if (!enabled) {
		await destroy();
		return;
	}

	logger.debug("init");
	if (!_treeView) {
		_treeView = new EgretTreeView(subscriptions);
	} else {
		_treeView.update();
	}

	let isEgretProject = Helper.isEgretProject();
	logger.debug(`init isEgretProject=`, isEgretProject);
	if (!isEgretProject) {
		await destroy();
		return;
	} else {
		logger.debug("init isInit=", isInit);
		if (!isInit) {
			isInit = true;
			_exml = new Exml(subscriptions);
			_egretServer = new EgretServer(subscriptions);
		}
	}
}

export async function deactivate() {
	logger.debug("deactivate");
	if (_treeView) {
		_treeView.destroy();
		_treeView = undefined;
	}
	await destroy();
}
async function destroy() {
	if (isInit) {
		logger.debug("destroy");
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