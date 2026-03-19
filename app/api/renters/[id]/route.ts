import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const json = await req.json();
        const { name, phone, monthlyRentAmount, moveInDate, securityDeposit, room } = json;

        if (!name || !phone || !monthlyRentAmount || !moveInDate) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Verify ownership and update
        const updatedRenter = await prisma.renter.update({
            where: {
                id,
                userId: session.user.id,
            },
            data: {
                name,
                phone,
                monthlyRentAmount: parseFloat(monthlyRentAmount),
                moveInDate: new Date(moveInDate),
                securityDeposit: securityDeposit ? parseFloat(securityDeposit) : null,
                room: Array.isArray(room) ? room : [],
            },
        });

        return NextResponse.json(updatedRenter, { status: 200 });
    } catch (error) {
        console.error("Error updating renter:", error);
        return NextResponse.json(
            { error: "Failed to update renter" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify ownership
        const renter = await prisma.renter.findUnique({
            where: { id, userId: session.user.id }
        });

        if (!renter) {
            return NextResponse.json({ error: "Renter not found" }, { status: 404 });
        }

        // Preserve payment history: snapshot renter name and rent amount onto payment records
        // When renter is deleted, Prisma will automatically set renterId to null (onDelete: SetNull)
        // Documents will be cascade-deleted (onDelete: Cascade)
        await prisma.payment.updateMany({
            where: { renterId: id },
            data: {
                renterName: renter.name,
                rentAmount: renter.monthlyRentAmount,
            }
        });

        // Delete the renter — payments are preserved with snapshots, documents cascade-delete
        await prisma.renter.delete({
            where: { id, userId: session.user.id }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting renter:", error);
        return NextResponse.json(
            { error: "Failed to delete renter" },
            { status: 500 }
        );
    }
}
