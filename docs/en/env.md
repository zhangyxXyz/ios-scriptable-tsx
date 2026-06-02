# Seiun.Env Runtime

`Seiun.Env.js` is the shared runtime build output. Its source entry is `src/scripts/Seiun.Env.ts`, and the actual assembly entry is `src/env/runtime.ts`.

`src/env/runtime.ts` combines `WidgetBase`, `Storage` / `Cache`, Pinyin, Custom Font, Stack UI, Utils, and related runtime pieces. When `dist/Seiun.Env.js` is built, these modules are bundled into one file that Scriptable can load directly.

## Recommended Usage

Business scripts should not value-import runtime code from `src/env`; doing so would bundle the runtime into each business output. Prefer:

```ts
import type {SeiunEnv} from '@app/env/types'

declare const importModule: (moduleName: string) => SeiunEnv

const dependencyFileName = 'Seiun.Env.js'
const runtimeRequire = typeof require === 'undefined' ? importModule : require
const {WidgetBase, Runing, Utils, GenrateView, h} = runtimeRequire(dependencyFileName) as SeiunEnv
```

## Exports

`src/env/runtime.ts` currently exports:

- `WidgetBase`
- `Runing`
- `Utils`
- `Cache`
- `Storage`
- `GenrateView`
- `h`

## Output Relationship

`dist/Seiun.Env.js` is the shared dependency.

`dist/BilibiliMonitor.js` is the business script and expects `Seiun.Env.js` to exist in the same Scriptable directory. This matches how `manual/BilibiliMonitor.js` loads `manual/Seiun.Env.js`.
