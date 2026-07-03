import { NextResponse } from "next/server";
import { buildPersonaInput, sanitizeMessages } from "@/lib/context";
import { buildOfflineReply } from "@/lib/offline-replies";
import { getPersona } from "@/lib/personas";

export const runtime = "nodejs";

const DEFAULT_MODEL = "gpt-5.4-mini";

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
