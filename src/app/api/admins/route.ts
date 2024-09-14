import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcrypt";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export const GET = async (req: NextRequest) => {

    const admins = await prisma.admin.findMany({
        select: {
            id: true,
            username: true,
        },
        orderBy: {
            id: "asc",
        }
    });

    return NextResponse.json({ code: "OK", message: "Admin fetched", data: admins });
}

export const POST = async (req: NextRequest) => {
    const { username, password } = await req.json();

    if (!username || !password) {
        return NextResponse.json({ code: "MISSING_FIELDS", message: "Username and password are required" });
    }

    const existingAdmin = await prisma.admin.findFirst({
        where: {
            username,
        },
    });

    if (existingAdmin) {
        return NextResponse.json({ code: "ALREADY_EXISTS", message: "Admin with that username already exists" });
    }

    const hashedPassword = hashSync(password, 10);

    const admin = await prisma.admin.create({
        data: {
            username,
            password: hashedPassword,
        },
    });

    return NextResponse.json({ code: "OK", message: "Admin created", data: admin });
}