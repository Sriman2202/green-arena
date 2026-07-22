import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleTurfActiveButton } from "@/components/admin/toggle-turf-active-button";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";

export default async function AdminTurfsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const user = await requireAdmin();

  if (user.role === "ADMIN") {
    const ownedTurfs = await prisma.turf.findMany({
      where: { ownerId: user.id },
      select: { id: true },
    });
    if (ownedTurfs.length === 1) {
      redirect(`/admin/turfs/${ownedTurfs[0].id}/edit`);
    }
  }

  const where: Prisma.TurfWhereInput = {
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    ...(user.role === "ADMIN" ? { ownerId: user.id } : {}),
  };

  const turfs = await prisma.turf.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Turfs</h2>
        {user.role === "SUPER_ADMIN" && (
          <Button render={<Link href="/admin/turfs/new" />}>Add turf</Button>
        )}
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="q" className="text-xs font-medium text-muted-foreground">
            Search turfs
          </label>
          <Input id="q" name="q" defaultValue={q ?? ""} placeholder="Search by name..." className="w-64" />
        </div>
        <Button type="submit" size="sm">
          Search
        </Button>
        {q && (
          <Button variant="ghost" size="sm" render={<Link href="/admin/turfs" />}>
            Clear
          </Button>
        )}
      </form>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Sport</TableHead>
              <TableHead>Price/hr</TableHead>
              <TableHead>Status</TableHead>
              {user.role === "SUPER_ADMIN" && <TableHead>Owner</TableHead>}
              {user.role === "SUPER_ADMIN" && <TableHead>Commission</TableHead>}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {turfs.map((turf) => (
              <TableRow key={turf.id}>
                <TableCell className="font-medium">{turf.name}</TableCell>
                <TableCell>{turf.city}</TableCell>
                <TableCell>{turf.sportTypes.join(", ")}</TableCell>
                <TableCell>
                  {CURRENCY_SYMBOL}
                  {Number(turf.pricePerHour)}
                </TableCell>
                <TableCell>
                  <Badge variant={turf.isActive ? "default" : "destructive"}>
                    {turf.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                {user.role === "SUPER_ADMIN" && (
                  <TableCell>{turf.owner ? turf.owner.name : "Unassigned"}</TableCell>
                )}
                {user.role === "SUPER_ADMIN" && (
                  <TableCell>{Number(turf.commissionPercent)}%</TableCell>
                )}
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      render={<Link href={`/admin/turfs/${turf.id}/edit`} />}
                    >
                      Edit
                    </Button>
                    {user.role === "SUPER_ADMIN" && (
                      <ToggleTurfActiveButton turfId={turf.id} isActive={turf.isActive} />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {turfs.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={user.role === "SUPER_ADMIN" ? 8 : 6}
                  className="text-center text-muted-foreground"
                >
                  {q ? `No turfs match "${q}".` : "No turfs yet."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
