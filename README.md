# ios-scriptable-tsx

[中文](./README.md) | [English](./README.en.md)

用 TypeScript / TSX 编写、调试并打包 [Scriptable](https://scriptable.app/) 脚本。这个仓库把常用运行时、组件化 Widget 写法、浏览器 Playground 和本地缓存模拟放在一起，让脚本可以先在桌面浏览器里跑通，再同步到 iOS Scriptable。

![Playground light preview](./docs/assets/playground-light.png)

![Playground dark preview](./docs/assets/playground-dark.png)

## 特性

- 使用 TypeScript / TSX 组织 Scriptable 脚本，入口由 `src/index.ts` 控制。
- 支持浏览器 Playground：Widget Preview、App Runtime WebView、请求日志和 Scriptable Docs 并排调试。
- App Runtime 会模拟真实点击、WebView 返回、Alert、Keychain、FileManager、Photos 文件选择等行为。
- 本地状态写入 `.cache`，包括 `.cache/keychain.json`、`.cache/Documents`、`.cache/Library`、`.cache/iCloud`、`.cache/images` 和 `.cache/tmp`，便于直接检查和重置。
- `Appearance` 控制 Widget / WebView 内部的 Scriptable 外观；页面自己的 Light / Dark / Auto 主题只影响 Playground 外壳。
- 内置离线 Scriptable Docs 预览，调试时不用频繁跳转到外部文档站点。

## 快速开始

安装依赖：

```bash
npm install
```

选择要编译的脚本。编辑 `src/index.ts`，引入需要输出的脚本：

```ts
import './scripts/Seiun.Env'
import './scripts/BilibiliMonitor'
```

单次开发构建：

```bash
npm run dev
```

生产构建：

```bash
npm run build
```

构建结果会输出到 `dist`。把业务脚本和它依赖的 `Seiun.Env.js` 放到 Scriptable 的同一目录即可运行。

## Playground 预览调试

启动带本地服务的开发模式：

```bash
npm run watch
```

终端会输出局域网地址和二维码。桌面调试可以直接打开：

```text
http://localhost:9090/playground
```

停止 watch：回到启动 `npm run watch` 的终端，按 `Ctrl+C`。在 Windows / PowerShell 里如果出现 `Terminate batch job (Y/N)?`，输入 `Y` 后回车。

Playground 默认以 `App Runtime` 运行，适合调试设置页、点击项、WebView、缓存和图片选择。切到 `Widget Preview` 时只渲染 Widget，适合确认 medium / large 等尺寸和 Appearance 下的最终显示。

常用调试入口：

- `Script`：选择 `src/index.ts` 当前导出的脚本。
- `Run Mode`：`App Runtime` 会拉起完整应用行为，`Widget Preview` 只渲染 Widget。
- `Widget Family`：模拟 Scriptable 的 `config.widgetFamily`，例如 `medium`、`large`。
- `Appearance`：模拟 Scriptable 的深浅色环境，直接影响 Widget / WebView 内部渲染。
- `Mock URL Map`：按 URL 写入自定义响应；不配置时会发起真实请求。
- `Log / Requests`：查看脚本日志、请求响应和运行时事件。
- `Docs`：在同一面板里查看离线 Scriptable 文档。

更多细节见 [Playground 调试指南](./docs/cn/playground.md)。

## 本地缓存说明

Playground 会把 Scriptable 的存储行为映射到仓库根目录的 `.cache`：

```text
.cache/
  keychain.json
  Documents/
  Library/
  iCloud/
  images/
  tmp/
```

`Keychain` 使用脚本名作为命名空间，便于阅读和排查。同名脚本会共用同一份命名空间，因此建议脚本文件名保持唯一。通过浏览器文件选择设置的图片会真实保存到本地缓存，并在后续 Widget / WebView 渲染中继续使用。

## 文档

- [快速开始](./docs/cn/quick-start.md)
- [Playground 调试指南](./docs/cn/playground.md)
- [构建流程](./docs/cn/build.md)
- [运行时环境](./docs/cn/env.md)
- [Stack UI](./docs/cn/stack-ui.md)
- [架构说明](./docs/cn/architecture.md)

## License

[MIT](./LICENSE)
