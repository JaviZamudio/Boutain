import { EnvVar, PrismaClient, Service, WebService } from "@prisma/client";
import fs from "fs";
import { execSync } from "child_process";
import { getServiceRuntime, ServiceRuntimeId } from "@/types";

const prisma = new PrismaClient();

export const deployService = async (serviceId: number) => {
    const service = await prisma.service.findUnique({
        where: {
            id: serviceId,
        },
        include: {
            WebService: {
                include: { EnvVars: true },
            },
            Database: true,
        }
    });

    if (!service) {
        throw new Error(`No Service found with id ${serviceId}`);
    }

    try {
        let dockerfile = '';
        let internalPort: string = getServiceRuntime(service.serviceRuntime as ServiceRuntimeId)?.defaultPort || '3000';

        if (service.serviceType === 'webService' && service.WebService) {
            internalPort = service.WebService.EnvVars.find((envVar) => envVar.key === 'PORT')?.value || internalPort
            dockerfile = generateWebServiceDockefile({ ...service, internalPort, WebService: service.WebService });
        } else {
            throw new Error(`Service type ${service.serviceType} is not supported`);
        }

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

function generateWebServiceDockefile(service: Service & { WebService: WebService & { EnvVars: EnvVar[] }, internalPort: string }) {
    const internalPort = service.WebService.EnvVars.find((envVar) => envVar.key === 'PORT')?.value || '3000';
    return `
# Use the official ${service.dockerImage} image
FROM ${service.dockerImage}:${service.dockerVersion}

# Set the working directory in the container
WORKDIR /app

# Set environment variables
${service.WebService?.EnvVars.map((envVar) => `ENV ${envVar.key}=${envVar.value}`).join('\n')}

# Set default environment variables if they don't exist
${service.WebService?.EnvVars.some((envVar) => envVar.key === 'PORT') ? '' : `ENV PORT=${internalPort}`}

# Clone the Service's GitHub repository, from the main branch
RUN git clone -b ${service.WebService?.mainBranch} ${service.WebService?.gitHubUrl} .

# Run the build command (hopefully this installs dependencies)
RUN ${service.WebService?.buildCommand}

# Expose the port the app runs on
EXPOSE ${internalPort}

# Run the start command
CMD ${JSON.stringify(service.WebService?.startCommand.split(' '))}
`
}

export function buildAndRunContainer({ containerName, imageName, port, internalPort, dockerfile }: { containerName: string, imageName: string, port: number, internalPort: number, dockerfile: string }) {
    try {
        // Create the directory if it doesn't exist
        if (!fs.existsSync('./docker')) {
            fs.mkdirSync('./docker');
        }

        // Write Dockerfile to the directory
        console.log("Writing Dockerfile...");
        fs.writeFileSync(`./docker/${containerName}-Dockerfile`, dockerfile);

        // Kill existing container if it exists (to free up the port)
        try {
            console.log(`Killing existing container... ${containerName}`);
            execSync(`docker kill ${containerName}`);
            execSync(`docker rm ${containerName}`);
        } catch (error) {
            // Ignore error if container doesn't exist
            console.log(`No container found with name ${containerName}`);
        }

        // Build Docker image
        console.log("Building Docker image...");
        execSync(`docker build -t ${imageName} -f ./docker/${containerName}-Dockerfile .`);

        // Run Docker container
        console.log("Running Docker container...");
        execSync(`docker run -d -p ${port}:${internalPort} --name ${containerName} ${imageName}`);

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function deployWebService(serviceId: number) {
    try {
        const service = await prisma.service.findUnique({
            where: {
                id: serviceId,
            },
            include: {
                WebService: {
                    include: { EnvVars: true },
                },
            }
        });

        if (!service) {
            throw new Error(`No Service found with id ${serviceId}`);
        }

        if (service.serviceType !== 'webService') {
            throw new Error(`Incorrect service type: ${service.serviceType}, expected "webService"`);
        }

        if (!service.WebService) {
            throw new Error(`No WebService found for service with id ${serviceId}`);
        }

        let defaultPort = getServiceRuntime(service.serviceRuntime as ServiceRuntimeId)?.defaultPort || '3000';
        let internalPort = service.WebService.EnvVars.find((envVar) => envVar.key === 'PORT')?.value || defaultPort;

        // Generate Dockerfile
        const dockerfile = generateWebServiceDockefile({ ...service, internalPort, WebService: service.WebService });

        const result = buildAndRunContainer({
            containerName: `s${service.id}`,
            imageName: `i${service.id}`,
            port: service.port,
            internalPort: parseInt(internalPort),
            dockerfile,
        });

        return result;
    } catch (error) {
        return false;
    }
}