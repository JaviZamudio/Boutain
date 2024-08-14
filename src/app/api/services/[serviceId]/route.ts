import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { deployService } from "..";

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: { serviceId: string } }) {
    const service = await prisma.service.findUnique({
        where: {
            id: parseInt(params.serviceId),
        },
        include: {
            EnvVars: true,
        },
    });

    return NextResponse.json({ code: "OK", message: "service fetched", data: service });
}

// POST: Re-Deploy service
export async function POST(request: NextRequest, { params }: { params: { serviceId: string } }) {
    const result = deployService(parseInt(params.serviceId));

    if (!result) {
        return NextResponse.json({ code: "ERROR", message: "Failed to re-deploy service" });
    }

    return NextResponse.json({ code: "OK", message: "service re-deployed" });
}