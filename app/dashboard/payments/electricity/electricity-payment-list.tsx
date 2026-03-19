"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ElecPaymentUI = {
    id: string;
    renterId: string;
    renterName: string;
    renterPhone: string;
    month: string;
    electricityTotal: number | null;
    electricityPaid: boolean;
    electricityPaidAt: string | null;
    electricityStartDate: string | null;
    electricityEndDate: string | null;
    openingReading: number | null;
    closingReading: number | null;
    electricityUnits: number | null;
    openingPhotoUrl: string | null;
    closingPhotoUrl: string | null;
};

export function ElectricityPaymentList({
    initialPayments,
    activeMonth
}: {
    initialPayments: ElecPaymentUI[];
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
            router.push(`/dashboard/payments/electricity?month=${newMonth}`);
        }
    };

    const handleToggle = async (paymentId: string, currentValue: boolean) => {
        setLoadingId(paymentId);
        const newValue = !currentValue;

        try {
            setPayments(prev => prev.map(p => {
                if (p.id === paymentId) return { ...p, electricityPaid: newValue };
                return p;
            }));

            const res = await fetch("/api/payments", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId, field: "electricityPaid", value: newValue })
            });

            if (!res.ok) throw new Error("Failed to update status");
            toast.success(`Electricity marked as ${newValue ? 'Paid' : 'Unpaid'}`);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update payment status");
            setPayments(prev => prev.map(p => {
                if (p.id === paymentId) return { ...p, electricityPaid: currentValue };
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

    const formatDateShort = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    const handleSendReminder = (payment: ElecPaymentUI) => {
        const phone = payment.renterPhone.replace(/[^0-9]/g, "");
        if (!phone) {
            toast.error("No phone number available for this renter.");
            return;
        }

        const hasDateRange = payment.electricityStartDate && payment.electricityEndDate;
        const periodStr = hasDateRange
            ? `${formatDateShort(payment.electricityStartDate!)} to ${formatDateShort(payment.electricityEndDate!)}`
            : displayMonth;

        let message = `Hi ${payment.renterName},\n\nYour *Electricity Bill* for the period *${periodStr}* is ready.\n`;

        if (payment.openingReading != null && payment.closingReading != null && payment.electricityUnits != null) {
            message += `Units Consumed: *${payment.electricityUnits}* (From ${payment.openingReading} to ${payment.closingReading})\n`;
        }

        message += `Total Amount: *₹${payment.electricityTotal?.toFixed(2)}*\n`;

        if (payment.openingPhotoUrl) {
            message += `\nView Opening Meter Photo: ${payment.openingPhotoUrl}`;
        }
        if (payment.closingPhotoUrl) {
            message += `\nView Closing Meter Photo: ${payment.closingPhotoUrl}`;
        }

        message += `\n\nPlease make the payment at your earliest convenience. Thank you!`;

        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
        toast.success("Opening WhatsApp...");
    };

    const handleSendAcknowledgment = (payment: ElecPaymentUI) => {
        const phone = payment.renterPhone.replace(/[^0-9]/g, "");
        if (!phone) {
            toast.error("No phone number available for this renter.");
            return;
        }

        const hasDateRange = payment.electricityStartDate && payment.electricityEndDate;
        const periodStr = hasDateRange
            ? `${formatDateShort(payment.electricityStartDate!)} to ${formatDateShort(payment.electricityEndDate!)}`
            : displayMonth;

        let message = `Hi ${payment.renterName},\n\nThank you! 🎉 Your *Electricity Bill* for the period *${periodStr}* has been received and marked as *Paid*.\n`;

        if (payment.electricityUnits != null) {
            message += `Units: *${payment.electricityUnits}*\n`;
        }
        message += `Amount Paid: *₹${payment.electricityTotal?.toFixed(2)}*\n`;
        message += `\nThank you for your timely payment!`;

        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
        toast.success("Opening WhatsApp...");
    };

    // Only show renters with an electricity bill generated
    const paymentsWithBill = payments.filter(p => p.electricityTotal != null);
    const paymentsWithoutBill = payments.filter(p => p.electricityTotal == null);

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

            {paymentsWithBill.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground text-sm">
                    No electricity bills generated for this month. Go to each renter&apos;s detail page to generate a bill.
                </p>
            ) : (
                <>
                    {/* Mobile: Card layout */}
                    <div className="space-y-3 md:hidden">
                        {paymentsWithBill.map((payment) => (
                            <Card key={payment.id}>
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-foreground">{payment.renterName}</span>
                                        {!payment.electricityPaid ? (
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
                                        <p className="text-sm font-semibold">₹{payment.electricityTotal?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                                        {payment.electricityStartDate && payment.electricityEndDate && (
                                            <p className="text-xs text-muted-foreground">
                                                Period: {formatDateShort(payment.electricityStartDate)} → {formatDateShort(payment.electricityEndDate)}
                                            </p>
                                        )}
                                        {payment.openingReading != null && payment.closingReading != null && (
                                            <p className="text-xs text-muted-foreground">
                                                Reading: {payment.openingReading} → {payment.closingReading} ({payment.electricityUnits} units)
                                            </p>
                                        )}
                                        {(payment.openingPhotoUrl || payment.closingPhotoUrl) && (
                                            <div className="flex gap-3 pt-1">
                                                {payment.openingPhotoUrl && (
                                                    <a href={payment.openingPhotoUrl} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                                                        <ExternalLink className="w-3 h-3" /> Opening
                                                    </a>
                                                )}
                                                {payment.closingPhotoUrl && (
                                                    <a href={payment.closingPhotoUrl} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                                                        <ExternalLink className="w-3 h-3" /> Closing
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 pt-1">
                                            {loadingId === payment.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            ) : (
                                                <Checkbox
                                                    checked={payment.electricityPaid}
                                                    onCheckedChange={() => handleToggle(payment.id, payment.electricityPaid)}
                                                    className="w-5 h-5"
                                                />
                                            )}
                                            <span className="text-xs">{payment.electricityPaid ? "Paid" : "Unpaid"}</span>
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
                                    <th className="px-6 py-3 font-medium">Bill Amount</th>
                                    <th className="px-6 py-3 font-medium">Period</th>
                                    <th className="px-6 py-3 font-medium">Units</th>
                                    <th className="px-6 py-3 font-medium text-center">Photos</th>
                                    <th className="px-6 py-3 font-medium text-center">Status</th>
                                    <th className="px-6 py-3 font-medium text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {paymentsWithBill.map((payment) => (
                                    <tr key={payment.id} className="bg-card hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">{payment.renterName}</td>
                                        <td className="px-6 py-4 font-medium">₹{payment.electricityTotal?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-4 text-xs text-muted-foreground">
                                            {payment.electricityStartDate && payment.electricityEndDate
                                                ? `${formatDateShort(payment.electricityStartDate)} → ${formatDateShort(payment.electricityEndDate)}`
                                                : "—"
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            {payment.electricityUnits != null ? (
                                                <span>{payment.electricityUnits} <span className="text-muted-foreground">({payment.openingReading}→{payment.closingReading})</span></span>
                                            ) : "—"}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                {payment.openingPhotoUrl && (
                                                    <a href={payment.openingPhotoUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-0.5">
                                                        <ExternalLink className="w-3 h-3" /> Open
                                                    </a>
                                                )}
                                                {payment.closingPhotoUrl && (
                                                    <a href={payment.closingPhotoUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-0.5">
                                                        <ExternalLink className="w-3 h-3" /> Close
                                                    </a>
                                                )}
                                                {!payment.openingPhotoUrl && !payment.closingPhotoUrl && "—"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {loadingId === payment.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                ) : (
                                                    <Checkbox checked={payment.electricityPaid} onCheckedChange={() => handleToggle(payment.id, payment.electricityPaid)} className="w-5 h-5" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center h-full">
                                                {!payment.electricityPaid ? (
                                                    <Button variant="ghost" size="sm" className="gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleSendReminder(payment)}>
                                                        <MessageCircle className="h-4 w-4" />
                                                        <span className="hidden lg:inline text-xs">Remind</span>
                                                    </Button>
                                                ) : (
                                                    <Button variant="ghost" size="sm" className="gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleSendAcknowledgment(payment)}>
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        <span className="hidden lg:inline text-xs">Acknowledge</span>
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

            {paymentsWithoutBill.length > 0 && (
                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                    <p className="text-xs text-muted-foreground">
                        <span className="font-medium">{paymentsWithoutBill.length} renter(s)</span> have no electricity bill for this month yet:
                        {" "}{paymentsWithoutBill.map(p => p.renterName).join(", ")}
                    </p>
                </div>
            )}
        </div>
    );
}
