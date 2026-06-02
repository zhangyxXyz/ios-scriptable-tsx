# Stack UI And TSX

Stack UI lives under `src/env/stack-ui` and renders TSX tags into Scriptable widget API calls.

## Supported Tags

- `wbox`
- `wstack`
- `wimage`
- `wspacer`
- `wtext`
- `wdate`

Type declarations live in:

```text
src/env/stack-ui/types
```

`tsconfig.json` includes these declarations through `typeRoots`.

## Rendering

Business scripts must set the target `ListWidget` before rendering:

```tsx
GenrateView.setListWidget(widget)

return (
    <wbox spacing={5}>
        <wtext textColor={this.widgetColor}>Hello</wtext>
    </wbox>
)
```

If a business script destructures `h` from `Seiun.Env.js`, the builder uses that `h` directly and does not bundle `src/env/stack-ui` into the business script again.
