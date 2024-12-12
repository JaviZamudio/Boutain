import { Database, EnvVar, PrismaClient, Project, Service, WebService } from "@prisma/client";
import fs from "fs";
import { exec, execSync } from "child_process";
import { getServiceRuntime, ServiceRuntimeId } from "@/types";
import { stderr, stdout } from "process";

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
    const decryptedGitHubKey = options?.githubKey ? Buffer.from(options.githubKey, 'base64').toString('utf-8') : '';
    const gitHubUrl = options?.githubKey ? service.WebService.gitHubUrl.replace('https://', `https://${decryptedGitHubKey}@`) : service.WebService.gitHubUrl;
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
#${service.WebService?.EnvVars.some((envVar) => envVar.key === serviceRuntime?.webSettings?.prodVar) ? '' : `ENV ${serviceRuntime?.webSettings?.prodVar}=development`}

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
FROM ${service.dockerImage}:${service.dockerVersion}

# Volume for the database
VOLUME ${serviceRuntime?.dbSettings?.volumePath}

# Set environment variables
ENV ${serviceRuntime?.dbSettings?.initDb}=${service.Database.dbName}
ENV ${serviceRuntime?.dbSettings?.initUser}=${service.Database.dbUser}
ENV ${serviceRuntime?.dbSettings?.initPassword}=${service.Database.dbPassword}
ENV MYSQL_ROOT_PASSWORD=${service.Database.dbPassword}

# Expose the port the app runs on
EXPOSE ${serviceRuntime?.defaultPort}
`
}

async function buildAndRunDatabaseContainer(service: Service & { Database: Database, Project: Project }) {
    const containerName = `s${service.id}_v`;
    const imageName = `i${service.id}`;
    const networkName = `n${service.Project.id}`;
    const volumeName = `v${service.id}`;
    const currentDir = process.cwd();
    const volumeHostLocation = `${currentDir}/docker/volumes/p${service.Project.id}/${volumeName}`;
    const volumeContaierDestination = getServiceRuntime(service.serviceRuntime as ServiceRuntimeId)?.dbSettings?.volumePath;
    const internalPort = getServiceRuntime(service.serviceRuntime as ServiceRuntimeId)?.defaultPort || '3306';
    const dockerfile = generateDatabaseDockerfile({ ...service, internalPort });

    // Create the directory if it doesn't exist
    if (!fs.existsSync('./docker')) {
        fs.mkdirSync('./docker');
    }

    // Check if a container exists
    const { containerExists, name } = await checkContainerExists(containerName);

    // Write Dockerfile to the directory
    console.log("Writing Dockerfile...");
    fs.writeFileSync(`./docker/${containerName}-Dockerfile`, dockerfile);

    // Build Docker image
    console.log("Building Docker image...");
    execSync(`docker build -t ${imageName} -f ./docker/${containerName}-Dockerfile .`);

    if (containerExists) {
        console.log(containerExists)
        try {
            // Check container version 
            const version = await checkContainerVersion(name) + 1;

            // Run Docker container
            console.log("Running Docker container...");
            const newContainerName = `${containerName}_${version}`;
            const newContainer = execSync(`docker run -d -p ${service.port}:${internalPort} --network ${networkName} --name ${containerName}_1 -v ${volumeHostLocation}:${volumeContaierDestination} --restart always ${imageName}`);

        } catch (error: any) {

        }
    }


    // Kill existing container if it exists (to free up the port)
    try {
        console.log(`Killing existing container... ${containerName}`);
        execSync(`docker container rm --force ${containerName}`);
    } catch (error) {
        // Ignore error if container doesn't exist
        console.log(`No container found with name ${containerName}`);
    }

    // Run Docker container
    console.log("Running Docker container...");
    execSync(`docker run -d -p ${service.port}:${internalPort} --network ${networkName} --name ${containerName}_1 -v ${volumeHostLocation}:${volumeContaierDestination} --restart always ${imageName}`);
}

async function buildAndRunWebServiceContainer(service: Service & { WebService: WebService & { EnvVars: EnvVar[] }, Project: Project, Admin: { githubKey?: string } }) {
    const containerName = `s${service.id}_v`;
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

    // Check if a container exists
    const { containerExists, name } = await checkContainerExists(containerName);

    // Write Dockerfile to the directory
    console.log("Writing Dockerfile...");
    fs.writeFileSync(`./docker/${containerName}-Dockerfile`, dockerfile);

    // Build Docker image 
    console.log("Building Docker image...");
    execSync(`docker build --no-cache -t ${imageName} -f ./docker/${containerName}-Dockerfile .`);

    if (containerExists) {
        try {
            // Check container version
            const version = await checkContainerVersion(name) + 1;

            // Run Docker container
            console.log("Running Docker container...");
            const newContainerName = `${containerName}_${version}`;
            const newContainer = execSync(`docker run -d -p 6000:${internalPort} --network ${networkName} --name ${newContainerName} --restart always ${imageName}`);

            if (newContainer) {
                // Delete the last container
                console.log(`Killing existing container... ${name}`);
                execSync(`docker container rm --force ${name}`);

                // Reassign the same port to the container
                execSync(`docker container rm --force ${newContainerName}`);
                execSync(`docker run -d -p ${service.port}:${internalPort} --network ${networkName} --name ${newContainerName} --restart always ${imageName}`);
            }
        } catch (error) {
            console.log(error)
            // Ignore error if container doesn't exist
            console.log(`No container found with name ${containerName}`);
        }
    } else {
        // Run first Docker container
        console.log("Running Docker container...");
        execSync(`docker run -d -p ${service.port}:${internalPort} --network ${networkName} --name ${containerName}_1 --restart always ${imageName}`);
    }
}

async function checkContainerExists(containerName: string): Promise<{ containerExists: boolean; name: string }> {
    return new Promise((resolve, reject) => {
        exec(`docker ps -a --filter "name=${containerName}" --format "{{.Names}}"`, (error, stdout, stderr) => {
            if (error) {
                reject('Error executing the command');
                return;
            }

            const output = stdout.trim(); // Get container name
            if (output) {
                resolve({ containerExists: true, name: output });
            } else {
                resolve({ containerExists: false, name: '' });
            }
        });
    });
}

function checkContainerVersion(containerName: string | ''): number {
    const version = containerName.split('_').pop();
    return Number(version);
}