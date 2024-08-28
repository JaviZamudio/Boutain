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
    return `
# Use the Official ${service.dockerImage} Image
from ${service.dockerImage}:${service.dockerVersion}

# Using a volume and store it in ./docker/volumes/v${service.id}
VOLUME /var/lib/mysql

# Set environment variables
ENV MYSQL_ROOT_PASSWORD=${service.Database.dbPassword}
ENV MYSQL_DATABASE=${service.Database.dbName}
ENV MYSQL_USER=${service.Database.dbUser}
ENV MYSQL_PASSWORD=${service.Database.dbPassword}
ENV POSTGRES_PASSWORD=${service.Database.dbPassword}
ENV POSTGRES_USER=${service.Database.dbUser}
ENV POSTGRES_DB=${service.Database.dbName}

# Expose the port the app runs on
EXPOSE 3306
    `
}

function buildAndRunDatabaseContainer(service: Service & { Database: Database, Project: Project }) {
    const containerName = `s${service.id}`;
    const imageName = `i${service.id}`;
    const volumeName = `v${service.id}`;
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
    execSync(`docker build -t ${imageName} -f ./docker/${containerName}-Dockerfile .`);

    // Run Docker container
    console.log("Running Docker container...");
    execSync(`docker run -d -p ${service.port}:${internalPort} --network ${networkName} --name ${containerName} ${imageName}`);

}

// export function buildAndRunContainer({ containerName, imageName, port, internalPort, dockerfile }: { containerName: string, imageName: string, port: number, internalPort: number, dockerfile: string }) {
//     try {
//         // Create the directory if it doesn't exist
//         if (!fs.existsSync('./docker')) {
//             fs.mkdirSync('./docker');
//         }

//         // Write Dockerfile to the directory
//         console.log("Writing Dockerfile...");
//         fs.writeFileSync(`./docker/${containerName}-Dockerfile`, dockerfile);

//         // Kill existing container if it exists (to free up the port)
//         try {
//             console.log(`Killing existing container... ${containerName}`);
//             execSync(`docker kill ${containerName}`);
//             execSync(`docker rm ${containerName}`);
//         } catch (error) {
//             // Ignore error if container doesn't exist
//             console.log(`No container found with name ${containerName}`);
//         }

//         // Build Docker image
//         console.log("Building Docker image...");
//         execSync(`docker build -t ${imageName} -f ./docker/${containerName}-Dockerfile .`);

//         // Run Docker container
//         console.log("Running Docker container...");
//         execSync(`docker run -d -p ${port}:${internalPort} --name ${containerName} ${imageName}`);

//         return true;
//     } catch (error) {
//         console.error(error);
//         return false;
//     }
// }

// export async function deployWebService(serviceId: number) {
//     try {
//         const service = await prisma.service.findUnique({
//             where: {
//                 id: serviceId,
//             },
//             include: {
//                 WebService: {
//                     include: { EnvVars: true },
//                 },
//             }
//         });

//         if (!service) {
//             throw new Error(`No Service found with id ${serviceId}`);
//         }

//         if (service.serviceType !== 'webService') {
//             throw new Error(`Incorrect service type: ${service.serviceType}, expected "webService"`);
//         }

//         if (!service.WebService) {
//             throw new Error(`No WebService found for service with id ${serviceId}`);
//         }

//         let defaultPort = getServiceRuntime(service.serviceRuntime as ServiceRuntimeId)?.defaultPort || '3000';
//         let internalPort = service.WebService.EnvVars.find((envVar) => envVar.key === 'PORT')?.value || defaultPort;

//         // Generate Dockerfile
//         const dockerfile = generateWebServiceDockefile({ ...service, internalPort, WebService: service.WebService });

//         const result = buildAndRunContainer({
//             containerName: `s${service.id}`,
//             imageName: `i${service.id}`,
//             port: service.port,
//             internalPort: parseInt(internalPort),
//             dockerfile,
//         });

//         return result;
//     } catch (error) {
//         return false;
//     }
// }