import { createNetwork } from "@/services/docker";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

interface PostServicetBody {
    name: string;
    description: string;
    gitHubUrl: string;
    mainBranch: string;
    buildCommand: string;
    startCommand: string;
    envVars: { key: string; value: string }[];
}
export async function POST(request: NextRequest) {
    const { name, description }: PostServicetBody = await request.json();

    const createProjectResult = await prisma.project.create({
        data: {
            name,
            description: description || null,
        },
    });

    createNetwork({ networkName: "n" + createProjectResult.id });

    return NextResponse.json({ code: "OK", message: "Project created", data: createProjectResult });
}

export async function GET() {
    const projects = await prisma.project.findMany({
        include: {
            _count: {
                select: { Services: true },
            }
        }
    });

    return NextResponse.json({ code: "OK", message: "Projects fetched", data: projects });
}