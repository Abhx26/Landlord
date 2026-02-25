import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const renters = await prisma.renter.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(renters);
    } catch (error) {
        console.error("Error fetching renters:", error);
        return NextResponse.json(
            { error: "Failed to fetch renters" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const json = await req.json();
        const { name, email, phone, monthlyRentAmount, moveInDate } = json;

        if (!name || !email || !phone || !monthlyRentAmount || !moveInDate) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const newRenter = await prisma.renter.create({
            data: {
                name,
                email,
                phone,
                monthlyRentAmount: parseFloat(monthlyRentAmount),
                moveInDate: new Date(moveInDate),
                userId: session.user.id,
            },
        });

        return NextResponse.json(newRenter, { status: 201 });
    } catch (error) {
        console.error("Error creating renter:", error);
        return NextResponse.json(
            { error: "Failed to create renter" },
            { status: 500 }
        );
    }
}
