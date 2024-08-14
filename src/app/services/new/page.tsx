"use client"

import { Button, Input, Link, Textarea } from "@nextui-org/react";
import { useState } from "react";

export default function NewServicePage() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    gitHubUrl: "",
    mainBranch: "",
    buildCommand: "",
    startCommand: "",
    envVars: [] as { key: string; value: string }[],
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const resBody = await fetch("/api/services", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    }).then((res) => {
      return res.json();
    });

    console.log(resBody);

    if (resBody.code === "OK") {
      alert("service created successfully! \n On port: " + resBody.data.port);
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
      envVars: [],
    });
  };

  return (
    <main className="p-4">
      <h1 className="text-3xl font-bold text-center">
        Create a New service
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xs">
        <h2>service details</h2>
        <Input label="service name" placeholder="My new service" onValueChange={(value) => setForm({ ...form, name: value })} value={form.name} isRequired />
        <Textarea label="Description" placeholder="A short description of the service" onValueChange={(value) => setForm({ ...form, description: value })} value={form.description} />
        <Input label="GitHub URL" placeholder="https://github.com/username/repo" onValueChange={(value) => setForm({ ...form, gitHubUrl: value })} value={form.gitHubUrl} isRequired />
        <Input label="Main branch" placeholder="main" onValueChange={(value) => setForm({ ...form, mainBranch: value })} value={form.mainBranch} isRequired />
        <Input label="Build command" placeholder="npm run build" onValueChange={(value) => setForm({ ...form, buildCommand: value })} value={form.buildCommand} isRequired />
        <Input label="Start command" placeholder="npm run start" onValueChange={(value) => setForm({ ...form, startCommand: value })} value={form.startCommand} isRequired />

        <div>
          <h2>Environment variables</h2>
          <Button onClick={() => setForm({ ...form, envVars: [...form.envVars, { key: "", value: "" }] })}>Add environment variable</Button>
        </div>
        <div>
          {form.envVars.map((envVar, index) => (
            <div key={index}>
              <Input label="Key" placeholder="API_KEY" onValueChange={(value) => setForm({ ...form, envVars: form.envVars.map((v, i) => (i === index ? { ...v, key: value } : v)) })} value={envVar.key} />
              <Input label="Value" placeholder="your-api-key" onValueChange={(value) => setForm({ ...form, envVars: form.envVars.map((v, i) => (i === index ? { ...v, value: value } : v)) })} value={envVar.value} />
            </div>
          ))}
        </div>

        <Button type="submit">Create service</Button>
      </form>
    </main >
  );
}