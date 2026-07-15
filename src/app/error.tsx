"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-heading text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground">
        We hit an unexpected error. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
