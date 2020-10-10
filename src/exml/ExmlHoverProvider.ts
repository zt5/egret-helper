import * as fs from "fs";
import * as vscode from "vscode";
import { localize } from "../common/Language";
import * as helper from "../helper";

export default class ExmlHoverProvider implements vscode.HoverProvider {
    public provideHover(doc: vscode.TextDocument, pos: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
        let line = doc.lineAt(pos);
        let result = helper.getSkinExmlDefine(line.text)
        if (result != null) {
            for (let i in result) {
                let destExmlPath = helper.convertFullPath(result[i]);
                if (destExmlPath && fs.existsSync(destExmlPath)) {
                    return new vscode.Hover(localize("exml.hover.jump", destExmlPath));
                } else {
                    return new vscode.Hover(localize("exml.hover.notExist", `${destExmlPath}`));
                }
            }
        }

        return null;
    }
}
