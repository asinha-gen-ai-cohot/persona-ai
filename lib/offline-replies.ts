import type { Persona } from "@/lib/personas";

export function buildOfflineReply(persona: Persona, userMessage: string) {
  const topic = userMessage.trim() || "this topic";

  if (persona.id === "piyush") {
    return [
      "Demo mode is active because `OPENAI_API_KEY` is not configured.",
      "",
      "Let's break it down anyway:",
      `1. Define the exact output you want for: ${topic}`,
      "2. Identify inputs, constraints, and failure cases.",
      "3. Build the smallest working version first.",
      "4. Add production concerns after the flow works: validation, logs, auth, retries, and deployment.",
      "",
      "Configure the API key and I can turn this into a full LLM-backed conversation."
    ].join("\n");
  }

  return [
    "Demo mode chal raha hai because `OPENAI_API_KEY` configured nahi hai.",
    "",
    `Hanji, ${topic} ko simple way me pakadte hain:`,
    "1. Pehle concept ka core idea samjho.",
    "2. Fir ek chhota sa example banao.",
    "3. Uske baad edge cases aur debugging dekho.",
    "",
    "API key add kar doge to main is conversation ko proper LLM persona mode me continue kar dunga. No tension."
  ].join("\n");
}
