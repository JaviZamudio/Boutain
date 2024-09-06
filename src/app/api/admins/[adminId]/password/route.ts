import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { compareSync, hashSync } from 'bcrypt';

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest, { params }: { params: { adminId: string } }) {
    const adminId = Number(params.adminId);
    const { currentPassword, newPassword, confirmPassword } = await req.json();
    console.log({ currentPassword, newPassword, confirmPassword });
    const admin = await prisma.admin.findUnique({
        where: {
            id: adminId
        }
    });
    if (!admin) {
        return NextResponse.json({ code: "USER_NOT_FOUND", message: "User not found" });
    }
    if (!compareSync(currentPassword, admin.password)) {
        return NextResponse.json({ code: "INVALID_PASSWORD", message: "Invalid Password" });
    }
    const updatedAdmin = await prisma.admin.update({
        where: {
            id: admin.id
        },
        data: {
            password: hashSync(newPassword, 10)
        }
    });
    return NextResponse.json({ code: "OK", message: "Password updated successfully" });
}