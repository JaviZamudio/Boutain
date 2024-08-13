"use client";

import { Table, TableBody, TableCell, TableHeader, TableRow, TableColumn, Button, Spinner, Link } from "@nextui-org/react";
import NextLink from "next/link";
import { Key, useEffect, useState } from "react";

interface Project {
  id: number;
  name: string;
  description?: string;
  port: number;
  gitHubUrl: string;
  mainBranch: string;
}
export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>();

  const fetchProjects = async () => {
    const response = await fetch("/api/projects");
    const resBody = await response.json();
    setProjects(resBody.data);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <main>
      <h1 className="text-4xl font-bold text-center">Projects</h1>

      <Button
        as={Link} href="/projects/new"
        startContent={<span className="material-symbols-outlined">add</span>}
      >
        New Project
      </Button>

      <Table aria-label="Example static collection table">
        <TableHeader>
          <TableColumn>Name</TableColumn>
          <TableColumn>Github URL</TableColumn>
          <TableColumn>Main Branch</TableColumn>
          <TableColumn>Port</TableColumn>
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
                  <Link href={project.gitHubUrl} isExternal showAnchorIcon>
                    {project.gitHubUrl}
                  </Link>
                </TableCell>
                <TableCell>{project.mainBranch}</TableCell>
                <TableCell>{project.port}</TableCell>
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