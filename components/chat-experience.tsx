"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  ExternalLink,
  MessageSquareText,
  Moon,
  RefreshCcw,
  SendHorizontal,
  Sparkles,
  Sun
} from "lucide-react";
import type { ChatMessage, PersonaId } from "@/lib/personas";
import { PERSONA_ORDER, PERSONAS } from "@/lib/personas";

type ThreadState = Record<PersonaId, ChatMessage[]>;

type ChatResponse = {
  message?: string;
  error?: string;
  detail?: string;
  offline?: boolean;
  model?: string;
};

type Theme = "light" | "dark";

const initialThreads: ThreadState = {
  hitesh: [{ role: "assistant", content: PERSONAS.hitesh.greeting }],
  piyush: [{ role: "assistant", content: PERSONAS.piyush.greeting }]
};

export function ChatExperience() {
  const [personaId, setPersonaId] = useState<PersonaId>("hitesh");
  const [threads, setThreads] = useState<ThreadState>(initialThreads);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastModel, setLastModel] = useState("ready");
  const [offline, setOffline] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const persona = PERSONAS[personaId];
  const messages = threads[personaId];

  const style = useMemo(
    () => ({ "--persona-accent": persona.accent }) as React.CSSProperties,
    [persona.accent]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("persona-chat-theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  async function submitMessage(nextInput?: string) {
    const content = (nextInput ?? input).trim();
    if (!content || isLoading) {
      return;
    }

    setError("");
    setInput("");
    setIsLoading(true);

    const nextMessages = [...messages, { role: "user" as const, content }];
    setThreads((current) => ({
      ...current,
      [personaId]: nextMessages
    }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: personaId, messages: nextMessages })
      });

      const data = (await response.json()) as ChatResponse;

      if (!response.ok || data.error || !data.message) {
        const detail = data.detail ? ` ${data.detail}` : "";
        throw new Error(`${data.error || "Unable to generate a response."}${detail}`);
      }

      setOffline(Boolean(data.offline));
      setLastModel(data.model || "llm");
      setThreads((current) => ({
        ...current,
        [personaId]: [...nextMessages, { role: "assistant", content: data.message as string }]
      }));
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Something went wrong.";
      setError(message);
      setThreads((current) => ({
        ...current,
        [personaId]: [
          ...nextMessages,
          {
            role: "assistant",
            content:
              "I could not complete that request. Check the server logs or API configuration, then try again."
          }
        ]
      }));
    } finally {
      setIsLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage();
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage();
    }
  }

  function resetCurrentThread() {
    setThreads((current) => ({
      ...current,
      [personaId]: [{ role: "assistant", content: persona.greeting }]
    }));
    setError("");
  }

  function toggleTheme() {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      window.localStorage.setItem("persona-chat-theme", next);
      return next;
    });
  }

  return (
    <main className="app-shell" data-theme={theme} style={style}>
      <section className="workspace" aria-label="Persona chat workspace">
        <aside className="sidebar">
          <div className="brand-line">
            <div className="brand-lockup">
              <div className="brand-mark" aria-hidden="true">
                <MessageSquareText size={20} />
              </div>
              <div className="brand-copy">
                <p className="eyebrow">LLM Persona Lab</p>
                <h1 className="brand-title">Mentor Chat</h1>
              </div>
            </div>
            <span className="status-pill">
              <Sparkles size={14} />
              {offline ? "Demo" : lastModel}
            </span>
          </div>

          <div className="persona-list" aria-label="Choose a persona">
            {PERSONA_ORDER.map((id) => {
              const option = PERSONAS[id];
              const active = id === personaId;

              return (
                <button
                  className={`persona-card${active ? " active" : ""}`}
                  key={option.id}
                  onClick={() => {
                    setPersonaId(option.id);
                    setError("");
                  }}
                  style={{ "--persona-accent": option.accent } as React.CSSProperties}
                  type="button"
                >
                  <div className="avatar-wrap">
                    <img alt="" src={option.imageUrl} />
                  </div>
                  <div className="persona-card-body">
                    <h2 className="persona-name">{option.name}</h2>
                    <p className="persona-role">{option.role}</p>
                    <div className="persona-tags">
                      {option.tags.map((tag) => (
                        <span className="persona-tag" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="source-panel">
            <p className="source-heading">Public Sources</p>
            <div className="source-links">
              {persona.sourceLinks.map((source) => (
                <a
                  className="source-link"
                  href={source.href}
                  key={source.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {source.label}
                  <ExternalLink size={13} />
                </a>
              ))}
            </div>
          </div>
        </aside>

        <section className="chat-panel" aria-label={`${persona.name} chat`}>
          <header className="chat-header">
            <div className="chat-persona">
              <div className="chat-avatar">
                <img alt="" src={persona.imageUrl} />
              </div>
              <div className="chat-heading">
                <p className="eyebrow">AI simulation</p>
                <h2 className="chat-name">{persona.name}</h2>
                <p className="chat-subtitle">{persona.role}</p>
              </div>
            </div>

            <div className="header-actions">
              <button
                aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                className="icon-button"
                onClick={toggleTheme}
                title={theme === "dark" ? "Light theme" : "Dark theme"}
                type="button"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                aria-label="Reset conversation"
                className="icon-button"
                onClick={resetCurrentThread}
                title="Reset conversation"
                type="button"
              >
                <RefreshCcw size={18} />
              </button>
            </div>
          </header>

          <div className="messages" aria-live="polite">
            {messages.map((message, index) => (
              <article className={`message ${message.role}`} key={`${message.role}-${index}`}>
                <div className="message-avatar" aria-hidden="true">
                  {message.role === "assistant" ? (
                    <img alt="" src={persona.imageUrl} />
                  ) : (
                    <Bot size={18} />
                  )}
                </div>
                <div className="message-bubble">
                  <p className="message-author">
                    {message.role === "assistant" ? persona.shortName : "You"}
                  </p>
                  <FormattedMessage content={message.content} />
                </div>
              </article>
            ))}

            {isLoading ? (
              <article className="message assistant">
                <div className="message-avatar" aria-hidden="true">
                  <img alt="" src={persona.imageUrl} />
                </div>
                <div className="message-bubble">
                  <p className="message-author">{persona.shortName}</p>
                  <div className="typing" aria-label="Generating response">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </article>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <form className="composer" onSubmit={onSubmit}>
            <div className="starter-row">
              {persona.starterPrompts.map((prompt) => (
                <button
                  className="starter-chip"
                  disabled={isLoading}
                  key={prompt}
                  onClick={() => void submitMessage(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {error ? <div className="error-strip">{error}</div> : null}

            <div className="input-row">
              <textarea
                aria-label="Message"
                className="chat-input"
                disabled={isLoading}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder={`Message ${persona.shortName}`}
                rows={2}
                value={input}
              />
              <button
                aria-label="Send message"
                className="send-button"
                disabled={!input.trim() || isLoading}
                title="Send message"
                type="submit"
              >
                <SendHorizontal size={19} />
              </button>
            </div>

            <div className="meta-row" aria-label="Conversation metadata">
              <span className="meta-chip">Context: recent turns + compact memory</span>
              <span className="meta-chip">Responses API</span>
              <span className="meta-chip">Persona-safe simulation</span>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}

function FormattedMessage({ content }: { content: string }) {
  const parts = content.split(/```/g);

  return (
    <div className="message-content">
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          return (
            <pre key={index}>
              <code>{stripCodeFenceLanguage(part)}</code>
            </pre>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </div>
  );
}

function stripCodeFenceLanguage(value: string) {
  return value.replace(/^[a-zA-Z0-9_-]+\n/, "").trim();
}
