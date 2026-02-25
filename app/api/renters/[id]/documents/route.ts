import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Add a document
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

        const { url, title } = await req.json();

        if (!url || !title) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify renter belongs to user
        const renter = await prisma.renter.findUnique({
            where: { id, userId: session.user.id }
        });

        if (!renter) {
            return NextResponse.json({ error: "Renter not found" }, { status: 404 });
        }

        const newDoc = await prisma.document.create({
            data: {
                renterId: renter.id,
                title,
                url,
            },
        });

        return NextResponse.json(newDoc, { status: 201 });
    } catch (error) {
        console.error("Error creating document:", error);
        return NextResponse.json(
            { error: "Failed to create document" },
            { status: 500 }
        );
    }
}
