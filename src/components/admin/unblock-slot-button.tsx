"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { unblockSlots } from "@/actions/admin-blocked-slots";

export function UnblockSlotButton({ ids }: { ids: string[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await unblockSlots(ids);
          if (result.error) {
            toast.error(result.error);
          } else {
            toast.success("Slot unblocked.");
          }
        });
      }}
    >
      {isPending ? "Removing..." : "Unblock"}
    </Button>
  );
}
