"use client"

import { NextLink } from "@/contexts/GlobalProviders";
import { Button, Card, CardBody, Input, Link, Spacer } from "@nextui-org/react";
import { Tabs, Tab } from "@nextui-org/tabs";
import { Service } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";

interface Project {
  id: number;
  createdAt: Date;
  name: string;
  description: string | null;
  servicesCount: number;
  Services: Service[];
}

export default function IndividualProjectPage({ params }: { params: { projectId: string } }) {
  const [project, setProject] = useState<Project>();

  const fetchProject = async () => {
    const response = await fetch(`/api/projects/${params.projectId}`);
    const resBody = await response.json();
    setProject({
      ...resBody.data,
      createdAt: new Date(resBody.data.createdAt),
      servicesCount: resBody.data.Services.length,
    })
  };

  useEffect(() => {
    fetchProject();
  }, []);

  return (
    <main className="p-4">
      <h1 className="text-4xl font-bold text-center">Project: {project?.name}</h1>

      {/* General Info */}
      <section>
        <h2 className="text-2xl font-bold">General Info</h2>
        <div className="flex gap-2">
          <span className="font-bold">Description:</span>
          {project?.description || "No description provided"}
        </div>

        <Button as={NextLink} href={`/projects/${params.projectId}/services`}>
          Go to Services
        </Button>
      </section>
    </main >
  )
}