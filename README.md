# egret 工具

[建议和bug反馈](https://github.com/zt5/egret-helper/issues/new)

## 特性
- 直接在编辑器中即可开启egret服务器
- 支持在编辑器中重新编译
- 支持Egret调试(依赖 [Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome) 插件)
- 支持ts代码中的`this.skinName`路径快速跳转和补全
- 支持将resource目录的资源文件同步到`default.res.json`中
- 如果安装了 [Egret UI Editor](https://docs.egret.com/uieditor) 按下快捷键(默认Alt+F1)会自动打开对应ts绑定的exml
> Tip: 由于路径补全是动态搜索，文件多可能会卡 输入`this.skinName`后等待一会即可

## 如何使用
* 安装 [Chrome](https://www.google.cn/chrome/) 浏览器
* 安装 [Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome) 插件
* 打开egret项目默认启动 创建一个调试Chrome的`launch.json`(`.vscode`目录中)(这一步可以省略不存在会自动创建)
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
* 更多功能 点击vscode左下角的状态栏插件图标，选择对应操作即可即可

## 扩展设置
* `egret-helper.enable`: true/false 是否启用插件
* `egret-helper.devlog`: true/false 是否打印详细日志
* `egret-helper.resMap`: 同步`default.res.json`的资源 对象的key值代表文件扩展名 tail属性：扩展名替换的尾巴(egret资源的名字) type：`default.res.json`中的type
* `egret-helper.resMapIgnore`: array 同步`default.res.json`忽略的资源

## 扩展命令
* `egret-helper.goToExml`: 快速跳转到exml文件 快捷键默认Alt+F1
* `egret-helper.egretRestart`: 重新运行egret服务器
* `egret-helper.egretRestartAndDebug`: 重新运行egret服务器并调试
* `egret-helper.egretBuild`: 重新编译项目
* `egret-helper.egretBuildAndDebug`: 重新编译项目并调试 快捷键默认Ctrl+F5
* `egret-helper.showEgretMenu`: 调出egret服务菜单
* `egret-helper.egretResSync`: 同步`default.res.json`

## 已知的问题
暂无