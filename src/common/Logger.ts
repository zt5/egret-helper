import * as vscode from "vscode";
import { LogLevel } from "../define";
import Helper from "./Helper";
export class Logger {
    private headerName: string = "";
    constructor(headerName: string) {
        this.headerName = headerName;
    }
    public log(...msg: any[]) {
        const color = _getColorByLevel(LogLevel.LOG);
        _log(_getDebugHeader(this.headerName, LogLevel.LOG), color, ...msg);
    }
    public warn(...msg: any[]) {
        const color = _getColorByLevel(LogLevel.WARN);
        _log(_getDebugHeader(this.headerName, LogLevel.WARN), color, ...msg);
    }
    public error(...msg: any[]) {
        const color = _getColorByLevel(LogLevel.ERROR);
        _log(_getDebugHeader(this.headerName, LogLevel.ERROR), color, ...msg);
    }
    public debug(...msg: any[]) {
        const configObj = Helper.getConfigObj();
        if (!configObj.devlog) return;
        const color = _getColorByLevel(LogLevel.DEBUG);
        _log(_getDebugHeader(this.headerName, LogLevel.DEBUG), color, ...msg);
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
            open: () => {
                logIsRun = true;
                checkLocalStr();
            },
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
    }
    if (logTerminal) logTerminal.show(false);
    checkLocalStr();
}
function checkLocalStr() {
    if (logIsRun && logLocalStr && writeEmitter) {
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

function _log(head: string, color: string, ...msg: unknown[]) {
    let str: string = head;
    for (let i = 0; i < msg.length; i++) {
        str += Helper.convertObjStr(msg[i]);
    }

    const JOIN_STR = `\n${COLOR_STR_END}${color}`;
    str = str.split("\n").join(JOIN_STR) + COLOR_STR_END;
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
    const color = _getColorByLevel(level);
    switch (level) {
        case LogLevel.DEBUG:
            return `${color}${timeStr}${headerName}[DEBUG]:`;//灰色
        case LogLevel.ERROR:
            return `${color}${timeStr}${headerName}[ERROR]:`;//红色
        case LogLevel.WARN:
            return `${color}${timeStr}${headerName}[WARN]:`; //黄色
        case LogLevel.LOG:
            return `${color}`; //默认颜色
    }
}
function _getColorByLevel(level: LogLevel) {
    switch (level) {
        case LogLevel.DEBUG:
            return `\u001b[90m`;//灰色
        case LogLevel.ERROR:
            return `\u001b[31m`;//红色
        case LogLevel.WARN:
            return `\u001b[33m`; //黄色
        case LogLevel.LOG:
            return `\u001b[39m`; //默认颜色
    }
}