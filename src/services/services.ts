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
        const internalPort = service.EnvVars.find((envVar) => envVar.key === 'PORT')?.value || '3000';

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

# Set environment variables
${service.EnvVars.map((envVar) => `ENV ${envVar.key}=${envVar.value}`).join('\n')}

# Set default environment variables if they don't exist
${service.EnvVars.some((envVar) => envVar.key === 'PORT') ? '' : `ENV PORT=${internalPort}`}

# Clone the Service's GitHub repository, from the main branch
RUN git clone -b ${service.mainBranch} ${service.gitHubUrl} .

# Run the build command (hopefully this installs dependencies)
RUN ${service.buildCommand}

# Expose the port the app runs on
EXPOSE ${internalPort}

# Run the start command
CMD ${JSON.stringify(service.startCommand.split(' '))}
        `
        // Create the directory if it doesn't exist
        if (!fs.existsSync('./docker')) {
            fs.mkdirSync('./docker');
        }

        // Write Dockerfile to the directory
        console.log("Writing Dockerfile...");
        fs.writeFileSync(`./docker/${service.id}-Dockerfile`, dockerfile);

        // Kill existing container if it exists (to free up the port)
        try {
            console.log(`Killing existing container... s${service.id}`);
            execSync(`docker kill s${service.id}`);
            execSync(`docker rm s${service.id}`);
        } catch (error) {
            // Ignore error if container doesn't exist
            console.log(`No container found with name s${service.id}`);
        }

        // Build Docker image
        console.log("Building Docker image...");
        execSync(`docker build -t i${service.id} -f ./docker/${service.id}-Dockerfile .`);

        // Run Docker container
        console.log("Running Docker container...");
        execSync(`docker run -d -p ${service.port}:${internalPort} --name s${service.id} i${service.id}`);

    } catch (error) {
        console.error(error);
        return false;
    }

    return true;
}