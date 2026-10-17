# Taste · Codex 原生机制定制版

候选版本：`codex-native-0.1.0-rc.1`，分支 `codex-native-mechanisms`。继续使用方案Ⅰ：`model_instructions_file` 读取“适用的官方机制片段＋Taste 偏好”，沿用作者安装器。不是追加到官方默认 Main 的方案Ⅱ。

## 修改范围

工具调用、skill 发现与读取、Apps/MCP/插件入口、Shell 转义、权限询问、任务续接、进度频道、本地文件链接和科学图表交付，采用固定版本的 OpenAI 公开 Astra 模板片段。没有导入官方整套人格和写作禁词表。Taste 的目的判断、自然表达、研究方法、视觉质量和协作经验保留。

`adapters/codex/patches.json` 保存被替换的 Taste 原段落。上游改动这些段落后，构建要求重新审阅，不静默删除新内容。未命中这些段落的上游变更仍需人工审阅；构建通过不证明语义完全兼容。

Main、Sub、Independent 共用官方来源。Sub 只加入通用工具与产物格式约定，不加载 Main 面向用户的异步问答流程。原生角色、leaf 状态、工具、权限、并发额度和消息机制仍由 Codex 提供，没有复制成另一套角色配置。主代理仍负责整合和最终验收。

三份 Steer 改为短提醒，不每轮重灌官方机制全文。现有 hook 的事件识别、配对去重、路径、信任与恢复流程没有重写；客户端没有派发的事件仍是限制。

## 来源与适用范围

官方来源：`openai/codex` 提交 `ce0323f2f2d3b25e82806cd555237da3db4e1897` 的 `codex-rs/models-manager/models.json`，`gpt-6-astra.model_messages.instructions_template`。这是批准使用的公开快照，不是当前账户的有效上下文，也不代表所有模型或客户端版本均已适配。

`adapters/codex/official/astra-base.md` 保存解码后的官方原文；选择的章节见 `adapters/codex/upstreams.json`。`binding.md` 是本 fork 编写的适用范围衔接，不冒称 OpenAI 原文。具体 API 仅在当前宿主确实提供时适用，工具 schema 和原生角色/权限仍决定可执行操作。

替换后的 Main 比原 Taste 更长。固定官方快照不会自动随 Codex 升级；未来更新由每日审阅报告提出，再由用户决定。没有经过语言盲测、长期任务成功率或延迟测试。

## 构建与验收

在完整仓库中使用 Node.js 22 或更高版本，不需要给主构建安装 npm 依赖：

```powershell
git clone --branch codex-native-mechanisms --single-branch https://github.com/aldington-david/gpt-with-taste.git taste-codex-native
cd taste-codex-native
node scripts/build.mjs --target codex --target chatgpt --check
npm run test:codex-native
```

完整 CI 保留 `npm run build:check`、`npm test` 和其他宿主的测试；旧测试中“所有宿主逐字输出 recipe”的预期仅为 Codex 改为组合输出，其他宿主仍要求逐字一致。

## 安装与恢复

先在隔离的 Codex home 验收，不要直接覆盖日常配置：

```powershell
node scripts/install.mjs --home "C:/Users/Ken_n/.codex-taste-native-test" --hooks --dry-run
node scripts/install.mjs --home "C:/Users/Ken_n/.codex-taste-native-test" --hooks
node scripts/install.mjs --home "C:/Users/Ken_n/.codex-taste-native-test" --check
```

示例目录用于隔离测试。运行所需的登录、权限和客户端设置仍通过正常流程配置，不复制认证文件。安装不会自动批准 hook；在同一 home 的 Codex 审核信任后，新开会话检查真实指令和事件送达。仅安装检查通过不代表 hook 生效。

保留执行安装的仓库和 `.gpt-with-taste/install-receipt.json`，在同一仓库、同一个 home 恢复：

```powershell
node scripts/install.mjs --restore --home "C:/Users/Ken_n/.codex-taste-native-test" --dry-run
node scripts/install.mjs --restore --home "C:/Users/Ken_n/.codex-taste-native-test"
```

插件 ID 沿用 `gpt-with-taste@gpt-with-taste-local`，不能作为原版之外的另一份同名插件并排启用。已有原版安装时，保留原安装记录并按作者恢复/所有权流程处理，不强行接管另一 clone 的安装。停用插件只停用 hooks，基础指令配置仍在。恢复安装不撤销此前修改的项目代码。

`sub.md` 不会自动配置到全部自定义角色。明确采用时要保留既有角色指令、leaf 状态和权限边界，并检查是否已经继承完整正文，避免重复加载。

## ChatGPT 偏好版

新增 `chatgpt` 目标仅生成 `dist/chatgpt/skills/taste/SKILL.md` 及兼容插件清单，不加入 Codex API、MCP 或本地 hooks。普通 ChatGPT 保留其自己的基础指令、工具和权限。通过支持的插件注册流程使用，不把 ZIP 上传当作所有账户都具备的安装方式，也不要把 Codex Main 当成普通 ChatGPT 的完整系统提示词。本次没有替用户注册插件或安装到日常环境。

其他宿主的作者源、适配器和生成产物保持原样。Codex 特有组合放在其适配层，`recipe/` 仍是跨宿主的作者源，`prompts/` 仍由构建生成。

## 更新与许可证

每日任务只读审阅 Taste 和相关官方机制更新，并评价改动及与本分支的冲突；已报告不等于已合入，不自动同步、提交、安装或信任 hooks。

根目录 MIT 许可证继续适用于 Taste 原作者源与原有代码。导入的 OpenAI 原文采用 Apache-2.0，完整许可证和 NOTICE 位于 `adapters/codex/official/` 及 Codex 发行目录。本 fork 的组合、摘录和衔接调整记录在 `upstreams.json`。这不是 OpenAI 官方发行版。
