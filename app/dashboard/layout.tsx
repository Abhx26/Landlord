import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Dynamically import authOptions to avoid Prisma loading at module initialization
  const { authOptions } = await import("@/lib/auth");
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
