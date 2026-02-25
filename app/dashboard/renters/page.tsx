import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, User } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { NewRenterModal } from "./new-renter-modal";

export default async function RentersPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect("/auth/signin");
    }

    const renters = await prisma.renter.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                        Renters
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Manage your tenants, their rent, and documents.
                    </p>
                </div>
                <NewRenterModal />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Renters</CardTitle>
                </CardHeader>
                <CardContent>
                    {renters.length === 0 ? (
                        <div className="text-center py-10">
                            <User className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-foreground">No renters yet</h3>
                            <p className="text-sm text-muted-foreground mt-2 mb-4">
                                You haven't added any renters to your properties.
                            </p>
                            <NewRenterModal />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Name</th>
                                        <th className="px-6 py-3 font-medium hidden sm:table-cell">Email</th>
                                        <th className="px-6 py-3 font-medium">Monthly Rent</th>
                                        <th className="px-6 py-3 font-medium hidden md:table-cell">Move-in Date</th>
                                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {renters.map((renter) => (
                                        <tr key={renter.id} className="bg-card hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-foreground">
                                                {renter.name}
                                                <div className="sm:hidden text-muted-foreground text-xs mt-1">
                                                    {renter.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 hidden sm:table-cell">{renter.email}</td>
                                            <td className="px-6 py-4 font-medium">
                                                ₹{renter.monthlyRentAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                {format(new Date(renter.moveInDate), "MMM d, yyyy")}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/dashboard/renters/${renter.id}`}>
                                                    <Button variant="outline" size="sm" className="gap-2">
                                                        <FileText className="h-4 w-4" />
                                                        <span className="hidden sm:inline">Details</span>
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
