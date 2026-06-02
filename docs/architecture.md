# 项目结构

```text
src/
  build/        构建工具链，只放编译、环境变量和本地开发服务器逻辑
  env/          Seiun.Env.js 运行时源码和编辑器类型
  scripts/      Scriptable 脚本入口
  index.ts      构建清单，import 哪些脚本就构建哪些脚本

dist/           构建产物
manual/         原始手写脚本参考
```

## 目录职责

`src/build` 只处理构建和格式化相关逻辑，不承载 Scriptable 运行时能力。

`src/env/runtime.ts` 是基于最新版 `manual/Seiun.Env.js` 拆分出来的运行时装配入口，负责导出 `WidgetBase`、`Runing`、`Utils`、`Cache`、`Storage`、`GenrateView` 和 `h`。

`src/env/widget-base.ts` 放 `WidgetBase` 和 `Runing`，`src/env/storage.ts` 放 Storage 和临时缓存实现，`src/env/pinyin.ts` 放拼音字典加载与转换逻辑，`src/env/custom-font.ts` 放自定义字体绘制逻辑，`src/env/stack-ui` 放 TSX/Stack UI 的运行时、JSX 注入和类型，`src/env/utils.ts` 放对外工具导出。

构建 `Seiun.Env.js` 时，构建器会把这些 env 子模块内联回单文件产物，Scriptable 端不需要额外文件。

`src/env/types.ts` 用于描述 `Seiun.Env.js` 的 API；`src/env/stack-ui/types` 用于本地 TSX 编辑体验。

`src/scripts` 只放当前要维护的脚本入口。旧脚本已移动到 `bak/scripts`，避免污染 `build:all` 和编辑器类型检查。

`src/index.ts` 是普通构建清单。新增脚本时，把脚本 import 到这里即可。
