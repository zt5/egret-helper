## 如何使用
* 安装 [Chrome](https://www.google.cn/chrome/)
* 安装 [Debugger for Chrome](https://github.com/Microsoft/vscode-chrome-debug) 插件
* 打开egret项目默认启动 创建一个调试Chrome的launch.json(.vscode目录中)(这一步可以省略不存在会自动创建)
```
{
    // 使用 IntelliSense 了解相关属性。 
    // 悬停以查看现有属性的描述。
    // 欲了解更多信息，请访问: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "type": "chrome",
            "request": "launch",
            "name": "Egret Debug",
            "url": "http://localhost:8080",//#replace
            "webRoot": "\${workspaceFolder}"
        }
    ]
}
```
* egret项目根目录的`tsconfig.json`中`compilerOptions`配置`sourceMap = true`(这一步可以省略不存在会自动创建)
* 如果有修改 点击左下角的菜单栏选择对应操作即可即可