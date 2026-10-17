# 验证记录：rc.3 C1 / C2

日期：2026-10-18。本轮实际运行：

```text
node --test adapters/codex/decisions.test.mjs
5 passed, 0 failed

实际调用 src/build.mjs 的 compile(root, ['codex', 'chatgpt'])
生成并重读核对 19 个输出；与改动前基线对照，Markdown 差异只含 C2 单句替换。

node --check adapters/codex/native.test.mjs
语法检查通过。
```

C1 没有新增运行时规则。Taste Main/Sub/Independent 全文、三份完整 Steer、ChatGPT skill、binding 和官方源快照均保持不变。新增测试纳入 native.test 入口；本轮未重跑旧 native 全套、全仓库 npm test、真实客户端安装/信任/事件及模型行为测试。具体断言和范围见 `C1-C2-DECISIONS.md`。

以下保留 rc.2 的历史执行记录；其“两项待确认”已由上述本轮决定取代，历史通过数不累加冒充本轮执行。

---

# 验证记录：原文恢复候选版

日期：2026-10-18；环境：Linux，Node.js 22.16.0。

实际执行：

```text
node --test adapters/codex/native.test.mjs
12 tests passed, 0 failed, 0 skipped

node scripts/build.mjs --target codex --target chatgpt
node scripts/build.mjs --target codex --target chatgpt --check
19 generated files checked

node --check scripts/build.test.mjs
Syntax check passed; the full multi-harness test file was not executed.
```

覆盖：Main/Sub/Independent 连续全文字节保留；12 处历史删改恢复至原位置；原版 Steer 五段/三段/三段及结尾换行保留；不做空白规范化；非空过滤器拒绝；官方片段只出现一次且有正确顺序和标题层级；Sub 不含根角色异步对话；ChatGPT 无 Codex policy 依赖；构建输出路径与原安装入口一致；输出变动能被只读检查发现。

集成部分使用真实 `pluginBundle` 和原版 `hooks/steer.mjs`：临时生成插件文件，在隔离含空格/中文路径启动实际 Node CLI，逐字核对完整提醒 JSON；测试父代理输入、子代理启动、首次重复事件、后续事件、邮箱等待，以及超时/未完成负例。它没有调用 Codex 安装 CLI，没有改动真实 Codex home，也没有证明接收模型看到了这些 JSON。

物化用到的 6 份 Taste 作者文本、官方快照、编译器和 hook/打包支持模块，对照 GitHub 的 blob 标识核对。这是本次来源同步与完整性检查，不是对任务执行增加通用哈希要求。

本地未物化完整的其他宿主，故未运行完整 `npm test`；未把针对性测试说成全仓库 CI。真实 Codex 安装/恢复、Windows launcher、hook 信任、模型实际接收上下文、完整 Sub 角色加载、ChatGPT 注册和模型行为/性能对照均未验证。C1、C2 的语义冲突仍在待确认清单，测试通过不表示它们已解决。
