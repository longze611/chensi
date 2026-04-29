# Thinking 启发式想法迭代平台开发文档 v3.0

## 1. 项目定位重构

## 1.1 新定位

**Thinking** 不再定位为“计划管理平台”，而是一个：

> 通过 AI 提问、建议和动态文档更新，引导用户不断完善想法的启发式想法迭代平台。

用户不需要一开始就有清晰计划，也不需要自己整理复杂结构。用户只需要输入一个原始想法，平台会帮助用户：

1. 轻微润色并补全原始想法。
2. 生成想法简要概述文档。
3. 生成详细想法动态更新文档。
4. 识别想法中的模糊点、不确定流程和缺失细节。
5. 以问题清单形式逐步询问用户。
6. 为每个问题清单生成对应的建议清单。
7. 用户可以回答、忽略、采纳建议、忽略建议，或自由补充想法。
8. Agent 根据用户反馈持续更新两份文档。
9. 想法在一轮轮问答与建议中逐渐变得清晰、完整、可表达。

核心不是“管理任务”，而是：

```text
原始想法 → AI 轻整理 → AI 提问与建议 → 用户反馈 → 文档更新 → 再提问 → 再更新 → 想法逐渐成熟
```

---

## 1.2 产品核心价值

Thinking 的价值不是替用户做计划，而是帮助用户把一个模糊念头变成更清晰、更完整、更有深度的想法。

它适合：

- 产品创意
- 科研想法
- 小说设定
- 艺术创作
- 商业点子
- 活动策划
- 论文选题
- 学习方案
- 个人项目
- 任何尚未成形的想法

Thinking 的工作方式像一个温和但有洞察力的思维伙伴：

- 它不急着给结论。
- 它先帮用户澄清问题。
- 它用问题引导用户思考。
- 它用建议启发用户扩展。
- 它把每轮反馈整理回文档。
- 它让想法自然生长。

---

## 1.3 和旧版本定位的区别

| 维度 | 旧版本 | 新版本 |
|---|---|---|
| 核心目标 | 生成计划、管理进度 | 启发用户、完善想法 |
| 用户操作 | 创建想法、设置完成细度、查看计划 | 输入想法、回答问题、采纳建议、补充想法 |
| Agent 作用 | 拆解计划、每日推进 | 提问、建议、整合、更新文档 |
| 主要页面 | 项目详情、计划、进度 | 想法栏、简要文档、动态文档、问题清单、建议清单 |
| 结果形态 | 任务计划 | 不断进化的想法文档 |
| 产品气质 | 轻项目管理 | 纸张感、思考感、启发式创作空间 |

---

# 2. 产品核心闭环

## 2.1 主闭环

```text
用户输入原始想法
    ↓
AI 轻微补全、润色、去病句
    ↓
生成初步想法
    ↓
生成两份文档
    ├── 想法简要概述文档
    └── 详细想法动态更新文档
    ↓
AI 阅读当前想法和文档
    ↓
生成问题清单 + 建议清单
    ↓
用户回答/忽略问题，采纳/忽略建议，补充自由想法
    ↓
Agent 整合本轮输入
    ↓
更新简要概述文档和详细动态文档
    ↓
进入下一轮问题与建议
```

---

## 2.2 两阶段问题机制

Thinking 的问题清单分为两个阶段。

### 阶段一：流程级问题清单

目标：帮助用户把想法的大流程、大结构、大逻辑讲清楚。

适合询问：

- 这个想法的起点是什么？
- 目标用户是谁？
- 整体流程怎么发生？
- 关键环节有哪些？
- 目前最模糊的部分在哪里？
- 想法最终希望呈现成什么？
- 哪些部分是必须有的？
- 哪些部分只是可能存在？

例如用户输入：

> 我想做一个平台，帮助用户完善自己的想法。

流程级问题可能是：

1. 用户进入平台后的第一个动作是什么？
2. AI 是先直接生成文档，还是先询问用户？
3. 用户回答问题后，文档应该自动更新还是等待确认？
4. 想法完善到什么程度算一轮结束？
5. 用户是否能回看每一轮想法变化？

---

### 阶段二：任务/模块级问题清单

目标：在流程明确后，深入每个流程环节、模块或任务，帮助用户补充细节。

适合询问：

- 每个模块具体如何工作？
- 每个角色的输入输出是什么？
- 每个步骤的判断标准是什么？
- 每个功能的边界是什么？
- 哪些交互需要用户确认？
- 哪些内容可以自动更新？
- 失败时如何处理？

例如流程里有一个模块：

> AI 生成问题清单。

模块级问题可能是：

1. 问题清单一次最多展示几个问题？
2. 问题是否需要按重要性排序？
3. 每个问题是否需要解释为什么要问？
4. 用户忽略问题后，AI 是否以后还会再次询问？
5. 问题是否需要分为“必须回答”和“可选回答”？

---

## 2.3 问题清单与建议清单的关系

每一轮问题清单都有对应的建议清单。

### 问题清单

问题清单负责“向用户要信息”。

每个问题包含：

- 问题标题
- 问题说明
- 为什么问这个问题
- 回答框
- 忽略按钮
- 重要性
- 所属阶段
- 关联的文档位置

### 建议清单

建议清单负责“给用户启发”。

建议不是替用户做决定，而是提供多角度参考。

每条建议包含：

- 建议内容
- 建议理由
- 适用条件
- 可能带来的影响
- 采纳按钮
- 忽略按钮
- 可选修改说明
- 关联问题

### 关系示例

问题：

> 用户回答完一个问题后，文档是否应该自动更新？

对应建议：

> 建议采用“自动生成更新草案 + 用户确认应用”的方式。这样既能保持 AI 的主动性，又不会让用户担心文档被未经允许地修改。

---

# 3. 页面结构设计

## 3.1 总体页面布局

Thinking 的核心页面采用三栏式布局：

```text
┌─────────────────────────────────────────────────────────────┐
│ 顶部极简导航栏                                                │
├───────────────┬───────────────────────┬─────────────────────┤
│ 左侧想法栏     │ 中间文档区              │ 右侧启发区           │
│ Idea Shelf    │ Documents              │ Questions/Suggestions│
│               │                       │                     │
│ - 想法列表     │ - 简要概述文档           │ - 问题清单            │
│ - 当前想法     │ - 详细动态文档           │ - 建议清单            │
│ - 翻页纸张感   │ - 版本更新痕迹           │ - 自由补充输入        │
└───────────────┴───────────────────────┴─────────────────────┘
```

也可以在窄屏下变成：

```text
顶部导航
当前想法
文档 Tabs
问题/建议 Tabs
```

---

## 3.2 左侧：想法栏 Idea Shelf

左侧是用户所有想法的入口。

设计要求：

- 像翻阅纸张一样浏览想法。
- 简约，不像数据库列表。
- 每条想法像一张小纸片。
- 当前选中的想法像被轻轻抽出来。

### 左侧想法卡片内容

每条想法展示：

- AI 生成标题
- 一句话简介
- 最近更新时间
- 当前迭代轮次
- 文档成熟度
- 是否有待回答问题

### 翻阅纸张效果

交互建议：

1. 鼠标 hover 时纸片轻微上浮。
2. 当前想法纸片略微向右滑出 4px。
3. 切换想法时，旧纸片轻微淡出，新纸片像纸张翻页一样进入。
4. 左侧背景可以使用接近纸张的米白色。
5. 不使用强边框，用阴影和层叠感表现纸张。

### 纸张式动效实现建议

可使用 Framer Motion：

```ts
const paperSwitch = {
  initial: { opacity: 0, x: -12, rotate: -0.5 },
  animate: { opacity: 1, x: 0, rotate: 0 },
  exit: { opacity: 0, x: 12, rotate: 0.5 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
};
```

---

## 3.3 中间：文档区 Documents

中间是 Thinking 的核心结果区域。

包含两个文档：

1. **想法简要概述文档**
2. **详细想法动态更新文档**

建议使用上下分区或 Tabs。

第一版推荐上下分区：

```text
中间文档区
├── 简要概述文档 Brief Document
└── 详细动态文档 Living Document
```

原因：

- 用户可以同时看到概览和细节。
- 便于感知 AI 每轮更新。
- 比 Tab 更有“文档桌面”感。

---

## 3.4 简要概述文档 Brief Document

简要文档用于快速说明这个想法当前是什么。

它应保持短、清楚、稳定。

内容结构：

```markdown
# 想法标题

## 一句话概述

## 当前核心想法

## 适用领域

## 目前已明确的内容

## 目前仍不确定的内容

## 下一轮最值得澄清的问题
```

Agent 每轮可以更新，但要克制，避免变成长文。

---

## 3.5 详细想法动态更新文档 Living Document

详细文档是想法不断进化的主文档。

它不是任务计划，而是“当前最完整的想法版本”。

内容结构根据领域可变，但通用结构如下：

```markdown
# 详细想法文档

## 1. 想法背景

## 2. 核心概念

## 3. 目标与价值

## 4. 当前流程/结构

## 5. 关键模块/组成部分

## 6. 用户或受众

## 7. 已确认设定

## 8. 待确认设定

## 9. AI 建议但尚未确认的方向

## 10. 迭代记录
```

对于不同领域，详细文档可调整：

### 软件/产品想法

- 产品定位
- 用户流程
- 核心功能
- 交互机制
- 数据对象
- 待确认边界

### 小说/故事想法

- 故事设定
- 世界观规则
- 人物关系
- 核心冲突
- 情节走向
- 待确认悬念

### 艺术创作想法

- 创作主题
- 视觉语言
- 材料媒介
- 情绪氛围
- 展示方式
- 待确认表达重点

### 科研想法

- 研究问题
- 假设
- 方法思路
- 数据/实验
- 评价方式
- 待确认变量

---

## 3.6 右侧：启发区 Inspiration Panel

右侧是 Thinking 的交互核心。

包含：

1. 问题清单
2. 建议清单
3. 自由补充输入框
4. 本轮提交按钮

推荐结构：

```text
右侧启发区
├── 当前阶段：流程级澄清 / 模块级深入
├── 问题清单
│   ├── 问题 1 + 回答框 + 忽略
│   ├── 问题 2 + 回答框 + 忽略
│   └── ...
├── 建议清单
│   ├── 建议 1 + 采纳 + 忽略
│   ├── 建议 2 + 采纳 + 忽略
│   └── ...
├── 自由补充想法输入框
└── 提交本轮反馈
```

---

# 4. 核心数据对象

## 4.1 Idea

Idea 是原始想法实体。

```ts
interface Idea {
  id: string;
  userId: string;

  rawInput: string;
  refinedIdea: string;

  title: string;
  briefSummary: string;
  domain: IdeaDomain;
  tags: string[];

  currentPhase: "process_clarification" | "task_deepening" | "free_iteration";
  maturityLevel: "seed" | "rough" | "structured" | "deepening" | "mature";
  iterationCount: number;

  createdAt: string;
  updatedAt: string;
}
```

---

## 4.2 IdeaDocument

两类文档都使用同一个表或模型。

```ts
interface IdeaDocument {
  id: string;
  ideaId: string;
  type: "brief" | "living";
  title: string;
  contentMarkdown: string;
  version: number;
  lastUpdatedBy: "agent" | "user";
  createdAt: string;
  updatedAt: string;
}
```

---

## 4.3 IterationRound

每一轮问题、建议、用户反馈和文档更新都属于一个迭代轮次。

```ts
interface IterationRound {
  id: string;
  ideaId: string;
  roundNumber: number;
  phase: "process_clarification" | "task_deepening" | "free_iteration";
  status: "open" | "submitted" | "processed" | "archived";

  agentFocus: string;
  summaryBefore: string;
  summaryAfter?: string;

  createdAt: string;
  submittedAt?: string;
  processedAt?: string;
}
```

---

## 4.4 QuestionItem

```ts
interface QuestionItem {
  id: string;
  roundId: string;
  ideaId: string;

  stage: "process" | "task";
  relatedSection?: string;
  relatedTaskOrModule?: string;

  question: string;
  explanation: string;
  whyItMatters: string;
  priority: "high" | "medium" | "low";

  answer?: string;
  status: "pending" | "answered" | "ignored";

  createdAt: string;
  updatedAt: string;
}
```

---

## 4.5 SuggestionItem

```ts
interface SuggestionItem {
  id: string;
  roundId: string;
  ideaId: string;

  relatedQuestionId?: string;
  relatedSection?: string;

  suggestion: string;
  rationale: string;
  expectedImpact: string;
  possibleRisk?: string;
  adoptionText?: string;

  status: "pending" | "adopted" | "ignored";

  createdAt: string;
  updatedAt: string;
}
```

---

## 4.6 FreeThoughtInput

用户每轮可以自由补充额外想法。

```ts
interface FreeThoughtInput {
  id: string;
  roundId: string;
  ideaId: string;
  content: string;
  createdAt: string;
}
```

---

## 4.7 DocumentRevision

用于记录每轮文档变化。

```ts
interface DocumentRevision {
  id: string;
  ideaId: string;
  documentId: string;
  roundId: string;
  versionBefore: number;
  versionAfter: number;

  changeSummary: string;
  diff?: string;
  createdAt: string;
}
```

---

# 5. Agent 工作流总览

## 5.1 多 Agent 架构

Thinking 建议使用多个职责清晰的 Agent，但不一定要真正并发执行。第一版可以由一个后端 Orchestrator 串行调用不同 Prompt。

```text
ThinkingOrchestrator
├── IdeaRefinementAgent
├── DocumentInitializationAgent
├── AmbiguityAnalysisAgent
├── QuestionGenerationAgent
├── SuggestionGenerationAgent
├── UserFeedbackIntegratorAgent
├── DocumentUpdateAgent
├── PhaseDecisionAgent
└── QualityReviewAgent
```

---

## 5.2 各 Agent 职责

| Agent | 职责 |
|---|---|
| IdeaRefinementAgent | 轻微润色原始想法，修改病句，形成初步想法 |
| DocumentInitializationAgent | 生成初始简要文档和详细动态文档 |
| AmbiguityAnalysisAgent | 分析当前想法中哪些地方模糊、不确定、缺失 |
| QuestionGenerationAgent | 基于模糊点生成问题清单 |
| SuggestionGenerationAgent | 基于当前问题与想法生成建议清单 |
| UserFeedbackIntegratorAgent | 整理用户回答、忽略、采纳建议、自由补充 |
| DocumentUpdateAgent | 更新简要概述文档和详细动态文档 |
| PhaseDecisionAgent | 判断下一轮是流程级澄清还是模块级深入 |
| QualityReviewAgent | 检查问题质量、建议质量、文档更新质量 |

---

## 5.3 初次创建想法工作流

```text
用户提交 rawInput
    ↓
IdeaRefinementAgent
    输出 refinedIdea/title/domain/tags
    ↓
DocumentInitializationAgent
    输出 briefDocument + livingDocument
    ↓
AmbiguityAnalysisAgent
    输出 ambiguityMap
    ↓
QuestionGenerationAgent
    输出 process-level question list
    ↓
SuggestionGenerationAgent
    输出 suggestion list
    ↓
QualityReviewAgent
    检查问题和建议是否清晰、不过多、不越界
    ↓
保存 Idea + Documents + Round + Questions + Suggestions
    ↓
前端展示
```

---

## 5.4 每轮迭代工作流

```text
用户回答问题 / 忽略问题 / 采纳建议 / 忽略建议 / 自由补充
    ↓
UserFeedbackIntegratorAgent
    整理本轮有效输入
    ↓
DocumentUpdateAgent
    更新 briefDocument + livingDocument
    ↓
PhaseDecisionAgent
    判断下一阶段
    ↓
AmbiguityAnalysisAgent
    分析更新后的想法还有哪些模糊点
    ↓
QuestionGenerationAgent
    生成下一轮问题清单
    ↓
SuggestionGenerationAgent
    生成下一轮建议清单
    ↓
QualityReviewAgent
    检查质量
    ↓
保存文档新版本 + 新一轮 round
    ↓
前端刷新
```

---

# 6. Agent 工作流详细设计

## 6.1 IdeaRefinementAgent

### 目标

对用户输入的原始想法进行轻微补全和语言整理。

### 非目标

不能大幅改写用户想法。
不能替用户加入过多未经确认的新内容。
不能把模糊想法强行变成完整方案。

### 输入

```json
{
  "rawInput": "用户输入的原始想法"
}
```

### 输出

```json
{
  "title": "自动生成的短标题",
  "refinedIdea": "轻微润色后的初步想法",
  "briefSummary": "一句话概述",
  "domain": "software_product | fiction | art | research | business | learning | other",
  "tags": ["标签1", "标签2"],
  "preservedUserIntent": "保留的用户原意说明",
  "assumptions": ["AI 做出的轻微假设"]
}
```

### Prompt

```text
你是 Thinking 平台中的 IdeaRefinementAgent。

你的任务是对用户输入的原始想法进行轻微整理，而不是替用户重新创作。

你需要：
1. 修正明显病句和表达不通顺的地方。
2. 保留用户原始意图和语气。
3. 在不改变核心含义的前提下，让想法更清楚。
4. 生成一个简短标题。
5. 生成一句话概述。
6. 判断想法大致属于哪个领域。
7. 给出 3-6 个标签。
8. 如果你补充了用户没有明确说的信息，必须放在 assumptions 中。

你不能：
1. 大幅扩写。
2. 把不确定内容写成确定事实。
3. 直接生成完整计划。
4. 批判用户想法。
5. 改变用户想法方向。

输出必须是 JSON，字段为：
{
  "title": string,
  "refinedIdea": string,
  "briefSummary": string,
  "domain": string,
  "tags": string[],
  "preservedUserIntent": string,
  "assumptions": string[]
}

用户原始想法：
{{rawInput}}
```

---

## 6.2 DocumentInitializationAgent

### 目标

根据初步想法生成两份初始文档。

### 输入

```json
{
  "refinedIdea": "初步想法",
  "title": "标题",
  "domain": "领域",
  "tags": []
}
```

### 输出

```json
{
  "briefDocumentMarkdown": "简要概述文档",
  "livingDocumentMarkdown": "详细动态文档",
  "initialOpenQuestions": ["初始开放问题"]
}
```

### Prompt

```text
你是 Thinking 平台中的 DocumentInitializationAgent。

你的任务是根据一个仍然不完整的初步想法，生成两份初始文档：
1. 想法简要概述文档
2. 详细想法动态更新文档

请注意：
这些文档不是最终方案，而是“当前版本的想法记录”。
如果某些信息用户没有提供，不要编造，要写入“待确认”或“暂不明确”。

简要概述文档应该短、清楚，方便用户快速理解当前想法。
详细动态文档应该更完整，能够承接后续迭代更新。

请根据领域调整文档结构：
- 软件/产品：关注用户、流程、功能、交互、边界。
- 小说/故事：关注设定、人物、冲突、世界观、情节。
- 艺术创作：关注主题、媒介、视觉语言、材料、展示方式。
- 科研：关注问题、假设、方法、数据、实验、评价。
- 商业：关注用户痛点、价值、市场、模式、风险。
- 学习：关注目标、当前水平、资料、阶段、检测。
- 其他：使用通用想法结构。

输出 JSON：
{
  "briefDocumentMarkdown": string,
  "livingDocumentMarkdown": string,
  "initialOpenQuestions": string[]
}

输入：
标题：{{title}}
领域：{{domain}}
标签：{{tags}}
初步想法：{{refinedIdea}}
```

---

## 6.3 AmbiguityAnalysisAgent

### 目标

识别当前想法中最值得澄清的模糊点。

这是 Thinking 的核心 Agent 之一。它决定下一轮问什么。

### 分析维度

AmbiguityAnalysisAgent 应从以下维度分析：

1. **流程不确定性**：整体流程是否清楚？
2. **角色不确定性**：涉及哪些用户/角色/对象？
3. **目标不确定性**：想法最终要达到什么？
4. **边界不确定性**：做什么，不做什么？
5. **机制不确定性**：关键机制如何工作？
6. **内容不确定性**：设定、材料、数据、内容是否缺失？
7. **交互不确定性**：用户如何参与？
8. **判断标准不确定性**：怎样算完成、有效、好？

### 输出

```json
{
  "ambiguities": [
    {
      "id": "amb_1",
      "type": "process | role | goal | boundary | mechanism | content | interaction | evaluation",
      "description": "模糊点描述",
      "whyItMatters": "为什么重要",
      "priority": "high | medium | low",
      "suggestedQuestionDirection": "应该从什么角度提问",
      "relatedSection": "相关文档章节"
    }
  ],
  "recommendedFocus": "本轮最适合聚焦的澄清方向"
}
```

### Prompt

```text
你是 Thinking 平台中的 AmbiguityAnalysisAgent。

你的任务是阅读当前想法和两份文档，找出最值得向用户澄清的模糊点。

你不是要解决问题，而是要判断“哪里不清楚，应该问什么方向的问题”。

请从以下维度分析：
1. 流程不确定性：整体流程是否清楚？
2. 角色不确定性：涉及哪些用户、角色、对象？
3. 目标不确定性：最终想达到什么？
4. 边界不确定性：做什么，不做什么？
5. 机制不确定性：关键机制如何工作？
6. 内容不确定性：设定、材料、数据、内容是否缺失？
7. 交互不确定性：用户如何参与？
8. 判断标准不确定性：怎样算完成、有效、好？

你需要优先选择真正影响想法成形的问题，不要问无关紧要的问题。

输出 JSON：
{
  "ambiguities": [
    {
      "id": string,
      "type": "process" | "role" | "goal" | "boundary" | "mechanism" | "content" | "interaction" | "evaluation",
      "description": string,
      "whyItMatters": string,
      "priority": "high" | "medium" | "low",
      "suggestedQuestionDirection": string,
      "relatedSection": string
    }
  ],
  "recommendedFocus": string
}

当前阶段：{{phase}}
简要概述文档：
{{briefDocument}}

详细动态文档：
{{livingDocument}}

上一轮用户反馈摘要：
{{lastFeedbackSummary}}
```

---

## 6.4 QuestionGenerationAgent

### 目标

把 AmbiguityAnalysisAgent 找出的模糊点转化成用户可以回答的问题清单。

### 问题设计原则

问题应该：

1. 具体。
2. 一次只问一件事。
3. 不要太长。
4. 不要像考试。
5. 能启发用户思考。
6. 能直接帮助更新文档。
7. 有明确的“为什么问”。

问题不应该：

1. 抽象空泛。
2. 连环追问过多。
3. 让用户感到压力。
4. 包含 AI 已经假设的答案。
5. 每轮问题过多。

### 数量控制

建议每轮：

- 流程级问题：3-5 个。
- 模块级问题：4-6 个。
- 高优先级问题不超过 3 个。

### 输出

```json
{
  "questions": [
    {
      "question": "问题正文",
      "explanation": "简短说明",
      "whyItMatters": "为什么这个问题重要",
      "priority": "high",
      "stage": "process",
      "relatedSection": "当前流程/结构",
      "answerPlaceholder": "给用户的回答提示"
    }
  ]
}
```

### Prompt

```text
你是 Thinking 平台中的 QuestionGenerationAgent。

你的任务是把模糊点转化成用户愿意回答的问题清单。

问题风格：
- 温和
- 具体
- 不像考试
- 不给用户压力
- 能启发用户思考

每个问题必须只问一件事。
每个问题必须能帮助更新当前想法文档。

如果当前阶段是 process_clarification，请优先问整体流程、角色、目标、边界、关键机制。
如果当前阶段是 task_deepening，请优先围绕已经明确的模块/任务问细节、输入输出、判断标准、异常情况。

每轮问题数量控制在 3-6 个。
优先级 high 的问题不超过 3 个。

输出 JSON：
{
  "questions": [
    {
      "question": string,
      "explanation": string,
      "whyItMatters": string,
      "priority": "high" | "medium" | "low",
      "stage": "process" | "task",
      "relatedSection": string,
      "answerPlaceholder": string
    }
  ]
}

当前阶段：{{phase}}
本轮聚焦方向：{{recommendedFocus}}
模糊点列表：
{{ambiguities}}

当前简要文档：
{{briefDocument}}

当前详细文档：
{{livingDocument}}
```

---

## 6.5 SuggestionGenerationAgent

### 目标

针对当前问题清单和想法文档，生成启发用户的建议清单。

### 建议设计原则

建议应该：

1. 多角度。
2. 有理由。
3. 不强迫用户采纳。
4. 能直接补充到文档中。
5. 明确说明采纳后的影响。
6. 对不确定内容保持建议语气。

建议不应该：

1. 越过用户直接做最终决定。
2. 太泛泛。
3. 和问题无关。
4. 堆砌过多。
5. 像“正确答案”。

### 建议类型

```ts
type SuggestionType =
  | "structure"      // 结构建议
  | "content"        // 内容补充建议
  | "clarity"        // 表达清晰度建议
  | "scope"          // 范围边界建议
  | "mechanism"      // 机制建议
  | "experience"     // 用户体验/读者体验/观看体验建议
  | "risk"           // 风险提醒
  | "alternative";   // 替代方向
```

### 输出

```json
{
  "suggestions": [
    {
      "suggestion": "建议内容",
      "rationale": "建议理由",
      "expectedImpact": "采纳后会怎样改善想法",
      "possibleRisk": "可能风险，可为空",
      "relatedQuestionIndex": 0,
      "type": "mechanism",
      "adoptionText": "如果采纳，可写入文档的文本"
    }
  ]
}
```

### Prompt

```text
你是 Thinking 平台中的 SuggestionGenerationAgent。

你的任务是根据当前想法文档和问题清单，为用户提供启发式建议。

请注意：
你不是替用户做决定，而是给用户提供可以采纳或忽略的思考方向。

建议应该满足：
1. 与当前问题清单相关。
2. 具体、可采纳。
3. 能帮助想法变清楚。
4. 说明为什么这样建议。
5. 说明采纳后会带来什么影响。
6. 如有风险，也要温和指出。

建议数量控制在 3-6 条。
每条建议都要尽量能被写入文档。

输出 JSON：
{
  "suggestions": [
    {
      "suggestion": string,
      "rationale": string,
      "expectedImpact": string,
      "possibleRisk": string | null,
      "relatedQuestionIndex": number | null,
      "type": "structure" | "content" | "clarity" | "scope" | "mechanism" | "experience" | "risk" | "alternative",
      "adoptionText": string
    }
  ]
}

当前阶段：{{phase}}
问题清单：
{{questions}}

简要概述文档：
{{briefDocument}}

详细动态文档：
{{livingDocument}}
```

---

## 6.6 UserFeedbackIntegratorAgent

### 目标

把用户本轮输入整理成结构化反馈，供文档更新 Agent 使用。

用户输入包括：

- 回答的问题
- 忽略的问题
- 采纳的建议
- 忽略的建议
- 自由补充想法

### 输出

```json
{
  "acceptedFacts": [],
  "userPreferences": [],
  "ignoredTopics": [],
  "adoptedSuggestions": [],
  "freeThoughts": [],
  "conflicts": [],
  "updateInstructions": []
}
```

### Prompt

```text
你是 Thinking 平台中的 UserFeedbackIntegratorAgent。

你的任务是整理用户在本轮迭代中的所有反馈，并转化为文档更新可以使用的结构化信息。

用户反馈包括：
1. 已回答的问题。
2. 已忽略的问题。
3. 已采纳的建议。
4. 已忽略的建议。
5. 自由补充的想法。

你需要判断：
- 哪些内容可以作为已确认事实写入文档。
- 哪些只是用户偏好。
- 哪些内容用户选择忽略，下一轮应尽量避免重复追问。
- 哪些采纳建议应被写入文档。
- 哪些内容之间存在冲突。

输出 JSON：
{
  "acceptedFacts": string[],
  "userPreferences": string[],
  "ignoredTopics": string[],
  "adoptedSuggestions": string[],
  "freeThoughts": string[],
  "conflicts": string[],
  "updateInstructions": string[]
}

当前简要文档：
{{briefDocument}}

当前详细文档：
{{livingDocument}}

本轮问题与用户回答：
{{answeredQuestions}}

本轮被忽略的问题：
{{ignoredQuestions}}

本轮被采纳的建议：
{{adoptedSuggestions}}

本轮被忽略的建议：
{{ignoredSuggestions}}

用户自由补充：
{{freeThoughts}}
```

---

## 6.7 DocumentUpdateAgent

### 目标

根据本轮反馈更新两份文档。

### 更新原则

1. 用户明确回答的内容优先级最高。
2. 用户采纳的建议可以写入文档。
3. 用户忽略的问题不应强行写入结论。
4. AI 可以整理表达，但不能改变用户含义。
5. 简要文档要保持短。
6. 详细文档要吸收新信息。
7. 必须生成变更摘要。
8. 不确定内容写入“待确认”。

### 输出

```json
{
  "updatedBriefDocumentMarkdown": "...",
  "updatedLivingDocumentMarkdown": "...",
  "changeSummary": "本轮更新摘要",
  "newlyConfirmed": [],
  "stillUnclear": [],
  "suggestedNextFocus": "下一轮建议聚焦"
}
```

### Prompt

```text
你是 Thinking 平台中的 DocumentUpdateAgent。

你的任务是根据用户本轮反馈，更新两份文档：
1. 想法简要概述文档
2. 详细想法动态更新文档

更新原则：
1. 用户明确回答的内容优先。
2. 用户采纳的建议可以写入文档。
3. 用户忽略的问题不要写成已确认内容。
4. 用户没有明确确认的内容只能放在“待确认”或“AI 建议方向”。
5. 简要文档保持短，重点展示当前想法核心。
6. 详细文档可以更完整，保留结构和迭代痕迹。
7. 不要删除重要历史上下文，除非用户明确否定。
8. 语言要清楚、简洁、稳定。

输出 JSON：
{
  "updatedBriefDocumentMarkdown": string,
  "updatedLivingDocumentMarkdown": string,
  "changeSummary": string,
  "newlyConfirmed": string[],
  "stillUnclear": string[],
  "suggestedNextFocus": string
}

原简要文档：
{{briefDocument}}

原详细文档：
{{livingDocument}}

结构化用户反馈：
{{integratedFeedback}}
```

---

## 6.8 PhaseDecisionAgent

### 目标

判断下一轮应该继续流程级澄清，还是进入任务/模块级深入。

### 判断规则

继续流程级澄清，如果：

- 整体流程仍不清楚。
- 目标用户/对象不清楚。
- 核心机制不清楚。
- 文档还无法形成稳定结构。

进入模块级深入，如果：

- 总体流程已经基本清晰。
- 文档中已经出现明确模块/任务/章节/组成部分。
- 下一步更适合逐个细化局部。

进入自由迭代，如果：

- 想法已经比较完整。
- 用户主要需要继续扩展、修改或打磨。

### Prompt

```text
你是 Thinking 平台中的 PhaseDecisionAgent。

你的任务是判断下一轮迭代应该处于哪个阶段：
1. process_clarification：继续澄清整体流程和大结构。
2. task_deepening：深入具体模块、任务、章节或组成部分。
3. free_iteration：想法已经较完整，进入自由打磨和扩展。

判断依据：
- 当前文档是否已有清晰整体结构。
- 核心流程是否明确。
- 是否已经出现可深入的模块/任务。
- 是否仍存在影响整体方向的大问题。
- 用户是否已经回答了关键流程问题。

输出 JSON：
{
  "nextPhase": "process_clarification" | "task_deepening" | "free_iteration",
  "reason": string,
  "recommendedFocus": string,
  "confidence": number
}

当前简要文档：
{{briefDocument}}

当前详细文档：
{{livingDocument}}

本轮更新摘要：
{{changeSummary}}

仍不明确内容：
{{stillUnclear}}
```

---

## 6.9 QualityReviewAgent

### 目标

作为质量守门员，检查问题、建议和文档更新是否符合产品要求。

### 检查项

1. 问题是否过多？
2. 问题是否清楚？
3. 问题是否一次只问一件事？
4. 建议是否具体？
5. 建议是否越权替用户做决定？
6. 文档是否编造信息？
7. 文档是否保持用户原意？
8. 是否有过度计划管理倾向？
9. 是否保持简约、启发式风格？

### Prompt

```text
你是 Thinking 平台中的 QualityReviewAgent。

你的任务是检查本轮 Agent 输出质量。

请检查：
1. 问题是否清楚、具体、不过多。
2. 每个问题是否只问一件事。
3. 建议是否具体、可采纳、有理由。
4. 建议是否没有替用户做最终决定。
5. 文档更新是否保留用户原意。
6. 文档是否没有把不确定内容写成事实。
7. 整体是否仍然是“启发用户完善想法”，而不是“项目管理”。

如果发现问题，请给出修正后的输出。
如果没有问题，返回 approved=true。

输出 JSON：
{
  "approved": boolean,
  "issues": string[],
  "revisedQuestions": any[] | null,
  "revisedSuggestions": any[] | null,
  "revisionNotes": string
}

待检查的问题：
{{questions}}

待检查的建议：
{{suggestions}}

待检查的文档更新摘要：
{{changeSummary}}
```

---

# 7. 关键交互流程

## 7.1 创建想法流程

```text
用户打开首页
    ↓
点击“写下一个想法”
    ↓
输入原始想法
    ↓
点击“开始整理”
    ↓
AI 轻微补全
    ↓
生成初始文档
    ↓
生成第一轮问题清单和建议清单
    ↓
进入主工作台
```

### 创建页设计

极简。

只包含：

- 一句标题：写下一个想法。
- 一个大输入框。
- 一个按钮：开始整理。

不要求用户选择完成细度。
不要求用户填写日期、标签、标题、领域。

这是新版本和旧版本的重要区别。

---

## 7.2 回答问题流程

用户在右侧问题清单中看到多个问题。

每个问题卡片有：

- 问题
- 为什么问
- 回答框
- 忽略按钮

用户可以：

1. 回答全部问题。
2. 只回答部分问题。
3. 忽略部分问题。
4. 全部忽略。

点击“提交本轮反馈”后，Agent 开始整合。

---

## 7.3 采纳建议流程

每条建议卡片有：

- 建议内容
- 建议理由
- 采纳后影响
- 采纳按钮
- 忽略按钮

用户可以：

- 采纳建议。
- 忽略建议。
- 采纳后在自由输入框补充修改。

被采纳的建议会进入本轮 Agent 输入，DocumentUpdateAgent 会将其写入文档。

---

## 7.4 自由补充流程

右侧底部始终有一个自由输入框。

文案：

```text
你也可以直接补充任何新想法，不必对应上面的问题。
```

用户输入内容会作为 freeThoughts 进入本轮迭代。

---

## 7.5 文档更新流程

用户提交本轮反馈后：

1. 前端显示 Agent 正在整合。
2. 后端执行多 Agent 工作流。
3. 文档生成新版本。
4. 前端展示更新摘要。
5. 新问题/建议清单出现。
6. 左侧想法卡片更新迭代轮次和成熟度。

---

# 8. 前端设计风格

## 8.1 风格关键词

```text
Apple-like
Google-like
极简
纸张感
米黄偏白
留白
轻阴影
低噪声
温和
流畅
```

---

## 8.2 配色建议

### 背景

```css
--paper-bg: #F8F5EE;
--paper-surface: #FFFDF8;
--paper-soft: #F1EADF;
```

### 文字

```css
--text-main: #1F1F1F;
--text-secondary: #5F6368;
--text-muted: #8B867D;
```

### 强调色

```css
--accent-blue: #4C7DFF;       /* 类 Google 的清爽蓝，用于主按钮 */
--accent-green: #7DAA8B;      /* 温和确认 */
--accent-gold: #C7A76C;       /* 纸张高亮 */
--accent-red-soft: #D98C82;   /* 温和风险 */
```

整体背景偏米黄白，按钮和交互可以少量使用 Google 风格蓝色，但面积必须克制。

---

## 8.3 组件形态

### 卡片

- 背景接近白纸。
- 圆角 18-24px。
- 极浅阴影。
- 少用边框。

### 按钮

- 主按钮类似 Apple/Google 的简洁胶囊按钮。
- 不要复杂渐变。
- hover 只轻微变亮和上浮。

### 输入框

- 大面积留白。
- 边框极浅。
- focus 使用淡蓝或暖金色 glow。

### 左侧想法栏

- 每条想法像一张纸片。
- 卡片层叠。
- 切换像翻纸。

---

## 8.4 动效原则

动效必须非常克制。

允许：

- 淡入淡出
- 轻微上浮
- 纸片翻页
- 卡片展开
- 文档更新高亮

禁止：

- 强弹跳
- 霓虹光效
- 大面积粒子
- 复杂 3D
- 过度科技感

---

# 9. 页面组件清单

## 9.1 核心页面

```text
/                      首页
/ideas                 想法工作台
/ideas/:id             单个想法迭代页面
```

第一版甚至可以只做一个主工作台页面。

---

## 9.2 核心组件

### Layout

- AppShell
- TopBar
- IdeaShelf
- DocumentWorkspace
- InspirationPanel

### Idea

- IdeaPaperCard
- IdeaSwitcher
- IdeaMaturityBadge

### Documents

- BriefDocumentCard
- LivingDocumentCard
- DocumentVersionBadge
- DocumentChangeHighlight

### Questions

- QuestionList
- QuestionCard
- AnswerBox
- IgnoreButton

### Suggestions

- SuggestionList
- SuggestionCard
- AdoptButton
- SuggestionImpactBlock

### Iteration

- FreeThoughtBox
- SubmitRoundButton
- IterationStatusIndicator
- RoundSummaryCard

### Agent

- AgentThinkingIndicator
- AgentUpdateSummary
- AgentQualityNotice

---

# 10. API 设计

## 10.1 创建想法

```http
POST /api/ideas
```

请求：

```json
{
  "rawInput": "我想做一个能引导用户完善想法的平台..."
}
```

响应：

```json
{
  "idea": {},
  "briefDocument": {},
  "livingDocument": {},
  "round": {},
  "questions": [],
  "suggestions": []
}
```

---

## 10.2 获取想法工作台数据

```http
GET /api/ideas/:id/workspace
```

返回：

```json
{
  "idea": {},
  "briefDocument": {},
  "livingDocument": {},
  "currentRound": {},
  "questions": [],
  "suggestions": [],
  "revisions": []
}
```

---

## 10.3 提交本轮反馈

```http
POST /api/ideas/:id/rounds/:roundId/submit
```

请求：

```json
{
  "questionResponses": [
    {
      "questionId": "q1",
      "status": "answered",
      "answer": "我希望文档更新前先给用户一个预览。"
    },
    {
      "questionId": "q2",
      "status": "ignored"
    }
  ],
  "suggestionResponses": [
    {
      "suggestionId": "s1",
      "status": "adopted"
    },
    {
      "suggestionId": "s2",
      "status": "ignored"
    }
  ],
  "freeThought": "我希望整体体验像翻阅纸张一样。"
}
```

响应：

```json
{
  "updatedBriefDocument": {},
  "updatedLivingDocument": {},
  "changeSummary": "本轮主要明确了文档更新需要用户预览确认。",
  "nextRound": {},
  "nextQuestions": [],
  "nextSuggestions": []
}
```

---

## 10.4 手动重新生成问题

```http
POST /api/ideas/:id/questions/regenerate
```

请求：

```json
{
  "instruction": "这轮我想重点讨论页面交互，不要问商业模式。"
}
```

---

## 10.5 手动补充想法

```http
POST /api/ideas/:id/free-thought
```

用于用户不想回答清单，只想直接补充一句想法。

---

# 11. 数据库设计 Prisma 草案

```prisma
model Idea {
  id              String   @id @default(cuid())
  userId          String
  rawInput        String
  refinedIdea     String
  title           String
  briefSummary    String
  domain          String
  tags            String[]
  currentPhase    String   @default("process_clarification")
  maturityLevel   String   @default("seed")
  iterationCount  Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  documents       IdeaDocument[]
  rounds          IterationRound[]
}

model IdeaDocument {
  id              String   @id @default(cuid())
  ideaId          String
  type            String
  title           String
  contentMarkdown String
  version         Int      @default(1)
  lastUpdatedBy   String   @default("agent")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  idea            Idea     @relation(fields: [ideaId], references: [id])
  revisions       DocumentRevision[]
}

model IterationRound {
  id              String   @id @default(cuid())
  ideaId          String
  roundNumber     Int
  phase           String
  status          String   @default("open")
  agentFocus      String?
  summaryBefore   String?
  summaryAfter    String?
  createdAt       DateTime @default(now())
  submittedAt     DateTime?
  processedAt     DateTime?

  idea            Idea     @relation(fields: [ideaId], references: [id])
  questions       QuestionItem[]
  suggestions     SuggestionItem[]
}

model QuestionItem {
  id              String   @id @default(cuid())
  roundId         String
  ideaId          String
  stage           String
  relatedSection  String?
  relatedTask     String?
  question        String
  explanation     String
  whyItMatters    String
  priority        String
  answer          String?
  status          String   @default("pending")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  round           IterationRound @relation(fields: [roundId], references: [id])
}

model SuggestionItem {
  id                String   @id @default(cuid())
  roundId           String
  ideaId            String
  relatedQuestionId String?
  relatedSection    String?
  suggestion        String
  rationale         String
  expectedImpact    String
  possibleRisk      String?
  adoptionText      String?
  status            String   @default("pending")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  round             IterationRound @relation(fields: [roundId], references: [id])
}

model DocumentRevision {
  id              String   @id @default(cuid())
  ideaId          String
  documentId      String
  roundId         String
  versionBefore   Int
  versionAfter    Int
  changeSummary   String
  diff            String?
  createdAt       DateTime @default(now())

  document        IdeaDocument @relation(fields: [documentId], references: [id])
}
```

---

# 12. 后端实现建议

## 12.1 推荐架构

```text
Next.js App Router
Prisma
PostgreSQL
LLM Provider Abstraction
Agent Orchestrator
```

第一版不一定需要队列。

如果 LLM 调用时间较长，可以加入：

- BullMQ
- Redis
- 后台 Worker
- 前端轮询任务状态

---

## 12.2 Agent Orchestrator 示例

```ts
async function createIdeaWorkspace(rawInput: string) {
  const refined = await ideaRefinementAgent.run({ rawInput });

  const docs = await documentInitializationAgent.run({
    title: refined.title,
    refinedIdea: refined.refinedIdea,
    domain: refined.domain,
    tags: refined.tags
  });

  const ambiguity = await ambiguityAnalysisAgent.run({
    phase: "process_clarification",
    briefDocument: docs.briefDocumentMarkdown,
    livingDocument: docs.livingDocumentMarkdown
  });

  const questions = await questionGenerationAgent.run({
    phase: "process_clarification",
    ambiguities: ambiguity.ambiguities,
    recommendedFocus: ambiguity.recommendedFocus,
    briefDocument: docs.briefDocumentMarkdown,
    livingDocument: docs.livingDocumentMarkdown
  });

  const suggestions = await suggestionGenerationAgent.run({
    phase: "process_clarification",
    questions: questions.questions,
    briefDocument: docs.briefDocumentMarkdown,
    livingDocument: docs.livingDocumentMarkdown
  });

  const quality = await qualityReviewAgent.run({
    questions: questions.questions,
    suggestions: suggestions.suggestions
  });

  return saveWorkspace({ refined, docs, questions, suggestions, quality });
}
```

---

# 13. 前端实现建议

## 13.1 技术栈

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
Framer Motion
Lucide React
React Hook Form
TanStack Query
```

---

## 13.2 页面布局组件

```tsx
<AppShell>
  <TopBar />
  <WorkspaceLayout>
    <IdeaShelf />
    <DocumentWorkspace />
    <InspirationPanel />
  </WorkspaceLayout>
</AppShell>
```

---

## 13.3 InspirationPanel 状态管理

右侧启发区需要维护：

```ts
interface RoundDraftState {
  answers: Record<string, string>;
  ignoredQuestions: Set<string>;
  adoptedSuggestions: Set<string>;
  ignoredSuggestions: Set<string>;
  freeThought: string;
}
```

提交时转化为 API 请求。

---

## 13.4 文档更新高亮

每轮文档更新后，可短暂高亮变化区域。

实现方式：

- 后端返回 changeSummary。
- 第一版只展示更新摘要。
- 后续可返回 markdown diff。
- 前端对变更段落加淡金色背景 2 秒后淡出。

---

# 14. Cursor 开发 Prompt

## 14.1 重构项目定位 Prompt

```text
你是一个资深全栈工程师和产品工程师。请重构 Thinking 项目，不再把它做成计划管理平台，而是做成“启发式想法迭代平台”。

新的核心流程是：
1. 用户输入一个原始想法。
2. AI 轻微润色和补全，形成初步想法。
3. 系统生成两份文档：想法简要概述文档、详细想法动态更新文档。
4. AI 阅读当前文档，生成问题清单和建议清单。
5. 用户可以回答问题、忽略问题、采纳建议、忽略建议，也可以自由补充想法。
6. Agent 根据本轮输入更新两份文档。
7. 系统进入下一轮问题与建议，想法不断迭代成熟。

请不要再实现旧版本的项目计划管理、任务进度管理、完成细度选择等核心逻辑。

要求：
1. 更新数据模型：Idea、IdeaDocument、IterationRound、QuestionItem、SuggestionItem、DocumentRevision。
2. 实现多 Agent Orchestrator 的代码结构。
3. 实现 create idea workspace 流程。
4. 实现 submit round feedback 流程。
5. 前端采用三栏布局：左侧想法栏、中间文档区、右侧问题/建议区。
6. UI 风格极简，参考 Apple/Google，背景为米黄偏白纸张色。
7. 左侧想法栏要有纸张翻阅感。
8. 完成后运行 typecheck、lint，并写 report.md。
```

---

## 14.2 Agent 工作流实现 Prompt

```text
请为 Thinking 实现 Agent 工作流系统。

需要创建以下 Agent：
1. IdeaRefinementAgent：轻微润色用户原始想法，生成标题、简介、领域、标签。
2. DocumentInitializationAgent：生成简要概述文档和详细动态文档。
3. AmbiguityAnalysisAgent：识别当前想法中的模糊点。
4. QuestionGenerationAgent：生成问题清单。
5. SuggestionGenerationAgent：生成建议清单。
6. UserFeedbackIntegratorAgent：整合用户回答、忽略、采纳建议和自由补充。
7. DocumentUpdateAgent：更新两份文档。
8. PhaseDecisionAgent：判断下一轮是流程级澄清还是任务级深入。
9. QualityReviewAgent：检查问题、建议和文档更新质量。

要求：
1. 每个 Agent 都有独立 prompt 文件。
2. 每个 Agent 都有 zod 输出 schema。
3. 所有 LLM 调用通过统一 LLMProvider。
4. 不允许在业务代码中散落 prompt。
5. Orchestrator 负责串行调用这些 Agent。
6. 输出必须稳定为 JSON。
7. 如果 JSON 解析失败，需要重试或返回明确错误。
8. 完成后为 create idea 和 submit round 各写一个集成测试。
9. 更新 report.md。
```

---

## 14.3 前端三栏工作台 Prompt

```text
请实现 Thinking 的主工作台前端。

页面结构：
左侧：IdeaShelf 想法栏，像翻阅纸张一样展示用户想法。
中间：DocumentWorkspace，展示两份文档：想法简要概述文档、详细想法动态更新文档。
右侧：InspirationPanel，展示问题清单、建议清单和自由补充输入框。

要求：
1. 使用 Next.js + TypeScript + Tailwind + shadcn/ui + Framer Motion。
2. 整体风格极简，参考 Apple/Google。
3. 背景使用米黄偏白纸张色。
4. 左侧想法卡片有纸片层叠和轻微翻页动效。
5. 中间文档像纸张卡片，不要像后台表格。
6. 右侧问题和建议用简洁卡片展示。
7. 每个问题有回答框和忽略按钮。
8. 每条建议有采纳和忽略按钮。
9. 右侧底部有自由补充输入框和提交本轮反馈按钮。
10. 提交后显示 Agent 正在整合文档的状态。
11. 完成后运行 typecheck、lint，并更新 report.md。
```

---

## 14.4 问题与建议交互 Prompt

```text
请实现 Thinking 中的问题清单和建议清单交互。

要求：
1. QuestionCard 展示 question、explanation、whyItMatters、priority。
2. 每个 QuestionCard 有回答框和忽略按钮。
3. 用户输入回答后状态变为 answered。
4. 用户点击忽略后状态变为 ignored，并折叠回答框。
5. SuggestionCard 展示 suggestion、rationale、expectedImpact、possibleRisk。
6. 每个 SuggestionCard 有采纳和忽略按钮。
7. 用户采纳后显示 adopted 状态。
8. 用户忽略后降低卡片视觉权重。
9. InspirationPanel 底部有 freeThought 输入框。
10. 提交时把所有回答、忽略、采纳、自由补充整理成 API 请求。
11. UI 保持极简、低噪声、纸张感。
12. 完成后运行 typecheck、lint，并更新 report.md。
```

---

# 15. MVP 验收标准

## 15.1 创建想法验收

1. 用户输入一个原始想法。
2. 系统生成轻微润色后的初步想法。
3. 系统生成标题和简介。
4. 系统生成简要概述文档。
5. 系统生成详细动态文档。
6. 系统生成第一轮问题清单。
7. 系统生成第一轮建议清单。

---

## 15.2 迭代验收

1. 用户回答部分问题。
2. 用户忽略部分问题。
3. 用户采纳部分建议。
4. 用户补充自由想法。
5. 点击提交本轮反馈。
6. Agent 更新两份文档。
7. 系统生成下一轮问题和建议。
8. 文档内容比上一轮更清晰。
9. 被忽略的问题不会被原样重复追问。

---

## 15.3 页面验收

1. 页面左侧是想法栏。
2. 中间有两份文档。
3. 右侧有问题清单和建议清单。
4. 整体风格极简。
5. 背景是米黄偏白纸张色。
6. 左侧想法切换有翻纸感。
7. 页面不像项目管理后台。
8. 页面没有进度管理、任务看板等旧版本中心元素。

---

# 16. 关键设计原则总结

1. **不做计划管理，做想法启发。**
2. **不急着给答案，先提出好问题。**
3. **AI 的建议是启发，不是命令。**
4. **用户可以回答，也可以忽略。**
5. **每一轮反馈都要回流到文档。**
6. **文档是想法当前状态的真实记录。**
7. **问题从流程级到任务级逐渐深入。**
8. **界面像翻阅纸张，不像后台系统。**
9. **语言温和，交互简洁。**
10. **平台的核心价值是让想法不断变清楚。**

---

# 17. 一句话定义

Thinking 是一个通过 AI 提问、建议和动态文档更新，帮助用户把模糊想法逐步澄清、扩展和完善的极简想法迭代平台。

