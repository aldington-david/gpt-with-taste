# 候选版验证记录

日期：2026-10-17。环境：Linux，Node.js 22.16.0。

实际执行：`node --test adapters/codex/native.test.mjs`，11 项通过、0 项失败。`node scripts/build.mjs --target codex --target chatgpt` 及同目标 `--check` 通过，生成 19 个文件。

覆盖：官方片段不重复、官方人格不误入、Main/Sub 交互范围、技能/App/插件/Shell/科学图条款、旧 Taste 段落替换、上游修改锚点时停止静默编译、短提醒长度、作者安装入口与 dist 一致、ChatGPT 不加载 Codex API、作者源对象不被修改、确定性构建与只读漂移检查。

本地无法直接克隆远程仓库；相关文件通过已连接 GitHub 读取并建立本地副本。Main、Sub、Independent、三份作者 Steer、原构建代码和原构建测试分别核对了返回的 Git blob 标识，之后再修改。没有用占位作者内容参与本次测试；其他宿主尚未完整物化到本地。

尚未在本地执行完整 `npm test`、全部宿主 build:check、Codex CLI 安装/恢复及 Windows 实机流程。没有进行模型输出对照、真实 hook 接收上下文检查或 ChatGPT 注册。11 项通过不代表上述未执行项目通过。

原有 CI 和跨宿主测试保留，新测试纳入 npm test。旧测试仅调整 Codex 的组合预期和对应 hook 正文，其他客户端仍验证作者文本逐字导出。CI 结果须以 GitHub 当前运行记录为准。本文件记录本地验证，不冒充 CI 通过证明。
