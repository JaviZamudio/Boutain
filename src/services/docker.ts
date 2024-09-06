import { Database, EnvVar, PrismaClient, Project, Service, WebService } from "@prisma/client";
import fs from "fs";
import { execSync } from "child_process";
import { getServiceRuntime, ServiceRuntimeId } from "@/types";

const prisma = new PrismaClient();

// TODO: Make exec async (it's currently blocking the event loop)
// TODO: Catch errors and return false if something goes wrong (instead of returning true either way)

export const createNetwork = async ({ networkName }: { networkName: string }) => {
    try {
        execSync(`docker network create ${networkName}`);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export const deployService = async (serviceId: number) => {
    try {
        const service = await prisma.service.findUnique({
            where: {
                id: serviceId,
            },
            include: {
                Admin: true,
                Project: true,
                WebService: {
                    include: { EnvVars: true },
                },
                Database: true,
            }
        });

        // Check if service exists
        if (!service) {
            throw new Error(`No Service found with id ${serviceId}`);
        }

        // Build and run the container based on the service type
        if (service.serviceType === 'webService' && service.WebService) {
            buildAndRunWebServiceContainer({ ...service, WebService: service.WebService, Project: service.Project, Admin: { ...service.Admin, githubKey: service.Admin.githubKey || '' } });
        } else if (service.serviceType === "database" && service.Database) {
            buildAndRunDatabaseContainer({ ...service, Database: service.Database, Project: service.Project });
        } else {
            throw new Error(`Service type ${service.serviceType} is not supported`);
        }

        return true;
    } catch (error) {
        console.error("ERROR:", error);
        return false;
    }
}

function generateWebServiceDockefile(service: Service & { WebService: WebService & { EnvVars: EnvVar[] }, internalPort: string }, options?: { githubKey?: string }) {
    const internalPort = service.WebService.EnvVars.find((envVar) => envVar.key === 'PORT')?.value || '3000';
    const gitHubUrl = options?.githubKey ? service.WebService.gitHubUrl.replace('https://', `https://${options.githubKey}@`) : service.WebService.gitHubUrl;
    const serviceRuntime = getServiceRuntime(service.serviceRuntime as ServiceRuntimeId);

    return `
# Use the official ${service.dockerImage} image
FROM ${service.dockerImage}:${service.dockerVersion}

# Set the working directory in the container
WORKDIR /app

# Set environment variables
${service.WebService?.EnvVars.map((envVar) => `ENV ${envVar.key}=${envVar.value}`).join('\n')}

# Set default environment variables if they don't exist
${service.WebService?.EnvVars.some((envVar) => envVar.key === 'PORT') ? '' : `ENV PORT=${internalPort}`}
#${service.WebService?.EnvVars.some((envVar) => envVar.key === serviceRuntime?.webServiceProps?.prodVar) ? '' : `ENV ${serviceRuntime?.webServiceProps?.prodVar}=development`}

# Clone the Service's GitHub repository, from the main branch
RUN git clone -b ${service.WebService?.mainBranch} ${gitHubUrl} .

# Run the build command (hopefully this installs dependencies)
RUN ${service.WebService?.buildCommand}

# Expose the port the app runs on
EXPOSE ${internalPort}

# Run the start command
CMD ${JSON.stringify(service.WebService?.startCommand.split(' '))}
`
}

function generateDatabaseDockerfile(service: Service & { Database: Database, Project: Project, internalPort: string }) {
    const serviceRuntime = getServiceRuntime(service.serviceRuntime as ServiceRuntimeId);

    return `
# Use the Official ${service.dockerImage} Image
from ${service.dockerImage}:${service.dockerVersion}

# Volume for the database
VOLUME ${serviceRuntime?.dbProps?.volumePath}

# Set environment variables
ENV ${serviceRuntime?.dbProps?.initDb}=${service.Database.dbName}
ENV ${serviceRuntime?.dbProps?.initUser}=${service.Database.dbUser}
ENV ${serviceRuntime?.dbProps?.initPassword}=${service.Database.dbPassword}

# Expose the port the app runs on
EXPOSE ${serviceRuntime?.defaultPort}
`
}

function buildAndRunDatabaseContainer(service: Service & { Database: Database, Project: Project }) {
    const containerName = `s${service.id}`;
    const imageName = `i${service.id}`;
    const volumeName = `v${service.id}`;
    const currentDir = process.cwd();
    const volumesLocation = `${currentDir}/docker/volumes/p${service.Project.id}`;
    const networkName = `n${service.Project.id}`;
    const internalPort = getServiceRuntime(service.serviceRuntime as ServiceRuntimeId)?.defaultPort || '3306';
    const dockerfile = generateDatabaseDockerfile({ ...service, internalPort });

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
        execSync(`docker container rm --force ${containerName}`);
    } catch (error) {
        // Ignore error if container doesn't exist
        console.log(`No container found with name ${containerName}`);
    }

    // Build Docker image
    console.log("Building Docker image...");
    execSync(`docker build -t ${imageName} -f ./docker/${containerName}-Dockerfile .`);

    // Run Docker container
    console.log("Running Docker container...");
    execSync(`docker run -d -p ${service.port}:${internalPort} --network ${networkName} --name ${containerName} -v ${volumeName}:/var/lib/mysql ${imageName}`);
}

function buildAndRunWebServiceContainer(service: Service & { WebService: WebService & { EnvVars: EnvVar[] }, Project: Project, Admin: { githubKey?: string } }) {
    const containerName = `s${service.id}`;
    const imageName = `i${service.id}`;
    const networkName = `n${service.Project.id}`;
    const internalPort = service.WebService.EnvVars.find((envVar) => envVar.key === 'PORT')?.value
        || getServiceRuntime(service.serviceRuntime as ServiceRuntimeId)?.defaultPort
        || '3000';
    const dockerfile = generateWebServiceDockefile({ ...service, internalPort }, { githubKey: service.Admin.githubKey });

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
        execSync(`docker container rm --force ${containerName}`);
    } catch (error) {
        // Ignore error if container doesn't exist
        console.log(`No container found with name ${containerName}`);
    }

    // Build Docker image
    console.log("Building Docker image...");
    execSync(`docker build --no-cache -t ${imageName} -f ./docker/${containerName}-Dockerfile .`);

    // Run Docker container
    console.log("Running Docker container...");
    execSync(`docker run -d -p ${service.port}:${internalPort} --network ${networkName} --name ${containerName} ${imageName}`);

}
