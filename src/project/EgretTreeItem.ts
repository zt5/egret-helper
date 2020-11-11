import * as vscode from "vscode";
import * as path from "path";

export default class EgretTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        private icon: string,
        public readonly command?: vscode.Command,
    ) {
        super(label);
    }

    iconPath = {
        light: path.join(__filename, '..', '..', '..', 'images', "light", this.icon),
        dark: path.join(__filename, '..', '..', '..', 'images', "dark", this.icon)
    };

    contextValue = 'dependency';
}