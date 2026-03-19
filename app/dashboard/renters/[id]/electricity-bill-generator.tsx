"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Calculator, AlertCircle, Camera, ImageIcon } from "lucide-react";
import { toast } from "sonner";

export function ElectricityBillGenerator({
    renterId,
    renterName,
    billedMonths = []
}: {
    renterId: string;
    renterName: string;
    billedMonths?: string[];
}) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Date range
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Readings
    const [openingReading, setOpeningReading] = useState("");
    const [closingReading, setClosingReading] = useState("");

    // Photos
    const [openingPhotoUrl, setOpeningPhotoUrl] = useState("");
    const [closingPhotoUrl, setClosingPhotoUrl] = useState("");

    // Final amount
    const [totalAmount, setTotalAmount] = useState("");

    // Auto-calculate units
    const calculatedUnits = useMemo(() => {
        const open = parseFloat(openingReading);
        const close = parseFloat(closingReading);
        if (!isNaN(open) && !isNaN(close) && close >= open) {
            return close - open;
        }
        return null;
    }, [openingReading, closingReading]);

    // Derive month from startDate for storage
    const derivedMonth = useMemo(() => {
        if (!startDate) return "";
        const d = new Date(startDate);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }, [startDate]);

    const isAlreadyBilled = derivedMonth ? billedMonths.includes(derivedMonth) : false;

    // Validation
    const isEndDateInvalid = startDate && endDate && new Date(endDate) < new Date(startDate);

    // Format date for display
    const formatDate = (dateStr: string) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    };

    const handleGenerateBill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate || !openingReading || !closingReading || !totalAmount || isAlreadyBilled || isEndDateInvalid) return;

        setIsLoading(true);

        try {
            const response = await fetch(`/api/renters/${renterId}/bills`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    month: derivedMonth,
                    startDate,
                    endDate,
                    openingReading: parseFloat(openingReading),
                    closingReading: parseFloat(closingReading),
                    openingPhotoUrl: openingPhotoUrl || null,
                    closingPhotoUrl: closingPhotoUrl || null,
                    units: calculatedUnits,
                    total: parseFloat(totalAmount),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to generate bill");
            }

            toast.success("Bill generated and saved!");

            setStartDate("");
            setEndDate("");
            setOpeningReading("");
            setClosingReading("");
            setOpeningPhotoUrl("");
            setClosingPhotoUrl("");
            setTotalAmount("");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleGenerateBill} className="space-y-5">
            {/* Billing Period */}
            <div>
                <h4 className="text-sm font-medium mb-3 text-foreground">Billing Period</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                            id="startDate"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                            id="endDate"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate || undefined}
                            required
                        />
                    </div>
                </div>
                {startDate && endDate && !isEndDateInvalid && (
                    <p className="text-xs text-muted-foreground mt-2 bg-muted/40 px-3 py-1.5 rounded-md">
                        Billing Period: <span className="font-medium">{formatDate(startDate)}</span> to <span className="font-medium">{formatDate(endDate)}</span>
                    </p>
                )}
                {isEndDateInvalid && (
                    <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> End date cannot be before start date.
                    </p>
                )}
            </div>

            {/* Readings & Photos */}
            <div>
                <h4 className="text-sm font-medium mb-3 text-foreground">Meter Readings & Photos</h4>
                <div className="grid grid-cols-1 gap-4">
                    {/* Opening Reading */}
                    <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Opening Reading {startDate ? `(${formatDate(startDate)})` : ""}</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="openingReading">Reading Value</Label>
                                <Input
                                    id="openingReading"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="e.g. 4520"
                                    value={openingReading}
                                    onChange={(e) => setOpeningReading(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Meter Photo</Label>
                                <CldUploadWidget
                                    uploadPreset="ml_default"
                                    onSuccess={(result: any) => {
                                        setOpeningPhotoUrl(result.info.secure_url);
                                        toast.success("Opening meter photo uploaded!");
                                    }}
                                    options={{ sources: ["local", "camera"], multiple: false, maxFiles: 1 }}
                                >
                                    {({ open }) => (
                                        <Button type="button" variant={openingPhotoUrl ? "outline" : "secondary"} className="w-full gap-2 h-9 text-xs" onClick={() => open()}>
                                            {openingPhotoUrl ? <><ImageIcon className="w-3.5 h-3.5 text-green-600" /> Uploaded</> : <><Camera className="w-3.5 h-3.5" /> Upload Photo</>}
                                        </Button>
                                    )}
                                </CldUploadWidget>
                            </div>
                        </div>
                    </div>

                    {/* Closing Reading */}
                    <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Closing Reading {endDate ? `(${formatDate(endDate)})` : ""}</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="closingReading">Reading Value</Label>
                                <Input
                                    id="closingReading"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="e.g. 4680"
                                    value={closingReading}
                                    onChange={(e) => setClosingReading(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Meter Photo</Label>
                                <CldUploadWidget
                                    uploadPreset="ml_default"
                                    onSuccess={(result: any) => {
                                        setClosingPhotoUrl(result.info.secure_url);
                                        toast.success("Closing meter photo uploaded!");
                                    }}
                                    options={{ sources: ["local", "camera"], multiple: false, maxFiles: 1 }}
                                >
                                    {({ open }) => (
                                        <Button type="button" variant={closingPhotoUrl ? "outline" : "secondary"} className="w-full gap-2 h-9 text-xs" onClick={() => open()}>
                                            {closingPhotoUrl ? <><ImageIcon className="w-3.5 h-3.5 text-green-600" /> Uploaded</> : <><Camera className="w-3.5 h-3.5" /> Upload Photo</>}
                                        </Button>
                                    )}
                                </CldUploadWidget>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Auto-calculated Units */}
                {calculatedUnits !== null && (
                    <div className="mt-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Units Consumed</span>
                        <span className="text-lg font-bold text-primary">{calculatedUnits.toFixed(2)} units</span>
                    </div>
                )}
            </div>

            {/* Final Amount */}
            <div className="space-y-2">
                <Label htmlFor="totalAmount">Final Amount (₹)</Label>
                <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter the final bill amount"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    required
                    className="text-lg font-semibold"
                />
            </div>

            {/* Submit */}
            <Button
                type="submit"
                className="w-full gap-2 bg-primary hover:bg-primary/90"
                disabled={isLoading || parseFloat(totalAmount || "0") <= 0 || isAlreadyBilled || !!isEndDateInvalid || calculatedUnits === null}
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                Generate Bill
            </Button>

            {isAlreadyBilled && (
                <div className="flex items-center gap-2 text-sm text-destructive justify-center mt-2 bg-destructive/10 p-2 rounded-md">
                    <AlertCircle className="w-4 h-4" />
                    <span>An electricity bill has already been generated for {derivedMonth}.</span>
                </div>
            )}
        </form>
    );
}
