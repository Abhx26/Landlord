import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RentPaymentList } from "./rent-payment-list";

export default async function MonthlyRentPage({
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

        return {
            id: payment?.id || `new-${renter.id}`,
            renterId: renter.id,
            renterName: renter.name,
            renterPhone: renter.phone || "",
            monthlyRentAmount: renter.monthlyRentAmount,
            month: selectedMonth,
            rentPaid: payment?.rentPaid || false,
            rentPaidAt: payment?.rentPaidAt?.toISOString() || null,
            isNewRecord: !payment,
        };
    });

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                    Monthly Rent - {displayMonthName}
                </h2>
                <p className="text-muted-foreground mt-1">
                    Track monthly rent payments and send reminders.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Rent Tracker</CardTitle>
                    <CardDescription>
                        Toggle the checkboxes when a tenant pays their monthly rent.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RentPaymentList initialPayments={paymentsData} activeMonth={selectedMonth} />
                </CardContent>
            </Card>
        </div>
    );
}
