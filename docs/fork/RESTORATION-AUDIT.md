# Taste 原文恢复与完整改动审计

审计日期：2026-10-18。上游基线为 `079fb262b4d7932515ba4e6341fd57b6f2122f4a`；被纠正的定制提交为 `f2dd6332e40bf7a9c0fdfdd1af35304ef2588d58`。本次仍采用方案Ⅰ：组合文件通过 `model_instructions_file` 加载。没有改为方案Ⅱ，没有合并 master 或安装到日常配置。

## 结论和证据范围

上一版的 12 处正文过滤、3 份整篇短提醒，以及 ChatGPT 复用 Main 删除过滤器，均扩大了用户要求的机制替换范围。不能把它们称为无损替换。本次先完整恢复原文，再单独保留已选择的官方机制段落。没有对 Taste 进行新的摘要、润色、去重或缩写。

`recipe/main.md`、`sub.md`、`independent.md` 的完整文本，分别作为连续、逐字一致的正文保留在对应 Codex 输出中。三个 Steer 的生成文件与 `recipe/` 原文件字节一致；原有运行脚本仍按上游实现仅移除提醒首尾空白、添加标签。ChatGPT skill 的正文也完整包含原始 Main。

这证明文本没有遗漏，不证明模型在运行时能同时满足所有要求。C1、C2 两项措辞冲突尚未决定，真实客户端和模型效果尚未验证，PR 保持草稿。

## 12 处正文删改：全部撤销

所有改前原文和旧替换值完整保存在 `history/f2dd633-patches.json`；按 main/sub/independent 数组顺序分别对应 M1–M5、S1–S5、I1–I2。该记录只供审计，不进入模型上下文。

| 编号 | 上一版删除/替换内容 | 误删评估 | 本次处置 |
|---|---|---|---|
| M1 | 常规判断、询问条件、阻塞负责人和恢复条件、局部暂停 | 混合了权限机制与任务管理，整段删除不成立 | 原段完整恢复；询问相关冲突单列，不删负责人/恢复条件 |
| M2 | 代理消息、等待、通知、超时、承诺的依赖、安全交接点 | 运行契约有重叠，但承诺履行和交接细节不能随整段消失 | 原段完整恢复，真实工具状态仍由运行环境决定 |
| M3 | 有效证据复用、无关矩阵/全套测试/审查链、非必要哈希及例外 | 明确误删 Taste 的验证偏好；官方适量测试不是全部等价替代 | 原段完整恢复，包括哈希限制和完整性校验例外 |
| M4 | 不逐个播报、实质更新、结果证据、避免道歉循环 | 只有部分汇报时机需协调，不能连文风要求一起删 | 原段完整恢复；C1 待讨论 |
| M5 | 工具遵守实际接口、无额外权限、先读错误、不绕过拒绝 | 具体接口补充有价值，但错误处理与拒绝边界不是多余文字 | 原段完整恢复，官方具体步骤另保留 |
| S1 | 角色/lease/leaf、读写范围、不接管全局验收、不猜授权 | 原生角色层与此互补，删掉全部不是必要替换 | 原段完整恢复，不注册另一套角色 |
| S2 | 子代理证据复用、无用检查/审查链、哈希限制及例外 | 与 M3 相同，属于实质偏好损失 | 原段完整恢复 |
| S3 | 提前协调的触发条件、对象/影响/行动、无变化不发送 | 消息内容和时机偏好，不等于消息 API；主代理进度规则不能直接推广给子代理 | 原段完整恢复；保留父代理渠道范围 |
| S4 | 送达≠阅读/采纳/批准、兑现依赖、超时不转移责任 | 部分被桥接概括，但完整限定不应丢失 | 原段完整恢复 |
| S5 | 从工具/来源混合段中移除前三句，仅保留材料来源保护 | 先读错误、不绕过拒绝不是接口发现步骤的重复 | 恢复整个原段，后半段来源保护不重复添加 |
| I1 | 角色职责、控制者、委派说明、工具参数/状态、恢复信息 | 整段混有重要交接要求，泛化角色桥接不是完整替代 | 原段完整恢复 |
| I2 | 事实行动表达、通知条件、少回执/少审批、真实消费者、后续负责人 | 部分更新频率需协调，其他工作偏好不能一并删除 | 原段完整恢复；C1 待讨论 |

当前 `adapters/codex/patches.json` 的三个数组为空。构建器拒绝非空删除或替换清单；未来确需替换具体句子，应先给用户看完整差异并取得批准，再修改构建规则，不能通过泛化过滤悄悄删文。

## 3 份 Hook 提醒：撤销整篇缩写

| 项目 | 上一版 | 本次 | 影响 |
|---|---|---|---|
| H1 user-steer | 原五段改为一段；丢失常规判断、接口兼容、写作/交付细节 | 原文五段、完整句子和段落顺序恢复 | 恢复每次用户事件上的完整 Taste 强化，不声称 token 更省 |
| H2 sub-steer | 原三段改为一段；缩掉语言区分、修复、交接和消息规则 | 原文三段完整恢复 | 子代理继续获得原有详细提醒 |
| H3 agent-steer | 原三段改为一段；缩掉修复归属、验收契约、语言、来源、交接细节 | 原文三段完整恢复 | 协作结果节点不再只剩概括性的几句话 |

移除 `adapters/codex/steering.json` 这份独立短提醒来源，构建直接输出三份 `recipe/*-steer.md`。移除构建器自设的 2,500 UTF-8 字节上限：该值不是 Codex 文档的约 2,500 token 默认输出阈值。没有修改平台输出限制，没有更改 hook 定义、路由、去重或脚本。

原文长度分别为 4,161 / 2,552 / 2,432 UTF-8 字节。这些是字节数，不是 token 计数，也不证明某个实际客户端永不截断。

## 官方导入部分：逐项复查

固定来源：`openai/codex@ce0323f2f2d3b25e82806cd555237da3db4e1897` 的 `codex-rs/models-manager/models.json`，字段 `gpt-6-astra.model_messages.instructions_template`。原始摘录仍在 `adapters/codex/official/astra-base.md`；本轮没有追进一个新官方版本，也没有导入官方整套人格。

| 编号 | 官方部分 | 本次状态和边界 |
|---|---|---|
| N1 | When to ask the user for permission | 保留 Main/Independent 的完整选定章节；不是授权绕过真实权限。与只读任务的关系以明确授权及真实权限约束为准 |
| N2 | Working with the user：频道、异步提问、追问、压缩、进度 | 保留来源章节完整上下文；固定进度频率的 C1 待用户决定，不通过删 Taste 来规避 |
| N3 | Formatting rules：文件链接、Markdown 渲染 | 保留原文；这些是 Codex 文件展示规则，不导入普通 ChatGPT |
| N4 | Visualizations：科学绘图、独立文件、表格/Mermaid 选择 | 保留原文；Taste 的审美、渲染检查和范围限定也完整保留 |
| N5 | Rules for getting work done：工具并行、转义、变量、测试 | 保留原文；其中测试和说明的偏好不是全都属于底层机制，因此没有再以它们为理由删 Taste 的验证段落 |
| N6 | Using skills：触发、路径、读取、首次告知、缺失处理 | 保留原文；C2 的必要 skill 缺失后停轮次要求需单独决定 |
| N7 | Apps (Connectors) | 保留原文及工具名，仅适用于运行环境实际暴露的接口；没有给其他平台虚构同名 API |
| N8 | Plugins | 保留原文：命名、触发、能力入口和不可用处理；不是直接调用插件名 |

Main/Independent 的官方章节仍按原来源顺序排列。Sub 只保留官方交付和工具部分：交付段落置于原有 `# Working with the user` → `## Final answer` → `### Formatting rules` / `### Visualizations` 标题路径下，再接工具章节。旧版把这两个三级标题放在 `# Plugins` 后面，造成语义上像插件子章节，本次纠正了这个组织问题。没有给 Sub 添加主代理的异步用户提问和固定进度段落。

Taste 的标题、章节顺序、段落和正文均不重组。官方机制与 Taste 正文作为两个可单独核对的来源块组合，不把官方段落伪称 Taste 原句，也不把桥接文字伪称 OpenAI 原文。

## 本 fork 自写桥接及代码：不是官方原文

旧 `binding.md` 的五段也纳入审计。本次仅保留三个明确用途：接口名称须由真实运行环境提供；主/子代理的沟通对象与实际角色限制；发送、邮箱唤醒、完成及超时的状态区别。

移除我额外加的“禁止用轮询脚本或解析 transcript 模拟事件”这一笼统方法禁令。没有用这次恢复给用户新加工具使用禁令。移除重复的审美/科研/验证优先级大段桥接；这些限定恢复到 Taste 原文中。未解决的 C1/C2 写入审计，而不是再追加一条含糊的“官方永远优先”来掩盖。

`compose.mjs` 不再折叠 Taste 空行或 trim Taste 正文，不再做段落替换，不再使用自写短提醒。`preferenceText` 保留接口以便明确检测未经批准的过滤，但只接受空 edits 并逐字返回 source。官方章节仍检查标题存在且唯一，缺失时不会静默退回 Taste-only。

ChatGPT 适配器不再导入 Codex 的 `loadPolicy` 或 `preferenceText`。它在原有 ChatGPT 适用范围说明之后完整放入 `texts.main`，不会因为 Codex 删除表而损失 Taste 内容。没有加入 Codex 专有接口或本地 hook。

## 对前一版全部 36 个变更文件的归类

以下目录分组列全前一版变更文件；没有以生成文件重复数量充当独立功能数量。

- 入口和文档：`FORK.md`、`docs/fork/CHANGES.md`、`docs/fork/VALIDATION.md`。旧完成描述和短提醒结论已改正。
- Codex 适配源：`adapters/codex/build.mjs`、`compose.mjs`、`binding.md`、`patches.json`、`steering.json`、`upstreams.json`、`native.test.mjs`。build 接口保留；其他改动如上，steering.json 删除。
- 官方来源和许可：`adapters/codex/official/astra-base.md`、`LICENSE`、`NOTICE`。不改正文快照与许可来源。
- Codex 生成物：`dist/codex/main.md`、`sub.md`、`independent.md`、`user-steer.md`、`sub-steer.md`、`agent-steer.md`、`UPSTREAMS.json`、`build-manifest.json`、`LICENSE-OpenAI.txt`、`NOTICE-OpenAI.txt`。正文和提醒重建，来源状态更新，许可保持。
- 安装兼容输出：`prompts/main.md`、`sub.md`、`user-steer.md`、`sub-steer.md`、`agent-steer.md`。必须与对应 dist/codex 文件完全一致。
- ChatGPT：`adapters/chatgpt/build.mjs`、`dist/chatgpt/.codex-plugin/plugin.json`、`skills/taste/SKILL.md`、`PROVENANCE.md`、`build-manifest.json`。恢复完整 Main，解除 Codex 过滤器耦合。
- 构建注册与已有测试：`src/build.mjs`、`scripts/build.test.mjs`、`package.json`。宿主目标、测试入口和项目身份不另改；将 build.test 中旧版“替换作者源应失败”的两项断言改为正文逐字保留检查，与不再过滤原文的契约一致。完整全宿主测试未在本轮运行。

原作者 `recipe/` 六份文本，以及原 hook、marketplace、插件打包、安装和恢复实现，都没有因本轮恢复而改动。其他宿主的适配器和生成文本也没有更改。

## 链路检查

| 环节 | 检查方式与结果 | 仍不能推出什么 |
|---|---|---|
| 作者源 → Codex compose | 完整连续字节比较；12 个历史被删段落在原位置；3 个提醒相等 | 文本完整不等于模型遵循度已测 |
| 官方原文 → 选定机制章节 | 标题唯一性、原文完整性、原顺序、Sub 作用范围检查 | 不代表用户账户当前模型目录逐字相同 |
| compose → dist → prompts | 实际执行构建及 --check，19 个生成文件一致 | 不是实际 Codex 配置安装 |
| prompts → 原 pluginBundle | 实际原打包函数生成临时插件，三份文件内容核对 | 未注册真实 marketplace，未批准 hook 信任 |
| 插件文件 → 原 hook CLI JSON | 在隔离路径运行实际 Node CLI，核对完整正文、父子路由、启动去重、后续轮次、邮箱等待及超时负例 | 这是脚本输出，不是接收模型上下文的证据 |
| Codex 安装/恢复/信任/接收模型 | 本轮未执行；这些程序未修改，不能冒充新验证 | 默认安装不会自动把完整 Sub 配到所有角色；原生 followup 的事件覆盖限制未因本轮修复 |
| ChatGPT 生成 → 注册/运行 | 生成与平台隔离已检；注册及真实运行未执行 | 普通 ChatGPT 不因此获得本地 hook 或 Codex API |

## 待用户确认的真实冲突

### C1：固定进度频率与 Taste 的事件式沟通

官方所选正文要求需要工具时先发 commentary，持续工作不超过 60 秒没有更新。Taste Main 反对确认式预告，Independent I2 将常规进度放入最终结果，并把提前通知限于需要改变安排的阻塞/冲突。Sub 的父代理协调不能简单套用主代理对用户的 60 秒规则。

本次保留双方原文，不擅自删改。建议讨论：保留官方要求的主代理进度/首次 skill 使用说明，由 Taste 控制消息内容；将 Taste 的“只有阻塞才提前通知”限定于额外协调消息，而不是取消平台必要进度。是否采用该限定由用户决定。

### C2：缺少必要 skill 时是否结束整个轮次

官方原文要求：如果找不到该 skill 且它是完成用户任务所必需的，停止当前轮次并说明原因。Taste M1 及 Sub 的范围要求则允许真正阻塞的一部分等待，同时继续独立工作。

本次不改成我自选的折中。选项是：A 保留官方“停止整个轮次”；B 只暂停依赖该 skill 的部分、继续已授权且独立的部分，并明确说明缺失。选 B 会改变官方原句的停止行为，必须先获批准。

## 来源

- Taste 原文和许可： https://github.com/NB-Corp/gpt-with-taste/tree/079fb262b4d7932515ba4e6341fd57b6f2122f4a
- 被纠正的定制提交： https://github.com/aldington-david/gpt-with-taste/commit/f2dd6332e40bf7a9c0fdfdd1af35304ef2588d58
- 官方快照： https://github.com/openai/codex/blob/ce0323f2f2d3b25e82806cd555237da3db4e1897/codex-rs/models-manager/models.json
- Hook 输出与信任： https://learn.chatgpt.com/docs/hooks
- 角色配置： https://learn.chatgpt.com/docs/agent-configuration/subagents
