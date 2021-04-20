# egret 工具 
[建议和bug反馈](https://github.com/zt5/egret-helper/issues/new)

## 特性
- 支持在编辑器中开启Egret服务器
- 支持在编辑器中重新编译
- 支持Egret调试(支持传统编译和最新的Webpack编译)
- 支持ts代码中的 `非空字符.skinName` 路径快速跳转和补全
- 支持将 `扩展设置 egret-helper.egretResourcePath` 目录的资源文件同步到 `egret-helper.egretResourceJsonPath` json中
- 如果安装了 [Egret UI Editor](https://docs.egret.com/uieditor) 按下快捷键(默认 `Alt+F1` )会自动打开当前ts绑定的exml(`Mac平台需要手动安装shell命令，打开Egret UI Editor 菜单栏：文件->安装 shell 命令`) 
- 支持在编辑器调用 [Egret Launcher](https://docs.egret.com/engine) 的发布和创建页面

## 如何使用
* 安装 [Chrome](https://www.google.cn/chrome/) 浏览器
* 更多功能 点击 `vscode左下角的状态栏插件图标` ，选择对应操作即可即可

## 扩展设置
|属性名|类型|枚举值|默认|说明|
|:-|:-|:-|:-|:-|
|`enable`|`boolean`|`true`,`false`|`true`|是否启用插件|
|`devlog`|`boolean`|`true`,`false`|`false`|是否打印详细日志|
|`egretResourceJsonPath`|`string`|`-`|`resource/default.res.json`|Egret资源配置的路径(<em>`相对于项目根目录`</em>)|
|`egretResourcePath`|`string`|`-`|`resource`|Egret资源的路径(<em>`相对于项目根目录`</em>)|
|`alertErrorWin`|`boolean`|`true`,`false`|`false`|是否在碰到错误时弹出错误提示框|
|`openEgretServer`|`enum`|`auto`,`alert`|`auto`|打开项目时怎么开启Egret服务器 (`注¹`)|
|`resMap`|`object array`|`-`|`vscode设置中查看`|同步Egret资源映射 (`注²`)|
|`resMapIgnore`|`string array`|`-`|`vscode设置中查看`|同步Egret忽略资源 (`注³`)|
|`hostType`|`enum`|`127.0.0.1`,`ip`|`127.0.0.1`|Egret服务器http地址的格式 (`注⁴`)|
|`debugBrowser`|`enum`|`chrome`,`edge`|`chrome`|调试使用的浏览器|
|`port`|`number`|`-`|`7000`|Egret服务器首选端口 (`注⁵`)|
|`webpackMode`|`boolean`|`true`,`false`|`false`|设置是否使用Egret Webpack编译(新版本的编译方式) (`注⁶`)|

## 注释
>`注¹`<br>
>>`auto`：打开Egret项目时，自动开启Egret服务器<br>
>>`alert`：打开Egret项目时，弹框询问是否开启Egret服务器

>`注²`<br>
>>例如{"`.png`":{tail:"`_png`",type:"`image`"}}<br>
>>`.png`：代表文件扩展名(必须小写)<br>
>>`_png`：扩展名尾巴(Egret资源的名字xxx_xx_png)<br>
>>`image`：`default.res.json` 中资源的type属性定义

>`注³`<br>
>>可以是文件名 xx.png(不区分大小写)<br>
>>路径的末尾 tmp/xx.png(不区分大小写)<br>
>>某一类文件 .png(不区分大小写)

>`注⁴`<br>
>>`ip`：Egret服务器使用 ip:端口号 例如(http://192.168.1.1:8000/index.html) 注意使用这种方式 `.vscode/launch.json` 里的ip容易频繁变动<br>
>>`127.0.0.1`：强制Egret服务器使用 127.0.0.1:端口号 例如(http://127.0.0.1:8000/index.html)

>`注⁵`<br>
>>Egret服务器使用端口 如果被占用默认寻找可用端口

>`注⁶`<br>
>>设置是否使用Egret Webpack编译(新版本的编译方式)
>>插件会自动修改`scripts/config.ts`中的`build`命令配置，注意如果有注释代码中含有和`build`命令类似的 需要把注释的放在下面
>>插件默认调试资源输出目录`bin-debug`(`scripts/config.ts`中`outputDir`的默认值)暂时不支持修改

## 扩展命令
* `egret-helper.goToExml`: 使用Egret UI Editor打开 快捷键默认 <kbd>Alt + F1</kbd>
* `egret-helper.egretBuildAndDebug`: 重新编译项目并调试 快捷键默认 <kbd>Ctrl + F5</kbd>