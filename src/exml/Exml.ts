import * as fs from "fs";
import * as vscode from 'vscode';

import * as helper from "../helper";
import ExmlPathAutoCompleteProvider from './ExmlPathAutoCompleteProvider';
import ExmlHoverProvider from './ExmlHoverProvider';
import ExmlLinkProvider from './ExmlLinkProvider';
import Listener from "../common/Listener";

export default class Exml extends Listener {
	public constructor(protected subscriptions: vscode.Disposable[]) {
		super();
		this.addListener(vscode.languages.registerHoverProvider(['typescript'], new ExmlHoverProvider()));
		this.addListener(vscode.languages.registerDefinitionProvider(['typescript'], new ExmlLinkProvider()));
		this.addListener(vscode.languages.registerCompletionItemProvider(['typescript'], new ExmlPathAutoCompleteProvider(), "="));

		this.addListener(vscode.commands.registerCommand("egret-helper.goToExml", () => {
			new Runner().exec();
		}));
	}
}

class Runner {
	public exec() {
		let activieWin = vscode.window.activeTextEditor;
		if (!activieWin) return;
		let doc = activieWin.document;
		let count = doc.lineCount;
		let results: string[] = [];
		for (let i = 0; i < count; i++) {
			let line = doc.lineAt(i);
			results.push(...this.collectOneLineExml(line));
		}
		if (results.length) {
			if (results.length == 1) {
				this.openExml(results[0]);
			} else {
				vscode.window.showQuickPick(results).then(pickurl => {
					if (!pickurl) return;
					this.openExml(pickurl);
				})
			}
		}
	}
	//收集一行行的exml
	private collectOneLineExml(line: vscode.TextLine) {
		let matchResult = line.text.match(helper.SKIN_EXP);
		let results: string[] = [];
		if (matchResult != null) {
			for (let i = 0; i < matchResult.length; i++) {
				let destExmlPath = helper.convertFullPath(matchResult[i]);
				if (destExmlPath && fs.existsSync(destExmlPath)) {
					results.push(destExmlPath);
				}
			}
		}
		return results;
	}
	private openExml(urlstr: string) {
		//调用外部编辑器
		vscode.env.openExternal(vscode.Uri.file(`${urlstr}`)).then(value => {
			if(!value){
				//如果没开启成功 那么直接使用vscode打开
				vscode.workspace.openTextDocument(vscode.Uri.file(urlstr)).then(
					document => vscode.window.showTextDocument(document)
				)
			}
		})
	}
}