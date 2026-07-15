"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { unblockSlot } from "@/actions/admin-blocked-slots";

export function UnblockSlotButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await unblockSlot(id);
          toast.success("Slot unblocked.");
        });
      }}
    >
      {isPending ? "Removing..." : "Unblock"}
    </Button>
  );
}
