"use client"

import { Button, Card, CardBody, Input, Link, Spacer } from "@nextui-org/react";
import { Tabs, Tab } from "@nextui-org/tabs";
import { useEffect, useMemo, useState } from "react";

interface Project {
  id: number;
  createdAt: Date;
  name: string;
  description: string | null;
  port: number;
  gitHubUrl: string;
  mainBranch: string;
  buildCommand: string;
  startCommand: string;
  EnvVars: {
    id: number;
    key: string;
    value: string;
    projectId: number;
  }[];
}

export default function IndividualProjectPage({ params }: { params: { projectId: string } }) {
  const [project, setProject] = useState<Project>();

  const fetchProject = async () => {
    const response = await fetch(`/api/projects/${params.projectId}`);
    const resBody = await response.json();
    setProject({
      ...resBody.data,
      createdAt: new Date(resBody.data.createdAt),
    })
  };

  const handleDeploy = async () => {
    const resBody = await fetch(`/api/projects/${params.projectId}`, {
      method: "POST",
    }).then((res) => res.json());

    if (resBody.code === "OK") {
      alert("Project re-deployed successfully!");
      fetchProject();
    } else {
      alert("Failed to re-deploy project");
    }
  }

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
        <div className="flex gap-2">
          <span className="font-bold">Port:</span>
          {project?.port}
        </div>
        <div className="flex gap-2">
          <span className="font-bold">GitHub URL:</span>
          <Link href={project?.gitHubUrl} isExternal showAnchorIcon>
            {project?.gitHubUrl}
          </Link>
        </div>
        <div className="flex gap-2">
          <span className="font-bold">Main Branch:</span>
          {project?.mainBranch}
        </div>

        <Button
          endContent={<span className="material-symbols-outlined filled">rocket_launch</span>}
          color="primary"
          variant="ghost"
          onClick={handleDeploy}
        >
          Deploy
        </Button>
      </section>


      <section>
        <Tabs aria-label="Options">
          <Tab key="environment" title="Environment" className="p-4">
            {project &&
              <EnvSection envVars={project.EnvVars} reloadCallback={fetchProject} />
            }
          </Tab>
          <Tab key="music" title="Music">
            <Card>
              <CardBody>
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
              </CardBody>
            </Card>
          </Tab>
          <Tab key="videos" title="Videos">
            <Card>
              <CardBody>
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </section>
    </main >
  )
}

function EnvSection({ envVars: initialEnvVars, reloadCallback }: { envVars: Project["EnvVars"], reloadCallback: () => void }) {
  const [envVars, setEnvVars] = useState<{ id: number, key: string, value: string }[]>(initialEnvVars);

  const shouldUpdate = useMemo(() => (
    JSON.stringify(envVars) !== JSON.stringify(initialEnvVars)
  ), [envVars, initialEnvVars]);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shouldUpdate) return;

    // Remove empty env vars
    const reqBody = { envVars: envVars.filter((e) => e.key && e.value) };

    // Update env vars
    const resBody = await fetch(`/api/projects/${initialEnvVars[0].projectId}/env`, {
      method: "PUT",
      body: JSON.stringify(reqBody),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => res.json());

    // Handle response
    if (resBody.code === "OK") {
      alert("Environment Variables updated successfully!");
    } else {
      alert("Failed to update Environment Variables");
    }

    // Reload project data
    reloadCallback()
  }

  useEffect(() => {
    setEnvVars(initialEnvVars);
  }, [initialEnvVars]);

  return (
    <div className="">
      <h3 className="text-xl font-bold">Environment Variables</h3>

      <form onSubmit={handleUpdate} className="space-y-4 mt-4 max-w-3xl">
        {/* Vars Inputs */}
        <div className="space-y-3">
          {envVars.map((envVar) => {
            return (
              <div key={envVar.id} className="flex items-center gap-2">
                <Input label="Key" value={envVar.key} onValueChange={(v) => {
                  setEnvVars((prev) => prev.map((e) => e.id === envVar.id ? { ...e, key: v } : e));
                }} />
                <PasswordInput label="Value" value={envVar.value} onValueChange={(v) => {
                  setEnvVars((prev) => prev.map((e) => e.id === envVar.id ? { ...e, value: v } : e));
                }} />

                <Button isIconOnly onClick={() => {
                  setEnvVars((prev) => prev.filter((e) => e.id !== envVar.id));
                }}
                  color="danger"
                  variant="faded"
                >
                  <span className="material-symbols-outlined">
                    delete
                  </span>
                </Button>
              </div>
            )
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {/* Add Button */}
          <Button
            onClick={() => {
              setEnvVars((prev) => [...prev, { id: Date.now(), key: "", value: "" }]);
            }}
            startContent={<span className="material-symbols-outlined">add</span>}
            className="mr-auto"
            color="secondary"
            variant="flat"
          >
            Add
          </Button>
          {/* Cancel Button */}
          <Button variant="flat" onClick={() => setEnvVars(initialEnvVars)} isDisabled={!shouldUpdate} >
            Cancel
          </Button>
          {/* Update Button */}
          <Button isDisabled={!shouldUpdate} type="submit" color="primary">
            Update
          </Button>
        </div>
      </form >
    </div >
  );
}

export function PasswordInput({ label, value, onValueChange }: { label: string, value: string, onValueChange: (v: string) => void }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input label={label} value={value} type={showPassword ? "text" : "password"} onValueChange={onValueChange} endContent={
      <Button isIconOnly variant="light" size="sm" onClick={() => setShowPassword(!showPassword)}>
        <span className="material-symbols-outlined">
          {showPassword ? "visibility_off" : "visibility"}
        </span>
      </Button>
    } />
  )
}