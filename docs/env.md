# Seiun.Env 运行时

`Seiun.Env.js` 是构建产物，源码入口是 `src/scripts/Seiun.Env.ts`，实际装配入口位于 `src/env/runtime.ts`。

`src/env/runtime.ts` 由最新版 `manual/Seiun.Env.js` 拆分而来。WidgetBase、Storage/Cache、Pinyin、Custom Font、Stack UI、Utils 等逻辑平铺在 `src/env/*.ts` 子模块里；构建 `dist/Seiun.Env.js` 时会内联装配成单文件。

同步时会把 `module.filename` 转成构建 banner 提供的 `MODULE.filename`，避免 esbuild CommonJS wrapper 改变 Scriptable 的真实文件上下文。

业务脚本不应该直接 value import `src/env` 里的运行时代码，否则会把运行时重复打进业务产物。推荐写法：

```ts
import type {SeiunEnv, WidgetBase as WidgetBaseType} from '@app/env/types'

declare const importModule: (moduleName: string) => SeiunEnv

const dependencyFileName = 'Seiun.Env.js'
const runtimeRequire = typeof require === 'undefined' ? importModule : require
const {WidgetBase, Runing, Utils, GenrateView, h} = runtimeRequire(dependencyFileName) as SeiunEnv
```

## 对外导出

`src/env/runtime.ts` 当前导出：

- `WidgetBase`
- `Runing`
- `Utils`
- `Cache`
- `Storage`
- `GenrateView`
- `h`

## 产物关系

`dist/Seiun.Env.js` 是公共依赖包。

`dist/BilibiliMonitor.js` 是业务脚本，运行时要求同目录存在 `Seiun.Env.js`。

这种关系和 `manual/BilibiliMonitor.js` 直接加载 `manual/Seiun.Env.js` 的模式一致。
