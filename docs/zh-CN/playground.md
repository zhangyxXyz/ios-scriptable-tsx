# Playground 调试指南

Playground 是给 Scriptable 脚本准备的浏览器运行环境。它不只渲染 Widget，也会尽量模拟脚本在 App 内运行时的行为，方便调试设置项、缓存、图片选择、WebView 和网络请求。

## 启动

```bash
npm run watch
```

打开：

```text
http://localhost:9090/playground
```

`npm run watch` 会监听源码、重新构建脚本，并启动 9090 本地服务。`npm run dev` 只做一次开发构建，适合只想生成 `dist` 的场景。

## 停止

回到启动 `npm run watch` 的终端，按 `Ctrl+C`。

在 Windows / PowerShell 中，如果终端提示：

```text
Terminate batch job (Y/N)?
```

输入 `Y` 后回车即可。如果终端已经关掉但 9090 端口还被占用，可以结束对应的 Node 进程后再重新启动 watch。

## 面板

- `Widget Preview / App Action Preview`：展示 Widget 或 App Runtime 过程中产生的预览内容。
- `WebView`：模拟 Scriptable 内置 WebView，支持点击条目、返回上一级和关闭当前页面。
- `Log / Requests`：显示脚本日志、请求参数和响应摘要，JSON 会进行语法高亮。
- `Docs`：内嵌本地 Scriptable Docs，可在 Log 面板右上角切换。

宽屏下各面板横向铺开，窄屏下会自动改成纵向排列。桌面全屏时页面本身尽量不滚动，滚动会发生在各个面板内部。

## 运行模式

`App Runtime` 是默认模式，会模拟 `config.runsInApp = true`。适合调试：

- 设置页点击和返回。
- `Alert` 的确认 / 取消结果。
- `WebView.evaluateJavaScript` 与页面事件桥接。
- `Keychain`、`FileManager`、图片选择和脚本缓存。

`Widget Preview` 只渲染 Widget，适合检查：

- `config.widgetFamily` 对布局的影响。
- `Appearance` 为 `light` / `dark` 时的真实视觉结果。
- `args.widgetParameter` 对内容的影响。

## Appearance 与页面主题

左侧 `Appearance` 控制的是 Scriptable 内部环境，会影响 Widget 和 WebView 里的业务 UI。

顶部主题按钮控制的是 Playground 外壳，支持 Auto / Light / Dark。这个主题不会覆盖 Widget / WebView 内部，方便分别确认调试器外观和脚本真实外观。

## 缓存和图片

Playground 会把 Scriptable 的本地存储映射到仓库根目录的 `.cache`：

```text
.cache/
  keychain.json
  Documents/
  Library/
  iCloud/
  images/
  tmp/
```

`Keychain` 数据序列化在 `.cache/keychain.json`，并以脚本名作为命名空间。背景图等图片通过浏览器文件选择获得，不再使用 mock 图片；选中后会保存到 `.cache/images` 并在后续渲染中继续使用。

如果需要重置状态，可以在脚本设置页里点击对应清理项，也可以直接删除 `.cache` 下的文件后重新运行。

## 请求调试

默认情况下，请求会真实发出。需要固定某个接口响应时，可以在 `Mock URL Map` 中填 JSON，例如：

```json
{
  "https://example.com/api": {
    "code": 0,
    "data": []
  }
}
```

运行后在 `Log / Requests` 面板检查请求 URL、响应内容和脚本输出。
