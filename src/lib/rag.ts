import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import type { Turf } from "@/generated/prisma/client";

const EMBEDDING_MODEL = "gemini-embedding-001";

let cachedClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey });
  }
  return cachedClient;
}

export function buildTurfEmbeddingText(turf: {
  name: string;
  description: string;
  city: string;
  area?: string | null;
  sportTypes: string[];
  amenities: string[];
}): string {
  return [
    turf.name,
    turf.sportTypes.join(", "),
    turf.city + (turf.area ? ", " + turf.area : ""),
    turf.description,
    turf.amenities.length ? "Amenities: " + turf.amenities.join(", ") : "",
  ]
    .filter(Boolean)
    .join(". ");
}

export async function embedText(
  text: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"
): Promise<number[]> {
  const ai = getClient();
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: [text],
    config: { taskType },
  });
  const values = response.embeddings?.[0]?.values;
  if (!values || values.length === 0) {
    throw new Error("Embedding API returned no vector.");
  }
  return values;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return -1;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return -1;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export interface RetrievedTurf {
  turf: Turf;
  score: number;
}

export async function retrieveRelevantTurfs(query: string, topK = 4): Promise<RetrievedTurf[]> {
  const queryEmbedding = await embedText(query, "RETRIEVAL_QUERY");

  const turfs = await prisma.turf.findMany({ where: { isActive: true } });
  const withEmbeddings = turfs.filter((turf) => turf.embedding.length > 0);

  return withEmbeddings
    .map((turf) => ({ turf, score: cosineSimilarity(queryEmbedding, turf.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function formatTurfsForContext(results: RetrievedTurf[]): string {
  if (results.length === 0) return "";
  const lines = results.map(
    ({ turf }, i) =>
      `${i + 1}. ${turf.name} — ${turf.sportTypes.join(", ")} in ${turf.city}${turf.area ? ", " + turf.area : ""}. ` +
      `₹${turf.pricePerHour}/hour. Amenities: ${turf.amenities.join(", ") || "None listed"}. ${turf.description}`
  );
  return "Here is real turf inventory data that may be relevant to the user's question:\n" + lines.join("\n");
}
