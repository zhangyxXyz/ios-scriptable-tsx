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
- Builds generate `dist/subscription.json`, which `ScriptUpdater.js` can use inside Scriptable to manage subscriptions, compare versions, and update scripts.

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

## Build Outputs And Subscriptions

The regular build parses static imports in `src/index.ts` and outputs each entry as a separate `dist/*.js` file. After the scripts are written, the builder also generates `dist/subscription.json` for subscription-based updates:

- `rawUrl`: the remote raw URL for the script. By default, it is inferred from GitHub `origin` and the current branch as `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/dist/<file>`.
- `name.zh` / `name.en`: Chinese and English names, read from `this.name` and `this.en` on the script class when available.
- `desc`: the `desc` field from the script header comment, or the script name when omitted.
- `version`: the `version` field from the script header comment, or the build time when no version is declared.
- `build`: the build timestamp.

To pin the subscription raw base URL, set it before building:

```bash
$env:SUBSCRIPTION_RAW_BASE_URL='https://raw.githubusercontent.com/zhangyxXyz/ios-scriptable-tsx/main/dist'
npm run dev
```

The builder writes candidate files to `dist/.tmp` first, then compares them with the existing files in `dist`. For comparison, the new file's build time is temporarily replaced with the old file's build time and an MD5 hash is calculated. If the content matches, the official `dist` file is not overwritten, which avoids meaningless diffs when only the build timestamp changed. Files without an old build time, or files with real content changes, are overwritten. `dist/.tmp` is removed after a successful build.

## Script Updater

`dist/ScriptUpdater.js` manages script subscriptions inside Scriptable. It uses this repository's `dist/subscription.json` by default and can also manage multiple subscription sources.

![ScriptUpdater in Playground](./docs/assets/script-updater-playground.png)

- Scripts are grouped by subscription source.
- Versions are compared first when available; when versions match, a newer remote build time is still treated as an update; scripts without versions compare build times directly.
- Rows show "Update" when an update is available and "Force" when already current.
- "Update All" only downloads scripts that need updates; "Force All" overwrites all scripts.

On first real-device launch, if `Seiun.Env.js` is missing locally, the updater downloads it and reopens the script. In the Playground, the updater treats the current `dist` outputs as the local scripts and does not depend on stale files under `.cache/Documents`.

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
