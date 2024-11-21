"use client";

import { Table, TableBody, TableCell, TableHeader, TableRow, TableColumn, Button, Spinner, Link } from "@nextui-org/react";
import NextLink from "next/link";
import { Key, useEffect, useState } from "react";

interface Project {
  id: number;
  name: string;
  description?: string;
  _count: { Services: number };
  servicesCount: number;
}
export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>();

  const fetchProjects = async () => {
    const response = await fetch("/api/projects");
    const resBody = await response.json();
    setProjects(resBody.data.map((project: Project) => ({
      ...project,
      servicesCount: project._count.Services
    })))
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <main className="p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold">Projects</h1>

        <Button
          as={Link} href="/projects/new"
          startContent={<span className="material-symbols-outlined">add</span>}
          color="primary"
        >
          New Project
        </Button>
      </div>

      <Table aria-label="Example static collection table" className="mt-4">
        <TableHeader>
          <TableColumn>Name</TableColumn>
          <TableColumn>N. Services</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody isLoading={!projects} loadingContent={<Spinner label="Loading projects..." />} emptyContent={"No projects found"}>
          {!projects ? [] :
            projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <Link href={`/projects/${project.id}`}>
                    {project.name}
                  </Link>
                </TableCell>
                <TableCell>
                  {project.servicesCount}
                </TableCell>
                <TableCell>
                  <Button endContent={<span className="material-symbols-outlined">chevron_right</span>} as={Link} href={`/projects/${project.id}`}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </main >
  );
}