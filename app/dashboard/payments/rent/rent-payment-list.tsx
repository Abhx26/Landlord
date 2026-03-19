"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type RentPaymentUI = {
    id: string;
    renterId: string;
    renterName: string;
    renterPhone: string;
    monthlyRentAmount: number;
    month: string;
    rentPaid: boolean;
    rentPaidAt: string | null;
    isNewRecord: boolean;
};

export function RentPaymentList({
    initialPayments,
    activeMonth
}: {
    initialPayments: RentPaymentUI[];
    activeMonth: string;
}) {
    const router = useRouter();
    const [payments, setPayments] = useState(initialPayments);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    useEffect(() => {
        setPayments(initialPayments);
    }, [initialPayments]);

    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMonth = e.target.value;
        if (newMonth) {
            router.push(`/dashboard/payments/rent?month=${newMonth}`);
        }
    };

    const handleToggle = async (paymentId: string, renterId: string, month: string, currentValue: boolean, isNewRecord: boolean) => {
        setLoadingId(paymentId);
        const newValue = !currentValue;

        try {
            setPayments(prev => prev.map(p => {
                if (p.id === paymentId) return { ...p, rentPaid: newValue };
                return p;
            }));

            let targetPaymentId = paymentId;

            if (isNewRecord) {
                const createRes = await fetch(`/api/payments`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ renterId, month }),
                });
                if (!createRes.ok) throw new Error("Failed to initialize payment record");
                const newRecord = await createRes.json();
                targetPaymentId = newRecord.id;

                setPayments(prev => prev.map(p => {
                    if (p.id === paymentId) return { ...p, id: targetPaymentId, isNewRecord: false };
                    return p;
                }));
            }

            const res = await fetch("/api/payments", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId: targetPaymentId, field: "rentPaid", value: newValue })
            });

            if (!res.ok) throw new Error("Failed to update status");
            toast.success(`Rent marked as ${newValue ? 'Paid' : 'Unpaid'}`);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update payment status");
            setPayments(prev => prev.map(p => {
                if (p.id === paymentId) return { ...p, rentPaid: currentValue };
                return p;
            }));
        } finally {
            setLoadingId(null);
        }
    };

    const displayMonth = (() => {
        const d = new Date(activeMonth + "-01");
        return d.toLocaleString("default", { month: "long", year: "numeric" });
    })();

    const handleSendReminder = (payment: RentPaymentUI) => {
        const phone = payment.renterPhone.replace(/[^0-9]/g, "");
        if (!phone) {
            toast.error("No phone number available for this renter.");
            return;
        }
        const message = `Hi ${payment.renterName},\n\nThis is a friendly reminder that your *Rent of ₹${payment.monthlyRentAmount.toLocaleString("en-IN")}* for ${displayMonth} is pending.\n\nPlease make the payment at your earliest convenience. Thank you!`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
        toast.success("Opening WhatsApp...");
    };

    const handleSendAcknowledgment = (payment: RentPaymentUI) => {
        const phone = payment.renterPhone.replace(/[^0-9]/g, "");
        if (!phone) {
            toast.error("No phone number available for this renter.");
            return;
        }
        const message = `Hi ${payment.renterName},\n\nThank you! 🎉 Your *Rent of ₹${payment.monthlyRentAmount.toLocaleString("en-IN")}* for *${displayMonth}* has been received and marked as *Paid*.\n\nThank you for your timely payment!`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
        toast.success("Opening WhatsApp...");
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Month filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/30 p-3 sm:p-4 rounded-lg border border-border">
                <div className="space-y-1">
                    <h3 className="text-sm font-medium">Filter by Month</h3>
                    <p className="text-xs text-muted-foreground">Select a billing period.</p>
                </div>
                <input
                    type="month"
                    value={activeMonth}
                    onChange={handleMonthChange}
                    className="flex h-10 w-full sm:w-auto sm:max-w-[200px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
            </div>

            {payments.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground text-sm">No active renters found.</p>
            ) : (
                <>
                    {/* Mobile: Card layout */}
                    <div className="space-y-3 md:hidden">
                        {payments.map((payment) => (
                            <Card key={payment.id}>
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-foreground">{payment.renterName}</span>
                                        {!payment.rentPaid ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 h-8"
                                                onClick={() => handleSendReminder(payment)}
                                            >
                                                <MessageCircle className="h-4 w-4" />
                                                Remind
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8"
                                                onClick={() => handleSendAcknowledgment(payment)}
                                            >
                                                <CheckCircle2 className="h-4 w-4" />
                                                Acknowledge
                                            </Button>
                                        )}
                                    </div>
                                    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                                        <p className="text-sm font-semibold">₹{payment.monthlyRentAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                                        <div className="flex items-center gap-2">
                                            {loadingId === payment.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            ) : (
                                                <Checkbox
                                                    checked={payment.rentPaid}
                                                    onCheckedChange={() => handleToggle(payment.id, payment.renterId, payment.month, payment.rentPaid, payment.isNewRecord)}
                                                    className="w-5 h-5"
                                                />
                                            )}
                                            <span className="text-xs">{payment.rentPaid ? "Paid" : "Unpaid"}</span>
                                            {payment.rentPaid && payment.rentPaidAt && (
                                                <span className="text-xs text-muted-foreground ml-auto">
                                                    {new Date(payment.rentPaidAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Desktop: Table layout */}
                    <div className="overflow-x-auto hidden md:block">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Renter</th>
                                    <th className="px-6 py-3 font-medium">Rent Amount</th>
                                    <th className="px-6 py-3 font-medium text-center">Status</th>
                                    <th className="px-6 py-3 font-medium text-center">Paid On</th>
                                    <th className="px-6 py-3 font-medium text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {payments.map((payment) => (
                                    <tr key={payment.id} className="bg-card hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">{payment.renterName}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium">₹{payment.monthlyRentAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center h-full gap-2">
                                                {loadingId === payment.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                ) : (
                                                    <Checkbox checked={payment.rentPaid} onCheckedChange={() => handleToggle(payment.id, payment.renterId, payment.month, payment.rentPaid, payment.isNewRecord)} className="w-5 h-5" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-xs text-muted-foreground">
                                            {payment.rentPaid && payment.rentPaidAt
                                                ? new Date(payment.rentPaidAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                                                : "—"
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center h-full">
                                                {!payment.rentPaid ? (
                                                    <Button variant="ghost" size="sm" className="gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleSendReminder(payment)}>
                                                        <MessageCircle className="h-4 w-4" />
                                                        <span className="hidden sm:inline text-xs">Remind</span>
                                                    </Button>
                                                ) : (
                                                    <Button variant="ghost" size="sm" className="gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleSendAcknowledgment(payment)}>
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        <span className="hidden sm:inline text-xs">Acknowledge</span>
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
