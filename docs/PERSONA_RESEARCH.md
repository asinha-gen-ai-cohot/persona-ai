# Persona Research and Prompt Strategy

This project is an AI simulation of two public educator personas. It is not affiliated with, endorsed by, or operated by Hitesh Choudhary or Piyush Garg.

## Public Sources Used

### Hitesh Choudhary

- Official profile: https://hiteshchoudhary.com/
- Reference site: https://hitesh.ai/
- YouTube channel: https://www.youtube.com/@chaiaurcode

Observed public signals:

- The official profile uses a developer workspace metaphor and presents Hitesh as a coding educator.
- The profile lists large-scale teaching activity, including YouTube subscriber/video counts.
- The public "Chai aur Code" brand suggests an approachable, conversational classroom mood.
- Public content positioning is centered around programming education, web development, projects, and practical mentorship.

Prompt translation:

- Warm Hinglish tone with short phrases like "hanji", "dekho", and "simple hai".
- Beginner-friendly sequencing: concept, example, task.
- Encouraging corrections, practical project advice, and deployment/debugging habits.
- Occasional chai/code analogy, with guardrails against overusing catchphrases.

### Piyush Garg

- Official website: https://www.piyushgarg.dev/
- Courses page: https://www.piyushgarg.dev/courses
- YouTube channel: https://www.youtube.com/@piyushgargdev/videos

Observed public signals:

- The website positions Piyush as a software engineer, content creator, educator, and founder.
- Public products include Teachyst, WisprType, and Skyping.
- Public course and video topics include Docker, Node.js, DSA, full-stack development, generative AI, RAG, agents, S3, VoIP, and deployment-oriented engineering.
- The teaching surface is implementation-heavy and product-oriented.

Prompt translation:

- Mostly English, concise, systems-first explanations.
- Start by defining goal, constraints, data flow, and trade-offs.
- Use implementation plans, API contracts, architecture bullets, production concerns, and checklists.
- Minimal Hinglish, more engineering vocabulary.

## Prompt Engineering Strategy

Each persona prompt has four layers:

1. Identity boundary: the assistant must identify as an AI simulation and cannot claim to be the real person.
2. Source-grounded style notes: public profile, product, teaching-topic, and channel signals are converted into style guidance.
3. Teaching moves: reusable response behaviors such as concept-first explanation, production trade-offs, or beginner exercises.
4. Response shape: lightweight formatting guidance so answers stay readable and consistent.

The app uses a server-side developer message for the persona prompt. User messages never directly modify the persona definition.

## Context Management Approach

The browser sends the visible transcript to `/api/chat`.

On the server:

- Messages are validated and normalized.
- The transcript is capped at 30 messages.
- Each message is capped at 1,800 characters.
- The latest 14 messages are sent verbatim to the model.
- Older turns are compressed into a compact memory note containing user goals and prior advice.

This keeps long conversations coherent without sending unbounded context. The recent transcript remains the source of immediate truth, while compact memory preserves older intent.

## LLM Integration

The server route calls the OpenAI Responses API at:

```text
POST /v1/responses
```

Default model:

```text
gpt-5.4-mini
```

The model can be changed with `OPENAI_MODEL`. If `OPENAI_API_KEY` is missing, the app returns a deterministic demo reply so the UI can still be reviewed.

## Sample Conversations

### Hitesh Persona

User:

```text
Explain JavaScript closures.
```

Simulated response:

```text
Hanji, closure ko simple way me samjhte hain.

Jab ek inner function apne outer function ke variables ko yaad rakhta hai, even after outer function finish ho gaya, usko closure bolte hain.

Example:
function chaiCounter() {
  let cups = 0;
  return function addCup() {
    cups++;
    return cups;
  };
}

const counter = chaiCounter();
counter(); // 1
counter(); // 2

Yaha addCup function cups ko yaad rakh raha hai. Mini task: ek private balance wallet banao jisme deposit aur withdraw functions ho.
```

### Piyush Persona

User:

```text
Design a URL shortener.
```

Simulated response:

```text
Let's break it down as a small production system.

Goal: convert a long URL into a short code and redirect users reliably.

Core APIs:
- POST /links: accepts longUrl, returns shortCode
- GET /:code: resolves code and returns 302 redirect

Data model:
- id
- shortCode unique
- longUrl
- createdAt
- expiresAt optional
- clickCount

Trade-offs:
- Random code is simple, but collision handling is required.
- Base62 incrementing ids are predictable, but fast.
- Redis cache helps hot redirects, but database remains source of truth.

Build v1 with Postgres, unique index on shortCode, and a retry loop for collisions.
```

## Known Limits

- Persona accuracy depends on public, high-level style signals rather than private data or exhaustive transcripts.
- The app intentionally avoids claiming the assistant is the real person.
- For a stricter evaluation, collect a larger public transcript dataset, annotate recurring phrases and teaching patterns, then run side-by-side human ratings.
