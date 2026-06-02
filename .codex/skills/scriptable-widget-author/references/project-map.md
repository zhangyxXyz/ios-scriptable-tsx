# 项目地图

## 重要文件

- `src/scripts`: TS/TSX 业务 Scriptable widget 入口。
- `src/scripts/Seiun.Env.ts`: 公共 runtime 依赖入口，会构建为 `dist/Seiun.Env.js`。
- `src/index.ts`: 普通单入口构建使用的静态 import 清单。
- `src/env/runtime.ts`: `Seiun.Env.js` 的 runtime 装配入口。
- `src/env/widget-base.ts`: `WidgetBase`、`Runing`、settings、actions 和 widget family 处理。
- `src/env/stack-ui`: TSX Stack UI runtime 和 widget 标签类型。
- `src/build/compile.ts`: esbuild bundler、入口发现、TSX 注入、`compileFilter` 和输出写入。
- `src/build/server.ts`: 9090 端口的 Playground server。
- `src/build/static/playground.html`: 浏览器 Playground 外壳。
- `docs/build.md`: 构建模式和 TSX 注入说明。
- `docs/playground.md`, `docs/zh-CN/playground.md`, `docs/en/playground.md`: Playground 行为和测试面。
- `docs/scriptable-docs`: Playground 内提供的本地 Scriptable API docs。
- `manual`: 原始 JavaScript widget 和移植素材。

## 脚本清单

- 如果 widget 需要图标元数据，把 Scriptable metadata comments 保持在文件顶部。
- 使用带 `importModule` fallback 的 `runtimeRequire('Seiun.Env.js')`。
- 需要类型时，从 `@app/env/types` 导入。
- network response types 要足够明确，便于发现 API shape 错误。
- 支持相关 `widgetFamily`，不支持的尺寸调用 `Utils.renderUnsupport(widget)`。
- 如果需求包含用户可配置参数，使用 `this.widgetParam` 或 `args.widgetParameter`。
- 为了匹配现有 widget，渲染内容前先调用 `await this.getWidgetBackgroundImage(widget)`。
- settings 只在 `Run()` 内注册，并在 `!config.runsInApp` 时提前返回。
- 文件结尾使用 `EndAwait(() => Runing(...))`。

## 验证清单

- 普通 manifest 构建运行 `npm run dev`。
- 需要验证每个脚本入口时运行 `npm run dev:all`。
- 确认预期文件存在于 `dist`。
- 视觉或 runtime 改动运行 `npm run watch`，并检查 `http://localhost:9090/playground`。
- 至少测试本次实现触及的 widget family。
- 在 Log / Requests 中检查抛出的错误、失败请求、格式不对的 mock 数据和意外空状态。
