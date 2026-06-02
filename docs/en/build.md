# Build Pipeline

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development build using imports from `src/index.ts` |
| `npm run build` | Production build using imports from `src/index.ts` |
| `npm run dev:all` | Development build for all files under `src/scripts` |
| `npm run build:all` | Production build for all files under `src/scripts` |
| `npm run watch` | Development build plus the local Playground server on port 9090 |
| `npm run format` | Format source files |

## Stop Watch

`npm run watch` keeps the terminal and port 9090 busy. To stop it, return to that terminal and press `Ctrl+C`. On Windows / PowerShell, if it asks `Terminate batch job (Y/N)?`, type `Y` and press Enter.

## index.ts Manifest Mode

`compileType=one` does not output `index.js`. The builder parses static imports in `src/index.ts` and treats each imported file as an independent entry.

Example:

```ts
import './scripts/Seiun.Env'
import './scripts/BilibiliMonitor'
```

Output:

```text
dist/Seiun.Env.js
dist/BilibiliMonitor.js
```

## Full scripts Mode

`dev:all` and `build:all` scan files under `src/scripts`. Keep only actively maintained entries there and put historical scripts under `manual`.

## TSX Injection

The builder decides whether `src/env/stack-ui/jsx-runtime.ts` should be injected for each entry:

- Entries without `<w...>` tags are not injected.
- Scripts that already destructure `h` from `Seiun.Env.js` are not injected.
- Older TSX scripts that use `<w...>` directly and do not have a local `h` receive the runtime factory injection.

This keeps business scripts from bundling `src/env` repeatedly; they consume runtime capabilities through `Seiun.Env.js`.
