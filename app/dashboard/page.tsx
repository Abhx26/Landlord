import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, IndianRupee, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Fetch dashboard stats
  const date = new Date();
  const currentMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  const [renters, payments] = await Promise.all([
    prisma.renter.count({ where: { userId: session.user.id } }),
    prisma.payment.findMany({
      where: { userId: session.user.id },
    }),
  ]);

  const totalRentCollected = payments
    .filter((p: any) => p.rentPaid)
    .reduce((sum: number, p: any) => sum + (p.rentAmount || 0), 0);

  const totalElectricityCollected = payments
    .filter((p: any) => p.electricityPaid)
    .reduce((sum: number, p: any) => sum + (p.electricityTotal || 0), 0);

  const pendingPayments = payments.filter((p: any) => p.renterId && (!p.rentPaid || (!p.electricityPaid && p.electricityTotal && p.electricityTotal > 0))).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Overview</h2>
        <p className="text-muted-foreground mt-1">
          Welcome to your landlord management dashboard. Here's a summary of your renters.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{renters}</div>
            <p className="text-xs text-muted-foreground">Active renters</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{(totalRentCollected + totalElectricityCollected).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">Electricity + Rent collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Unpaid rent or electricity</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/renters">
              <Button variant="outline" className="w-full justify-start">
                View Renters
              </Button>
            </Link>
            <Link href="/dashboard/payments">
              <Button variant="outline" className="w-full justify-start">
                Record Payments
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attention Needed</CardTitle>
            <CardDescription>Items requiring action</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingPayments > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 mb-2">
                <div>
                  <p className="font-medium text-sm">{pendingPayments} Pending Payments</p>
                  <p className="text-xs text-muted-foreground">Review outstanding bills</p>
                </div>
                <Link href="/dashboard/payments">
                  <Button variant="ghost" size="sm">View</Button>
                </Link>
              </div>
            )}
            {pendingPayments === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                All caught up! No immediate action needed.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
