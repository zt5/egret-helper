import * as vscode from "vscode";
export default abstract class Listener {
    protected listeners: vscode.Disposable[];

    protected abstract subscriptions: vscode.Disposable[];
    protected _isDestroy = false;
    constructor() {
        this.listeners = [];
    }
    protected addListener(listener: vscode.Disposable) {
        this.listeners.push(listener);
        this.subscriptions.push(listener);
    }
    protected removeListener(listener: vscode.Disposable) {
        let index = this.listeners.indexOf(listener);
        if (index != -1) {
            this.listeners.splice(index, 1);
        }
        listener.dispose();
    }
    protected get isDestroy() {
        return this._isDestroy;
    }
    public destroy() {
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