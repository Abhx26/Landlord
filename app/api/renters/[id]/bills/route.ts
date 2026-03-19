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

        const {
            month,
            startDate,
            endDate,
            openingReading,
            closingReading,
            openingPhotoUrl,
            closingPhotoUrl,
            units,
            total,
        } = await req.json();

        if (
            !month ||
            !startDate ||
            !endDate ||
            openingReading === undefined ||
            closingReading === undefined ||
            units === undefined ||
            total === undefined
        ) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (total <= 0) {
            return NextResponse.json({ error: "Bill total must be greater than 0" }, { status: 400 });
        }

        if (new Date(endDate) < new Date(startDate)) {
            return NextResponse.json({ error: "End date cannot be before start date" }, { status: 400 });
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

        const electricityData = {
            electricityStartDate: new Date(startDate),
            electricityEndDate: new Date(endDate),
            openingReading: parseFloat(String(openingReading)),
            closingReading: parseFloat(String(closingReading)),
            openingPhotoUrl: openingPhotoUrl || null,
            closingPhotoUrl: closingPhotoUrl || null,
            electricityUnits: parseFloat(String(units)),
            electricityCostPerUnit: 0,
            electricityTotal: parseFloat(String(total)),
            electricityPaid: false,
        };

        let payment;
        if (existingPayment) {
            if (existingPayment.electricityTotal !== null) {
                return NextResponse.json(
                    { error: "An electricity bill has already been generated for this month." },
                    { status: 400 }
                );
            }

            payment = await prisma.payment.update({
                where: { id: existingPayment.id },
                data: electricityData,
            });
        } else {
            payment = await prisma.payment.create({
                data: {
                    renterId: renter.id,
                    userId: session.user.id,
                    month,
                    renterName: renter.name,
                    rentAmount: renter.monthlyRentAmount,
                    rentPaid: false,
                    ...electricityData,
                },
            });
        }

        return NextResponse.json(payment, { status: 201 });
    } catch (error) {
        console.error("Error generating bill:", error);
        return NextResponse.json(
            { error: "Failed to generate bill" },
            { status: 500 }
        );
    }
}
