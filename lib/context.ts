import type { ChatMessage, Persona } from "@/lib/personas";

const MAX_MESSAGES = 30;
const MAX_MESSAGE_CHARS = 1800;
const RECENT_MESSAGES = 14;

export type ResponseInputMessage = {
  role: "developer" | "user" | "assistant";
  content: string;
};

export function sanitizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is ChatMessage => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const role = (item as ChatMessage).role;
      const content = (item as ChatMessage).content;
      return (role === "user" || role === "assistant") && typeof content === "string";
    })
    .map((message) => ({
      role: message.role,
      content: normalizeContent(message.content)
    }))
    .filter((message) => message.content.length > 0)
    .slice(-MAX_MESSAGES);
}

export function buildPersonaInput(
  persona: Persona,
  messages: ChatMessage[]
): ResponseInputMessage[] {
  const { memory, recent } = compactConversation(messages);

  const contextPolicy = `
Context management policy:
- The client sends the full visible transcript.
- The server keeps the most recent ${RECENT_MESSAGES} messages verbatim.
- Older turns are compressed into a compact memory note with user goals and resolved advice.
- Treat the compact memory as background and the recent transcript as the source of immediate truth.
`;

  const input: ResponseInputMessage[] = [
    {
      role: "developer",
      content: `${persona.systemPrompt}\n${contextPolicy}`.trim()
    }
  ];

  if (memory) {
    input.push({
      role: "developer",
      content: `Compact memory from older turns:\n${memory}`
    });
  }

  input.push(
    ...recent.map((message) => ({
      role: message.role,
      content: message.content
    }))
  );

  return input;
}

function compactConversation(messages: ChatMessage[]) {
  if (messages.length <= RECENT_MESSAGES) {
    return { memory: "", recent: messages };
  }

  const older = messages.slice(0, -RECENT_MESSAGES);
  const recent = messages.slice(-RECENT_MESSAGES);

  const memory = older
    .map((message) => {
      const label = message.role === "user" ? "User" : "Assistant";
      return `- ${label}: ${summarizeLine(message.content)}`;
    })
    .join("\n");

  return { memory, recent };
}

function normalizeContent(content: string) {
  return content.replace(/\s+/g, " ").trim().slice(0, MAX_MESSAGE_CHARS);
}

function summarizeLine(content: string) {
  const normalized = normalizeContent(content);
  if (normalized.length <= 220) {
    return normalized;
  }

  return `${normalized.slice(0, 217)}...`;
}
