# Persona Chat

AI-powered website for simulated conversations with either Hitesh Choudhary or Piyush Garg. The app supports persona switching, server-side LLM calls, context compaction, and a clean chat experience.

## Features

- Next.js app with `/api/chat` server route.
- Persona switcher for Hitesh Choudhary and Piyush Garg.
- Source-grounded persona prompts in `lib/personas.ts`.
- OpenAI Responses API integration.
- Context handling with recent turns plus compact memory.
- API rate limiting at 3 chat requests per minute.
- Demo mode when no API key is configured.
- Persisted light/dark theme toggle.
- Documentation with research, prompt strategy, context approach, and samples.

## Setup

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```bash
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-5.4-mini
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_REASONING_EFFORT=low
```

Run locally:

```bash
npm run dev
```

Open http://localhost:3000.

Build for production:

```bash
npm run build
npm run start
```

## Deployment

Vercel is the shortest path for this project:

1. Push the repository to GitHub.
2. Import it in Vercel as a Next.js project.
3. Add `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`, and `OPENAI_REASONING_EFFORT` in project environment variables.
4. Deploy.

## Documentation

See `docs/PERSONA_RESEARCH.md` for:

- How persona data was collected and prepared.
- Prompt engineering strategy.
- Context management approach.
- Sample conversations for both personas.

## Source Anchors

- Hitesh Choudhary profile: https://hiteshchoudhary.com/
- Hitesh AI reference: https://hitesh.ai/
- Chai aur Code YouTube: https://www.youtube.com/@chaiaurcode
- Piyush Garg website: https://www.piyushgarg.dev/
- Piyush Garg courses: https://www.piyushgarg.dev/courses
- Piyush Garg YouTube: https://www.youtube.com/@piyushgargdev/videos
- OpenAI Responses API: https://developers.openai.com/api/reference/resources/responses/methods/create
