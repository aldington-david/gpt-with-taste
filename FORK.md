# Codex 官方机制适配：01–10

本分支从 `master@079fb262b4d7932515ba4e6341fd57b6f2122f4a` 创建，只改变 Codex 适配输出。目标是使用官方的工具、Skill、插件和交互机制，同时保留 Taste 的判断、写作、研究与审美。继续使用原有 `model_instructions_file` 安装入口。

## 本次选择

| 项目 | 实现 |
| --- | --- |
| 01 Skill 发现读取 | 引入官方 `Using skills`，包括触发、读取来源、相对资源和暂停依据 |
| 02 Apps/MCP/插件 | 引入官方 `Apps (Connectors)`、`Plugins`，按实际可用能力发现与调用 |
| 03 工具并行 | 恢复独立工具调用并行、有依赖操作顺序执行的约定 |
| 04 Shell 与文本 | 恢复转义、环境变量、多行正文等具体工具规则 |
| 05 代理角色 | 以运行环境的角色、leaf、工具、模型及权限消息为准，不静态复制角色配置 |
| 06 消息生命周期 | 按实际返回值区分消息、邮箱唤醒和完成；使用宿主等待与通知 |
| 07 授权确认 | Main/Independent 引入官方权限询问；Sub 服从原生父任务与权限消息 |
| 08 追问和压缩 | Main/Independent 引入官方用户交互与任务续接；Sub 保留父任务上下文 |
| 09 进度和交付 | 主代理采用官方频道与更新要求；Sub 通过原生父代理通道报告 |
| 10 格式和可视化 | 引入本地文件链接、Markdown、解释性可视化与科学图表交付规则 |

用户选择保留 **A 的验证策略**，包括 Main/Sub 对非必要哈希的限制；官方 `Rules for getting work done` 只取工具与 Shell 部分，没有引入其后额外的验证政策。**B 的分工与整合验收偏好、C 的人格、语言、写作、科研与视觉质量要求保留。**

本次没有选择 11：三份 Steer 提醒及 Hook 路由逐字保留。基础指令说明运行机制与 Taste 偏好的适用关系，仍需真实多轮任务验证旧提醒下的实际效果。本次没有新增 ChatGPT 构建目标或安装包。

## 文件职责

- `recipe/`：保留上游共享行为源，Claude、Pi、OMP、Kiki、DSH 继续使用原输出。
- `adapters/codex/official/model-instructions.md`：固定版本的公开官方原文存档。
- `adapters/codex/upstream.json`：来源、所选章节和本次范围。
- `adapters/codex/patches.json`：仅列出被替换的原 Taste 机制段落及保留内容；原段落缺失或重复时，构建要求重新审阅。
- `adapters/codex/binding.md`：本 fork 编写的适用范围与角色衔接，**不是官方逐字原文**。
- `adapters/codex/compose.mjs`：组合机制与 Taste，Main/Independent 包含用户交互，Sub 只包含适合其角色的机制。
- `dist/codex/`、`prompts/`：生成文件；三份 Steer 保持原字节。

不直接修改生成的提示词。修改 Codex 适配源后，运行：

```sh
node scripts/build.mjs --target codex
npm run build:check
npm test
```

这组检查验证生成内容、平台隔离、角色范围、保留段落，以及隔离临时目录内的安装器/恢复逻辑。它不启动真实 Codex 安装或修改日常配置。真实 CLI 插件安装测试 `test:codex-plugin` 不属于本次执行范围。

## 来源与维护

官方来源为 [openai/codex@ce0323f2](https://github.com/openai/codex/blob/ce0323f2f2d3b25e82806cd555237da3db4e1897/codex-rs/models-manager/models.json) 中的 `gpt-6-astra.model_messages.instructions_template`。本次核对的所选机制章节与同一提交的 `gpt-6.1-sol` 一致；两个模型的人格差异没有导入。原生角色、审批模式和工具定义仍由运行环境提供。

官方片段使用 Apache-2.0；原文许可与 NOTICE 位于 `adapters/codex/official/`，生成副本位于 `dist/codex/`。Taste 原有 MIT 许可保留。固定版本更新需要重新检查章节、替换段落和输出，不会运行时下载最新版。

相较原 Main，基础指令会变长；Steer 没有缩短，因此不声称节省整个会话的 token。当前是 Codex 适配，不是普通 ChatGPT 网页端系统提示词的替换。

## 验证记录（2026-10-18）

- Windows，Node.js `24.19.0`：`npm test` 的 73 个测试全部通过，随后 Pi、OMP 消费端夹具通过。
- `npm run build:check`：六个现有平台的 88 个生成文件通过。
- 新增的 8 个定向测试覆盖机制组合、Main/Sub 范围、A/B/C 保留、Steer 原样输出、LF/CRLF、原段落变化与重复的拒绝，以及来源/许可副本。
- 与基线比较，其他平台、共享 `recipe/`、Hook 实现与三份 Steer 没有内容变更。
- 生成文本字符数：Main `24,348 → 39,573`；Sub `16,284 → 25,743`；Independent `5,560 → 21,586`。这是文本体积，不是实测 token 消耗。

未运行真实 Codex 插件安装、模型 A/B 或多轮 Hook 注入验收；这些测试结果不代表客户端中的行为效果已经验证。

## PR 与使用范围

本分支用于一个新的 PR，目标为本 fork 的 `master`。现有 PR #1 及其分支不在本次修改范围。不自动合并、不安装、不新增 Hook 信任。

上游 README 的安装命令仍指向上游仓库；它不会安装本 fork 的变更。未来决定试用时，应从本 fork 选定提交使用原安装器，并保留该 checkout 的恢复 receipt。此次只交付源码与 PR。
