export const serviceTypes = [
    {
        id: "webService",
        name: "Web Service"
    },
    {
        id: "staticWebsite",
        name: "Static Website"
    },
    {
        id: "database",
        name: "Database"
    },
    {
        id: "objectStorage",
        name: "Object Storage"
    }
]

export type ServiceType = typeof serviceTypes[number]["id"];