// CONSTANTS
export const serviceTypes = [
    {
        id: "webService",
        icon: "language",
        name: "Web Service",
        routePrefix: "web"
    },
    {
        id: "database",
        icon: "database",
        name: "Database",
        routePrefix: "db"
    },
    {
        id: "objectStorage",
        icon: "folder_open",
        name: "Object Storage",
        routePrefix: "storage"
    },
    {
        id: "staticWebsite",
        icon: "web",
        name: "Static Website",
        routePrefix: "static"
    },
] as const;

export const serviceRuntimes = [
    {
        id: "nodejs",
        typeId: "webService",
        name: "Node.js",
        dockerImage: "node",
        dockerVersions: ["14", "16", "18", "20", "22"]
    },
    {
        id: "postgresql",
        typeId: "database",
        name: "PostgreSQL",
        dockerImage: "postgres",
        dockerVersions: ["9.6", "10", "11", "12", "13", "14"]
    },
    {
        id: "minio",
        typeId: "objectStorage",
        name: "MinIO",
        dockerImage: "minio/minio",
        dockerVersions: ["latest"]
    }
] as const;

// TYPES
export type ServiceTypeId = typeof serviceTypes[number]["id"];
export type ServiceRuntimeId = typeof serviceRuntimes[number]["id"];

// FUNCTIONS
export function getServiceType(typeId: ServiceTypeId) {
    return serviceTypes.find(type => type.id === typeId);
}
export function getServiceRuntime(runtimeId: ServiceRuntimeId) {
    return serviceRuntimes.find(runtime => runtime.id === runtimeId);
}
export function getRuntimesByType(typeId: ServiceTypeId) {
    return serviceRuntimes.filter(runtime => runtime.typeId === typeId);
}