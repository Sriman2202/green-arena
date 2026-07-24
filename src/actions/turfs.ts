"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { turfSchema } from "@/lib/validations/turf";
import { signUpSchema } from "@/lib/validations/auth";
import { saveUploadedImages } from "@/lib/upload";
import { buildTurfEmbeddingText, embedText } from "@/lib/rag";

async function computeTurfEmbeddingSafely(data: {
  name: string;
  description: string;
  city: string;
  area?: string | null;
  sportTypes: string[];
  amenities: string[];
}): Promise<number[]> {
  try {
    return await embedText(buildTurfEmbeddingText(data), "RETRIEVAL_DOCUMENT");
  } catch (err) {
    console.error("Failed to compute turf embedding:", err);
    return [];
  }
}

export interface TurfFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function parseList(value: FormDataEntryValue | null): string[] {
  if (!value) return [];
  return value
    .toString()
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function buildTurfInput(formData: FormData) {
  const existingImages = formData.getAll("existingImages").map((value) => value.toString());
  const newImageFiles = formData.getAll("newImages").filter((entry): entry is File => entry instanceof File);

  const uploaded = await saveUploadedImages(newImageFiles);
  if (uploaded.error) {
    return { error: uploaded.error };
  }

  return {
    input: {
      name: formData.get("name"),
      description: formData.get("description"),
      address: formData.get("address"),
      contactNumber: formData.get("contactNumber"),
      city: formData.get("city"),
      area: formData.get("area") || undefined,
      sportTypes: formData.getAll("sportTypes").map((value) => value.toString()),
      pricePerHour: formData.get("pricePerHour"),
      openTimeMinutes: formData.get("openTimeMinutes"),
      closeTimeMinutes: formData.get("closeTimeMinutes"),
      slotDurationMinutes: formData.get("slotDurationMinutes"),
      amenities: parseList(formData.get("amenitiesText")),
      images: [...existingImages, ...uploaded.paths],
      lat: formData.get("lat") || undefined,
      lng: formData.get("lng") || undefined,
      isActive: formData.get("isActive") === "on",
    },
  };
}

async function resolveOwnerId(formData: FormData): Promise<{ ownerId?: string | null; error?: string }> {
  const ownerMode = formData.get("ownerMode");
  if (ownerMode === "new") {
    const ownerParsed = signUpSchema.omit({ phone: true }).safeParse({
      name: formData.get("newOwnerName"),
      email: formData.get("newOwnerEmail"),
      password: formData.get("newOwnerPassword"),
    });
    if (!ownerParsed.success) {
      return { error: "Enter a valid name, email, and password (min 8 characters) for the new admin." };
    }
    const existingUser = await prisma.user.findUnique({ where: { email: ownerParsed.data.email } });
    if (existingUser) {
      return { error: "An account with this email already exists." };
    }
    const passwordHash = await bcrypt.hash(ownerParsed.data.password, 10);
    const newOwner = await prisma.user.create({
      data: { name: ownerParsed.data.name, email: ownerParsed.data.email, phone: "", passwordHash, role: "ADMIN" },
    });
    return { ownerId: newOwner.id };
  } else {
    const existingOwnerId = formData.get("existingOwnerId");
    return { ownerId: existingOwnerId ? existingOwnerId.toString() : null };
  }
}

function resolveCommissionPercent(formData: FormData): { commissionPercent?: number; error?: string } {
  if (!formData.has("commissionPercent")) return {};
  const raw = Number(formData.get("commissionPercent"));
  if (!Number.isFinite(raw) || raw < 0 || raw > 100) {
    return { error: "Commission must be a number between 0 and 100." };
  }
  return { commissionPercent: raw };
}

export async function createTurf(
  _prevState: TurfFormState,
  formData: FormData
): Promise<TurfFormState> {
  await requireSuperAdmin();

  const built = await buildTurfInput(formData);
  if (built.error) {
    return { error: built.error };
  }

  const parsed = turfSchema.safeParse(built.input);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const resolvedOwner = await resolveOwnerId(formData);
  if (resolvedOwner.error) {
    return { error: resolvedOwner.error };
  }

  const resolvedCommission = resolveCommissionPercent(formData);
  if (resolvedCommission.error) {
    return { error: resolvedCommission.error };
  }

  const embedding = await computeTurfEmbeddingSafely(parsed.data);
  await prisma.turf.create({
    data: {
      ...parsed.data,
      embedding,
      ownerId: resolvedOwner.ownerId,
      commissionPercent: resolvedCommission.commissionPercent ?? 10,
    },
  });

  revalidatePath("/admin/turfs");
  revalidatePath("/turfs");
  redirect("/admin/turfs");
}

export async function updateTurf(
  turfId: string,
  _prevState: TurfFormState,
  formData: FormData
): Promise<TurfFormState> {
  const currentUser = await requireAdmin();

  const existingTurf = await prisma.turf.findUnique({ where: { id: turfId } });
  if (!existingTurf) {
    return { error: "Turf not found." };
  }
  if (currentUser.role === "ADMIN" && existingTurf.ownerId !== currentUser.id) {
    return { error: "You don't have access to this turf." };
  }

  const built = await buildTurfInput(formData);
  if (built.error) {
    return { error: built.error };
  }

  const parsed = turfSchema.safeParse(built.input);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let ownerId: string | null | undefined;
  if (currentUser.role === "SUPER_ADMIN" && formData.has("ownerMode")) {
    const resolvedOwner = await resolveOwnerId(formData);
    if (resolvedOwner.error) {
      return { error: resolvedOwner.error };
    }
    ownerId = resolvedOwner.ownerId;
  }

  let commissionPercent: number | undefined;
  if (currentUser.role === "SUPER_ADMIN" && formData.has("commissionPercent")) {
    const resolvedCommission = resolveCommissionPercent(formData);
    if (resolvedCommission.error) {
      return { error: resolvedCommission.error };
    }
    commissionPercent = resolvedCommission.commissionPercent;
  }

  const embedding = await computeTurfEmbeddingSafely(parsed.data);
  await prisma.turf.update({
    where: { id: turfId },
    data: {
      ...parsed.data,
      embedding,
      ...(ownerId !== undefined ? { ownerId } : {}),
      ...(commissionPercent !== undefined ? { commissionPercent } : {}),
    },
  });

  revalidatePath("/admin/turfs");
  revalidatePath(`/turfs/${turfId}`);
  revalidatePath("/turfs");
  redirect("/admin/turfs");
}

export async function toggleTurfActive(turfId: string, isActive: boolean): Promise<void> {
  await requireSuperAdmin();

  await prisma.turf.update({ where: { id: turfId }, data: { isActive } });

  revalidatePath("/admin/turfs");
  revalidatePath("/turfs");
}
