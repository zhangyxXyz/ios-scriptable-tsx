# Architecture

```text
src/
  build/        build pipeline, local server, and Playground mock runtime
  env/          Seiun.Env.js runtime source, utilities, and TSX rendering
  scripts/      currently maintained Scriptable script entries
  index.ts      build manifest: imported scripts are bundled

dist/           build outputs
manual/         original hand-written scripts and historical references
docs/           project docs and offline Scriptable Docs
```

## Responsibilities

`src/build` handles building, formatting, the local development server, and Playground simulation. It does not contain the real Scriptable runtime.

`src/env/runtime.ts` assembles the shared runtime and exports `WidgetBase`, `Runing`, `Utils`, `Cache`, `Storage`, `GenrateView`, and `h`. When `Seiun.Env.js` is built, the modules under `src/env` are bundled into a single file.

`src/env/stack-ui` provides the TSX / Stack UI runtime, JSX injection, and type declarations. When a business script explicitly gets `h` from `Seiun.Env.js`, the runtime is not bundled again into that script.

`src/scripts` contains only actively maintained script entries. Historical scripts live under `manual/bak`, `manual/collect`, or `manual/gallery` so they do not pollute `build:all` or editor type checking.

`src/index.ts` is the regular build manifest. Add an import there when a new script should be generated.
