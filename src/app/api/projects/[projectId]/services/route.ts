import { deployService } from "@/services/services";
import { ServiceTypeId, serviceRuntimes } from "@/types";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

interface PostServicetBody {
    name: string;
    description: string;
    serviceType: ServiceTypeId;
}
export async function POST(request: NextRequest, { params }: { params: { projectId: string } }) {
    const { name, description, serviceType }: PostServicetBody = await request.json();

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
            port,
            projectId: parseInt(params.projectId),
            serviceType: serviceType,
            serviceRuntime: "nodejs",
            dockerImage: "nodejs",
            dockerVersion: "18",
            // dockerConfig: JSON.stringify({ dockerImage: "nodejs", dockerVersion: "18" }),
        },
    });

    if (!createServiceResult) {
        return NextResponse.json({ code: "ERROR", message: "Failed to create Service" });
    }

    if (serviceType === "webService") {
        // Create a default route for the service
        await prisma.webSevice.create({
            data: {
                serviceId: createServiceResult.id,
                buildCommand: "npm i && npm run build",
                startCommand: "npm start",
                gitHubUrl: "",
                mainBranch: "main",
            },
        });
    } else if (serviceType === "database") {
        // Create a default route for the service
        await prisma.database.create({
            data: {
                serviceId: createServiceResult.id,
                dbName: name,
                dbUser: "admin",
                dbPassword: "password",
            },
        });
    }

    const deployResult = deployService(createServiceResult.id);

    if (!deployResult) {
        return NextResponse.json({ code: "ERROR", message: "Failed to deploy Service" });
    }

    return NextResponse.json({ code: "OK", message: "Service created", data: createServiceResult });
}

export async function GET(request: NextRequest, { params }: { params: { projectId: string } }) {
    console.log(params)

    const services = await prisma.service.findMany({
        where: {
            projectId: parseInt(params.projectId),
        },
    });

    return NextResponse.json({ code: "OK", message: "Services fetched", data: services });
}