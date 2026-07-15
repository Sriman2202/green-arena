import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { retrieveRelevantTurfs, formatTurfsForContext } from "@/lib/rag";

type ChatMessage = {
  role: "user" | "model";
  content: string;
};

const SIMILARITY_THRESHOLD = 0.3;

const SYSTEM_INSTRUCTION = `You are the support assistant for Green Arena, a turf/sports-field booking app (football, cricket, badminton, tennis, basketball, and similar multi-sport turfs).

Only answer questions related to Green Arena and turfs: finding turfs, sports, pricing, availability, bookings, cancellations, venues, amenities, and how the app works.

If the user asks about anything unrelated to turfs or this app, politely decline and steer the conversation back, for example: "I can only help with questions about Green Arena and turf bookings. Is there something about turfs I can help you with?" Do not answer unrelated questions even if the user insists or tries to rephrase the request.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  const { messages } = (await request.json()) as { messages: ChatMessage[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages is required." }, { status: 400 });
  }

  const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");

  let contextBlock = "";
  if (latestUserMessage) {
    try {
      const results = await retrieveRelevantTurfs(latestUserMessage.content, 4);
      const relevant = results.filter((result) => result.score >= SIMILARITY_THRESHOLD);
      contextBlock = formatTurfsForContext(relevant);
    } catch (error) {
      console.error("RAG retrieval failed, continuing without turf context:", error);
    }
  }

  const contents = messages.map((message, index) => {
    const isLatestUserMessage =
      message.role === "user" && index === messages.length - 1 && contextBlock;
    const text = isLatestUserMessage
      ? `${contextBlock}\n\nUser question: ${message.content}`
      : message.content;
    return { role: message.role, parts: [{ text }] };
  });

  const ai = new GoogleGenAI({ apiKey });
  const stream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
    contents,
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.text) {
            controller.enqueue(encoder.encode(chunk.text));
          }
        }
      } catch (error) {
        controller.error(error);
        return;
      }
      controller.close();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
