# 验证记录：新增 ChatGPT 专用技能插件

日期：2026-10-18；环境：Windows，Node.js 24.19.0，Codex 0.163.0-alpha.10.2。基线为 PR1 的 `5b041b0cbdc5f694dd39db64cd566094bd6f245b`。

实际执行：

```text
node --test adapters/chatgpt-only/chatgpt-only.test.mjs
2 passed, 0 failed

package.json 中 test 对应的全部命令
Node test runner: 84 passed, 0 failed, 0 skipped
Pi consumer fixture passed
OMP consumer fixture passed

node scripts/build.mjs --check
98 generated files checked
```

上面的 2 项已包含在全套 84 项中，不额外累计。新增构建目标的 6 个产物包含独立 portable manifest、完整技能、产品元数据、许可证与来源记录。新旧 SKILL.md 逐字一致，原 `recipe/`、`prompts/`、`dist/chatgpt/`、`dist/codex/` 和原 ChatGPT 适配器均无改动。

另外使用真实 Codex CLI，在两个临时 home 中分别注册临时 marketplace 并安装同一个生成插件，再通过独立 app-server 的 `skills/list` 读取目录。对照副本只移除 `agents/openai.yaml`；测试产物保留生成文件原样：

| 插件副本 | 安装结果 | Codex 技能目录 |
| --- | --- | --- |
| 对照：无产品限制 | 安装成功，版本 0.1.0 | 包含 `gpt-with-taste-chatgpt-only:taste` |
| 生成产物：`products: [CHATGPT]` | 安装成功，版本 0.1.0 | 不包含该技能 |

这证明本机客户端能安装新格式的插件，并对这份实际产物执行产品筛选。隔离过程没有创建模型任务、调用模型或改动日常 Codex home。没有验证云端账号上传/分发、ChatGPT 调用行为、其他客户端版本、所有能识别 `model_instructions_file` 的宿主或已有聊天的历史上下文；产品筛选不冒充通用能力检测。

新插件的构建、使用、更新与兼容限制见 [ChatGPT 插件说明](../harnesses/chatgpt-only.md)。以下为已有提交的历史记录。

---

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
