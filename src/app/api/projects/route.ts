import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

interface PostProjectBody {
    name: string;
    description: string;
    gitHubUrl: string;
    mainBranch: string;
    buildCommand: string;
    startCommand: string;
    envVars: { key: string; value: string }[];
}
export async function POST(request: NextRequest) {
    const { name, description, gitHubUrl, mainBranch, buildCommand, startCommand, envVars }: PostProjectBody = await request.json();

    let port = 0;
    const lastPort = await prisma.project.findFirst({
        select: {
            port: true,
        },
        orderBy: {
            port: "desc",
        },
    });
    port = lastPort ? lastPort.port + 1 : 3000;

    const createProjectResult = await prisma.project.create({
        data: {
            name,
            description: description || null,
            gitHubUrl,
            mainBranch,
            buildCommand,
            startCommand,
            port,
        },
    });

    await prisma.envVar.createMany({
        data: envVars.map(({ key, value }) => ({
            projectId: createProjectResult.id,
            key,
            value,
        })),
    });

    return NextResponse.json({ code: "OK", message: "Project created", data: createProjectResult });
}

export async function GET() {
    const projects = await prisma.project.findMany({
        include: {
            EnvVars: true,
        },
    });

    return NextResponse.json({ code: "OK", message: "Projects fetched", data: projects });
}