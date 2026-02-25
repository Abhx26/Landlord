import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { month, units, costPerUnit, total } = await req.json();

        if (!month || units === undefined || costPerUnit === undefined || total === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // A real electricity bill must have a positive total
        if (total <= 0) {
            return NextResponse.json({ error: "Bill total must be greater than 0" }, { status: 400 });
        }

        // Verify renter
        const renter = await prisma.renter.findUnique({
            where: { id, userId: session.user.id }
        });

        if (!renter) {
            return NextResponse.json({ error: "Renter not found" }, { status: 404 });
        }

        // Find the payment for this month 
        const existingPayment = await prisma.payment.findFirst({
            where: { renterId: renter.id, month }
        });

        let payment;
        if (existingPayment) {
            // Check if this month ALREADY has an electricity bill generated
            if (existingPayment.electricityTotal !== null) {
                return NextResponse.json(
                    { error: "An electricity bill has already been generated for this month." },
                    { status: 400 }
                );
            }

            // Update existing payment record to add the newly generated electricity bill
            payment = await prisma.payment.update({
                where: { id: existingPayment.id },
                data: {
                    electricityUnits: units,
                    electricityCostPerUnit: costPerUnit,
                    electricityTotal: total,
                    electricityPaid: false
                }
            });
        } else {
            // Create brand new payment record containing the electricity bill (rent is defaulted to unpaid)
            payment = await prisma.payment.create({
                data: {
                    renterId: renter.id,
                    userId: session.user.id,
                    month,
                    renterName: renter.name,
                    rentAmount: renter.monthlyRentAmount,
                    electricityUnits: units,
                    electricityCostPerUnit: costPerUnit,
                    electricityTotal: total,
                    electricityPaid: false,
                    rentPaid: false
                }
            });
        }
        // We no longer attempt to send an email, logic has been removed.

        return NextResponse.json(payment, { status: 201 });
    } catch (error) {
        console.error("Error generating bill:", error);
        return NextResponse.json(
            { error: "Failed to generate bill" },
            { status: 500 }
        );
    }
}
