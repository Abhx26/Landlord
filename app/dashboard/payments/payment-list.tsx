"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type PaymentUI = {
    id: string;
    renterId: string;
    renterName: string;
    renterPhone: string;
    monthlyRentAmount: number;
    month: string;
    rentPaid: boolean;
    electricityTotal: number | null;
    electricityPaid: boolean;
    isNewRecord: boolean;
};

export function PaymentList({
    initialPayments,
    activeMonth
}: {
    initialPayments: PaymentUI[];
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
            router.push(`/dashboard/payments?month=${newMonth}`);
        }
    };

    const handleToggle = async (paymentId: string, renterId: string, month: string, field: "rentPaid" | "electricityPaid", currentValue: boolean, isNewRecord: boolean) => {
        setLoadingId(`${paymentId}-${field}`);
        const newValue = !currentValue;

        try {
            setPayments(prev => prev.map(p => {
                if (p.id === paymentId) return { ...p, [field]: newValue };
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
                body: JSON.stringify({ paymentId: targetPaymentId, field, value: newValue })
            });

            if (!res.ok) throw new Error("Failed to update status");
            toast.success(`${field === 'rentPaid' ? 'Rent' : 'Electricity'} marked as ${newValue ? 'Paid' : 'Unpaid'}`);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update payment status");
            setPayments(prev => prev.map(p => {
                if (p.id === paymentId) return { ...p, [field]: currentValue };
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

    const handleSendReminder = (payment: PaymentUI) => {
        const phone = payment.renterPhone.replace(/[^0-9]/g, "");
        if (!phone) {
            toast.error("No phone number available for this renter.");
            return;
        }
        const unpaidItems: string[] = [];
        if (!payment.rentPaid) unpaidItems.push(`Rent of ₹${payment.monthlyRentAmount.toLocaleString("en-IN")}`);
        if (payment.electricityTotal && !payment.electricityPaid) unpaidItems.push(`Electricity bill of ₹${payment.electricityTotal.toFixed(2)}`);
        const message = `Hi ${payment.renterName}, this is a friendly reminder that your ${unpaidItems.join(" and ")} for ${displayMonth} is pending. Please make the payment at your earliest convenience. Thank you!`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
        toast.success("Opening WhatsApp...");
    };

    const hasUnpaid = (p: PaymentUI) => !p.rentPaid || (p.electricityTotal && !p.electricityPaid);

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
                <p className="py-8 text-center text-muted-foreground text-sm">No active renters found for this billing period.</p>
            ) : (
                <>
                    {/* Mobile: Card layout */}
                    <div className="space-y-3 md:hidden">
                        {payments.map((payment) => (
                            <Card key={payment.id}>
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-foreground">{payment.renterName}</span>
                                        {hasUnpaid(payment) ? (
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
                                            <Badge variant="outline" className="text-[10px] font-normal text-green-600 border-green-200 bg-green-50">All Paid</Badge>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Rent */}
                                        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                                            <p className="text-xs text-muted-foreground">Rent</p>
                                            <p className="text-sm font-semibold">₹{payment.monthlyRentAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                                            <div className="flex items-center gap-2">
                                                {loadingId === `${payment.id}-rentPaid` ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                ) : (
                                                    <Checkbox
                                                        checked={payment.rentPaid}
                                                        onCheckedChange={() => handleToggle(payment.id, payment.renterId, payment.month, "rentPaid", payment.rentPaid, payment.isNewRecord)}
                                                        className="w-5 h-5"
                                                    />
                                                )}
                                                <span className="text-xs">{payment.rentPaid ? "Paid" : "Unpaid"}</span>
                                            </div>
                                        </div>

                                        {/* Electricity */}
                                        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                                            <p className="text-xs text-muted-foreground">Electricity</p>
                                            {payment.electricityTotal ? (
                                                <>
                                                    <p className="text-sm font-semibold">₹{payment.electricityTotal.toFixed(2)}</p>
                                                    <div className="flex items-center gap-2">
                                                        {loadingId === `${payment.id}-electricityPaid` ? (
                                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                        ) : (
                                                            <Checkbox
                                                                checked={payment.electricityPaid}
                                                                onCheckedChange={() => handleToggle(payment.id, payment.renterId, payment.month, "electricityPaid", payment.electricityPaid, payment.isNewRecord)}
                                                                className="w-5 h-5"
                                                            />
                                                        )}
                                                        <span className="text-xs">{payment.electricityPaid ? "Paid" : "Unpaid"}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="text-xs italic text-muted-foreground mt-1">Not generated</p>
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
                                    <th className="px-6 py-3 font-medium text-center">Rent Paid</th>
                                    <th className="px-6 py-3 font-medium">Electricity Bill</th>
                                    <th className="px-6 py-3 font-medium text-center">Electricity Paid</th>
                                    <th className="px-6 py-3 font-medium text-center">Reminder</th>
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
                                            <div className="flex items-center justify-center h-full">
                                                {loadingId === `${payment.id}-rentPaid` ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                ) : (
                                                    <Checkbox checked={payment.rentPaid} onCheckedChange={() => handleToggle(payment.id, payment.renterId, payment.month, "rentPaid", payment.rentPaid, payment.isNewRecord)} className="w-5 h-5" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {payment.electricityTotal ? (
                                                <div className="font-medium flex items-center justify-between w-full pr-4">
                                                    <span>₹{payment.electricityTotal.toFixed(2)}</span>
                                                    <Badge variant="outline" className="text-[10px] ml-2 font-normal">-</Badge>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs italic">Not generated</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center h-full">
                                                {!payment.electricityTotal ? (
                                                    <span className="text-muted-foreground">-</span>
                                                ) : loadingId === `${payment.id}-electricityPaid` ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                ) : (
                                                    <Checkbox checked={payment.electricityPaid} onCheckedChange={() => handleToggle(payment.id, payment.renterId, payment.month, "electricityPaid", payment.electricityPaid, payment.isNewRecord)} className="w-5 h-5" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center h-full">
                                                {hasUnpaid(payment) ? (
                                                    <Button variant="ghost" size="sm" className="gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleSendReminder(payment)} title={`Send WhatsApp reminder for ${displayMonth}`}>
                                                        <MessageCircle className="h-4 w-4" />
                                                        <span className="hidden sm:inline text-xs">Remind</span>
                                                    </Button>
                                                ) : (
                                                    <Badge variant="outline" className="text-[10px] font-normal text-green-600 border-green-200 bg-green-50">All Paid</Badge>
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
