import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: { serviceId: string } }) {
    const env = await prisma.envVar.findMany({
        where: {
            WebService: {
                serviceId: parseInt(params.serviceId),
            }
        },
    });

    return NextResponse.json({ code: "OK", message: "Environment Variables fetched for service " + params.serviceId, data: env });
}

export async function PUT(request: NextRequest, { params }: { params: { serviceId: string } }) {
    const { envVars } = await request.json() as { envVars: { key: string, value: string }[] };

    const [deletedEnvVars, newEnvVars] = await prisma.$transaction([
        // Delete all env vars for this service
        prisma.envVar.deleteMany({
            where: {
                WebService: {
                    serviceId: parseInt(params.serviceId),
                }
            },
        }),
        // Create new env vars
        prisma.webService.update({
            where: {
                serviceId: parseInt(params.serviceId),
            },
            data: {
                EnvVars: {
                    create: envVars.map((envVar: any) => ({
                        key: envVar.key,
                        value: envVar.value,
                    })),
                },
            },
        }),
    ]);

    return NextResponse.json({ code: "OK", message: "Environment Variables updated", data: envVars });
}