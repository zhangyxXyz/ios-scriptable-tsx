# Playground Debugging

The Playground is a browser runtime for Scriptable scripts. It renders widgets and also simulates app-side behavior so settings screens, cache writes, image picking, WebView interactions, and network requests can be debugged on desktop.

## Start

```bash
npm run watch
```

Open:

```text
http://localhost:9090/playground
```

`npm run watch` watches source files, rebuilds scripts, and starts the local server on port 9090. `npm run dev` only runs a one-off development build, which is useful when you only need files in `dist`.

## Stop

Return to the terminal running `npm run watch` and press `Ctrl+C`.

On Windows / PowerShell, if the terminal asks:

```text
Terminate batch job (Y/N)?
```

Type `Y` and press Enter. If the terminal was already closed but port 9090 is still occupied, stop the matching Node process before starting watch again.

## Panels

- `Widget Preview / App Action Preview`: shows the widget or preview content produced during App Runtime.
- `WebView`: simulates Scriptable's built-in WebView, including item clicks, back navigation, and closing the current page.
- `Log / Requests`: shows logs, request parameters, and response summaries with JSON syntax highlighting.
- `Docs`: embeds the local Scriptable Docs and can be toggled from the Log panel header.

On wide screens, panels are arranged horizontally. On narrow screens, they stack vertically. Desktop fullscreen keeps page-level scrolling minimal; each panel scrolls internally.

## Run Modes

`App Runtime` is the default mode and simulates `config.runsInApp = true`. Use it for:

- Settings page clicks and navigation.
- `Alert` confirm / cancel results.
- `WebView.evaluateJavaScript` and the page event bridge.
- `Keychain`, `FileManager`, image picking, and script cache.

`Widget Preview` renders only the widget. Use it for:

- Checking how `config.widgetFamily` affects layout.
- Verifying the final visual result for `light` / `dark` Appearance.
- Testing `args.widgetParameter`.

## Appearance And Shell Theme

The left-side `Appearance` control simulates Scriptable's internal environment and affects the business UI inside Widget and WebView.

The top theme button controls only the Playground shell and supports Auto / Light / Dark. It does not override the inner Widget / WebView appearance.

## Cache And Images

The Playground maps Scriptable local storage to `.cache` in the repository root:

```text
.cache/
  keychain.json
  Documents/
  Library/
  iCloud/
  images/
  tmp/
```

`Keychain` is serialized to `.cache/keychain.json` and uses the script name as its namespace. Background images are picked through the browser file picker instead of mock images; selected files are saved to `.cache/images` and reused by later renders.

To reset state, use the script settings screen or delete files under `.cache` before running again.

## Request Debugging

By default, requests are sent for real. To pin a response for a specific URL, add JSON to `Mock URL Map`:

```json
{
  "https://example.com/api": {
    "code": 0,
    "data": []
  }
}
```

After running, inspect request URLs, responses, and script output in `Log / Requests`.
