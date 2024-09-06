"use client"

import { getServiceRuntime, ServiceRuntimeId } from "@/types";
import { Button, Link } from "@nextui-org/react";
import { Tabs, Tab } from "@nextui-org/tabs";
import { Database, Service as PrismaService } from "@prisma/client";
import { useEffect, useState } from "react";

interface Service extends PrismaService {
  id: number;
  createdAt: Date;
  name: string;
  description: string | null;
  port: number;
  url: string;
  serviceHost: string;
  Database: Database;
}

export default function IndividualservicePage({ params }: { params: { serviceId: string, projectId: string } }) {
  const [service, setService] = useState<Service>();

  const fetchService = async () => {
    const response = await fetch(`/api/projects/${params.projectId}/services/${params.serviceId}`);
    const resBody = await response.json();
    setService({
      ...resBody.data,
      createdAt: new Date(resBody.data.createdAt),
    })
  };

  const handleDeploy = async () => {
    const resBody = await fetch(`/api/projects/${params.projectId}/services/${params.serviceId}`, {
      method: "POST",
    }).then((res) => res.json());

    if (resBody.code === "OK") {
      alert("service re-deployed successfully!");
      fetchService();
    } else {
      alert("Failed to re-deploy service");
    }
  }

  useEffect(() => {
    fetchService();
  }, []);

  return (
    <>
      <h1 className="text-4xl font-bold text-center">service: {service?.name}</h1>

      {/* General Info */}
      <section>
        <h2 className="text-2xl font-bold">General Info</h2>
        <div className="flex gap-2">
          <span className="font-bold">Description:</span>
          {service?.description || "No description provided"}
        </div>
        <div className="flex gap-2">
          <span className="font-bold">Host:</span>
          <Link
            href={service?.serviceHost}
            isExternal
            showAnchorIcon
            underline="hover"
          >
            {service?.serviceHost}
          </Link>
        </div>
        <div className="flex gap-2">
          <span className="font-bold">Port:</span>
          {service?.port}
        </div>
        <div className="flex gap-2">
          <span className="font-bold">Runtime:</span>
          {getServiceRuntime(service?.serviceRuntime as ServiceRuntimeId)?.name}
        </div>
        <div className="flex gap-2">
          <span className="font-bold">Default DB Name:</span>
          {service?.Database.dbName}
        </div>
        <div className="flex gap-2">
          <span className="font-bold">DB Username:</span>
          {service?.Database.dbUser}
        </div>

        <Button
          onClick={handleDeploy}
          color="primary"
          variant="solid"
          startContent={<span className="material-symbols-outlined">rocket_launch</span>}
        >
          Re-deploy
        </Button>
      </section>


      {/* <section className="mt-4">
        <Tabs aria-label="Options">
          <Tab key="environment" title="Environment" className="p-4">
            
          </Tab>
          <Tab key="settings" title="Settings">
            
          </Tab>
        </Tabs>
      </section> */}
    </>
  )
}