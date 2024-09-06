import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export const GET = async (req: NextRequest, { params }: { params: { adminId: string } }) => {
    const adminId = parseInt(params.adminId);

    const admin = await prisma.admin.findUnique({
        where: {
            id: adminId,
        },
    });

    if (!admin) {
        return NextResponse.json({ code: "NOT_FOUND", message: "No Admin found with that ID" });
    }

    const data = {
        ...admin,
        password: undefined,
        githubKey: admin.githubKey ? Buffer.from(admin.githubKey, 'base64').toString() : undefined,
    }

    return NextResponse.json({ code: "OK", message: "Admin fetched", data });
}