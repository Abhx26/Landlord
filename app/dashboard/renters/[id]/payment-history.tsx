"use client";

import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { format } from "date-fns";

type Payment = {
    id: string;
    month: string;
    rentAmount: number | null;
    rentPaid: boolean;
    rentPaidAt: string | null;
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
    createdAt: string;
};

export function PaymentHistory({ payments }: { payments: Payment[] }) {
    if (payments.length === 0) {
        return (
            <p className="text-sm text-muted-foreground text-center py-4">
                No payment history yet.
            </p>
        );
    }

    const formatDateShort = (dateStr: string) =>
        format(new Date(dateStr), "dd MMM yyyy");

    return (
        <div className="space-y-3">
            {payments.map((payment) => (
                <div key={payment.id} className="rounded-lg border border-border bg-card overflow-hidden">
                    <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
                        <span className="font-medium text-sm">{payment.month}</span>
                    </div>
                    <div className="divide-y divide-border">
                        {/* Rent Entry */}
                        {payment.rentAmount != null && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 gap-2">
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="text-[10px] w-20 justify-center bg-blue-50 text-blue-700 border-blue-200">
                                        Rent
                                    </Badge>
                                    <span className="text-sm font-semibold">
                                        ₹{payment.rentAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant={payment.rentPaid ? "default" : "destructive"} className="text-[10px] w-16 justify-center">
                                        {payment.rentPaid ? "Paid" : "Unpaid"}
                                    </Badge>
                                    {payment.rentPaid && payment.rentPaidAt && (
                                        <span className="text-xs text-muted-foreground">
                                            {format(new Date(payment.rentPaidAt), "MMM d, yyyy 'at' h:mm a")}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Electricity Entry */}
                        {payment.electricityTotal != null && payment.electricityTotal > 0 && (
                            <div className="px-4 py-3 space-y-2">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="text-[10px] w-20 justify-center bg-amber-50 text-amber-700 border-amber-200">
                                            Electricity
                                        </Badge>
                                        <span className="text-sm font-semibold">
                                            ₹{payment.electricityTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={payment.electricityPaid ? "default" : "destructive"} className="text-[10px] w-16 justify-center">
                                            {payment.electricityPaid ? "Paid" : "Unpaid"}
                                        </Badge>
                                        {payment.electricityPaid && payment.electricityPaidAt && (
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(payment.electricityPaidAt), "MMM d, yyyy 'at' h:mm a")}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Date range & readings details */}
                                <div className="bg-muted/30 rounded-md px-3 py-2 text-xs text-muted-foreground space-y-1">
                                    {payment.electricityStartDate && payment.electricityEndDate && (
                                        <p>Period: <span className="font-medium text-foreground">{formatDateShort(payment.electricityStartDate)} → {formatDateShort(payment.electricityEndDate)}</span></p>
                                    )}
                                    {payment.openingReading != null && payment.closingReading != null && (
                                        <p>Reading: <span className="font-medium text-foreground">{payment.openingReading} → {payment.closingReading}</span> ({payment.electricityUnits} units)</p>
                                    )}
                                    {(payment.openingPhotoUrl || payment.closingPhotoUrl) && (
                                        <div className="flex gap-3 pt-1">
                                            {payment.openingPhotoUrl && (
                                                <a href={payment.openingPhotoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                                                    <ExternalLink className="w-3 h-3" /> Opening Photo
                                                </a>
                                            )}
                                            {payment.closingPhotoUrl && (
                                                <a href={payment.closingPhotoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                                                    <ExternalLink className="w-3 h-3" /> Closing Photo
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
