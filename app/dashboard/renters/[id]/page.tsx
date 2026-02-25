import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DocumentVault } from "./document-vault";
import { ElectricityBillGenerator } from "./electricity-bill-generator";
import { EditRenterModal } from "./edit-renter-modal";
import { DeleteRenterButton } from "./delete-renter-button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";

export default async function RenterDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
        redirect("/auth/signin");
    }

    const renter = await prisma.renter.findUnique({
        where: {
            id,
            userId: session.user.id // Security check
        },
        include: {
            documents: {
                orderBy: { createdAt: "desc" }
            },
            payments: {
                orderBy: { createdAt: "desc" },
                take: 5 // Show recent 5 payments
            }
        }
    });

    if (!renter) {
        redirect("/dashboard/renters");
    }

    // Extract all months that already have a generated electricity bill (only real bills with total > 0)
    const billedMonths = await prisma.payment.findMany({
        where: {
            renterId: renter.id,
            electricityTotal: { gt: 0 }
        },
        select: { month: true }
    }).then(payments => payments.map(p => p.month));

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        {renter.name}
                        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700">Active</Badge>
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        {renter.email} • {renter.phone || "No Phone"} • Moved in {format(new Date(renter.moveInDate), "MMM d, yyyy")} • Rent: ₹{renter.monthlyRentAmount.toLocaleString('en-IN')}
                    </p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[180px]">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <EditRenterModal
                                renterId={renter.id}
                                initialData={{
                                    name: renter.name,
                                    email: renter.email,
                                    phone: renter.phone,
                                    monthlyRentAmount: renter.monthlyRentAmount,
                                    moveInDate: renter.moveInDate.toISOString() // pass raw date
                                }}
                            />
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <DeleteRenterButton renterId={renter.id} renterName={renter.name} />
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Electricity Bill Generator</CardTitle>
                            <CardDescription>Calculate the monthly bill and send a professional email. This will also record the bill into the payment history for this month.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ElectricityBillGenerator
                                renterId={renter.id}
                                renterName={renter.name}
                                billedMonths={billedMonths}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Payments & Bills</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {renter.payments.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No payment history yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {renter.payments.map((payment) => (
                                        <div key={payment.id} className="flex justify-between items-center p-3 sm:p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
                                            <div>
                                                <p className="font-medium">Month: {payment.month}</p>
                                                <p className="text-xs text-muted-foreground flex gap-4 mt-1">
                                                    <span>Rent: ₹{renter.monthlyRentAmount.toLocaleString('en-IN')}</span>
                                                    {(payment.electricityTotal != null && payment.electricityTotal > 0) && <span>Electricity: ₹{payment.electricityTotal.toFixed(2)}</span>}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-1 items-end">
                                                <Badge variant={payment.rentPaid ? "default" : "destructive"} className="text-[10px] w-24 justify-center">
                                                    {payment.rentPaid ? "Rent Paid" : "Rent Unpaid"}
                                                </Badge>
                                                {(payment.electricityTotal != null && payment.electricityTotal > 0) && (
                                                    <Badge variant={payment.electricityPaid ? "default" : "destructive"} className="text-[10px] w-24 justify-center">
                                                        {payment.electricityPaid ? "Elec Paid" : "Elec Unpaid"}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div>
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Document Vault</CardTitle>
                            <CardDescription>Upload identity verification (Aadhar, PAN, Passport) and lease agreements.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DocumentVault renterId={renter.id} initialDocuments={renter.documents as any} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
