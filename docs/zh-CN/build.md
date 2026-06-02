# 构建流程

## 命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 开发模式，读取 `src/index.ts` 的 import 清单构建 |
| `npm run build` | 生产模式，读取 `src/index.ts` 的 import 清单构建 |
| `npm run dev:all` | 开发模式，打包整个 `src/scripts` 目录 |
| `npm run build:all` | 生产模式，打包整个 `src/scripts` 目录 |
| `npm run watch` | 开发构建并启动 9090 本地 Playground 服务 |
| `npm run format` | 格式化源码 |

## 停止 watch

`npm run watch` 会持续占用终端和 9090 端口。停止时回到该终端，按 `Ctrl+C`。Windows / PowerShell 如果提示 `Terminate batch job (Y/N)?`，输入 `Y` 后回车。

## index.ts 清单模式

`compileType=one` 不会输出 `index.js`。构建器会解析 `src/index.ts` 里的静态 import，并把这些 import 指向的文件作为独立入口。

示例：

```ts
import './scripts/Seiun.Env'
import './scripts/BilibiliMonitor'
```

输出：

```text
dist/Seiun.Env.js
dist/BilibiliMonitor.js
```

## 全量 scripts 模式

`dev:all` 和 `build:all` 会扫描 `src/scripts` 下的文件。当前建议 `src/scripts` 只保留正在维护的入口，历史脚本放到 `manual`。

## TSX 注入策略

构建器会按入口判断是否需要注入 `src/env/stack-ui/jsx-runtime.ts`：

- 没有 `<w...>` 标签的入口不注入。
- 已经从 `Seiun.Env.js` 解构出 `h` 的脚本不注入。
- 旧式 TSX 脚本如果直接使用 `<w...>` 且没有本地 `h`，会注入运行时 factory。

这样业务脚本不会重复打包 `src/env`，只通过 `Seiun.Env.js` 消费运行时能力。
