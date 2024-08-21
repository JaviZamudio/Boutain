"use client"

import { PostServicetBody } from "@/app/api/projects/[projectId]/services/route";
import { PasswordInput } from "@/app/services/[serviceId]/page";
import { getRuntimesByType, getServiceRuntime, ServiceRuntimeId } from "@/types";
import { Button, Divider, Input, Link, Select, SelectItem, Textarea } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import React, { useState } from 'react'


export default function NewServicePage({ params }: { params: { projectId: string } }) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    description: "",
    gitHubUrl: "",
    mainBranch: "",
    buildCommand: "",
    startCommand: "",
    runtimeId: "",
    runtimeVersion: "",
    envVars: [] as { key: string; value: string }[],
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const reqBody: PostServicetBody = {
      name: form.name,
      description: form.description,
      serviceType: "webService",
      runtimeId: form.runtimeId as ServiceRuntimeId,
      dockerVersion: form.runtimeVersion,
      serviceDetails: {
        buildCommand: form.buildCommand,
        startCommand: form.startCommand,
        mainBranch: form.mainBranch,
        gitHubUrl: form.gitHubUrl,
        envVars: form.envVars,
      },
    };

    const resBody = await fetch(`/api/projects/${params.projectId}/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqBody),
    }).then((res) => {
      return res.json();
    });

    console.log(resBody);

    if (resBody.code === "OK") {
      alert("Service created successfully! \n On port: " + resBody.data.port);
      router.push(`/projects/${params.projectId}/services/${resBody.data.id}`);
    } else {
      alert("Failed to create service");
    }

    setForm({
      name: "",
      description: "",
      gitHubUrl: "",
      mainBranch: "",
      buildCommand: "",
      startCommand: "",
      runtimeId: "",
      runtimeVersion: "",
      envVars: [],
    });
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-center">
        Create a New service
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4 flex flex-col">
        {/* General */}
        <section className="space-y-4">
          <h2 className="text-xl">General details</h2>
          <Input label="Service Name" placeholder="My new service" onValueChange={(value) => setForm({ ...form, name: value })} value={form.name} isRequired />
          <Textarea label="Description" placeholder="A short description of the service" onValueChange={(value) => setForm({ ...form, description: value })} value={form.description} />
        </section>

        <Divider />

        {/* Runtime */}
        <section className="space-y-4 flex flex-col">
          <h2 className="text-xl">Runtime details</h2>
          {/* Select Runtime */}
          <Select
            label="Select a runtime"
            className="max-w-xs"
            onChange={(e) => setForm({ ...form, runtimeId: e.target.value, runtimeVersion: getServiceRuntime(e.target.value as ServiceRuntimeId)?.dockerVersions[0] || "" })}
          >
            {getRuntimesByType("webService").map((runtime) => (
              <SelectItem key={runtime.id} value={runtime.id}>
                {runtime.name}
              </SelectItem>
            ))}
          </Select>
          {/* Select Version */}
          <Select
            label="Select a version"
            className="max-w-xs"
            isDisabled={!form.runtimeId}
            selectedKeys={form.runtimeVersion ? [form.runtimeVersion] : []}
            onChange={(e) => setForm({ ...form, runtimeVersion: e.target.value })}
          >
            {getServiceRuntime(form.runtimeId as ServiceRuntimeId)?.dockerVersions.map((version) => (
              <SelectItem key={version} value={version}>
                {version}
              </SelectItem>
            )) || []}
          </Select>
        </section>

        <Divider />

        {/* Details */}
        <section className="space-y-4">
          <h2 className="text-xl">Service details</h2>
          <Input label="GitHub URL" placeholder="https://github.com/username/repo" onValueChange={(value) => setForm({ ...form, gitHubUrl: value })} value={form.gitHubUrl} isRequired />
          <Input label="Main branch" placeholder="main" onValueChange={(value) => setForm({ ...form, mainBranch: value })} value={form.mainBranch} isRequired />
          <Input label="Build command" placeholder="npm run build" onValueChange={(value) => setForm({ ...form, buildCommand: value })} value={form.buildCommand} isRequired />
          <Input label="Start command" placeholder="npm run start" onValueChange={(value) => setForm({ ...form, startCommand: value })} value={form.startCommand} isRequired />
        </section>

        <Divider />

        {/* Environment variables */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl">Environment variables</h2>
            <Button
              onClick={() => setForm({ ...form, envVars: [...form.envVars, { key: "", value: "" }] })}
              type="button"
              color="secondary"
              variant="flat"
              endContent={<span className="material-symbols-outlined">add</span>}
            >
              Environment variable
            </Button>
          </div>
          <div className="space-y-2">
            {form.envVars.map((envVar, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input label="Key" value={envVar.key} onValueChange={(value) => {
                  setForm({ ...form, envVars: form.envVars.map((ev, i) => (i === index ? { ...ev, key: value } : ev)) });
                }} />
                <PasswordInput label="Value" value={envVar.value} onValueChange={(value) => {
                  setForm({ ...form, envVars: form.envVars.map((ev, i) => (i === index ? { ...ev, value: value } : ev)) });
                }} />

                <Button isIconOnly onClick={() => {
                  setForm({ ...form, envVars: form.envVars.filter((_, i) => i !== index) });
                }}
                  color="danger"
                  variant="faded"
                >
                  <span className="material-symbols-outlined">
                    delete
                  </span>
                </Button>
              </div>
            ))}
          </div>
        </section>

        <Divider />

        <Button type="submit" color="primary" size="lg" className="self-end">Create service</Button>
      </form>
    </>
  );
}