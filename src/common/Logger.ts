import * as vscode from "vscode";
import { LogLevel } from "../define";
import Helper from "./Helper";
export class Logger {
    private headerName: string = "";
    constructor(headerName: string) {
        this.headerName = headerName;
    }
    public log(...msg: any[]) {
        _log(_getDebugHeader(this.headerName, LogLevel.LOG), ...msg);
    }
    public warn(...msg: any[]) {
        _log(_getDebugHeader(this.headerName, LogLevel.WARN), ...msg);
    }
    public raw(...msg: any[]) {
        _log(_getDebugHeader(this.headerName, LogLevel.RAW), ...msg);
    }
    public error(...msg: any[]) {
        _log(_getDebugHeader(this.headerName, LogLevel.ERROR), ...msg);
    }
    public debug(...msg: any[]) {
        const configObj = Helper.getConfigObj();
        if (!configObj.devlog) return;
        _log(_getDebugHeader(this.headerName, LogLevel.DEBUG), ...msg);
    }
}
export function getLogger(val: any): Logger {
    let headerName: string = "";
    if (val) {
        let className: string;
        if (typeof val == "string") className = val;
        else className = _getClassName(val);
        if (className) headerName += `[${className}]`
    }
    return new Logger(headerName);
}
let logIsRun = false;
let writeEmitter: vscode.EventEmitter<string> | undefined;
let logLocalStr = "";
let logTerminal: vscode.Terminal | undefined;
const COLOR_STR_END = "\u001b[39m";
export async function showLog() {
    if (!writeEmitter) {
        writeEmitter = new vscode.EventEmitter<string>();
        let closeEmitter: vscode.EventEmitter<number | void> | undefined = new vscode.EventEmitter<number | void>();
        const pty: vscode.Pseudoterminal = {
            onDidWrite: writeEmitter.event,
            onDidClose: closeEmitter.event,
            open: () => { },
            close: () => {
                logIsRun = false;
                if (closeEmitter) {
                    closeEmitter.dispose();
                    closeEmitter = undefined;
                }
                if (writeEmitter) {
                    writeEmitter.dispose();
                    writeEmitter = undefined;
                }
                logTerminal = undefined;
            },
            handleInput: data => {
                if (data === "\r") {
                    queueLog("\r\n");
                } else {
                    queueLog(data);
                }
            }
        };

        logTerminal = vscode.window.createTerminal({
            name: "Egret", pty
        })
        logTerminal.show(true);
    }
    await vscode.commands.executeCommand("workbench.action.terminal.focus");
    logIsRun = true;
    if (logLocalStr) {
        writeEmitter.fire(logLocalStr);
        logLocalStr = "";
    }
}
function queueLog(str: string) {
    str += COLOR_STR_END;//结束格式
    if (logIsRun && writeEmitter) {
        writeEmitter.fire(str);
    } else {
        logLocalStr += str;
    }
}

function _log(head: string, ...msg: unknown[]) {
    let str: string = head;
    for (let i = 0; i < msg.length; i++) {
        str += Helper.convertObjStr(msg[i]);
    }
    const JOIN_STR = `\r\n${COLOR_STR_END}`;
    str = str.split("\n").join(JOIN_STR)
    if (str && !str.endsWith("\n")) {
        queueLog(str + "\r\n")
    }
    else {
        queueLog(str)
    }
}

function _getClassName(target: any) {
    if (target && target.constructor && target.constructor.toString) {
        if (target.constructor.name) {
            return target.constructor.name;
        }
        var str = target.constructor.toString();
        if (str.charAt(0) == '[') {
            var arr = str.match(/\[\w+\s*(\w+)\]/);
        } else {
            var arr = str.match(/function\s*(\w+)/);
        }
        if (arr && arr.length == 2) {
            return arr[1];
        }
    }
    return undefined;
}
function _getDebugHeader(headerName: string, level: LogLevel) {
    const time = new Date();
    const timeStr = `[${Helper.fillNum(time.getHours())}:${Helper.fillNum(time.getMinutes())}:${Helper.fillNum(time.getSeconds())}.${time.getMilliseconds()}]`;
    switch (level) {
        case LogLevel.DEBUG:
            return `\u001b[90m${timeStr}${headerName}[DEBUG]:`;//灰色
        case LogLevel.ERROR:
            return `\u001b[31m${timeStr}${headerName}[ERROR]:`;//红色
        case LogLevel.WARN:
            return `\u001b[33m${timeStr}${headerName}[WARN]:`; //黄色
        case LogLevel.LOG:
        case LogLevel.RAW:
            return `\u001b[39m`; //默认颜色
    }
}