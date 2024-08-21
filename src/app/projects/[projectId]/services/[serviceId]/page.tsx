"use client"

import { Button, Card, CardBody, Input, Link, Spacer, Textarea } from "@nextui-org/react";
import { Tabs, Tab } from "@nextui-org/tabs";
import { Database, EnvVar, Service as PrismaService, WebService } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface Service extends PrismaService {
  id: number;
  createdAt: Date;
  name: string;
  description: string | null;
  port: number;
  url: string;
  WebService: WebService & { EnvVars: EnvVar[] };
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
          <span className="font-bold">URL:</span>
          <Link
            href={service?.url}
            isExternal
            showAnchorIcon
            underline="hover"
          >
            {service?.url}
          </Link>
        </div>
        <div className="flex gap-2">
          <span className="font-bold">GitHub URL:</span>
          <Link href={service?.WebService.gitHubUrl} isExternal showAnchorIcon>
            {service?.WebService.gitHubUrl}
          </Link>
        </div>
        <div className="flex gap-2">
          <span className="font-bold">Main Branch:</span>
          {service?.WebService.mainBranch}
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


      <section className="mt-4">
        <Tabs aria-label="Options">
          <Tab key="environment" title="Environment" className="p-4">
            {service &&
              <EnvSection serviceId={service.id} envVars={service.WebService.EnvVars} reloadCallback={fetchService} />
            }
          </Tab>
          <Tab key="settings" title="Settings">
            {service &&
              <SettingsSection service={service} />
            }
          </Tab>
        </Tabs>
      </section>
    </>
  )
}

function EnvSection({ envVars: initialEnvVars, reloadCallback, serviceId }: { envVars: EnvVar[], reloadCallback: () => void, serviceId: number }) {
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
    const resBody = await fetch(`/api/services/${serviceId}/env`, {
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

    // Reload service data
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

function SettingsSection({ service }: { service: Service }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const initialForm = useMemo(() => ({
    name: service.name,
    description: service.description || "",
    gitHubUrl: service.WebService.gitHubUrl,
    mainBranch: service.WebService.mainBranch,
    buildCommand: service.WebService.buildCommand,
    startCommand: service.WebService.startCommand,
  }), [service]);
  const [form, setForm] = useState(initialForm);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isEditing) return;

    // Update service
    const resBody = await fetch(`/api/projects/${service.projectId}/services/${service.id}`, {
      method: "PUT",
      body: JSON.stringify(form),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => res.json());

    if (resBody.code === "OK") {
      alert("Service updated successfully!");
      router.refresh();
      setIsEditing(false);
    } else {
      alert("Failed to update Service");
    }
  }

  useEffect(() => {
    setForm(initialForm);
  }, [service]);

  useEffect(() => {
    setIsEditing(JSON.stringify(form) !== JSON.stringify(initialForm));
  }, [form, initialForm]);

  return (
    <div>
      <h3 className="text-xl font-bold">Settings</h3>
      <form className="space-y-4 mt-4 max-w-3xl" onSubmit={handleSubmit}>
        <Input label="Name" value={form.name} onValueChange={(v) => setForm((prev) => ({ ...prev, name: v }))} />
        <Textarea label="Description" value={form.description} onValueChange={(v) => setForm((prev) => ({ ...prev, description: v }))} />
        <Input label="GitHub URL" value={form.gitHubUrl} onValueChange={(v) => setForm((prev) => ({ ...prev, gitHubUrl: v }))} />
        <Input label="Main Branch" value={form.mainBranch} onValueChange={(v) => setForm((prev) => ({ ...prev, mainBranch: v }))} />
        <Input label="Build Command" value={form.buildCommand} onValueChange={(v) => setForm((prev) => ({ ...prev, buildCommand: v }))} />
        <Input label="Start Command" value={form.startCommand} onValueChange={(v) => setForm((prev) => ({ ...prev, startCommand: v }))} />

        <div className="flex gap-2 mt-4">
          <Button
            isDisabled={!isEditing}
            variant="flat"
            onClick={() => {
              setIsEditing(false);
              setForm(initialForm);
            }}>
            Cancel
          </Button>
          <Button type="submit" color="primary" isDisabled={!isEditing}>
            Update
          </Button>
        </div>
      </form>
    </div>
  )
}

function PasswordInput({ label, value, onValueChange }: { label: string, value: string, onValueChange: (v: string) => void }) {
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