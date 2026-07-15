import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TurfForm } from "@/components/admin/turf-form";
import { TurfOwnerFields } from "@/components/admin/turf-owner-fields";
import { updateTurf } from "@/actions/turfs";
import { requireAdmin } from "@/lib/auth";

export default async function EditTurfPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAdmin();

  const turf = await prisma.turf.findUnique({ where: { id } });
  if (!turf) notFound();
  if (user.role === "ADMIN" && turf.ownerId !== user.id) redirect("/admin/turfs");

  const updateTurfWithId = updateTurf.bind(null, turf.id);

  let ownerSection: React.ReactNode = undefined;
  if (user.role === "SUPER_ADMIN") {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    });
    ownerSection = <TurfOwnerFields admins={admins} defaultOwnerId={turf.ownerId} />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Edit turf</h2>
      <TurfForm
        action={updateTurfWithId}
        submitLabel="Save changes"
        ownerSection={ownerSection}
        showCommissionField={user.role === "SUPER_ADMIN"}
        readOnlyByDefault={user.role === "ADMIN"}
        defaultValues={{
          name: turf.name,
          description: turf.description,
          address: turf.address,
          contactNumber: turf.contactNumber ?? "",
          city: turf.city,
          area: turf.area,
          sportType: turf.sportType,
          pricePerHour: Number(turf.pricePerHour),
          openTimeMinutes: turf.openTimeMinutes,
          closeTimeMinutes: turf.closeTimeMinutes,
          slotDurationMinutes: turf.slotDurationMinutes,
          amenities: turf.amenities,
          images: turf.images,
          lat: turf.lat,
          lng: turf.lng,
          isActive: turf.isActive,
          ...(user.role === "SUPER_ADMIN" ? { commissionPercent: Number(turf.commissionPercent) } : {}),
        }}
      />
    </div>
  );
}
