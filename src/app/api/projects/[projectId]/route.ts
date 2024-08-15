import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: { projectId: string } }) {
    const project = await prisma.project.findUnique({
        where: {
            id: parseInt(params.projectId),
        },
        include: {
            Services: true,
        },
    });

    return NextResponse.json({ code: "OK", message: "Project fetched", data: project });
}

export async function DELETE(request: NextRequest, { params }: { params: { projectId: string } }) {
    const project = await prisma.project.delete({
        where: {
            id: parseInt(params.projectId),
        },
    });

    return NextResponse.json({ code: "OK", message: "Project deleted", data: project });
}