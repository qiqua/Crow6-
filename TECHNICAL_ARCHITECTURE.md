# Crow5 类 AI 编程桌面产品技术架构文档

## 1. 文档目标

本文档用于设计一套类似 Crow5 / Cursor / Windsurf 的 AI 编程桌面产品技术架构。目标不是复制特定产品的私有实现，而是基于公开可见能力，设计一套可落地、可扩展、可商业化的通用 AI 开发工作台架构。

该产品的核心目标是：

- 让用户通过自然语言完成软件开发任务。
- 支持本地项目代码库感知。
- 支持多模型接入与自由切换。
- 支持多智能体协同处理复杂任务。
- 支持可扩展 Skills / 插件 / 工作流市场。
- 支持桌面端、本地运行时与云端服务协同。

---

## 2. 产品定位

本产品定位为 AI Native 软件开发桌面工作台，面向开发者、产品经理、创业团队和企业研发团队。

核心价值：

- 从“写代码”升级为“描述目标”。
- 从“单轮对话”升级为“多智能体任务协作”。
- 从“当前文件补全”升级为“全工程理解”。
- 从“单模型调用”升级为“多模型统一调度”。
- 从“固定功能”升级为“Skills 可扩展生态”。

---

## 3. 总体架构

系统整体分为五层：

1. 桌面客户端层
2. 本地运行时层
3. 代码库感知层
4. 模型与 Agent 编排层
5. 云端服务层

```text
┌──────────────────────────────────────────────┐
│                Desktop Client                 │
│      Electron / Tauri / VS Code Extension     │
│                                              │
│  Chat UI / Agent Console / Diff Review        │
│  File Explorer / Terminal / Skill Manager     │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│              Local Agent Runtime              │
│                                              │
│  Tool Executor / File Tools / Git Tools       │
│  Terminal Runner / Permission Manager         │
│  Patch Applier / Local Task State             │
└───────────────┬──────────────────────┬───────┘
                │                      │
                ▼                      ▼
┌─────────────────────────┐   ┌──────────────────────────┐
│      Code Intelligence   │   │       Model Gateway       │
│                         │   │                          │
│  File Indexer            │   │  OpenAI / DeepSeek        │
│  Symbol Graph            │   │  Claude / Gemini / Qwen   │
│  Vector Store            │   │  Ollama / LM Studio       │
│  Semantic Search         │   │  Local / Cloud Models     │
└─────────────────────────┘   └──────────────┬───────────┘
                                             │
                                             ▼
┌──────────────────────────────────────────────┐
│                 Cloud Backend                 │
│                                              │
│  Auth / User Profile / License / Billing      │
│  Skill Marketplace / Config Sync              │
│  Model Provider Config / Telemetry            │
│  Update Service / Team Workspace              │
└──────────────────────────────────────────────┘
```

---

## 4. 核心模块拆解

### 4.1 桌面客户端

桌面客户端负责与用户交互，是整个产品的主入口。

主要职责：

- 项目目录打开与管理。
- AI 会话界面。
- 多 Agent 任务面板。
- 文件树与代码预览。
- Diff 审查与确认应用。
- 内置终端。
- 模型配置管理。
- Skills 安装与管理。
- 用户登录与授权状态展示。

推荐技术栈：

- Electron + React + TypeScript
- Vite
- TailwindCSS
- shadcn/ui
- Monaco Editor
- xterm.js
- Zustand
- TanStack Query

可替代方案：

- Tauri + React：性能更好，但工程复杂度更高。
- VS Code Extension：开发速度最快，适合先验证 AI 编程助手能力。

---

### 4.2 本地 Agent Runtime

本地运行时负责执行与用户本地环境相关的任务。

主要职责：

- 文件读取与写入。
- 代码搜索。
- Git diff 获取。
- Patch 应用。
- 终端命令执行。
- 项目索引调度。
- 工具权限控制。
- 本地任务状态管理。

所有高风险操作必须经过用户确认。

工具权限建议分级：

| 权限级别 | 工具类型 | 示例 |
| --- | --- | --- |
| 只读 | 安全工具 | 读取文件、搜索代码、查看 Git diff |
| 中风险 | 修改类工具 | 写文件、应用 patch、运行测试命令 |
| 高风险 | 破坏性工具 | 删除目录、安装依赖、执行未知脚本、上传代码 |

推荐原则：

- AI 不直接写入文件，优先生成 patch。
- 用户确认 diff 后再应用修改。
- 命令执行前展示命令内容、工作目录和风险等级。
- 所有工具调用需要记录日志。

---

### 4.3 代码库感知系统

代码库感知是产品智能程度的关键。

目标能力：

- 理解项目结构。
- 支持跨文件问答。
- 定位函数、类、接口、API 定义。
- 找到相关调用链。
- 为 AI 修改代码提供精准上下文。
- 支持大项目的增量索引。

推荐架构：

```text
Project Files
   │
   ▼
File Scanner
   │
   ▼
Ignore Rule Filter
   │
   ├── .gitignore
   ├── node_modules
   ├── dist / build
   └── binary files
   │
   ▼
Parser & Chunker
   │
   ├── tree-sitter AST
   ├── symbol extraction
   ├── import/export graph
   └── semantic chunks
   │
   ▼
Index Store
   │
   ├── SQLite metadata
   ├── Vector database
   └── Symbol graph
   │
   ▼
Retriever
   │
   ├── keyword search
   ├── file search
   ├── symbol search
   └── semantic search
```

推荐技术：

- 文件监听：chokidar
- 忽略规则：ignore
- 关键词搜索：ripgrep
- 代码解析：tree-sitter
- 元数据存储：SQLite
- 向量存储：LanceDB / Qdrant / sqlite-vec
- Embedding 模型：OpenAI Embeddings / BGE / Jina / 本地 embedding 模型

上下文构建优先级：

1. 用户当前选中的代码。
2. 当前打开文件。
3. 最近修改文件。
4. 语义检索命中的代码片段。
5. 关键词搜索命中的代码片段。
6. 项目结构摘要。
7. 历史会话摘要。

---

### 4.4 Model Gateway

Model Gateway 用于统一不同模型供应商的调用方式。

支持目标：

- OpenAI-compatible API
- DeepSeek
- Anthropic Claude
- Google Gemini
- Qwen
- Moonshot
- Ollama
- LM Studio
- vLLM
- 企业私有模型

主要职责：

- 统一 Chat Completion 接口。
- 统一 Streaming 输出。
- 统一工具调用协议。
- 管理模型上下文长度。
- 处理 reasoning 内容。
- 处理重试、限流与超时。
- 统计 token 与成本。
- 支持模型路由与降级。

建议接口抽象：

```ts
interface ChatModel {
  provider: string;
  model: string;
  complete(input: ChatInput): Promise<ChatOutput>;
  stream(input: ChatInput): AsyncIterable<ChatChunk>;
}
```

模型路由策略：

| 任务类型 | 推荐模型策略 |
| --- | --- |
| 快速问答 | 低成本高速模型 |
| 代码生成 | 强代码模型 |
| 架构设计 | 长上下文强推理模型 |
| 多 Agent 汇总 | 高质量推理模型 |
| 本地隐私任务 | Ollama / LM Studio / 私有模型 |

MVP 阶段可以优先使用 LiteLLM 降低适配成本。

---

### 4.5 多智能体编排系统

多 Agent 系统负责处理复杂开发任务。

推荐角色：

| Agent | 职责 |
| --- | --- |
| Planner Agent | 理解需求、拆解任务、制定执行计划 |
| Codebase Agent | 搜索代码、定位相关文件、总结上下文 |
| Engineer Agent | 生成代码修改方案 |
| Reviewer Agent | 审查 diff、发现潜在风险 |
| Tester Agent | 生成测试、运行测试、分析失败原因 |
| Doc Agent | 生成文档、更新 README、补充说明 |
| Orchestrator | 调度所有 Agent、合并结果、管理状态 |

任务状态机：

```text
created
  │
  ▼
planning
  │
  ▼
context_gathering
  │
  ▼
coding
  │
  ▼
reviewing
  │
  ▼
testing
  │
  ▼
waiting_user_approval
  │
  ▼
completed
```

异常状态：

```text
failed
cancelled
blocked
needs_user_input
```

Agent 编排模式：

- 顺序执行：适合简单任务。
- 并行执行：适合搜索、审查、测试等可并行场景。
- 评审回路：Engineer 产出后交给 Reviewer，失败则返回修改。
- 用户确认回路：涉及写文件、运行命令或外部请求时暂停等待用户授权。

---

### 4.6 Skills 系统

Skills 系统用于扩展产品能力，类似插件、工作流或专业 Agent。

Skill 类型：

| 类型 | 描述 |
| --- | --- |
| Prompt Skill | 基于提示词模板的轻量能力 |
| Workflow Skill | 多步骤工作流 |
| Tool Skill | 封装外部 API 或本地脚本 |
| Agent Skill | 专用角色智能体 |
| Enterprise Skill | 团队私有技能 |

Skill Manifest 示例：

```yaml
id: code-review
name: 代码审查
version: 1.0.0
description: 对当前 Git diff 进行代码审查
permissions:
  - read_files
  - read_git_diff
  - run_tests
inputs:
  - repository_path
  - diff
entry:
  type: prompt_workflow
  file: skill.md
```

本地目录结构：

```text
skills/
  code-review/
    skill.yaml
    skill.md
  generate-tests/
    skill.yaml
    skill.md
  setup-deploy/
    skill.yaml
    skill.md
```

云端市场能力：

- Skill 搜索。
- Skill 安装。
- Skill 更新。
- 版本管理。
- 权限声明。
- 团队私有 Skill。
- 评分与使用统计。

---

## 5. 云端服务设计

云端服务不应承载用户本地源码，除非企业用户明确开启代码同步或云端索引。

核心服务：

- 用户认证服务。
- 设备授权服务。
- 订阅与计费服务。
- Skill Marketplace。
- 模型配置同步。
- 用户偏好同步。
- 自动更新服务。
- 遥测与错误上报。

推荐后端技术：

- API：NestJS / FastAPI
- 数据库：PostgreSQL
- 缓存：Redis
- 队列：BullMQ / Celery
- 对象存储：S3 / Cloudflare R2 / MinIO
- 日志：OpenTelemetry
- 错误监控：Sentry
- 部署：Docker + Kubernetes / Railway / Render / Fly.io

核心数据表：

```text
users
teams
devices
sessions
subscriptions
model_providers
user_model_configs
skills
skill_versions
skill_installs
agent_runs
tool_calls
conversations
usage_logs
```

---

## 6. 数据流设计

### 6.1 AI 修改代码流程

```text
用户输入需求
  │
  ▼
Planner 拆解任务
  │
  ▼
Codebase Agent 检索相关上下文
  │
  ▼
Engineer Agent 生成 patch
  │
  ▼
Reviewer Agent 审查 patch
  │
  ▼
桌面端展示 diff
  │
  ▼
用户确认
  │
  ▼
本地 Runtime 应用 patch
  │
  ▼
Tester Agent 建议或运行测试
  │
  ▼
输出最终结果
```

### 6.2 代码问答流程

```text
用户提问
  │
  ▼
查询意图识别
  │
  ▼
关键词搜索 + 语义搜索 + 符号搜索
  │
  ▼
上下文排序与裁剪
  │
  ▼
LLM 生成答案
  │
  ▼
附带引用文件与行号
```

### 6.3 Skill 安装流程

```text
用户打开 Skill 市场
  │
  ▼
查询云端 Skill Registry
  │
  ▼
查看 Skill 权限与说明
  │
  ▼
用户确认安装
  │
  ▼
下载 Skill Manifest 与内容
  │
  ▼
写入本地 Skills 目录
  │
  ▼
注册到 Agent Runtime
```

---

## 7. 安全与权限设计

必须遵守的安全原则：

- 默认不上传用户源码。
- 默认不执行高风险命令。
- 默认不自动安装依赖。
- 默认不删除文件。
- 所有写操作必须可审查、可撤销。
- 所有模型请求应明确是否包含代码上下文。
- 企业版本应支持完全本地模型和私有部署。

权限控制建议：

```text
Tool Request
  │
  ▼
Risk Classifier
  │
  ├── low: auto allow
  ├── medium: require confirmation
  └── high: require explicit confirmation + warning
  │
  ▼
Audit Log
```

敏感信息保护：

- 检测 `.env`、密钥、token、证书文件。
- 模型请求前做敏感信息脱敏。
- 支持用户配置禁止发送的文件路径。
- 支持本地模型优先策略。
- 支持企业审计日志。

---

## 8. MVP 实施路线

### V0.1：基础 AI 编程助手

目标：完成可用的本地 AI 编程助手。

功能：

- 打开本地项目。
- 文件树展示。
- AI 聊天。
- 读取文件。
- 搜索代码。
- 生成修改建议。
- 支持 OpenAI-compatible 模型。

建议周期：2-4 周。

---

### V0.2：Diff 与安全写入

目标：让 AI 能安全修改代码。

功能：

- 生成 patch。
- Diff 预览。
- 用户确认应用。
- Git diff 审查。
- 命令执行确认。
- 基础任务日志。

建议周期：2-3 周。

---

### V0.3：代码库索引

目标：提升代码理解能力。

功能：

- 项目文件索引。
- 增量文件监听。
- 关键词搜索。
- 语义搜索。
- 代码 chunk。
- 上下文构建器。

建议周期：3-5 周。

---

### V0.4：多 Agent 任务系统

目标：从聊天升级为任务协作。

功能：

- Planner Agent。
- Codebase Agent。
- Engineer Agent。
- Reviewer Agent。
- Tester Agent。
- Agent 执行面板。
- 任务状态机。

建议周期：4-6 周。

---

### V0.5：Skills 本地系统

目标：支持能力扩展。

功能：

- 本地 Skill Manifest。
- Skill 安装与卸载。
- Prompt Skill。
- Workflow Skill。
- Skill 权限声明。

建议周期：3-4 周。

---

### V1.0：云端系统与商业化

目标：形成可发布产品。

功能：

- 用户登录。
- 设备授权。
- 模型配置同步。
- Skill Marketplace。
- 自动更新。
- 订阅计费。
- 错误监控。
- 企业私有化基础能力。

建议周期：8-12 周。

---

## 9. 推荐项目结构

```text
apps/
  desktop/
    src/
      renderer/
      main/
      preload/
  web/
    src/
  api/
    src/

packages/
  agent-runtime/
  model-gateway/
  code-indexer/
  skill-runtime/
  shared/
  ui/

skills/
  code-review/
  generate-tests/

docs/
  architecture.md
  security.md
  agent-system.md
  skill-system.md
```

如果使用 monorepo，推荐：

- pnpm workspace
- Turborepo
- TypeScript
- ESLint
- Prettier

---

## 10. 优先技术选型

| 模块 | 推荐技术 |
| --- | --- |
| 桌面端 | Electron + React + TypeScript |
| UI | TailwindCSS + shadcn/ui |
| 编辑器 | Monaco Editor |
| 终端 | xterm.js |
| 本地服务 | Node.js |
| 文件监听 | chokidar |
| 搜索 | ripgrep |
| 代码解析 | tree-sitter |
| Git | simple-git |
| 本地数据库 | SQLite |
| 向量库 | LanceDB / sqlite-vec / Qdrant |
| 模型网关 | LiteLLM 或自研 Adapter |
| 后端 API | NestJS / FastAPI |
| 云端数据库 | PostgreSQL |
| 缓存队列 | Redis + BullMQ |
| 对象存储 | S3 / R2 / MinIO |

---

## 11. 关键风险

### 11.1 上下文质量不足

风险：AI 找不到正确代码，导致回答不准确。

应对：

- 同时使用关键词搜索、语义搜索和符号搜索。
- 检索结果必须带文件路径和行号。
- 对上下文做 rerank。

### 11.2 AI 自动修改代码风险

风险：错误修改、删除文件、破坏项目。

应对：

- 只允许 patch 模式写入。
- 所有 diff 用户确认。
- 提供撤销能力。
- 使用 Git 快照保护。

### 11.3 多模型接口差异

风险：不同模型工具调用、流式输出格式不同。

应对：

- 建立统一 Model Gateway。
- 所有模型输出转换为内部标准格式。
- 对每个 provider 建立适配器测试。

### 11.4 多 Agent 成本和延迟过高

风险：多个 Agent 并发调用模型导致成本高、响应慢。

应对：

- 简单任务走单 Agent。
- 复杂任务才启用多 Agent。
- 支持用户选择“快速 / 标准 / 深度”模式。
- 复用上下文摘要和中间结果。

### 11.5 用户源码隐私

风险：源码被发送到外部模型。

应对：

- 明确提示模型请求内容。
- 支持本地模型模式。
- 支持敏感文件排除。
- 企业版支持私有部署。

---

## 12. 成功指标

产品层指标：

- 新用户首次成功完成 AI 修改代码的比例。
- 单任务平均完成时间。
- AI 修改后用户接受 diff 的比例。
- 代码问答命中文件准确率。
- 多 Agent 任务成功率。
- Skill 安装与使用频率。

工程层指标：

- 索引耗时。
- 检索延迟。
- 模型首 token 时间。
- patch 应用成功率。
- 工具调用失败率。
- 崩溃率。
- 内存占用。

---

## 13. 推荐落地顺序

最推荐的起步方式：

1. 先做 Electron 桌面端骨架。
2. 接入一个 OpenAI-compatible 模型。
3. 实现文件读取、代码搜索、AI 问答。
4. 实现 patch 生成、diff 预览和用户确认应用。
5. 加入本地代码索引和语义搜索。
6. 再引入多 Agent 状态机。
7. 最后做 Skills 市场和云端商业化能力。

不要一开始就做完整平台。先验证“AI 能否稳定理解并修改本地项目”这个核心闭环。

---

## 14. 结论

一款 Crow5 类 AI 编程桌面产品的本质是：

```text
桌面 IDE 体验
  + 本地代码库感知
  + 多模型网关
  + Agent 编排系统
  + 安全工具调用
  + Skills 扩展生态
  + 云端账号与市场服务
```

MVP 的关键不是做很多功能，而是打通以下闭环：

```text
用户描述需求
  → AI 理解项目
  → AI 生成修改
  → 用户审查 diff
  → 安全应用代码
  → 测试验证结果
```

只要这个闭环稳定，就可以逐步扩展为多 Agent、Skills、模型生态和商业化平台。
