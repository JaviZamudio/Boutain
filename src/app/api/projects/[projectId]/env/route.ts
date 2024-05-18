import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: { projectId: string } }) {
    const env = await prisma.envVar.findMany({
        where: {
            projectId: parseInt(params.projectId),
        },
    });

    return NextResponse.json({ code: "OK", message: "Environment Variables fetched for project " + params.projectId, data: env });
}

export async function PUT(request: NextRequest, { params }: { params: { projectId: string } }) {
    const { envVars } = await request.json();

    const [deletedEnvVars, newEnvVars] = await prisma.$transaction([
        // Delete all env vars for this project
        prisma.envVar.deleteMany({
            where: {
                projectId: parseInt(params.projectId),
            },
        }),
        // Create new env vars
        prisma.envVar.createMany({
            data: envVars.map((envVar: any) => ({
                projectId: parseInt(params.projectId),
                key: envVar.key,
                value: envVar.value,
            })),
        }),
    ]);

    return NextResponse.json({ code: "OK", message: "Environment Variables updated", data: envVars });
}