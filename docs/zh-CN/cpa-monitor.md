# CPA 额度监控

`CPAMonitor` 查询 CPA Key Billing 1.5.5 起提供的订阅与上游额度接口。

1. 使用 ScriptUpdater 更新订阅，安装 `CPAMonitor`；也可把 `dist/CPAMonitor.js` 和 `dist/Seiun.Env.js` 放到同一个 Scriptable 目录。
2. 在 Scriptable 内运行脚本，打开 **CPA 设置**，填写 HTTPS 地址，不带管理页面路径。
3. 点击 **设置 API Key**，输入下游 Key。Key 只保存在 Keychain；留空保存可清除。
4. 在 CPA 的 API Key 页面为该 Key 开启需要的额度查询权限。默认允许订阅查询、禁止上游查询。
5. 添加桌面组件，选择小、中或大号。查询内容默认使用已授权的全部内容；Provider 留空表示全部，也可填写 `codex`、`claude` 等单个类型。

接口会返回全部允许访问的凭证。组件分别最多显示 1、2、6 行额度窗口，超出部分显示数量提示；多个凭证可能共享额度，不能累加百分比。切换 Provider 或查询内容可缩小显示范围。

脚本不保存本地额度响应缓存，每次运行请求服务端。服务端默认缓存 5 分钟；组件请求系统约 5 分钟后刷新，实际调度由 iOS 决定。旧快照、缓存、不支持和未授权状态会明确显示；未知额度不会显示为零。更换 Key 后不会沿用旧 Key 的缓存响应。

API Key 换钥后，在脚本的 **设置 API Key** 中重新保存。401 表示 Key 无效或已被撤销；403 表示当前查询内容没有权限。

源码：[`src/scripts/CPAMonitor.tsx`](../../src/scripts/CPAMonitor.tsx)。插件接口说明见 [CPA Key Billing](https://github.com/zhangyxXyz/CLIProxyAPI-Plugins/blob/dev/plugins/key-billing/docs/monitor.md)。
