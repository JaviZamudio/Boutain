import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { compareSync, hashSync } from "bcrypt";
import { sign, verify } from "jsonwebtoken";
import { JWT_SECRET } from "@/configs";
import { TokenInfo } from "@/types/types";

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

    const updatedAdmin = await prisma.admin.update({
        where: {
            id: adminId
        },
        data: {
            githubKey: githubKey
        }
    })

    return NextResponse.json({ code: "OK", message: "User created", data: updatedAdmin });
}
