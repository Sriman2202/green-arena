"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export function TurfOwnerFields({
  admins,
  defaultOwnerId,
}: {
  admins: { id: string; name: string; email: string }[];
  defaultOwnerId?: string | null;
}) {
  const [mode, setMode] = useState<"existing" | "new">(admins.length > 0 ? "existing" : "new");

  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <h3 className="font-medium">Turf owner</h3>
      <p className="text-sm text-muted-foreground">
        Assign an existing admin or create a new one to manage this turf.
      </p>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "existing" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("existing")}
          className={cn(mode === "existing" && "pointer-events-none")}
        >
          Assign existing admin
        </Button>
        <Button
          type="button"
          variant={mode === "new" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("new")}
          className={cn(mode === "new" && "pointer-events-none")}
        >
          Create new admin
        </Button>
      </div>

      {mode === "existing" ? (
        <>
          <input type="hidden" name="ownerMode" value="existing" />
          <Field>
            <FieldLabel htmlFor="existingOwnerId">Admin</FieldLabel>
            <select
              id="existingOwnerId"
              name="existingOwnerId"
              defaultValue={defaultOwnerId ?? ""}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">— Unassigned —</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name} ({admin.email})
                </option>
              ))}
            </select>
          </Field>
        </>
      ) : (
        <>
          <input type="hidden" name="ownerMode" value="new" />
          <Field>
            <FieldLabel htmlFor="newOwnerName">Name</FieldLabel>
            <Input id="newOwnerName" name="newOwnerName" />
          </Field>
          <Field>
            <FieldLabel htmlFor="newOwnerEmail">Email</FieldLabel>
            <Input id="newOwnerEmail" name="newOwnerEmail" type="email" />
          </Field>
          <Field>
            <FieldLabel htmlFor="newOwnerPassword">Password</FieldLabel>
            <Input id="newOwnerPassword" name="newOwnerPassword" type="password" />
          </Field>
        </>
      )}
    </div>
  );
}
