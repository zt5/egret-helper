
import * as vscode from "vscode";
import Helper from "../common/Helper";
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
        result.push(new EgretTreeItem(
            "创建项目",
            "使用Egret Launcher创建项目",
            "create.svg",
            {
                command: 'egret-helper.createProject',
                title: 'create'
            }
        ))
        if (Helper.getCurRootPath()) {
            result.push(
                new EgretTreeItem(
                    "构建项目",
                    "重新编译项目(egret build命令)",
                    "build.svg",
                    {
                        command: 'egret-helper.egretBuild',
                        title: 'build'
                    }
                ));
            result.push(
                new EgretTreeItem(
                    "编译引擎",
                    "重新编译引擎(egret build -e命令)",
                    "builde.svg",
                    {
                        command: 'egret-helper.egretBuildEngine',
                        title: 'buildEngine'
                    }
                ));
            result.push(
                new EgretTreeItem(
                    "同步资源",
                    `同步资源(${Helper.getEgretResPath()})到资源配置文件(${Helper.getDefaultResJsonPath()})中`,
                    "sync.svg",
                    {
                        command: 'egret-helper.egretResSync',
                        title: 'sync'
                    }
                ));
            result.push(
                new EgretTreeItem(
                    "发布项目",
                    "使用Egret Launcher发布项目",
                    "publish.svg",
                    {
                        command: 'egret-helper.publishProject',
                        title: 'publish'
                    }
                ));
            result.push(
                new EgretTreeItem(
                    "重启服务",
                    "重新启动Egret 调试服务器",
                    "reboot.svg",
                    {
                        command: 'egret-helper.egretRestart',
                        title: 'restart'
                    }
                ));
        }

        return Promise.resolve(result);
    }
}