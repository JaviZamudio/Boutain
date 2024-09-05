import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: { projectId: string } }) {
    try {
        const services = await prisma.service.findMany({
            where: {
                projectId: parseInt(params.projectId),
            },
        });

        return NextResponse.json({ code: "OK", message: "Services fetched", data: services });
    } catch (error) {
        return NextResponse.json({ code: "ERROR", message: "Failed to fetch Services" });
    }
}