import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; docId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { docId } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const doc = await prisma.document.findUnique({
            where: { id: docId },
            include: { renter: true }
        });

        if (!doc || doc.renter.userId !== session.user.id) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        await prisma.document.delete({
            where: { id: docId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting document:", error);
        return NextResponse.json(
            { error: "Failed to delete document" },
            { status: 500 }
        );
    }
}
