import * as path from "path";
import * as vscode from "vscode";
import { CancellationToken, CompletionItem, CompletionList } from "vscode";
import Helper from "../common/Helper";


export default class ExmlPathAutoCompleteProvider implements vscode.CompletionItemProvider {
	private normalPath(file: string) {
		return file.split(path.sep).join("/");
	}
	/**
	 * 自动提示实现
	*/
	public provideCompletionItems(doc: vscode.TextDocument, pos: vscode.Position, token: CancellationToken): vscode.ProviderResult<CompletionItem[] | CompletionList> {
		let line = doc.lineAt(pos);
		let result = Helper.valNeedAutoComplete(line.text);
		if (!result) return;
		let workPath = Helper.getCurRootPath();
		if (workPath.lastIndexOf(path.sep) != workPath.length - 1) {
			//最后没有分隔符
			workPath += path.sep;
		}
		workPath = this.normalPath(workPath);
		if (!workPath) return;
		return vscode.workspace.findFiles("**/*.exml", undefined, undefined, token).then(result => {
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