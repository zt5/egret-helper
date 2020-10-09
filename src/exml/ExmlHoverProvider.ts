import * as fs from "fs";
import * as vscode from "vscode";
import * as helper from "../helper";

export default class ExmlHoverProvider implements vscode.HoverProvider {
    public provideHover(doc: vscode.TextDocument, pos: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
        let line = doc.lineAt(pos);
        let result = helper.getSkinExmlDefine(line.text)
        if (result != null) {
            for (let i in result) {
                let destExmlPath = helper.convertPath(result[i], line.text, pos, result);
                if (destExmlPath && fs.existsSync(destExmlPath)) {
                    return new vscode.Hover("点击跳转到[" + destExmlPath + "]");
                } else {
                    return new vscode.Hover("不存在[" + destExmlPath + "]");
                }
            }
        }

        return null;
    }
}
