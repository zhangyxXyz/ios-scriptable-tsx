# Stack UI 与 TSX

Stack UI 位于 `src/env/stack-ui`，用于把 TSX 标签渲染成 Scriptable widget API。实际运行时在 `src/env/stack-ui/index.ts`，TSX 注入桥在 `src/env/stack-ui/jsx-runtime.ts`，类型声明在 `src/env/stack-ui/types`。

## 支持标签

- `wbox`
- `wstack`
- `wimage`
- `wspacer`
- `wtext`
- `wdate`

类型声明位于：

```text
src/env/stack-ui/types
```

`tsconfig.json` 已经通过 `typeRoots` 引入这些声明。

## 渲染方式

业务脚本需要在渲染前指定目标 `ListWidget`：

```tsx
GenrateView.setListWidget(widget)

return (
    <wbox spacing={5}>
        <wtext textColor={this.widgetColor}>Hello</wtext>
    </wbox>
)
```

如果业务脚本从 `Seiun.Env.js` 解构出了 `h`，构建器会直接使用这个 `h`，不会把 `src/env/stack-ui` 重复打进业务脚本。
