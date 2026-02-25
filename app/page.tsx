import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  // Dynamically import authOptions to avoid Prisma loading at module initialization
  const { authOptions } = await import("@/lib/auth");
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  } else {
    redirect("/auth/signin");
  }
}
