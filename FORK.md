# Taste + Codex 原生机制：原文保留候选版

本分支继续使用方案Ⅰ：通过 `model_instructions_file` 读取“官方机制摘录 + Taste 正文”，沿用作者安装器。当前是 `codex-native-0.1.0-rc.3` 候选版，不是已验证可直接安装的发布版本。

## 这次纠正了什么

此前 `f2dd633` 的 12 处正文删改和 3 份短提醒不符合完整保留 Taste 的目标，现已撤销。Main/Sub/Independent 的 Taste 部分完整逐字保留，三个事件提醒直接使用原版全文。ChatGPT skill 也不再套用 Codex 的删除过滤器。

官方工具、skill、App、插件、交互与产物机制仍在独立章节中保留，沿用固定 Astra 公开来源。Sub 的产物章节恢复原有标题层级，但不加载主代理对用户的异步提问流程。`binding.md` 仅作运行环境、角色沟通和状态区分的衔接，不冒称官方原文。

完整审计见 [RESTORATION-AUDIT.md](docs/fork/RESTORATION-AUDIT.md)，逐项原删除内容见 [历史删除清单](docs/fork/history/f2dd633-patches.json)，测试范围见 [VALIDATION.md](docs/fork/VALIDATION.md)。

## C1 / C2 已处理

C1 结合 Taste 全文解释为：执行期间及时反馈，内容仍按 Taste 筛选，不逐条播报工具调用。原文没有要求全程沉默，也不只针对跨代理沟通。本次不为 C1 删改提示词或新增规则。

C2 用户选择 B：缺少必要 skill 时，报告受影响的工作，只暂停依赖部分，继续已授权且独立的工作；没有独立工作时才结束当前轮次。官方原始快照不变，仅在生成的 Codex 章节中替换一句。

完整前后原句、中文解释和验证范围见 [C1-C2-DECISIONS.md](docs/fork/C1-C2-DECISIONS.md)。PR 仍为草稿，真实宿主加载和行为效果尚未验证，不据此声称已安装可用。

## 源码与构建

另增 `chatgpt-only` 构建目标：独立的纯技能插件 `gpt-with-taste-chatgpt-only`，复用原 ChatGPT SKILL.md 的完整字节，通过 `products: [CHATGPT]` 排除 Codex 技能发现，让 Codex 继续使用原生 Main 入口。旧 `chatgpt` 产物保留；新旧 ChatGPT 插件不同时启用。构建、产品筛选和云端未验证范围见 [ChatGPT 插件说明](docs/harnesses/chatgpt-only.md)。

`recipe/` 仍是完整上游作者源。`adapters/codex/compose.mjs` 组合官方机制摘录（含用户批准的 C2 单句适配）和 Taste 全文，`patches.json` 只允许空清单；不自动删句或压缩。原版 Steer 不再经过 `steering.json`。`adapters/chatgpt/` 独立生成偏好 skill，未导入 Codex 接口和 hooks。

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
