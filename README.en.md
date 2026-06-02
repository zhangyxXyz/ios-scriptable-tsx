# ios-scriptable-tsx

[中文](./README.md) | [English](./README.en.md)

Write, debug, and bundle [Scriptable](https://scriptable.app/) scripts with TypeScript / TSX. This repository combines a reusable Scriptable runtime, component-style widget authoring, a browser Playground, and local storage simulation so scripts can be verified on desktop before being copied to iOS Scriptable.

![Playground light preview](./docs/assets/playground-light.png)

![Playground dark preview](./docs/assets/playground-dark.png)

## Features

- Author Scriptable scripts in TypeScript / TSX. `src/index.ts` controls the active build entries.
- Debug in the browser with Widget Preview, App Runtime WebView, request logs, and Scriptable Docs in one workspace.
- App Runtime simulates real interactions such as WebView navigation, list item clicks, alerts, Keychain, FileManager, and browser-backed image picking.
- Local runtime state is written to `.cache`, including `.cache/keychain.json`, `.cache/Documents`, `.cache/Library`, `.cache/iCloud`, `.cache/images`, and `.cache/tmp`.
- `Appearance` controls the inner Scriptable rendering for Widget / WebView. The Playground shell has its own Light / Dark / Auto theme.
- Offline Scriptable Docs are available inside the Playground.

## Quick Start

Install dependencies:

```bash
npm install
```

Choose the scripts to build by editing `src/index.ts`:

```ts
import './scripts/Seiun.Env'
import './scripts/BilibiliMonitor'
```

Run a single development build:

```bash
npm run dev
```

Run a production build:

```bash
npm run build
```

Generated files are written to `dist`. Copy the business script and `Seiun.Env.js` into the same Scriptable directory on iOS.

## Playground Preview

Start the development watcher and local server:

```bash
npm run watch
```

The terminal prints a LAN URL and QR code. For desktop debugging, open:

```text
http://localhost:9090/playground
```

To stop watch mode, return to the terminal running `npm run watch` and press `Ctrl+C`. On Windows / PowerShell, if it asks `Terminate batch job (Y/N)?`, type `Y` and press Enter.

The Playground defaults to `App Runtime`, which is best for testing settings screens, clicks, WebView behavior, cache writes, and image selection. Switch to `Widget Preview` when you only need to verify the final widget layout for `medium`, `large`, and other families.

Common controls:

- `Script`: select a script exported by `src/index.ts`.
- `Run Mode`: `App Runtime` runs app-like behavior, while `Widget Preview` only renders the widget.
- `Widget Family`: simulates Scriptable's `config.widgetFamily`.
- `Appearance`: controls the Scriptable light / dark environment for the inner Widget and WebView.
- `Mock URL Map`: override specific URL responses; leave it empty to use real requests.
- `Log / Requests`: inspect logs, responses, and runtime events.
- `Docs`: browse the offline Scriptable documentation in the same panel.

See [Playground Debugging](./docs/en/playground.md) for details.

## Local Cache

The Playground maps Scriptable storage APIs to `.cache` in the repository root:

```text
.cache/
  keychain.json
  Documents/
  Library/
  iCloud/
  images/
  tmp/
```

`Keychain` uses the script name as its namespace, making state easy to inspect and reset. Scripts with the same name share one namespace, so keep script filenames unique. Images selected through the browser file picker are saved to local cache and reused by later Widget / WebView renders.

## Documentation

- [Quick Start](./docs/en/quick-start.md)
- [Playground Debugging](./docs/en/playground.md)
- [Build Pipeline](./docs/en/build.md)
- [Runtime Environment](./docs/en/env.md)
- [Stack UI](./docs/en/stack-ui.md)
- [Architecture](./docs/en/architecture.md)

## License

[MIT](./LICENSE)
