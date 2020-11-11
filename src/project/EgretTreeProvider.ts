
import * as vscode from "vscode";
import * as helper from "../helper";
import EgretTreeItem from "./EgretTreeItem";

export default class EgretTreeProvider implements vscode.TreeDataProvider<EgretTreeItem>{
    private _onDidChangeTreeData: vscode.EventEmitter<EgretTreeItem | undefined | void> = new vscode.EventEmitter<EgretTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<EgretTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element: EgretTreeItem): vscode.TreeItem {
        return element;
    }
    getChildren(element?: EgretTreeItem): Thenable<EgretTreeItem[]> {
        let result: EgretTreeItem[] = [];
        result.push(new EgretTreeItem("创建项目", "create.svg", {
            command: 'egret-helper.createProject',
            title: 'create'
        }))
        if (helper.getCurRootPath()) {
            result.push(
                new EgretTreeItem("构建项目", "build.svg", {
                    command: 'egret-helper.egretBuild',
                    title: 'build'
                }),
            );
            result.push(
                new EgretTreeItem("编译引擎", "builde.svg", {
                    command: 'egret-helper.egretBuildEngine',
                    title: 'buildEngine'
                }),
            );
            result.push(
                new EgretTreeItem("同步资源", "sync.svg", {
                    command: 'egret-helper.egretResSync',
                    title: 'sync'
                }),
            );
            result.push(
                new EgretTreeItem("发布项目", "publish.svg", {
                    command: 'egret-helper.publishProject',
                    title: 'publish'
                }),
            );
            result.push(
                new EgretTreeItem("重启服务", "reboot.svg", {
                    command: 'egret-helper.egretRestart',
                    title: 'restart'
                }),
            );
        }

        return Promise.resolve(result);
    }
}