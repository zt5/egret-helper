import * as vscode from 'vscode';
import Helper from './common/Helper';
import { getLogger, Logger } from './common/Logger';
import EgretController from "./egret-server/EgretController";
import Exml from "./exml/Exml";
import EgretTreeView from './project/EgretTreeView';

let _treeView: EgretTreeView | undefined;
let _exml: Exml | undefined;
let _egretController: EgretController | undefined;
let isInit = false;
let logger: Logger;

export function activate({ subscriptions }: vscode.ExtensionContext) {
	logger = getLogger("extension");
	logger.debug("activate");

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
			_egretController = new EgretController(subscriptions);
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
	if (_egretController) {
		await _egretController.destroy();
		_egretController = undefined;
	}
}