import { deployService } from "@/services/services";
import { ServiceRuntimeId, ServiceTypeId, getServiceRuntime, serviceRuntimes } from "@/types";
import { Database, EnvVar, PrismaClient, WebService } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

interface WebServiceDetails {
    buildCommand: string;
    startCommand: string;
    mainBranch: string;
    gitHubUrl: string;
    envVars: { key: string; value: string }[];
}

export interface PostServicetBody {
    name: string;
    description: string;
    serviceType: ServiceTypeId;
    runtimeId: ServiceRuntimeId;
    dockerVersion: string;
    serviceDetails: WebServiceDetails | Database;
}
export async function POST(request: NextRequest, { params }: { params: { projectId: string } }) {
    const { name, description, serviceType, runtimeId, dockerVersion, serviceDetails } = await request.json() as PostServicetBody;

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

    // Create the service
    const createServiceResult = await prisma.service.create({
        data: {
            name,
            description: description || null,
            port,
            projectId: parseInt(params.projectId),
            serviceType: serviceType,
            serviceRuntime: runtimeId,
            dockerImage: getServiceRuntime(runtimeId)?.dockerImage || "node",
            dockerVersion: dockerVersion,
        },
    });

    if (!createServiceResult) {
        return NextResponse.json({ code: "ERROR", message: "Failed to create Service" });
    }

    // Create the service details
    if (serviceType === "webService") {
        const webServiceDetails = serviceDetails as WebServiceDetails;
        await prisma.webService.create({
            data: {
                serviceId: createServiceResult.id,
                buildCommand: webServiceDetails.buildCommand,
                startCommand: webServiceDetails.startCommand,
                mainBranch: webServiceDetails.mainBranch,
                gitHubUrl: webServiceDetails.gitHubUrl,
                EnvVars: {
                    create: webServiceDetails.envVars.map((envVar) => ({
                        key: envVar.key,
                        value: envVar.value,
                    })),
                }
            },
        });
    } else if (serviceType === "database") {
        await prisma.database.create({
            data: {
                serviceId: createServiceResult.id,
                dbName: name,
                dbUser: "admin",
                dbPassword: "password",
            },
        });
    }

    // Deploy the service
    const deployResult = deployService(createServiceResult.id);

    if (!deployResult) {
        return NextResponse.json({ code: "ERROR", message: "Failed to deploy Service" });
    }

    return NextResponse.json({ code: "OK", message: "Service created", data: createServiceResult });
}

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