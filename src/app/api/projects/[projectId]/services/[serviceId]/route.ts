import { deployService } from "@/services/services";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: { serviceId: string } }) {
    const service = await prisma.service.findUnique({
        where: {
            id: parseInt(params.serviceId),
        },
        include: {
            EnvVars: true,
            Project: true
        },
    });

    const currentHost = request.headers.get("host")?.split(":")[0];

    if (!service) {
        return NextResponse.json({ code: "NOT_FOUND", message: "No Service found with that ID" });
    }

    const data = {
        ...service,
        url: `http://${currentHost}:${service.port}`,
    }

    return NextResponse.json({ code: "OK", message: "service fetched", data: data });
}

// POST: Re-Deploy service
export async function POST(request: NextRequest, { params }: { params: { serviceId: string } }) {
    const result = deployService(parseInt(params.serviceId));

    if (!result) {
        return NextResponse.json({ code: "ERROR", message: "Failed to re-deploy service" });
    }

    return NextResponse.json({ code: "OK", message: "service re-deployed" });
}

// PUT: Update service
export async function PUT(request: NextRequest, { params }: { params: { serviceId: string } }) {
    const { name, description, gitHubUrl, mainBranch, buildCommand, startCommand } = await request.json();

    const service = await prisma.service.update({
        where: {
            id: parseInt(params.serviceId),
        },
        data: {
            name,
            description: description || null,
            gitHubUrl,
            mainBranch,
            buildCommand,
            startCommand,
        },
    });

    return NextResponse.json({ code: "OK", message: "Service updated", data: service });
}