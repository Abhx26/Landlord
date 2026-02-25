"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Pencil, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type EditRenterModalProps = {
    renterId: string;
    initialData: {
        name: string;
        email: string;
        phone: string;
        monthlyRentAmount: number;
        moveInDate: string; // ISO string format
    };
};

export function EditRenterModal({ renterId, initialData }: EditRenterModalProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Format the date properly for an <input type="date">
    const formattedDate = new Date(initialData.moveInDate).toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        name: initialData.name,
        email: initialData.email,
        phone: initialData.phone || "",
        monthlyRentAmount: initialData.monthlyRentAmount.toString(),
        moveInDate: formattedDate,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`/api/renters/${renterId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    monthlyRentAmount: parseFloat(formData.monthlyRentAmount),
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update renter");
            }

            toast.success("Renter updated successfully!");
            setOpen(false);
            router.refresh(); // Refresh the page to show updated details
        } catch (error) {
            toast.error("Failed to update renter. Please try again.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 h-auto px-2 py-1.5 focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                    <Pencil className="h-4 w-4" />
                    Edit Details
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Renter</DialogTitle>
                        <DialogDescription>
                            Update the contact info or monthly rent for this tenant.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="John Doe"
                                required
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="+919876543210"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="monthlyRentAmount">Monthly Rent (₹)</Label>
                                <Input
                                    id="monthlyRentAmount"
                                    name="monthlyRentAmount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="1500"
                                    required
                                    value={formData.monthlyRentAmount}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="moveInDate">Move-in Date</Label>
                                <Input
                                    id="moveInDate"
                                    name="moveInDate"
                                    type="date"
                                    required
                                    value={formData.moveInDate}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
