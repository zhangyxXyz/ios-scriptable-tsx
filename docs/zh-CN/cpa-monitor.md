# CLIProxy-Api 额度卡片

`CPAMonitor` 通过 Key Billing 下游 API Key 查询订阅与上游额度。中号使用 **2 × 2** 四格，大号使用 **2 × 3** 六格；样式沿用原 DoneHub 卡片。DoneHubMonitor 已移除，可改用本组件。

1. 在 ScriptUpdater 更新订阅并安装 CPAMonitor，或把 `dist/CPAMonitor.js` 与 `dist/Seiun.Env.js` 放入同一 Scriptable 目录。
2. 在 App 中运行脚本，打开 **CLIProxy-Api 设置**，填写 HTTPS 服务地址，不带管理页面路径。
3. **设置 API Key**：输入下游 Key，仅保存到 Keychain。留空保存清除 Key。
4. 在 Key Billing 为该 Key 开启所需的额度查询权限，且路由允许访问相应凭证。默认上游查询关闭。
5. 点击 **查询并发现额度项**。中／大卡片各位置可选择预设指标，或查询发现的指定账号窗口；按位置选择即可调整顺序。
6. 添加中号或大号桌面组件。Provider 默认留空；多服务卡片需要查询全部服务。

| 位置 | 中号默认 | 大号默认 |
| --- | --- | --- |
| 左上 | Codex 周额度 | Codex 周额度 |
| 右上 | DeepSeek 余额 | DeepSeek 余额 |
| 第二行左 | Copilot credits | Copilot credits |
| 第二行右 | OpenCode 5 小时 | Copilot 补全 |
| 第三行左 | — | OpenCode 5 小时 |
| 第三行右 | — | OpenCode 周额度 |

另外可选择 Claude 五小时／周额度、Copilot 聊天、OpenCode 月额度和订阅额度。预设匹配多个账号或币种时提示“请选择”，请指定查询发现的窗口，不会相加或随意选取一个。

余额保留币种，credits 保留小数，“不限量”仅来自上游明确返回；Codex credits 不作为美元余额。未知、无权限、不支持、刷新失败分别显示，不用零代替。DeepSeek 和 OpenCode 认证文件查询需要包含本次适配的 Key Billing v1.5.8 构建。

**刷新与缓存全部由服务器负责。** 卡片每次运行请求接口，不保存本地额度响应，也没有刷新间隔设置或独立过期规则。插件默认缓存 5 分钟，失败后 30 秒允许重试，最多返回 1 小时内的旧快照。卡片显示服务端数据的实际更新时间和缓存／旧快照／异常状态；重复读取缓存不会把更新时间改成现在。组件请求 iOS 约 5 分钟后刷新，实际调度由系统决定。

401 表示 Key 无效或已撤销，403 表示缺少查询权限。更换 Key 后重新查询发现可选项。设置中仅保存可选窗口名称与 ID，不保存额度值。

源码：[`src/scripts/CPAMonitor.tsx`](../../src/scripts/CPAMonitor.tsx)。接口：[Key Billing monitor](https://github.com/zhangyxXyz/CLIProxyAPI-Plugins/blob/dev/plugins/key-billing/docs/monitor.md)。
