import * as helper from "../helper";
import * as vscode from "vscode";
import { fillNum } from "../helper";
export class Logger {
    private headerName: string = "";
    constructor(headerName: string) {
        this.headerName = headerName;
    }
    public log(...msg: any[]) {
        const configObj = helper.getConfigObj();
        if (configObj.devlog) {
            _log(this.headerName, ...msg);
        } else {
            _log("", ...msg);
        }
    }
    public devlog(...msg: any[]) {
        const configObj = helper.getConfigObj();
        if (!configObj.devlog) return;
        _log(_getDebugHeader(this.headerName), ...msg);
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

let _channel: vscode.OutputChannel;
export function showLog(show = false) {
    if (!_channel) _channel = vscode.window.createOutputChannel('Egret');/**日志窗口名*/
    _channel.show(show);
}

function _log(head: string, ...msg: any[]) {
    if (!_channel) showLog();
    let str: string = head;
    for (let i = 0; i < msg.length; i++) {
        str += _logstr(_channel, msg[i]);
    }
    if (str && !str.endsWith("\n")) _channel.appendLine(str);
    else _channel.append(str);
}

function _logstr(_channel: vscode.OutputChannel, msg: any) {
    if (typeof msg == "string") return msg;
    else if (typeof msg == "number") return `${msg}`;
    else if (typeof msg == "boolean") return `${msg}`;
    else if (msg === null || msg === undefined) return `${msg}`;
    else return JSON.stringify(msg);
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
function _getDebugHeader(headerName: string) {
    const time = new Date();
    const timeStr = `[${fillNum(time.getHours())}:${fillNum(time.getMinutes())}:${fillNum(time.getSeconds())}.${time.getMilliseconds()}]`;
    return `${timeStr}${headerName}[DEBUG]:`;
}