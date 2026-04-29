# 沉思 Chensi

沉思（Chensi）是一个多 Agent 想法迭代工作台，用来帮助用户把模糊想法逐轮整理成清晰、可维护的文档。

它不会直接替用户产出最终答案，而是通过文档、方向性问题、待处理问题和建议，帮助用户持续澄清想法。

## Features

- 想法创建与多轮迭代
- 概要文档与详细文档
- 结构化问题文档
- 右侧待处理问题与建议面板
- 多 Agent 分析进度展示
- 中英文界面切换
- AI Provider 配置面板
- MySQL + Prisma 数据持久化
- BlockNote 文档编辑体验

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Prisma
- MySQL
- BlockNote
- Framer Motion

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set your local MySQL connection string:

```env
DATABASE_URL="mysql://user:password@localhost:3306/thinking_v2"
```

Optional fallback OpenAI-compatible configuration:

```env
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4o-mini"
OPENAI_BASE_URL="https://api.openai.com/v1"
```

The app also supports configuring AI providers in the UI, including OpenAI, DeepSeek, Zhipu GLM, Kimi / Moonshot, and Google Gemini.

### 3. Sync database schema

```bash
npx prisma db push
```

If Prisma Client is not generated automatically, run:

```bash
npx prisma generate
```

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build production app
npm run start        # Start production server
npm run typecheck    # Run TypeScript check
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push Prisma schema to database
npm run db:studio    # Open Prisma Studio
```

## Environment Variables

| Name | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | MySQL connection string used by Prisma. |
| `OPENAI_API_KEY` | No | Fallback API key for OpenAI-compatible LLM calls. |
| `OPENAI_MODEL` | No | Fallback model name. |
| `OPENAI_BASE_URL` | No | Fallback OpenAI-compatible base URL. |

## Project Structure

```text
src/app/                 Next.js App Router pages and API routes
src/components/          UI components
src/components/document/ BlockNote document editor shell
src/lib/                 Agents, prompts, store, Prisma, LLM utilities
prisma/schema.prisma     Database schema
```

## Notes for GitHub

Do not commit `.env` or any file containing real API keys, database passwords, or secrets.

This repository includes `.env.example` as a safe template for local setup.

## License

No license has been selected yet. Add one before publishing if you want to define how others may use this project.
