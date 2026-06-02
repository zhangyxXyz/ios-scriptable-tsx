---
name: scriptable-widget-author
description: 在 ios-scriptable-tsx 仓库中编写、修改、构建并验证 Scriptable iOS widget 脚本。当 Codex 需要在 src/scripts 下创建或编辑 TSX/TypeScript Scriptable widget、把 manual 中的 Scriptable JS widget 移植成仓库风格、更新 src/index.ts 入口、运行 npm build/watch 命令，或在本地浏览器 Playground 的 /playground 验证行为时使用。
---

# Scriptable Widget Author

## 工作流

1. 先阅读本地项目上下文：
   - `README.md`
   - `docs/build.md`
   - `docs/playground.md` 或 `docs/zh-CN/playground.md`
   - `src/scripts` 中已有的 widget，通常是 `BilibiliMonitor.tsx`
   - `src/env/types.ts` 和 `src/env/stack-ui/types` 中相关 runtime/types
2. 在 `src/scripts` 中创建或编辑 widget 脚本。
3. 使用普通单入口构建时，确认脚本已经被 `src/index.ts` 引入。
4. 运行开发构建。
5. 如果任务修改了 widget UI 或 runtime 行为，用 Playground 验证。
6. 汇报 `dist` 中生成的文件，以及验证中仍然存在的限制。

## Widget 模式

业务 widget 优先沿用仓库现有模式：

```ts
import type {SeiunEnv, WidgetBase as WidgetBaseType} from '@app/env/types'

declare const importModule: (moduleName: string) => SeiunEnv

const dependencyFileName = 'Seiun.Env.js'
const runtimeRequire = typeof require === 'undefined' ? importModule : require
const {WidgetBase, Runing, Utils, GenrateView, h} = runtimeRequire(dependencyFileName) as SeiunEnv

class MyWidget extends WidgetBase {
    name = 'My Widget'
    en = 'MyWidget'
    widgetParam = args.widgetParameter

    async render() {
        const widget = new ListWidget()
        await this.getWidgetBackgroundImage(widget)
        GenrateView.setListWidget(widget)
        return widget
    }
}

EndAwait(() => Runing(MyWidget as unknown as typeof WidgetBaseType, args.widgetParameter, false))
```

布局用 TSX 更清晰时，使用 `wbox`、`wstack`、`wtext`、`wimage`、`wspacer` 等 Stack UI 标签。使用 TSX 时，从 `Seiun.Env.js` 中解构 `h`。

## 构建

在仓库根目录使用这些命令：

```bash
npm run dev
npm run build
npm run dev:all
npm run build:all
```

`npm run dev` 和 `npm run build` 会解析 `src/index.ts` 中的静态 import，并为每个被引入的脚本输出一个文件。新增业务脚本时这样加入入口：

```ts
import './scripts/MyWidget'
```

`dev:all` 和 `build:all` 会扫描 `src/scripts`。

需要更快的定向构建时，compiler 支持 `compileFilter`：

```bash
$env:compileFilter='MyWidget'; npm run dev
```

构建产物输出到 `dist`。Scriptable 运行时需要把业务脚本和 `dist/Seiun.Env.js` 放在同一个 Scriptable 目录。

## Playground 验证

只要 widget UI、设置动作、请求、缓存、WebView 或 Scriptable runtime 行为发生变化，就使用 Playground。

1. 启动 watcher：

```bash
npm run watch
```

2. 打开：

```text
http://localhost:9090/playground
```

3. 选择生成的脚本并测试：
   - App Runtime：测试设置页、Alert、WebView、storage、keychain 和点击动作。
   - Widget Preview：测试 `small`、`medium`、`large`、appearance 和 `args.widgetParameter`。
   - Log / Requests：检查 console 输出、请求 URL、响应和错误。
   - Mock URL Map：需要固定 API 数据时使用。

4. 如果 9090 端口已被占用，停止对应的 Node 进程；如果正在运行的 server 服务的是本仓库，也可以复用。

Playground 会把 Scriptable 本地存储映射到 `.cache`。不要提交 `.cache`。

## 参考

需要一个紧凑的仓库文件、命令和验证清单地图时，阅读 `references/project-map.md`。
