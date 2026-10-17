# Taste + Codex 原生机制：原文恢复候选版

本分支继续使用方案Ⅰ：通过 `model_instructions_file` 读取“官方机制摘录 + Taste 正文”，沿用作者安装器。当前是 `codex-native-0.1.0-rc.2` 恢复候选版，不是已验证可直接安装的发布版本。

## 这次纠正了什么

此前 `f2dd633` 的 12 处正文删改和 3 份短提醒不符合完整保留 Taste 的目标，现已撤销。Main/Sub/Independent 的 Taste 部分完整逐字保留，三个事件提醒直接使用原版全文。ChatGPT skill 也不再套用 Codex 的删除过滤器。

官方工具、skill、App、插件、交互与产物机制仍在独立章节中保留，沿用固定 Astra 公开来源。Sub 的产物章节恢复原有标题层级，但不加载主代理对用户的异步提问流程。`binding.md` 仅作运行环境、角色沟通和状态区分的衔接，不冒称官方原文。

完整审计见 [RESTORATION-AUDIT.md](docs/fork/RESTORATION-AUDIT.md)，逐项原删除内容见 [历史删除清单](docs/fork/history/f2dd633-patches.json)，测试范围见 [VALIDATION.md](docs/fork/VALIDATION.md)。

## 先确认两处冲突

C1：官方的主代理进度频率与 Taste 的事件式沟通边界。
C2：必要 skill 缺失时停止整个轮次，还是只暂停依赖该 skill 的部分。

双方原文现均保留，没有用“官方优先”一语替用户作出新的取舍。PR 保持草稿；确认并完成实际宿主验收前，不建议用它覆盖日常配置。

## 源码与构建

`recipe/` 仍是完整上游作者源。`adapters/codex/compose.mjs` 组合原样官方摘录和 Taste 全文，`patches.json` 只允许空清单；不自动删句或压缩。原版 Steer 不再经过 `steering.json`。`adapters/chatgpt/` 独立生成偏好 skill，未导入 Codex 接口和 hooks。

```sh
node scripts/build.mjs --target codex --target chatgpt
node scripts/build.mjs --target codex --target chatgpt --check
npm run test:codex-native
```

这些构建和测试不安装到真实 Codex home。完整仓库测试仍用 `npm test`；本轮没有声称全宿主 CI 已通过。

## 安装和恢复没有换入口

以后确认安装时，仍用作者的 `node scripts/install.mjs --hooks` 及对应 `--home`。继续保留原安装 clone 和 `.gpt-with-taste/install-receipt.json`；不要从新 clone 接管一份已有 receipt 的安装。插件名称沿用原版，不与原版同名并排安装。

恢复仍使用同一 clone、同一 home 的 `node scripts/install.mjs --restore`；先用 `--dry-run` 预览。关闭插件只停用 hooks，不撤销 `model_instructions_file`。本轮没有实际安装、恢复、修改权限、信任 hook 或配置子代理角色。

默认安装只复制完整 Sub 文件，不自动为所有自定义角色注册它。生成有 Sub、hook 脚本输出正确、模型实际收到 Sub，是三个不同的验收点。真实客户端事件覆盖与完整上下文仍需检查。

## 来源和更新

Taste 基线：`079fb262b4d7932515ba4e6341fd57b6f2122f4a`。
官方基线：`openai/codex@ce0323f2f2d3b25e82806cd555237da3db4e1897` 的 `gpt-6-astra.model_messages.instructions_template`。

这些是固定公开快照，不是账户实时提示词，也不证明所有模型和客户端都兼容。上游变更只审阅、报告和给建议；不自动合入或安装。后续任何 Taste 原句替换均需逐句列出及用户批准。
