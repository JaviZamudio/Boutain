import { deployService } from "@/services/services";
import { getServiceRuntime, ServiceRuntimeId, ServiceTypeId } from "@/types";
import { Database, PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

interface PutWebServiceDetails {
    buildCommand: string;
    startCommand: string;
    mainBranch: string;
    gitHubUrl: string;
}

export interface PutServiceBody {
    name: string;
    description: string;
    serviceDetails: PutWebServiceDetails | Database;
}

export async function GET(request: NextRequest, { params }: { params: { serviceId: string } }) {
    const service = await prisma.service.findUnique({
        where: {
            id: parseInt(params.serviceId),
        },
        include: {
            Project: true,
            Database: {
                include: {

                }
            },
            WebService: {
                include: {
                    EnvVars: true,
                }
            }
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
    const { name, description, serviceDetails } = await request.json() as PutServiceBody;

    const service = await prisma.service.findUnique({
        where: {
            id: parseInt(params.serviceId),
        },
    });

    if (!service) {
        return NextResponse.json({ code: "NOT_FOUND", message: "No Service found with that ID" });
    }

    const updatedService = await prisma.service.update({
        where: {
            id: parseInt(params.serviceId),
        },
        data: {
            name,
            description: description || null,
            // serviceRuntime: runtimeId,
            // dockerVersion,
            // dockerImage: getServiceRuntime(runtimeId)?.dockerImage,
            WebService: service.serviceType !== "webService" ? undefined : {
                update: serviceDetails as PutWebServiceDetails,
            },
            Database: service.serviceType !== "database" ? undefined : {
                update: serviceDetails as Database,
            },
        },
    });

    return NextResponse.json({ code: "OK", message: "Service updated", data: updatedService });
}