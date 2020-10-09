import * as path from "path";
import * as vscode from "vscode";
import { CancellationToken, CompletionItem, CompletionList } from "vscode";
import * as helper from "../helper";


export default class ExmlPathAutoCompleteProvider implements vscode.CompletionItemProvider {
	private normalPath(file: string) {
		return file.split(path.sep).join("/");
	}
	/**
	 * 自动提示实现
	*/
	public provideCompletionItems(doc: vscode.TextDocument, pos: vscode.Position, token: CancellationToken): vscode.ProviderResult<CompletionItem[] | CompletionList> {
		let line = doc.lineAt(pos);
		let result = helper.valNeedAutoComplete(line.text);
		if (!result) return;
		let workFolder = helper.getCurRootPath();
		if (!workFolder) return;
		let workPath = workFolder.uri.fsPath;
		if (workPath.lastIndexOf(path.sep) != workPath.length - 1) {
			//最后没有分隔符
			workPath += path.sep;
		}
		workPath = this.normalPath(workPath);
		if (!workPath) return;
		let configs = helper.getConfigObj();
		if (!configs.exmlSearchGlob) return;
		return vscode.workspace.findFiles(configs.exmlSearchGlob, undefined, undefined, token).then(result => {
			return result.map(item => {
				let paths = this.normalPath(item.fsPath).slice(workPath.length);
				return new CompletionItem(`"${paths}"`)
			});
		});
	}
	/**
	 * 光标选中当前自动补全item时触发动作，一般情况下无需处理
	*/
	public resolveCompletionItem(item: CompletionItem, token: CancellationToken): vscode.ProviderResult<CompletionItem> {
		return null;
	}
}