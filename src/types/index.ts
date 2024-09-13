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

export const serviceRuntimes: ServiceRuntime[] = [
    {
        id: "nodejs",
        typeId: "webService",
        name: "Node.js",
        dockerImage: "node",
        dockerVersions: ["latest", "14", "16", "18", "20", "22"],
        defaultPort: "3000",
        webSettings: {
            prodVar: "NODE_ENV",
        }
    },
    {
        id: "postgresql",
        typeId: "database",
        name: "PostgreSQL",
        dockerImage: "postgres",
        dockerVersions: ["latest", "9.6", "10", "11", "12", "13", "14"],
        defaultPort: "5432",
        dbSettings: {
            initDb: "POSTGRES_DB",
            initUser: "POSTGRES_USER",
            initPassword: "POSTGRES_PASSWORD",
            volumePath: "/var/lib/postgresql/data"
        }
    },
    {
        id: "mongodb",
        typeId: "database",
        name: "MongoDB",
        dockerImage: "mongo",
        dockerVersions: ["latest", "4.4", "5.0", "5.2"],
        defaultPort: "27017",
        dbSettings: {
            initDb: "MONGO_INITDB_DATABASE",
            initUser: "MONGO_INITDB_ROOT_USERNAME",
            initPassword: "MONGO_INITDB_ROOT_PASSWORD",
            volumePath: "/data/db"
        }
    },
    {
        id: "mysql",
        typeId: "database",
        name: "MySQL",
        dockerImage: "mysql",
        dockerVersions: ["latest", "9.0", "8.0", "5.7"],
        defaultPort: "3306",
        dbSettings: {
            initDb: "MYSQL_DATABASE",
            initUser: "MYSQL_USER",
            initPassword: "MYSQL_PASSWORD",
            volumePath: "/var/lib/mysql"
        }
    },
    {
        id: "minio",
        typeId: "objectStorage",
        name: "MinIO",
        dockerImage: "minio/minio",
        dockerVersions: ["latest"],
        defaultPort: "9000"
    }
];

// TYPES
export type ServiceTypeId = "webService" | "database" | "objectStorage" | "staticWebsite";
export type ServiceRuntimeId = "mongodb" | "mysql" | "minio" | "nodejs" | "postgresql";
export type ServiceType = typeof serviceTypes[number];
export type ServiceRuntime = {
    dbSettings?: {
        initDb: string,
        initUser: string,
        initPassword: string,
        volumePath: string
    },
    webSettings?: {
        prodVar: string
    },
    id: ServiceRuntimeId,
    typeId: ServiceTypeId,
    name: string, dockerImage: string,
    dockerVersions: string[],
    defaultPort: string
};

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