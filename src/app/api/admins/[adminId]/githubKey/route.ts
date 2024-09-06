import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient()

// PUT to update github key
export async function PUT(req: NextRequest, { params }: { params: { adminId: string } }) {
    const { githubKey } = await req.json()
    const adminId = parseInt(params.adminId)

    const existingAdmin = await prisma.admin.findUnique({
        where: {
            id: adminId
        }
    })

    if (!existingAdmin) {
        return NextResponse.json({ code: "NOT_FOUND", message: "No Admin found with that ID" });
    }

    // Base64 encode the key
    const encryptedKey = Buffer.from(githubKey).toString('base64')

    const updatedAdmin = await prisma.admin.update({
        where: {
            id: adminId
        },
        data: {
            githubKey: encryptedKey
        }
    })

    return NextResponse.json({ code: "OK", message: "User created", data: updatedAdmin });
}
