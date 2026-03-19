import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Create a rent-only payment record (no electricity data)
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { renterId, month } = await req.json();

        if (!renterId || !month) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify renter belongs to this user
        const renter = await prisma.renter.findUnique({
            where: { id: renterId, userId: session.user.id }
        });

        if (!renter) {
            return NextResponse.json({ error: "Renter not found" }, { status: 404 });
        }

        // Check if a payment record already exists for this month
        const existing = await prisma.payment.findFirst({
            where: { renterId, month }
        });

        if (existing) {
            return NextResponse.json(existing);
        }

        // Create a new payment record — only rent fields, electricity stays null
        const payment = await prisma.payment.create({
            data: {
                renterId,
                userId: session.user.id,
                month,
                renterName: renter.name,
                rentAmount: renter.monthlyRentAmount,
                rentPaid: false,
            }
        });

        return NextResponse.json(payment, { status: 201 });
    } catch (error) {
        console.error("Error creating payment record:", error);
        return NextResponse.json(
            { error: "Failed to create payment record" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { paymentId, field, value } = await req.json();

        if (!paymentId || !field || value === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Security check: ensure payment belongs to the user
        const existingPayment = await prisma.payment.findUnique({
            where: { id: paymentId, userId: session.user.id }
        });

        if (!existingPayment) {
            return NextResponse.json({ error: "Payment not found" }, { status: 404 });
        }

        // Only allow updating specific boolean fields
        if (field !== "rentPaid" && field !== "electricityPaid") {
            return NextResponse.json({ error: "Invalid field" }, { status: 400 });
        }

        // Build update data with paidAt timestamp
        const paidAtField = field === "rentPaid" ? "rentPaidAt" : "electricityPaidAt";
        const updateData: Record<string, any> = {
            [field]: value,
            [paidAtField]: value ? new Date() : null,
        };

        const updatedPayment = await prisma.payment.update({
            where: { id: paymentId },
            data: updateData
        });

        return NextResponse.json(updatedPayment);
    } catch (error) {
        console.error("Error updating payment:", error);
        return NextResponse.json(
            { error: "Failed to update payment" },
            { status: 500 }
        );
    }
}
