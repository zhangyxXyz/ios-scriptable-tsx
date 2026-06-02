# 架构说明

```text
src/
  build/        构建工具链、本地服务和 Playground mock runtime
  env/          Seiun.Env.js 运行时源码、工具函数和 TSX 渲染能力
  scripts/      当前维护的 Scriptable 脚本入口
  index.ts      构建清单：import 哪些脚本就构建哪些脚本

dist/           构建产物
manual/         原始手写脚本和历史脚本参考
docs/           项目文档和离线 Scriptable Docs
```

## 职责划分

`src/build` 只处理构建、格式化、本地开发服务和 Playground 模拟逻辑，不承载真实 Scriptable 运行时能力。

`src/env/runtime.ts` 是公共运行时装配入口，导出 `WidgetBase`、`Runing`、`Utils`、`Cache`、`Storage`、`GenrateView` 和 `h`。构建 `Seiun.Env.js` 时，构建器会把 `src/env` 下的模块内联成单文件产物。

`src/env/stack-ui` 提供 TSX / Stack UI 的运行时、JSX 注入和类型声明。业务脚本显式从 `Seiun.Env.js` 取得 `h` 时，不会重复打包整套运行时。

`src/scripts` 只放当前维护的脚本入口。历史脚本放在 `manual/bak`、`manual/collect` 或 `manual/gallery` 里，避免污染 `build:all` 和编辑器类型检查。

`src/index.ts` 是普通构建清单。新增脚本时，把脚本 import 到这里即可。
