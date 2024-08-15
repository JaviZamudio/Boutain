import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { deployService } from ".";

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
    const { name, description, gitHubUrl, mainBranch, buildCommand, startCommand, envVars }: PostServicetBody = await request.json();

    // Set the port to the next available port
    let port = 0;
    const lastPort = await prisma.service.findFirst({
        select: {
            port: true,
        },
        orderBy: {
            port: "desc",
        },
    });
    port = lastPort ? lastPort.port + 1 : 3000;

    const createServiceResult = await prisma.service.create({
        data: {
            name,
            description: description || null,
            gitHubUrl,
            mainBranch,
            buildCommand,
            startCommand,
            port,
            // TODO: Get the projectId from the user's session
            projectId: 1, // "Default" project
        },
    });

    await prisma.envVar.createMany({
        data: envVars.map(({ key, value }) => ({
            serviceId: createServiceResult.id,
            key,
            value,
        })),
    });

    const deployResult = deployService(createServiceResult.id);

    if (!deployResult) {
        return NextResponse.json({ code: "ERROR", message: "Failed to deploy Service" });
    }

    return NextResponse.json({ code: "OK", message: "Service created", data: createServiceResult });
}

export async function GET() {
    const services = await prisma.service.findMany({
        include: {
            EnvVars: true,
        },
    });

    return NextResponse.json({ code: "OK", message: "Services fetched", data: services });
}