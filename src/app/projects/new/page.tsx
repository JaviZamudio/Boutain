"use client"

import { Button, Input, Link, Textarea } from "@nextui-org/react";
import { useState } from "react";

export default function NewProjectPage() {
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

    const resBody = await fetch("/api/projects", {
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
      alert("Project created successfully! \n On port: " + resBody.data.port);
    } else {
      alert("Failed to create project");
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
    <main>
      <h1>Create a new project</h1>
      <form onSubmit={handleSubmit}>
        <h2>Project details</h2>
        <Input label="Project name" placeholder="My new project" onValueChange={(value) => setForm({ ...form, name: value })} value={form.name} />
        <Textarea label="Description" placeholder="A short description of the project" onValueChange={(value) => setForm({ ...form, description: value })} value={form.description} />
        <Input label="GitHub URL" placeholder="https://github.com/username/repo" onValueChange={(value) => setForm({ ...form, gitHubUrl: value })} value={form.gitHubUrl} />
        <Input label="Main branch" placeholder="main" onValueChange={(value) => setForm({ ...form, mainBranch: value })} value={form.mainBranch} />
        <Input label="Build command" placeholder="npm run build" onValueChange={(value) => setForm({ ...form, buildCommand: value })} value={form.buildCommand} />
        <Input label="Start command" placeholder="npm run start" onValueChange={(value) => setForm({ ...form, startCommand: value })} value={form.startCommand} />

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

        <Button type="submit">Create project</Button>
      </form>
    </main >
  );
}