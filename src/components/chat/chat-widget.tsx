"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MARKDOWN_CLASSES =
  "[&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-1 [&_strong]:font-semibold [&_a]:underline";

type ChatMessage = {
  role: "user" | "model";
  content: string;
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  async function sendMessage() {
    const content = input.trim();
    if (!content || isStreaming) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Something went wrong. Please try again.");
      }

      setMessages((prev) => [...prev, { role: "model", content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) {
          const chunkText = decoder.decode(result.value, { stream: true });
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = { ...last, content: last.content + chunkText };
            return updated;
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <Card className="w-[min(22rem,calc(100vw-2rem))] shadow-xl ring-1 ring-foreground/10">
          <CardHeader className="flex-row items-center justify-between border-b pb-3">
            <CardTitle>Chat</CardTitle>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close chat"
              onClick={() => setIsOpen(false)}
            >
              <X />
            </Button>
          </CardHeader>
          <CardContent className="flex h-80 flex-col gap-3 overflow-y-auto">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">Ask me anything to get started.</p>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  message.role === "user"
                    ? "self-end whitespace-pre-wrap bg-primary text-primary-foreground"
                    : cn("self-start bg-muted text-foreground", MARKDOWN_CLASSES)
                )}
              >
                {message.role === "model" ? (
                  <ReactMarkdown>
                    {message.content || (isStreaming && index === messages.length - 1 ? "…" : "")}
                  </ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
            ))}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div ref={messagesEndRef} />
          </CardContent>
          <CardFooter className="gap-2 border-t bg-transparent p-3">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message…"
              className="min-h-9 resize-none"
              rows={1}
            />
            <Button
              size="icon"
              aria-label="Send message"
              disabled={isStreaming || !input.trim()}
              onClick={sendMessage}
            >
              <Send />
            </Button>
          </CardFooter>
        </Card>
      )}
      <Button
        size="icon-lg"
        aria-label={isOpen ? "Close chat" : "Open chat"}
        className="rounded-full shadow-lg"
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? <X /> : <MessageCircle />}
      </Button>
    </div>
  );
}
