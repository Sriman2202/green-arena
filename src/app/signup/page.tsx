import Link from "next/link";
import { SignUpForm } from "@/components/auth/signup-form";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Green Arena
          </Link>
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Find and book turfs near you in seconds.
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}
