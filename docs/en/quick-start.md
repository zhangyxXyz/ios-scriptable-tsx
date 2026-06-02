# Quick Start

## Install Dependencies

```bash
npm install
```

## Choose Build Entries

Edit `src/index.ts` and import the scripts that should be generated:

```ts
import './scripts/Seiun.Env'
import './scripts/BilibiliMonitor'
```

`npm run build` reads these imports and bundles each referenced script into `dist`.

## Build

```bash
npm run build
```

The default outputs are:

- `dist/Seiun.Env.js`
- `dist/BilibiliMonitor.js`

Copy both files into the same Scriptable directory. The business script loads the runtime with `require('./Seiun.Env')` or `importModule('Seiun.Env.js')`.

## Development Build

```bash
npm run dev
```

This also reads `src/index.ts`, with `NODE_ENV=development`.

## Playground Preview

```bash
npm run watch
```

Open `http://localhost:9090/playground`. The browser Playground can simulate App Runtime, Widget Preview, WebView, Keychain, image picking, and request logs.

To stop watch mode, return to the terminal running `npm run watch` and press `Ctrl+C`. On Windows / PowerShell, if it asks `Terminate batch job (Y/N)?`, type `Y` and press Enter.

See [Playground Debugging](./playground.md) for details.
