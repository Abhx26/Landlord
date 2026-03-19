"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Camera, Loader2, ImageIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type MeterReadingData = {
    id: string;
    month: string;
    meterPhotoUrl: string;
    unitsConsumed: number;
    calculatedAmount: number;
    createdAt: string;
};

export function MeterReadings({
    renterId,
    initialReadings = [],
}: {
    renterId: string;
    initialReadings?: MeterReadingData[];
}) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [readings, setReadings] = useState<MeterReadingData[]>(initialReadings);
    const [photoUrl, setPhotoUrl] = useState("");
    const [unitsConsumed, setUnitsConsumed] = useState("");
    const [calculatedAmount, setCalculatedAmount] = useState("");

    // Default to current month
    const date = new Date();
    const currentMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const [month, setMonth] = useState(currentMonth);

    const existingMonths = readings.map((r) => r.month);
    const isAlreadyRecorded = existingMonths.includes(month);

    const handleUploadSuccess = (result: any) => {
        const url = result.info.secure_url;
        setPhotoUrl(url);
        toast.success("Meter photo uploaded!");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!photoUrl || !unitsConsumed || !calculatedAmount || !month || isAlreadyRecorded) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/renters/${renterId}/meter-readings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    month,
                    meterPhotoUrl: photoUrl,
                    unitsConsumed: parseFloat(unitsConsumed),
                    calculatedAmount: parseFloat(calculatedAmount),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save meter reading");
            }

            const newReading = await res.json();
            setReadings((prev) => [newReading, ...prev]);
            setPhotoUrl("");
            setUnitsConsumed("");
            setCalculatedAmount("");
            toast.success("Meter reading saved!");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Upload Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="reading-month">Month</Label>
                        <Input
                            id="reading-month"
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Meter Photo</Label>
                        <CldUploadWidget
                            uploadPreset="ml_default"
                            onSuccess={handleUploadSuccess}
                            options={{
                                sources: ["local", "camera"],
                                multiple: false,
                                maxFiles: 1,
                            }}
                        >
                            {({ open }) => (
                                <Button
                                    type="button"
                                    variant={photoUrl ? "outline" : "secondary"}
                                    className="w-full gap-2"
                                    onClick={() => open()}
                                >
                                    {photoUrl ? (
                                        <>
                                            <ImageIcon className="w-4 h-4 text-green-600" />
                                            Photo Uploaded
                                        </>
                                    ) : (
                                        <>
                                            <Camera className="w-4 h-4" />
                                            Take Meter Photo
                                        </>
                                    )}
                                </Button>
                            )}
                        </CldUploadWidget>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="units-consumed">Units Consumed</Label>
                        <Input
                            id="units-consumed"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g. 150"
                            value={unitsConsumed}
                            onChange={(e) => setUnitsConsumed(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="calc-amount">Calculated Amount (₹)</Label>
                        <Input
                            id="calc-amount"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g. 1500"
                            value={calculatedAmount}
                            onChange={(e) => setCalculatedAmount(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={isLoading || !photoUrl || isAlreadyRecorded}
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Camera className="w-4 h-4" />
                    )}
                    Save Meter Reading
                </Button>

                {isAlreadyRecorded && (
                    <p className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded-md">
                        A meter reading already exists for {month}.
                    </p>
                )}
            </form>

            {/* Readings List */}
            {readings.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Past Readings</h4>
                    {readings.map((reading) => (
                        <div
                            key={reading.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors gap-2"
                        >
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                                    {reading.month}
                                </Badge>
                                <span className="text-sm">
                                    {reading.unitsConsumed} units — ₹{reading.calculatedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                    {format(new Date(reading.createdAt), "MMM d, yyyy")}
                                </span>
                                <a
                                    href={reading.meterPhotoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Photo
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
