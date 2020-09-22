'use strict';
import * as fs from "fs";
import * as vscode from "vscode";
import * as helper from "../helper";

export default class ExmlLinkProvider implements vscode.DefinitionProvider {
    public provideDefinition(doc: vscode.TextDocument, pos: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition | vscode.DefinitionLink[]> {
        let line = doc.lineAt(pos);
        let result = line.text.match(helper.SKIN_EXP);
        if (result != null) {
            for (let i in result) {
                let destExmlPath = helper.convertPath(result[i], line.text, pos, result);
                if (destExmlPath && fs.existsSync(destExmlPath)) {
                    return new vscode.Location(vscode.Uri.file(destExmlPath), new vscode.Position(0, 0));
                }
            }
        }
        return null;
    }
}
