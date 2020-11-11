import * as vscode from 'vscode';
import { EgretWebsite, LauncherErrorCode } from './launcherDefines';

export { msgGotoEgretWebsite, openExternal, onLauncherTask };


function openExternal(url: string): boolean {
    return false;
}

const msgGotoEgretWebsite = `Go to download at official website：${EgretWebsite}`;

function onLauncherTask<T>(promise: Promise<T>) {
    promise.catch((error) => {
        let errorMsg: string = 'Inner error happened';
        if (error) {
            switch (error.code) {
                case LauncherErrorCode.NotFound:
                    errorMsg = 'Please install Egret Launcher';
                    break;
                case LauncherErrorCode.VersionNotMatch:
                    errorMsg = `Version of Egret Launcher should not be lower than ${error.minVersion}`;
                    break;
                default: break;
            }
        }
        vscode.window.showInformationMessage(errorMsg, msgGotoEgretWebsite)
            .then(t => {
                if (t === msgGotoEgretWebsite) {
                    vscode.env.openExternal(vscode.Uri.parse(EgretWebsite))
                }
            });
        return;
    });
}

