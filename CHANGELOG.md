## [0.0.8] - 2020-10-10

### 修改
- 多语言支持
[0.0.8]: https://github.com/zt5/egret-helper/releases/tag/v0.0.8
-----------------------------------------------------------------------------------------------------------
## [0.0.7] - 2020-10-09

### 修改
- 优化exml路径的正则表达式匹配
- 调用 [Egret UI Editor](https://docs.egret.com/uieditor) 编辑器使用官方命令(eui)调用
- exml路径补全正则表达式优化(`之前只能匹配this.skinName=???，现在修改成 非空字符.skinName=??? 都可以触发了`)
- 编辑器判断exml路径正则表达式优化(`之前仅能匹配resource路径下的，现在改成整个工作空间`)

[0.0.7]: https://github.com/zt5/egret-helper/releases/tag/v0.0.7
-----------------------------------------------------------------------------------------------------------
## [0.0.6] - 2020-09-29
### 新增
- 添加配置`alertErrorWin` 是否在碰到错误时弹出错误提示框 默认`false`

### 修改
- 优化log显示

[0.0.6]: https://github.com/zt5/egret-helper/releases/tag/v0.0.6
-----------------------------------------------------------------------------------------------------------
## [0.0.5] - 2020-09-25
### 新增
- 添加配置`egretPropertiesPath` egret项目文件`egretProperties.json`文件路径(相对于项目根目录) 默认`"egretProperties.json"`
- 添加配置`egretResourceJsonPath` egret资源配置`default.res.json`的路径(相对于项目根目录) 默认`"resource/default.res.json"`
- 添加配置`egretResourcePath` string egret同步资源文件夹路径(要添加或删除到`default.res.json`的文件夹,相对于项目根目录) 默认`"resource"`
- 添加配置`exmlSearchGlob` exml搜索路径(glob字符串格式) 默认`"**/resource/**/*.exml"`
- 添加配置`exmlOpenExternal` 是否使用外部编辑器打开exml(目前仅支持在ts文件快捷键Alt+F1打开) 默认`true`

[0.0.5]: https://github.com/zt5/egret-helper/releases/tag/v0.0.5
-----------------------------------------------------------------------------------------------------------
## [0.0.4] - 2020-09-24
### 新增
- 添加编译并调试快捷键`Ctrl+F5`
- 支持动态修改配置

### 修改
- 关闭打开项目时自动同步资源功能
- 打开Egret菜单命令由`egret-helper.barClick`修改为`egret-helper.showEgretMenu`
- 配置描述优化

[0.0.4]: https://github.com/zt5/egret-helper/releases/tag/v0.0.4
-----------------------------------------------------------------------------------------------------------
## [0.0.3] - 2020-09-23
### 修复
- 设置菜单devlog无效的问题

[0.0.3]: https://github.com/zt5/egret-helper/releases/tag/v0.0.3
-----------------------------------------------------------------------------------------------------------
## [0.0.2] - 2020-09-23
### 新增
- 支持resource中的文件同步到default.res.json中(点击菜单选择default.res.json同步)

[0.0.2]: https://github.com/zt5/egret-helper/releases/tag/v0.0.2
-----------------------------------------------------------------------------------------------------------
## [0.0.1] - 2020-09-19
### 新增
- 支持内建的Egret服务器(可以重启http服务器和重新编译代码)
- 支持Egret调试(依赖[Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome)插件)
- 支持ts代码中的xxx.skinName路径快速跳转和补全

[0.0.1]: https://github.com/zt5/egret-helper/releases/tag/v0.0.1
-----------------------------------------------------------------------------------------------------------