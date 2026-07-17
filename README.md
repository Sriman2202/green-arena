Green Arena is a turf booking platform built with [Next.js](https://nextjs.org), Prisma, and PostgreSQL.

## Running locally

### Prerequisites

- Node.js 20.9+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for the local PostgreSQL database)

### Steps

1. **Clone the repo and install dependencies:**

   ```bash
   git clone https://github.com/Sriman2202/green-arena.git
   cd green-arena
   npm install
   ```

2. **Configure environment variables.** A `.env` file with working local defaults is already included, containing:

   ```
   DATABASE_URL="postgresql://greenarena:greenarena@localhost:5432/greenarena?schema=public"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="dev-only-secret-change-in-production-000000000000"
   GEMINI_API_KEY="<your Gemini API key from https://aistudio.google.com/apikey>"
   ```

   Replace `GEMINI_API_KEY` with your own key if you plan to exercise AI-powered features.

3. **Start the local PostgreSQL database** (via `docker-compose.yml`):

   ```bash
   docker compose up -d
   ```

4. **Apply database migrations:**

   ```bash
   npx prisma migrate deploy
   ```

5. **(Optional) Seed sample data** — populates sample turf listings:

   ```bash
   npx tsx prisma/seed.ts
   ```

6. **Start the development server:**

   ```bash
   npm run dev
   ```

7. **Open the app** at [http://localhost:3000](http://localhost:3000).

To stop the database when you're done: `docker compose down` (add `-v` to also wipe the data volume).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
