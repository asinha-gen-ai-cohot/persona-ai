import { NextResponse } from "next/server";
import { buildPersonaInput, sanitizeMessages } from "@/lib/context";
import { buildOfflineReply } from "@/lib/offline-replies";
import { getPersona } from "@/lib/personas";

export const runtime = "nodejs";

const DEFAULT_MODEL = "gpt-5.4-mini";
const RATE_LIMIT_MAX_REQUESTS = 3;
const RATE_LIMIT_WINDOW_MS = 60_000;

const requestLog = new Map<string, number[]>();

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(request);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `You have hit the rate limit of ${RATE_LIMIT_MAX_REQUESTS} requests per minute. Please wait ${rateLimit.retryAfterSeconds} seconds and try again.`,
          rateLimited: true,
          retryAfter: rateLimit.retryAfterSeconds
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
            "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimit.resetAt)
          }
        }
      );
    }

    const body = await request.json();
    const persona = getPersona(typeof body.persona === "string" ? body.persona : undefined);
    const messages = sanitizeMessages(body.messages);
    const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");

    if (!latestUserMessage) {
      return NextResponse.json({ error: "Send at least one user message." }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        message: buildOfflineReply(persona, latestUserMessage.content),
        offline: true,
        model: "demo"
      });
    }

    const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
    const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const input = buildPersonaInput(persona, messages);

    const payload: Record<string, unknown> = {
      model,
      input,
      max_output_tokens: 1100,
      store: false
    };

    if (supportsReasoning(model)) {
      payload.reasoning = {
        effort: process.env.OPENAI_REASONING_EFFORT || "low"
      };
      payload.text = {
        verbosity: "medium"
      };
    }

    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json(
        {
          error: "The LLM request failed.",
          detail: detail.slice(0, 800)
        },
        { status: 502 }
      );
    }

    const data = (await response.json()) as OpenAIResponse;
    const message = extractOutputText(data);

    if (!message) {
      return NextResponse.json(
        { error: "The LLM returned an empty response." },
        { status: 502 }
      );
    }

    return NextResponse.json({ message, offline: false, model });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function extractOutputText(data: OpenAIResponse) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  return (
    data.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter((text): text is string => Boolean(text?.trim()))
      .join("\n")
      .trim() ?? ""
  );
}

function supportsReasoning(model: string) {
  return /^(gpt-5|o\d|o-|o\.)/i.test(model);
}

function checkRateLimit(request: Request) {
  const clientId = getClientId(request);
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const recentRequests = (requestLog.get(clientId) ?? []).filter(
    (timestamp) => timestamp > windowStart
  );

  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    const resetAtMs = recentRequests[0] + RATE_LIMIT_WINDOW_MS;
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((resetAtMs - now) / 1000)),
      resetAt: Math.ceil(resetAtMs / 1000)
    };
  }

  recentRequests.push(now);
  requestLog.set(clientId, recentRequests);

  return {
    allowed: true,
    retryAfterSeconds: 0,
    resetAt: Math.ceil((now + RATE_LIMIT_WINDOW_MS) / 1000)
  };
}

function getClientId(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const vercelIp = request.headers.get("x-vercel-forwarded-for");
  const cloudflareIp = request.headers.get("cf-connecting-ip");

  return (
    forwardedFor?.split(",")[0]?.trim() ||
    realIp?.trim() ||
    vercelIp?.split(",")[0]?.trim() ||
    cloudflareIp?.trim() ||
    "local-client"
  );
}
