import * as vscode from "vscode";
import * as path from "path";

export default class EgretTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly tooltip: string,
        private icon: string,
        public readonly command?: vscode.Command,
    ) {
        super(label);
        this.description = this.tooltip;
    }

    iconPath = {
        light: path.join(__filename, '..', '..', '..', 'images', "light", this.icon),
        dark: path.join(__filename, '..', '..', '..', 'images', "dark", this.icon)
    };

    contextValue = 'dependency';
}