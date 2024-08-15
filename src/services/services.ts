import { PrismaClient } from "@prisma/client";
import fs from "fs";
import { execSync } from "child_process";

const prisma = new PrismaClient();

export const deployService = async (serviceId: number) => {
    const service = await prisma.service.findUnique({
        where: {
            id: serviceId,
        },
        include: {
            EnvVars: true,
        },
    });

    if (!service) {
        throw new Error(`No Service found with id ${serviceId}`);
    }

    try {
        // Create Dockerfile in /docker with the Service's configuration
        const dockerfile = `
# Use the official Node.js 18 image
# Node.js: node:18
# Python: python:3.9
# PostgreSQL: postgres:13
# Object Storage: minio/minio
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Clone the Service's GitHub repository, from the main branch
RUN git clone -b ${service.mainBranch} ${service.gitHubUrl} .

# Run the build command (hopefully this installs dependencies)
RUN ${service.buildCommand}

# Expose the port the app runs on
EXPOSE ${service.internalPort}

# Set environment variables
PORT=${service.internalPort}
${service.EnvVars.map((envVar) => `ENV ${envVar.key}=${envVar.value}`).join('\n')}

# Run the start command
CMD ${service.startCommand}
        `
        // Create the directory if it doesn't exist
        if (!fs.existsSync('./docker')) {
            fs.mkdirSync('./docker');
        }

        // Write Dockerfile to the directory
        fs.writeFileSync(`./docker/${service.id}-Dockerfile`, dockerfile);

        // Kill existing container if it exists (to free up the port)
        try {
            execSync(`docker kill s${service.id}`);
        } catch (error) {
            // Ignore error if container doesn't exist
        }

        // Build Docker image
        execSync(`docker build -t i${service.id} -f ./docker/${service.id}-Dockerfile .`);

        // Run Docker container
        execSync(`docker run -d -p ${service.port}:${service.internalPort} --name s${service.id} i${service.id}`);

    } catch (error) {
        console.error(error);
        return false;
    }

    return true;
}