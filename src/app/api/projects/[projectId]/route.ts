import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { deployProject } from "..";

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: { projectId: string } }) {
    const project = await prisma.project.findUnique({
        where: {
            id: parseInt(params.projectId),
        },
        include: {
            EnvVars: true,
        },
    });

    return NextResponse.json({ code: "OK", message: "Project fetched", data: project });
}

// POST: Re-Deploy Project
export async function POST(request: NextRequest, { params }: { params: { projectId: string } }) {
    const result = deployProject(parseInt(params.projectId));

    if (!result) {
        return NextResponse.json({ code: "ERROR", message: "Failed to re-deploy project" });
    }

    return NextResponse.json({ code: "OK", message: "Project re-deployed" });
}