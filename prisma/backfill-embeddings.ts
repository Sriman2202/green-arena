import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { GoogleGenAI } from "@google/genai";
import { buildTurfEmbeddingText } from "../src/lib/rag";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
  const ai = new GoogleGenAI({ apiKey });

  const turfs = await prisma.turf.findMany({ where: { embedding: { equals: [] } } });
  console.log(`Found ${turfs.length} turfs missing embeddings.`);

  for (const turf of turfs) {
    const text = buildTurfEmbeddingText(turf);
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: [text],
      config: { taskType: "RETRIEVAL_DOCUMENT" },
    });
    const values = response.embeddings?.[0]?.values;
    if (!values) {
      console.warn(`No embedding returned for turf ${turf.id} (${turf.name}), skipping.`);
      continue;
    }
    await prisma.turf.update({ where: { id: turf.id }, data: { embedding: values } });
    console.log(`Embedded: ${turf.name}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
