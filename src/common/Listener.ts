import * as vscode from "vscode";
import { devlog } from "../helper";
export default abstract class Listener {
    protected listeners: vscode.Disposable[];

    protected abstract subscriptions: vscode.Disposable[];
    protected _isDestroy = false;
    constructor() {
        devlog("Listener constructor ", this._getClassName())
        this.listeners = [];
    }
    private _getClassName(): string {
        let self = <any>this;
        if (self.__proto__) {
            if (self.__proto__.constructor) {
                return self.__proto__.constructor.name;
            }
        }
        return "";
    }
    protected addListener(listener: vscode.Disposable) {
        devlog("Listener addListener ", this._getClassName())
        this.listeners.push(listener);
        this.subscriptions.push(listener);
    }
    protected get isDestroy() {
        return this._isDestroy;
    }
    public destroy() {
        devlog("Listener destroy ", this._getClassName())
        this._isDestroy = true;
        for (let i = 0; i < this.listeners.length; i++) {
            let tmpIndex = this.subscriptions.indexOf(this.listeners[i]);
            if (tmpIndex != -1) {
                this.subscriptions.splice(tmpIndex, 1);
            }
            this.listeners[i].dispose();
        }
        this.listeners.splice(0, this.listeners.length);
    }

}