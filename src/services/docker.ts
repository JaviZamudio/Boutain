import { Database, EnvVar, PrismaClient, Project, Service, WebService } from "@prisma/client";
import fs from "fs";
import { exec, execSync } from "child_process";
import { getServiceRuntime, ServiceRuntimeId } from "@/types";
import { stderr, stdout } from "process";
import { rejects } from "assert";
import { Resolver } from "dns";

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
   const imageName = `i${service.id}_v`;
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

   // Check if a image exists
   const { imageExists, image } = await checkImageExists(imageName);

   // Check if a container exists
   const { containerExists, container } = await checkContainerExists(containerName);

   // Write Dockerfile to the directory
   console.log("Writing Dockerfile...");
   fs.writeFileSync(`./docker/${containerName}-Dockerfile`, dockerfile);

   if (imageExists && containerExists) {
      try {
         const imageVersion = await checkVersion(image) + 1; // New image version
         const containerVersion = await checkVersion(container) + 1; // New container version
         const newImageName = `${imageName}_${imageVersion}`;

         console.log("Building Docker image...");

         // Build Docker image
         console.log("Building Docker image...");
         const newImage = execSync(`docker build -t ${newImageName} -f ./docker/${containerName}-Dockerfile .`);

         if (newImage) {
            console.log("Runnig new docker container");
            const newContainerName = `${containerName}_${containerVersion}`;
            const newContainer = execSync(`docker run -d -p 6001:${internalPort} --network ${networkName} --name ${newContainerName} -v ${volumeHostLocation}:${volumeContaierDestination} --restart always ${newImageName}`);

            if (newContainer) {
               // Kill last container
               console.log(`Killing existing container...`);
               execSync(`docker container rm --force ${container}`);

               // Kill last image
               console.log("Killing docker image...");
               execSync(`docker rmi "${image}"`);

               // First delete the new container and then reassign the same port to the container
               execSync(`docker container rm --force ${newContainerName}`);
               execSync(`docker run -d -p ${service.port}:${internalPort} --network ${networkName} --name ${newContainerName} -v ${volumeHostLocation}:${volumeContaierDestination} --restart always ${newImageName}`);
            }
         } else {
            return Error('Error to re deploy service');
         }
      } catch (error) {

      }
   } else {
      // Build first docker image
      console.log("Building Docker image...");
      const newImage = execSync(`docker build -t ${imageName}_1 -f ./docker/${containerName}-Dockerfile .`);
      // Run first docker container
      console.log("Running Docker container...");
      execSync(`docker run -d -p ${service.port}:${internalPort} --network ${networkName} --name ${containerName}_1 -v ${volumeHostLocation}:${volumeContaierDestination} --restart always ${imageName}_1`);
   }
}

async function buildAndRunWebServiceContainer(service: Service & { WebService: WebService & { EnvVars: EnvVar[] }, Project: Project, Admin: { githubKey?: string } }) {
   const containerName = `s${service.id}_v`;
   const imageName = `i${service.id}_v`;
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

   // Check if an image exists
   const { imageExists, image } = await checkImageExists(imageName);

   // Check if a container exists
   const { containerExists, container } = await checkContainerExists(containerName);

   if (imageExists && containerExists) {
      try {
         const imageVersion = await checkVersion(image) + 1; // New image version
         const containerVersion = await checkVersion(container) + 1; // New container version
         const newImageName = `${imageName}_${imageVersion}`;
         console.log("Building Docker image...");
         const newImage = execSync(`docker build --no-cache -t ${newImageName} -f ./docker/${containerName}-Dockerfile .`);

         if (newImage) {
            console.log("Running new docker container");
            const newContainerName = `${containerName}_${containerVersion}`;
            const newContainer = execSync(`docker run -d -p 6000:${internalPort} --network ${networkName} --name ${newContainerName} --restart always ${newImageName}`);

            if (newContainer) {

               // Kill last container
               console.log(`Killing existing container...`);
               execSync(`docker container rm --force ${container}`);

               // Kill last image
               console.log("Killing docker image...");
               execSync(`docker rmi "${image}"`);

               // First delete the new container and then reassign the same port to the container
               execSync(`docker container rm --force ${newContainerName}`);
               execSync(`docker run -d -p ${service.port}:${internalPort} --network ${networkName} --name ${newContainerName} --restart always ${newImageName}`);

            } else {
               // Kill new image
               console.log("Killing docker image...");
               execSync(`docker rmi $(docker images | grep "${newImageName}")`);
            }
         } else {
            return Error('Error to deploy service');
         }

      } catch (error) {
         console.log(error);
         return 'Error to deloy service'
      }
   } else {
      // Build first image and first container 
      try {
         // Build first docker image
         console.log("Building Docker image...");
         execSync(`docker build --no-cache -t ${imageName}_1 -f ./docker/${containerName}-Dockerfile .`);

         // Run first Docker container
         console.log("Running Docker container...");
         execSync(`docker run -d -p ${service.port}:${internalPort} --network ${networkName} --name ${containerName}_1 --restart always ${imageName}_1`);
      } catch (error) {

      }
   }
}

async function checkImageExists(imageName: string): Promise<{ imageExists: boolean; image: string }> {
   return new Promise((resolve, reject) => {
      exec(`docker images | grep "${imageName}"`, (error, stdout, stderr) => {
         if (error) {
            console.log(`Image doesn't exists`);
            resolve({ imageExists: false, image: '' })
            return;
         }

         const output = stdout.trim().split(' ')[0];
         if (output) {
            resolve({ imageExists: true, image: output });
         }
      })
   })
}

async function checkContainerExists(containerName: string): Promise<{ containerExists: boolean; container: string }> {
   return new Promise((resolve, reject) => {
      exec(`docker ps -a --filter "name=${containerName}" --format "{{.Names}}"`, (error, stdout, stderr) => {
         if (error) {
            reject('Error executing the command');
            return;
         }

         const output = stdout.trim(); // Get container name
         if (output) {
            resolve({ containerExists: true, container: output });
         } else {
            resolve({ containerExists: false, container: '' });
         }
      });
   });
}

function checkVersion(name: string | ''): number {
   const version = name.split('_').pop();
   return Number(version);
}

async function buildImage(imageExists: boolean, image: string, containerName: string, imageName: string): Promise<string | undefined> {
   if (imageExists) {
      try {
         const imageVersion = await checkVersion(image) + 1;
         const newImageName = `${imageName}_${imageVersion}`;
         console.log(newImageName, "new image name");
         // Build new docker image
         console.log("Building Docker image...");
         const newImage = execSync(`docker build --no-cache -t ${newImageName} -f ./docker/${containerName}-Dockerfile .`);

         console.log(newImage);
         if (newImage) {
            // Delete last image
            console.log("Killing docker image...");
            execSync(`docker rmi $(docker images | grep ${image})`);
         }
         return newImageName;
      } catch (error) {
         console.log(error);
         console.log("Docker image not exists...");
      }
   } else {
      // Build first docker image
      console.log("Building Docker image...");
      execSync(`docker build --no-cache -t ${imageName}_1 -f ./docker/${containerName}-Dockerfile .`);
      return `${imageName}_1`;
   }
}

//TODO: Check image version and create de new version
// First, create docker image, then create docker container, only if the last way was successfully