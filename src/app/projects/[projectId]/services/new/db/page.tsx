"use client"

import { PostServicetBody } from "@/app/api/projects/[projectId]/services/route";
import { PasswordInput } from "@/components/PasswordInput";
import { AuthContext } from "@/contexts/AuthContext";
import { getRuntimesByType, getServiceRuntime, ServiceRuntimeId } from "@/types";
import { Button, Divider, Input, Link, Select, SelectItem, Textarea } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import React, { useContext, useState } from 'react'


export default function NewServicePage({ params }: { params: { projectId: string } }) {
  const router = useRouter()
  const { currentAdmin } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: "",
    description: "",
    runtimeId: "",
    runtimeVersion: "",

    dbName: "",
    dbUser: "",
    dbPassword: "",
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentAdmin) return;

    const reqBody: PostServicetBody = {
      adminId: currentAdmin?.id,
      name: form.name,
      description: form.description,
      serviceType: "database",
      runtimeId: form.runtimeId as ServiceRuntimeId,
      dockerVersion: form.runtimeVersion,
      serviceDetails: {
        dbName: form.dbName,
        dbUser: form.dbUser,
        dbPassword: form.dbPassword
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
      router.push(`/projects/${params.projectId}/services/${resBody.data.id}/db`);
    } else {
      alert("Failed to create service");
    }

    setForm({
      name: "",
      description: "",
      runtimeId: "",
      runtimeVersion: "",
      dbName: "",
      dbUser: "",
      dbPassword: "",
    });
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-center">
        Create a New Database
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4 flex flex-col">
        {/* General */}
        <section className="space-y-4">
          <h2 className="text-xl">General details</h2>
          <Input label="Service Name" placeholder="My new db" onValueChange={(value) => setForm({ ...form, name: value })} value={form.name} isRequired />
          <Textarea label="Description" placeholder="A short description of the Database" onValueChange={(value) => setForm({ ...form, description: value })} value={form.description} />
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
            {getRuntimesByType("database").map((runtime) => (
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
          <h2 className="text-xl">Database details</h2>
          <Input label="Database Name" placeholder="my_db" onValueChange={(value) => setForm({ ...form, dbName: value })} value={form.dbName} isRequired />
          <Input label="Database User" placeholder="root" onValueChange={(value) => setForm({ ...form, dbUser: value })} value={form.dbUser} isRequired autoComplete="off" />
          <PasswordInput label="Database Password" placeholder="password" onValueChange={(value) => setForm({ ...form, dbPassword: value })} value={form.dbPassword} isRequired />
        </section>

        <Divider />

        <Button type="submit" color="primary" size="lg" className="self-end">Create service</Button>
      </form>
    </>
  );
}