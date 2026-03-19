import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify renter belongs to this user
        const renter = await prisma.renter.findUnique({
            where: { id, userId: session.user.id }
        });

        if (!renter) {
            return NextResponse.json({ error: "Renter not found" }, { status: 404 });
        }

        const readings = await prisma.meterReading.findMany({
            where: { renterId: id },
            orderBy: { month: "desc" }
        });

        return NextResponse.json(readings);
    } catch (error) {
        console.error("Error fetching meter readings:", error);
        return NextResponse.json(
            { error: "Failed to fetch meter readings" },
            { status: 500 }
        );
    }
}

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

        const { month, meterPhotoUrl, unitsConsumed, calculatedAmount } = await req.json();

        if (!month || !meterPhotoUrl || unitsConsumed === undefined || calculatedAmount === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify renter belongs to this user
        const renter = await prisma.renter.findUnique({
            where: { id, userId: session.user.id }
        });

        if (!renter) {
            return NextResponse.json({ error: "Renter not found" }, { status: 404 });
        }

        // Check if a reading already exists for this month
        const existing = await prisma.meterReading.findFirst({
            where: { renterId: id, month }
        });

        if (existing) {
            return NextResponse.json(
                { error: "A meter reading already exists for this month." },
                { status: 400 }
            );
        }

        const reading = await prisma.meterReading.create({
            data: {
                renterId: id,
                month,
                meterPhotoUrl,
                unitsConsumed: parseFloat(String(unitsConsumed)),
                calculatedAmount: parseFloat(String(calculatedAmount)),
            }
        });

        return NextResponse.json(reading, { status: 201 });
    } catch (error) {
        console.error("Error creating meter reading:", error);
        return NextResponse.json(
            { error: "Failed to create meter reading" },
            { status: 500 }
        );
    }
}
