# 仓库指令

## 项目结构

这个仓库会把 TypeScript/TSX 编写的 iOS Scriptable widget 构建为 `dist` 下的单文件 JavaScript 产物。

- 业务 widget 脚本放在 `src/scripts`。
- `src/scripts/Seiun.Env.ts` 会构建共享 Scriptable runtime 依赖 `dist/Seiun.Env.js`。
- `src/index.ts` 是普通 `npm run dev` 和 `npm run build` 使用的 manifest。
- `src/env` 包含 Scriptable runtime、WidgetBase、storage/cache helpers、Stack UI TSX runtime 和 types。
- `src/build` 包含 compiler 和本地 Playground server。

## Agent 工作流

当任务是编写或修改 widget 时，使用本地 skill：`.codex/skills/scriptable-widget-author`。

编辑前先阅读相关源码和文档，不要凭空猜：

- `README.md`
- `docs/zh-CN/build.md` 或 `docs/en/build.md`
- `docs/zh-CN/playground.md` 或 `docs/en/playground.md`
- `src/scripts` 中已有脚本
- `src/env/types.ts` 和 `src/env/stack-ui/types` 中的相关 types

## 构建与验证

- 普通 manifest 构建使用 `npm run dev`。
- 新增 widget 入口时，在 `src/index.ts` 中添加静态 import。
- 只有在需要验证 `src/scripts` 中所有脚本时，才使用 `npm run dev:all`。
- 需要定向本地构建时，可以使用 `$env:compileFilter='Name'; npm run dev`。
- 修改业务脚本或运行时后，运行对应构建并保留生成的 `dist/*.js` 与 `dist/subscription.json` 变更；这些产物需要随源码一起提交。
- UI/runtime 验证使用 `npm run watch`，然后打开 `http://localhost:9090/playground`。
- Playground 状态存储在 `.cache`；不要提交它。

## 编码注意

- 优先沿用现有 `WidgetBase`、`Runing`、`Utils`、`GenrateView` 和 Stack UI TSX 模式。
- 使用 TSX 的业务 widget 应该从 `Seiun.Env.js` 消费 `h`。
- 改动范围保持在请求涉及的 widget/runtime 行为内。
- 纯文档或非构建行为改动不需要刷新 `dist`；涉及业务脚本、入口或 runtime 的改动需要同步刷新 `dist`。
