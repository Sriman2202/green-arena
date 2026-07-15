import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Green Arena
          </Link>
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to book your next game.
          </p>
        </div>
        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
