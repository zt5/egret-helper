# egret 工具

[建议和bug反馈](https://github.com/zt5/egret-helper/issues/new)

## 特性
- 直接在编辑器中即可开启egret服务器
- 支持在编辑器中重新编译
- 支持Egret调试(依赖[Debugger for Chrome](https://github.com/Microsoft/vscode-chrome-debug)插件)
- 支持ts代码中的this.skinName路径快速跳转和补全
- 如果安装了[Egret UI Editor](https://docs.egret.com/uieditor)按下快捷键(默认Alt+F1)会自动打开对应ts绑定的exml
> Tip: 由于路径补全是动态搜索，文件多可能会卡 输入this.skinName后等待一会即可

## 目录结构

* `src/common` 通用代码
  * `src/common/Listener.ts` 自定义回收基类
  * `src/common/Progress.ts` 封装的cmd执行命令
* `src/egret-server` 内建的egret run命令服务器
  * `src/egret-server/EgretServer.ts` 服务入口
  * `src/egret-server/EgretBuild.ts` egret build命令
  * `src/egret-server/EgretServerBar.ts` 服务状态ui
  * `src/egret-server/EgretService.ts` egret run命令
  * `src/egret-server/EgretResSync.ts` 检查本地的文件并添加或删除到default.res.json中
* `src/exml` exml相关
  * `src/exml/Exml.ts` 服务入口
  * `src/exml/ExmlHoverProvider.ts` this.skinName=xx 鼠标悬浮提示
  * `src/exml/ExmlLinkProvider.ts` this.skinName=xx 编辑器中的定义
  * `src/exml/ExmlPathAutoCompleteProvider.ts` this.skinName=xx 自动补全
  * `src/define.ts` 结构定义
  * `src/helper.ts` 帮助类
  * `src/extension.ts` 扩展入口

## 需要的环境
* vscode插件 [Debugger for Chrome](https://github.com/Microsoft/vscode-chrome-debug)
* 谷歌浏览器 [Chrome](https://www.google.cn/chrome/)

## 扩展设置
* `egret-helper.enable`: true/false 是否启用插件
* `egret-helper.devLog`: true/false 是否打印详细日志
* `egret-helper.resWatch`: array default.res.json监测的资源
* `egret-helper.resWatchIgnore`: object default.res.json监测忽略的资源

## 扩展命令
* `egret-helper.goToExml`: 快速跳转到exml文件 快捷键默认Alt+F1
* `egret-helper.egretRestart`: 重新运行egret服务器
* `egret-helper.egretRestartAndDebug`: 重新运行egret服务器并调试
* `egret-helper.egretBuild`: 重新编译项目
* `egret-helper.egretBuildAndDebug`: 重新编译项目并调试
* `egret-helper.barClick`: 点击egret服务bar
* `egret-helper.egretResSync`: 同步default.res.json

## 已知的问题
暂无