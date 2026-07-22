import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RevenueChart, type DailyStat } from "@/components/admin/revenue-chart";
import { todayDateString } from "@/lib/slots";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";

const DEFAULT_CHART_DAYS = 14;
const MAX_CHART_DAYS = 90;

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ turfId?: string; from?: string; to?: string }>;
}) {
  const { turfId, from, to } = await searchParams;
  const user = await requireAdmin();

  const turfs =
    user.role === "SUPER_ADMIN"
      ? await prisma.turf.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : [];

  const toDate = parseDate(to) ?? new Date();
  const fromDate = parseDate(from) ?? (() => {
    const d = new Date(toDate);
    d.setDate(d.getDate() - (DEFAULT_CHART_DAYS - 1));
    return d;
  })();

  const dayCount = Math.min(
    MAX_CHART_DAYS,
    Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000) + 1)
  );
  const fromDateStr = todayDateString(fromDate);
  const toDateStr = todayDateString(toDate);

  const bookingFilter: Prisma.BookingWhereInput = {
    status: { not: "CANCELLED" },
    date: { gte: fromDateStr, lte: toDateStr },
    ...(turfId ? { turfId } : {}),
    ...(user.role === "ADMIN" ? { turf: { ownerId: user.id } } : {}),
  };

  const [revenueAgg, platformRevenueAgg, totalBookings, dailyAgg] = await Promise.all([
    prisma.booking.aggregate({
      _sum: { pricePaid: true },
      where: bookingFilter,
    }),
    prisma.booking.aggregate({
      _sum: { platformCommission: true },
      where: bookingFilter,
    }),
    prisma.booking.count({ where: bookingFilter }),
    prisma.booking.groupBy({
      by: ["date"],
      where: bookingFilter,
      _sum: { pricePaid: true },
      _count: { _all: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const dailyMap = new Map(
    dailyAgg.map((row) => [
      row.date,
      { revenue: Number(row._sum.pricePaid ?? 0), bookings: row._count._all },
    ])
  );

  const chartData: DailyStat[] = [];
  for (let i = dayCount - 1; i >= 0; i -= 1) {
    const day = new Date(toDate);
    day.setDate(day.getDate() - i);
    const dateStr = todayDateString(day);
    const stats = dailyMap.get(dateStr);
    chartData.push({ date: dateStr, revenue: stats?.revenue ?? 0, bookings: stats?.bookings ?? 0 });
  }

  const totalRevenue = Number(revenueAgg._sum.pricePaid ?? 0);
  const platformRevenue = Number(platformRevenueAgg._sum.platformCommission ?? 0);

  return (
    <div className="space-y-6">
      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4"
      >
        {user.role === "SUPER_ADMIN" && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="turfId" className="text-xs font-medium text-muted-foreground">
              Turf
            </label>
            <select
              id="turfId"
              name="turfId"
              defaultValue={turfId ?? ""}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">All turfs</option>
              {turfs.map((turf) => (
                <option key={turf.id} value={turf.id}>
                  {turf.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="from" className="text-xs font-medium text-muted-foreground">
            From
          </label>
          <Input id="from" name="from" type="date" defaultValue={fromDateStr} className="w-40" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="to" className="text-xs font-medium text-muted-foreground">
            To
          </label>
          <Input id="to" name="to" type="date" defaultValue={toDateStr} className="w-40" />
        </div>
        <Button type="submit" size="sm">
          Apply filters
        </Button>
        {(turfId || from || to) && (
          <Button variant="ghost" size="sm" render={<Link href="/admin" />}>
            Clear
          </Button>
        )}
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-bold">
              {CURRENCY_SYMBOL}
              {totalRevenue.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        {user.role === "SUPER_ADMIN" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Platform Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-3xl font-bold">
                {CURRENCY_SYMBOL}
                {platformRevenue.toLocaleString("en-IN")}
              </p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-bold">{totalBookings}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {fromDateStr} – {toDateStr}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  );
}
