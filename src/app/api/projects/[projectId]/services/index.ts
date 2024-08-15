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
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Clone the Service's GitHub repository, from the main branch
RUN git clone -b ${service.mainBranch} ${service.gitHubUrl} .

# Run the build command (hopefully this installs dependencies)
RUN ${service.buildCommand}

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
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
        execSync(`docker kill ${service.id}`);


        // Build Docker image
        execSync(`docker build -t ${service.id} -f ./docker/${service.id}-Dockerfile .`);

        // Run Docker container
        execSync(`docker run -d -p ${service.port}:3000 --name ${service.id} ${service.id}`);

    } catch (error) {
        console.error(error);
        return false;
    }

    return true;
}