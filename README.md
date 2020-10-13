# egret 工具 
[建议和bug反馈](https://github.com/zt5/egret-helper/issues/new)

## 特性
- 直接在编辑器中即可开启Egret服务器
- 支持在编辑器中重新编译
- 支持Egret调试(依赖 [Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome) 插件)
- 支持ts代码中的 `非空字符.skinName` 路径快速跳转和补全
- 支持将 `扩展设置 egret-helper.egretResourcePath` 目录的资源文件同步到 `default.res.json` 中
- 如果安装了 [Egret UI Editor](https://docs.egret.com/uieditor) 按下快捷键(默认 `Alt+F1` )会自动打开当前ts绑定的exml(`Mac平台需要手动安装shell命令，打开Egret UI Editor 菜单栏：文件->安装 shell 命令`)
> 由于路径补全需要搜索全部exml，文件多可能会卡，输入 `非空字符.skinName=` 后等待一会即可  

## 如何使用
* 安装 [Chrome](https://www.google.cn/chrome/) 浏览器
* 安装 [Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome) 插件
* 更多功能 点击 `vscode左下角的状态栏插件图标` ，选择对应操作即可即可

## 扩展设置
* `enable`: true/false 是否启用插件  
  >默认 `true`
* `devlog`: true/false 是否打印详细日志  
  >默认 `false`
* `resMap`: object 同步 `default.res.json` 的资源  
  >例如{".png":{tail:"_png",type:"image"}}  
  ".png"：代表文件扩展名(必须小写)
  "tail属性"：扩展名尾巴(Egret资源的名字 `xxx_xx_png` )  
  "type属性"：`default.res.json` 中资源的type属性定义
* `resMapIgnore`: array 同步 `default.res.json` 忽略的资源 
  >可以是文件名 xx.png(不区分大小写)
  路径的末尾 tmp/xx.png(不区分大小写)
  某一类文件 .png(不区分大小写)
* `egretPropertiesPath`: string Egret项目文件 `egretProperties.json` 文件路径  
  >默认 `egretProperties.json`  
  >相对于项目根目录
* `egretResourceJsonPath`: string Egret资源配置 `default.res.json` 的路径  
  >默认 `resource/default.res.json`  
  >相对于项目根目录
* `egretResourcePath`: string Egret同步资源文件夹路径  
  >默认 `resource`  
  >相对于项目根目录  
  >执行同步资源到 `default.res.json` 时扫描的文件夹,
* `exmlSearchGlob`: string exml搜索路径  
  >默认 `**/resource/**/*.exml`  
  >glob字符串格式
* `exmlOpenExternal`: true/false 是否使用外部编辑器打开exml  
  >默认 `true`  
  >目前仅支持在ts文件快捷键 `Alt+F1` 打开
* `alertErrorWin`: true/false 是否在碰到错误时弹出错误提示框
  >默认 `false`  

## 扩展命令
* `egret-helper.goToExml`: 快速跳转到exml文件 快捷键默认 `Alt+F1`
* `egret-helper.egretBuildAndDebug`: 重新编译项目并调试 快捷键默认 `Ctrl+F5`