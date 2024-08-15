"use client"

import { Button, Input, Link, Textarea } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
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
      alert("Project created successfully!");
    } else {
      alert("Failed to create project");
    }

    router.push(`/projects/${resBody.data.id}`);
  };

  return (
    <main className="p-4">
      <h1 className="text-3xl font-bold text-center">
        Create a New Project
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xs">
        <h2>Project details</h2>
        <Input label="Project name" placeholder="My new project" onValueChange={(value) => setForm({ ...form, name: value })} value={form.name} isRequired />
        <Textarea label="Description" placeholder="A short description of the project" onValueChange={(value) => setForm({ ...form, description: value })} value={form.description} />

        <Button type="submit">Create Project</Button>
      </form>
    </main >
  );
}