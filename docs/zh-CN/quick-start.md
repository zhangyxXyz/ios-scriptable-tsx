# 快速开始

## 安装依赖

```bash
npm install
```

## 选择构建入口

编辑 `src/index.ts`，把需要生成的脚本 import 进来：

```ts
import './scripts/Seiun.Env'
import './scripts/BilibiliMonitor'
```

`npm run build` 会解析这些 import，并把对应脚本分别打包到 `dist`。

## 构建

```bash
npm run build
```

当前默认输出：

- `dist/Seiun.Env.js`
- `dist/BilibiliMonitor.js`

把这两个文件放到 Scriptable 同一目录。业务脚本通过 `require('./Seiun.Env')` 或 `importModule('Seiun.Env.js')` 加载运行时。

## 开发构建

```bash
npm run dev
```

开发构建同样读取 `src/index.ts`，区别是 `NODE_ENV=development`。

## Playground 预览

```bash
npm run watch
```

打开 `http://localhost:9090/playground`。这里可以用浏览器模拟 App Runtime、Widget Preview、WebView、Keychain、图片选择和请求日志。

停止 watch：回到启动 `npm run watch` 的终端，按 `Ctrl+C`。在 Windows / PowerShell 里如果出现 `Terminate batch job (Y/N)?`，输入 `Y` 后回车。

更多说明见 [Playground 调试指南](./playground.md)。
