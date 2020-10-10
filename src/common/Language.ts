
import * as path from "path";
import * as vscode from "vscode";
import { getLogger, Logger } from "./Log";
let y18n: any;
let logger: Logger;
export function localize(key: string, ...args: string[]) {
    return y18n.__(key, ...args);
}

export function init(context: vscode.ExtensionContext) {
    //code . --locale=en 可以指定固定语言启动
    logger = getLogger("Language");
    y18n = require('y18n')({
        directory: path.join(context.extensionPath, "locales")
    });
    if (process.env.VSCODE_NLS_CONFIG) {
        logger.devlog("VSCODE_NLS_CONFIG=", process.env.VSCODE_NLS_CONFIG)
        let locale = JSON.parse(process.env.VSCODE_NLS_CONFIG).locale;
        if (locale) {
            y18n.setLocale(locale);
            logger.devlog("language=", locale)
        } else {
            y18n.setLocale("en");
        }
    } else {
        y18n.setLocale("en");
    }
}