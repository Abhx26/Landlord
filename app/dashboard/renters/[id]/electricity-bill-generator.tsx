"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Calculator, AlertCircle } from "lucide-react";
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
    const [units, setUnits] = useState("");
    const [totalCost, setTotalCost] = useState("");

    // Predict current month
    const date = new Date();
    const currentMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const [month, setMonth] = useState(currentMonth);

    // Calculate if the specifically selected month already has an electricity bill
    const isAlreadyBilled = billedMonths.includes(month);

    const handleGenerateAndSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!units || !totalCost || !month || isAlreadyBilled) return;

        setIsLoading(true);

        try {
            const response = await fetch(`/api/renters/${renterId}/bills`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    month,
                    units: parseFloat(units),
                    costPerUnit: 0, // Not used anymore as per user request
                    total: parseFloat(totalCost),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to generate bill");
            }

            toast.success("Bill generated and saved! You can send a reminder from the Payments page.");

            setUnits("");
            setTotalCost("");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleGenerateAndSend} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="month">Billing Month</Label>
                    <Input
                        id="month"
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="units">Units Consumed</Label>
                    <Input
                        id="units"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g. 150"
                        value={units}
                        onChange={(e) => setUnits(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="totalCost">Total Bill Amount (₹)</Label>
                    <Input
                        id="totalCost"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g. 1500"
                        value={totalCost}
                        onChange={(e) => setTotalCost(e.target.value)}
                        required
                    />
                </div>
            </div>

            <Button
                type="submit"
                className="w-full gap-2 bg-primary hover:bg-primary/90"
                disabled={isLoading || parseFloat(totalCost || "0") <= 0 || isAlreadyBilled}
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                Generate Bill
            </Button>

            {isAlreadyBilled && (
                <div className="flex items-center gap-2 text-sm text-destructive justify-center mt-2 bg-destructive/10 p-2 rounded-md">
                    <AlertCircle className="w-4 h-4" />
                    <span>An electricity bill has already been generated for {month}.</span>
                </div>
            )}
        </form>
    );
}
