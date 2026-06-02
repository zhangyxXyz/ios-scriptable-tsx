# Seiun.Env 运行时

`Seiun.Env.js` 是公共运行时构建产物。源码入口是 `src/scripts/Seiun.Env.ts`，实际装配入口位于 `src/env/runtime.ts`。

`src/env/runtime.ts` 会把 `WidgetBase`、`Storage` / `Cache`、Pinyin、Custom Font、Stack UI、Utils 等逻辑组合起来。构建 `dist/Seiun.Env.js` 时，这些模块会内联成一个 Scriptable 可直接加载的文件。

## 推荐用法

业务脚本不应该直接 value import `src/env` 里的运行时代码，否则会把运行时重复打进业务产物。推荐写法：

```ts
import type {SeiunEnv} from '@app/env/types'

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

`dist/BilibiliMonitor.js` 是业务脚本，运行时要求同目录存在 `Seiun.Env.js`。这种关系与 `manual/BilibiliMonitor.js` 直接加载 `manual/Seiun.Env.js` 的模式一致。
