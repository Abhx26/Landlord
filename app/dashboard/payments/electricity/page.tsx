import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ElectricityPaymentList } from "./electricity-payment-list";

export default async function ElectricityRentPage({
    searchParams
}: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect("/auth/signin");
    }

    const params = await searchParams;
    let selectedMonth = params?.month as string;

    if (!selectedMonth) {
        const date = new Date();
        selectedMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    const dateObj = new Date(selectedMonth + "-01");
    const displayMonthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

    const renters = await prisma.renter.findMany({
        where: { userId: session.user.id },
        include: {
            payments: {
                where: { month: selectedMonth }
            }
        },
        orderBy: { name: "asc" }
    });

    const paymentsData = renters.map(renter => {
        const payment = renter.payments.length > 0 ? renter.payments[0] : null;
        const hasElecBill = payment?.electricityTotal != null && payment.electricityTotal > 0;

        return {
            id: payment?.id || `new-${renter.id}`,
            renterId: renter.id,
            renterName: renter.name,
            renterPhone: renter.phone || "",
            month: selectedMonth,
            electricityTotal: hasElecBill ? payment!.electricityTotal! : null,
            electricityPaid: hasElecBill ? (payment!.electricityPaid || false) : false,
            electricityPaidAt: payment?.electricityPaidAt?.toISOString() || null,
            electricityStartDate: payment?.electricityStartDate?.toISOString() || null,
            electricityEndDate: payment?.electricityEndDate?.toISOString() || null,
            openingReading: payment?.openingReading ?? null,
            closingReading: payment?.closingReading ?? null,
            electricityUnits: payment?.electricityUnits ?? null,
            openingPhotoUrl: payment?.openingPhotoUrl || null,
            closingPhotoUrl: payment?.closingPhotoUrl || null,
        };
    });

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                    Electricity Rent - {displayMonthName}
                </h2>
                <p className="text-muted-foreground mt-1">
                    Track electricity bill payments and send detailed reminders with proof.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Electricity Bill Tracker</CardTitle>
                    <CardDescription>
                        Toggle the checkboxes when a tenant pays their electricity bill. Send WhatsApp reminders with full billing details and photo proof.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ElectricityPaymentList initialPayments={paymentsData} activeMonth={selectedMonth} />
                </CardContent>
            </Card>
        </div>
    );
}
