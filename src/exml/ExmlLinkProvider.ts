import * as fs from "fs";
import * as vscode from "vscode";
import * as helper from "../helper";

export default class ExmlLinkProvider implements vscode.DefinitionProvider {
    public provideDefinition(doc: vscode.TextDocument, pos: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition | vscode.DefinitionLink[]> {
        let line = doc.lineAt(pos);
        let result = helper.getSkinExmlDefine(line.text);
        if (result != null) {
            for (let i in result) {
                let destExmlPath = helper.convertFullPath(result[i]);
                if (destExmlPath && fs.existsSync(destExmlPath)) {
                    return new vscode.Location(vscode.Uri.file(destExmlPath), new vscode.Position(0, 0));
                }
            }
        }
        return null;
    }
}
