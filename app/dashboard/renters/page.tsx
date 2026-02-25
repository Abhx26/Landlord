import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, User, ChevronRight } from "lucide-react";
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
        <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        Renters
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manage your tenants, their rent, and documents.
                    </p>
                </div>
                <NewRenterModal />
            </div>

            {renters.length === 0 ? (
                <Card>
                    <CardContent className="py-10">
                        <div className="text-center">
                            <User className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-foreground">No renters yet</h3>
                            <p className="text-sm text-muted-foreground mt-2 mb-4">
                                You haven't added any renters to your properties.
                            </p>
                            <NewRenterModal />
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Mobile: Card layout */}
                    <div className="space-y-3 md:hidden">
                        {renters.map((renter) => (
                            <Link key={renter.id} href={`/dashboard/renters/${renter.id}`}>
                                <Card className="hover:bg-muted/50 transition-colors cursor-pointer mb-3">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-foreground truncate">{renter.name}</p>
                                                <p className="text-xs text-muted-foreground truncate mt-0.5">{renter.email}</p>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                                        </div>
                                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Rent</p>
                                                <p className="text-sm font-semibold">₹{renter.monthlyRentAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Move-in</p>
                                                <p className="text-sm">{format(new Date(renter.moveInDate), "MMM d, yyyy")}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    {/* Desktop: Table layout */}
                    <Card className="hidden md:block">
                        <CardHeader>
                            <CardTitle>All Renters</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Name</th>
                                            <th className="px-6 py-3 font-medium">Email</th>
                                            <th className="px-6 py-3 font-medium">Monthly Rent</th>
                                            <th className="px-6 py-3 font-medium">Move-in Date</th>
                                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {renters.map((renter) => (
                                            <tr key={renter.id} className="bg-card hover:bg-muted/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-foreground">{renter.name}</td>
                                                <td className="px-6 py-4">{renter.email}</td>
                                                <td className="px-6 py-4 font-medium">
                                                    ₹{renter.monthlyRentAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {format(new Date(renter.moveInDate), "MMM d, yyyy")}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link href={`/dashboard/renters/${renter.id}`}>
                                                        <Button variant="outline" size="sm" className="gap-2">
                                                            <FileText className="h-4 w-4" />
                                                            <span>Details</span>
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
