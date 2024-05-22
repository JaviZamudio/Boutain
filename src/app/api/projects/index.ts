import { PrismaClient } from "@prisma/client";
import fs from "fs";
import { execSync } from "child_process";

const prisma = new PrismaClient();

export const deployProject = async (projectId: number) => {
    const project = await prisma.project.findUnique({
        where: {
            id: projectId,
        },
        include: {
            EnvVars: true,
        },
    });

    if (!project) {
        throw new Error(`No project found with id ${projectId}`);
    }

    try {
        // Create Dockerfile in /docker with the project's configuration
        const dockerfile = `
# Use the official Node.js 18 image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Clone the project's GitHub repository, from the main branch
RUN git clone -b ${project.mainBranch} ${project.gitHubUrl} .

# Run the build command (hopefully this installs dependencies)
RUN ${project.buildCommand}

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
${project.EnvVars.map((envVar) => `ENV ${envVar.key}=${envVar.value}`).join('\n')}

# Run the start command
CMD ${project.startCommand}
        `
        // Create the directory if it doesn't exist
        if (!fs.existsSync('./docker')) {
            fs.mkdirSync('./docker');
        }

        // Write Dockerfile to the directory
        fs.writeFileSync(`./docker/${project.id}-Dockerfile`, dockerfile);

        // Kill existing container if it exists (to free up the port)
        execSync(`docker kill ${project.id}`);


        // Build Docker image
        execSync(`docker build -t ${project.id} -f ./docker/${project.id}-Dockerfile .`);

        // Run Docker container
        execSync(`docker run -d -p ${project.port}:3000 --name ${project.id} ${project.id}`);

    } catch (error) {
        console.error(error);
        return false;
    }

    return true;
}