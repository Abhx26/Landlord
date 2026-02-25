import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentList } from "./payment-list";

export default async function PaymentsPage({
    searchParams
}: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect("/auth/signin");
    }

    // Get month from URL or fallback to current month
    const params = await searchParams;
    let selectedMonth = params?.month as string;

    if (!selectedMonth) {
        const date = new Date();
        selectedMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    // Determine a formatted human name (e.g. "February 2026")
    const dateObj = new Date(selectedMonth + "-01"); // Append day to prevent time-zone shifts
    const displayMonthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Find all renters for this user
    const renters = await prisma.renter.findMany({
        where: { userId: session.user.id },
        include: {
            payments: {
                where: { month: selectedMonth }
            }
        },
        orderBy: { name: "asc" }
    });

    // Prepare standard payment shape for the UI
    // If a renter doesn't have a payment record for this month yet, we'll create a default one in memory to display
    const paymentsData = renters.map(renter => {
        const payment = renter.payments.length > 0 ? renter.payments[0] : null;

        return {
            id: payment?.id || `new-${renter.id}`,
            renterId: renter.id,
            renterName: renter.name,
            renterPhone: renter.phone || "",
            monthlyRentAmount: renter.monthlyRentAmount,
            month: selectedMonth,
            rentPaid: payment?.rentPaid || false,
            electricityTotal: (payment?.electricityTotal && payment.electricityTotal > 0) ? payment.electricityTotal : null,
            electricityPaid: (payment?.electricityTotal && payment.electricityTotal > 0) ? (payment?.electricityPaid || false) : false,
            isNewRecord: !payment, // Flag to indicate if we need to create the record on first toggle
        };
    });

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                    Payments - {displayMonthName}
                </h2>
                <p className="text-muted-foreground mt-1">
                    Track rent and electricity payments for the current month.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Month Tracker</CardTitle>
                    <CardDescription>
                        Toggle the checkboxes below when a tenant pays their rent or their generated electricity bill.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <PaymentList initialPayments={paymentsData} activeMonth={selectedMonth} />
                </CardContent>
            </Card>
        </div>
    );
}
