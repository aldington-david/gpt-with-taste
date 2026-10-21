# C1 / C2：本次解释与已批准改动

日期：2026-10-18。基于恢复提交 `9cccada904585de84f15aa211cadcc9a16fdcfab`；不更新 Taste 或官方来源版本，不合并、不安装。

## C1：执行反馈及时，内容仍按 Taste；不增加运行时补丁

此前把 Taste 概括成“只在跨代理协调时才发消息”不准确。应结合全文理解：

- `recipe/user-steer.md` 第三段原句：`Necessary execution updates should name an actual action, not preview the writing plan.` 它明确允许必要的执行更新，并约束更新应讲什么。
- `recipe/main.md` 的 `Write for the reader's next action` 末段：`Do ordinary checks without narrating each tool call.` 要求不逐个播报调用，并非禁止执行期间反馈。
- `recipe/independent.md` 开头要求启动任务或改变方向时，用一句话交代目标和下一步，然后执行。它同样不要求全程沉默。
- Main 协作章的 `early coordination message` 处理的是需要接收者提前改变安排的消息，接收者可以是人，也可以是代理。不能把整个 Taste 的沟通原则强制限定为代理之间的交流。

因此，官方选定模板规定的开始提示及持续工作时的反馈频率，与 Taste 选择信息、减少逐条命令播报和空泛回执，可以同时用于同一条进度消息。读文件、执行命令、检索资料、调用 App 等工具工作都属于可能需要反馈的执行工作，不只限于终端。

“测试仍在运行，目前没有新的输出”可以是真实状态反馈；不应为满足时间间隔而编造新进展，也不需要把每条命令、每次重读或每个成功检查单独发给用户。需要提前改变安排的真实阻塞、权限或方向变化及时说明；常规细节合并到有实质内容的更新、工作记录或最终结果中。

Independent 中“常规进度留到最终结果”的孤立字面读法可能显得更严格，但结合其开头的任务启动说明、Main 和 User Steer，合理解释是不要逐条发送常规过程记录，不是扣住所有及时反馈。这里记录的是结合上下文的解释，不冒称作者另有明确声明。

**本次 C1 不改官方或 Taste 原文，不新加 bridge，不修改 `binding.md`，也不缩写或扩写三份 hooks。** 不以解决“冲突”为由增加不必要的指令。原来源的消息时机与内容要求继续一起生效；实际模型执行是否符合这种理解，仍需使用时验证。

## C2：用户明确选择 B，只暂停依赖缺失 skill 的工作

官方存档仍逐字保留。只在 Codex 构建投影的 `Using skills` 章节替换下面一句，Main、Sub、Independent 使用同一处转换。上游句子不存在或出现多次时构建报错，避免错改位置。

### 原句

> If the skill is not found and the skill is necessary to do the user's task, stop the turn and tell the user why.

中文：找不到该 skill，且它是完成用户任务所必需的，就结束当前轮次并向用户说明原因。

### 改后

> If the skill is not found and it is necessary for part of the user's task, report the missing skill and the affected work through your role's permitted communication channel, and pause only the work that depends on it. Continue already-authorized work that is independent of the missing skill. Do not pretend to have used the skill or bypass an explicit requirement to use it. If no independent work remains, end the turn after explaining the blocker and what is needed to resume.

中文：找不到某个 skill，且任务中的一部分必须依赖它时，通过本角色获准的沟通渠道说明缺少什么、哪些工作受阻，只暂停依赖该 skill 的工作。继续已经授权且不依赖它的其他工作。不得假装使用过该 skill，也不得绕过明确的使用要求。如果已经没有可独立推进的工作，说明阻塞及恢复所需条件后结束当前轮次。

保留原段前两句的触发和继续查找要求。此改动不意味着找不到就随便换工具，也不增加权限。子代理通过父代理渠道报告，不因该句改为直接向最终用户发消息。一个任务全部依赖缺失 skill 时仍会停止；多个独立任务中只有一项受阻时，其余项可继续。这些是规则解释，不是模型行为实测结果。

准确代码位置：`adapters/codex/compose.mjs` 的 `missingSkillAdjustment` 与 `officialSection`。这句改后文字属于用户批准的定制适配，不是 OpenAI 原文。普通 ChatGPT 没有导入该 Codex 章节，本次不向其重复注入停止规则。

## 文件和加载链

`official/astra-base.md`（原文不动）→ `officialSection`（仅 C2 一句）→ `compose`（完整 Taste 不动）→ `dist/codex` → `prompts/main.md` / `sub.md` → 原安装入口。

`recipe/*-steer.md` → `dist/codex/*-steer.md` / `prompts/*-steer.md`：逐字不变。打包、hook 路由、去重、信任与恢复实现没有修改。ChatGPT skill 和其它宿主不受 C2 的 Codex 投影影响。

## 本次验证

运行 `node --test adapters/codex/decisions.test.mjs`：5 项通过。实际调用仓库 `compile` 生成并逐文件重读校验 Codex / ChatGPT 的 19 个输出，并与修改前同一编译器的结果比较：所有 Markdown 变动均严格等于 C2 这一句的替换。3 份 Taste 长期正文、3 份提醒、ChatGPT skill、binding 和官方存档均未改动。

新测试已由 `native.test.mjs` 引入；原有官方逐字比较只对 C2 的明确适配调整预期，并补充可逆替换对照，其他原文保留断言未放宽。本轮未再次运行依赖完整物化模块的 native 全套、完整 npm test 或真实宿主测试；只通过 `node --check adapters/codex/native.test.mjs` 做了语法检查。不能将 5 项规则与构建测试说成用户侧60秒消息、实际缺失skill任务或模型接收上下文的实测。

## 来源

- Taste Main：`recipe/main.md`，基线 `NB-Corp/gpt-with-taste@079fb262b4d7932515ba4e6341fd57b6f2122f4a`。
- Taste User Steer：同一基线 `recipe/user-steer.md`。
- Taste Independent：同一基线 `recipe/independent.md`。
- 官方：`openai/codex@ce0323f2f2d3b25e82806cd555237da3db4e1897` 的公开 Astra `model_messages.instructions_template`；仓库存档 `adapters/codex/official/astra-base.md`。
- 本次授权：用户指出 C1 无需理解成排他的消息规则，并明确选择 C2 B。
