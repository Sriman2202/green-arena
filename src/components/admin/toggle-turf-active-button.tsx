"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleTurfActive } from "@/actions/turfs";

export function ToggleTurfActiveButton({
  turfId,
  isActive,
}: {
  turfId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await toggleTurfActive(turfId, !isActive);
          toast.success(isActive ? "Turf deactivated." : "Turf activated.");
        });
      }}
    >
      {isPending ? "Updating..." : isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}
