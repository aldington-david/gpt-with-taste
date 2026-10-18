# ChatGPT 技能插件：与 Codex Main 分开加载

这个额外插件用于 ChatGPT 的技能入口。Codex 继续通过 `model_instructions_file` 加载 Main，新插件的 Taste skill 按产品筛选从 Codex 技能目录中排除。原有 `dist/chatgpt/skills/taste/SKILL.md` 保留，新插件直接复用同一份完整正文，文风、连词、章节和空白均不改写。

## 构建和文件

```sh
node scripts/build.mjs --target chatgpt-only
node scripts/build.mjs --target chatgpt-only --check
node --test adapters/chatgpt-only/chatgpt-only.test.mjs
```

输出在 `dist/chatgpt-only/`：

```text
plugin.json
LICENSE
skills/taste/SKILL.md
skills/taste/agents/openai.yaml
PROVENANCE.md
build-manifest.json
```

插件 ID 为 `gpt-with-taste-chatgpt-only`，版本沿用 `recipe/manifest.json`。根目录 `plugin.json` 使用 Agent Plugins 1.0 格式；这是一个只含技能的插件，不带 MCP、Hook 或安装脚本。构建只生成文件，不安装到账号或本地宿主。

正文仍由 `recipe/main.md` 和原 `adapters/chatgpt/build.mjs` 生成；新增适配器只负责独立插件身份、许可证和产品元数据。维护时修改这两个已有来源，不单独改生成的 SKILL.md。

## 避免重复加载

技能目录中的 `agents/openai.yaml` 声明：

```yaml
policy:
  products: [CHATGPT]
```

当前 Codex 按产品筛选技能，未匹配的技能不会进入其正常技能目录。这适用于 Codex 产品，不依赖它在本地还是云端，也不检测当前是否配置了 `model_instructions_file`。只关闭自动调用的 `allow_implicit_invocation: false` 仍允许显式调用，因此这里不采用它。

用户需要的是原生 Main 与技能入口互斥。对已确认的 Codex 产品，这个筛选直接排除第二个入口；其他复用 Codex 运行时的模式是否支持用户配置 Main，仍需按实际宿主确认。当前没有已验证的通用元数据条件可以表达“凡支持 model_instructions_file 都禁用”。产品筛选也不是防止手动读取或复制文本的文件权限。

原有 `dist/chatgpt/` 没有这个产品筛选，仍按原样保留。使用新插件时，不同时安装或启用旧 ChatGPT 插件；新插件不会撤销旧插件已有的安装或上下文。Codex 原生安装和恢复仍使用原来的入口。

## 上传与更新

需要在账号中试用时，将 `dist/chatgpt-only/` 的内容作为一个插件包提交到个人私有插件入口；归档根目录应直接包含 `plugin.json`，不要打包整个仓库。保存后检查返回的技能诊断、实际 `openai.yaml` 和两端目录：ChatGPT 应能选中 Taste，Codex 应过滤这份技能。开始新聊天验证，已有聊天可能保留先前读过的正文。

本轮只提交源码和生成文件，没有上传账号或安装到日常配置。云端接收及分发尚未验证。本机 plugin-creator 0.1.27 的打包说明列出 `CHAT`，但本机 Codex 0.163.0-alpha.10.2 只接受 `CHATGPT`；直接写 `CHAT` 会使可选元数据被忽略，技能仍可发现。如果账号入口拒绝 `CHATGPT`，保留包和错误结果，先解决该入口与客户端的格式兼容，不要直接改成 `CHAT` 并声称排除已生效。

更新仍从同一源构建并核对生成文件，再更新同一个新插件 ID。停用或卸载该技能插件不撤销 Codex 的 `model_instructions_file`；原生 Main 的恢复按 [Codex 恢复说明](../recovery.md) 进行。

## 验证范围与来源

自动测试覆盖新旧技能逐字一致、独立插件身份、实际产品枚举、许可证、原文特殊空白保留和缺失源文错误。构建检查验证生成文件没有漂移。具体执行结果和本机隔离插件安装及目录扫描见 [验证记录](../fork/VALIDATION.md)。这些检查不代表云端安装或模型行为已经通过。

- [OpenAI 插件打包格式](https://developers.openai.com/plugins/build/plugins)
- [产品枚举及匹配](https://github.com/openai/codex/blob/8c076942cb70fba8e5c4732c23f1faabc4aed484/codex-rs/protocol/src/protocol.rs#L3964-L3996)
- [插件技能的产品筛选调用](https://github.com/openai/codex/blob/8c076942cb70fba8e5c4732c23f1faabc4aed484/codex-rs/core-plugins/src/loader.rs#L1064-L1102)
- [可选元数据解析失败时的处理](https://github.com/openai/codex/blob/8c076942cb70fba8e5c4732c23f1faabc4aed484/codex-rs/ext/skills/src/loader/metadata.rs#L26-L88)
