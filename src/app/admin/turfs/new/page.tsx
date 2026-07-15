import { TurfForm } from "@/components/admin/turf-form";
import { TurfOwnerFields } from "@/components/admin/turf-owner-fields";
import { createTurf } from "@/actions/turfs";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NewTurfPage() {
  await requireSuperAdmin();

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Add turf</h2>
      <TurfForm
        action={createTurf}
        submitLabel="Create turf"
        ownerSection={<TurfOwnerFields admins={admins} />}
        showCommissionField
      />
    </div>
  );
}
