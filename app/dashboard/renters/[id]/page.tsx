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
import { PaymentHistory } from "./payment-history";
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
                orderBy: { createdAt: "desc" }
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

    // Serialize payments for client component
    const serializedPayments = renter.payments.map(p => ({
        id: p.id,
        month: p.month,
        rentAmount: p.rentAmount,
        rentPaid: p.rentPaid,
        rentPaidAt: p.rentPaidAt?.toISOString() || null,
        electricityTotal: p.electricityTotal,
        electricityPaid: p.electricityPaid,
        electricityPaidAt: p.electricityPaidAt?.toISOString() || null,
        electricityStartDate: p.electricityStartDate?.toISOString() || null,
        electricityEndDate: p.electricityEndDate?.toISOString() || null,
        openingReading: p.openingReading,
        closingReading: p.closingReading,
        electricityUnits: p.electricityUnits,
        openingPhotoUrl: p.openingPhotoUrl,
        closingPhotoUrl: p.closingPhotoUrl,
        createdAt: p.createdAt.toISOString(),
    }));

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">
                            {renter.name}
                        </h2>
                        <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700">Active</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                        <span>{renter.phone || "No Phone"}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>Moved in {format(new Date(renter.moveInDate), "MMM d, yyyy")}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>Rent: ₹{renter.monthlyRentAmount.toLocaleString('en-IN')}</span>
                        {renter.securityDeposit != null && (
                            <>
                                <span className="hidden sm:inline">•</span>
                                <span>Deposit: ₹{renter.securityDeposit.toLocaleString('en-IN')}</span>
                            </>
                        )}
                        {renter.room && (Array.isArray(renter.room) ? renter.room.length > 0 : true) && (
                            <>
                                <span className="hidden sm:inline">•</span>
                                <span>{Array.isArray(renter.room) ? renter.room.join(", ") : renter.room}</span>
                            </>
                        )}
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
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
                                    phone: renter.phone,
                                    monthlyRentAmount: renter.monthlyRentAmount,
                                    moveInDate: renter.moveInDate.toISOString(),
                                    securityDeposit: renter.securityDeposit,
                                    room: renter.room,
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Left Column */}
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Electricity Bill Generator</CardTitle>
                            <CardDescription>Calculate the monthly bill. This will also record the bill into the payment history for this month.</CardDescription>
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
                            <CardTitle>Payment History</CardTitle>
                            <CardDescription>All past payments with exact date and time they were marked as paid.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PaymentHistory payments={serializedPayments} />
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
