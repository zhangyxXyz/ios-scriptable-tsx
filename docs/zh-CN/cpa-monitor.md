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

**本地缓存沿用 DoneHub 策略。** 5 分钟内直接读取本地额度快照；过期后请求接口，网络或服务暂时失败时仍显示最后一次成功的数据，不额外设置旧缓存保留期限。底部以红字显示“使用缓存”或“请求失败/使用缓存”，保留数据的原更新时间；成功请求显示绿色“在线”。设置中的“查询并发现额度项”会主动请求，“清除缓存”可删除本地快照。没有刷新间隔选项；组件请求 iOS 约 5 分钟后刷新，实际调度由系统决定。

缓存按服务地址、Key 与查询条件隔离；更换 Key 会清空旧快照，收到 401／403 时也会清除缓存，避免继续显示已失效权限的数据。额度快照保存于本地，API Key 仍仅保存到 Keychain。401 表示 Key 无效或已撤销，403 表示缺少查询权限。

**远端服务保持不变。** 插件仍使用自己的 5 分钟共享缓存、失败后 30 秒重试间隔和最长 1 小时旧快照策略。本地缓存不会改变服务器的刷新或过期行为。

卡片沿用 DoneHub 的图标、浅色／深色面板、额度条和底部状态样式。套餐来自接口返回；通过现有认证文件只读接口补充时，仅匹配唯一的同类可查询账号，不猜测多账号归属或未报告的套餐。OpenCode 未返回套餐名时按约定显示“GO”，这是缺省展示标签，不代表接口识别出的具体套餐档位；其他服务未返回套餐时显示“套餐未知”。省略“按量付费”标签及其分隔符。DeepSeek 图标与其他服务一样使用 PicGallery 的 GitHub raw 资源。

源码：[`src/scripts/CPAMonitor.tsx`](../../src/scripts/CPAMonitor.tsx)。接口：[Key Billing monitor](https://github.com/zhangyxXyz/CLIProxyAPI-Plugins/blob/dev/plugins/key-billing/docs/monitor.md)。
