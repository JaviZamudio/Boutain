"use client";

import { Table, TableBody, TableCell, TableHeader, TableRow, TableColumn, Button, Spinner, Link } from "@nextui-org/react";
import NextLink from "next/link";
import { Key, useEffect, useState } from "react";

interface Service {
  id: number;
  name: string;
  description?: string;
  port: number;
  gitHubUrl: string;
  mainBranch: string;
}
export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>();

  const fetchServices = async () => {
    const response = await fetch("/api/services");
    const resBody = await response.json();
    setServices(resBody.data);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return (
    <main>
      <h1 className="text-4xl font-bold text-center">Services</h1>

      <Button
        as={Link} href="/services/new"
        startContent={<span className="material-symbols-outlined">add</span>}
      >
        New service
      </Button>

      <Table aria-label="Example static collection table">
        <TableHeader>
          <TableColumn>Name</TableColumn>
          <TableColumn>Github URL</TableColumn>
          <TableColumn>Main Branch</TableColumn>
          <TableColumn>Port</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody isLoading={!services} loadingContent={<Spinner label="Loading services..." />} emptyContent={"No services found"}>
          {!services ? [] :
            services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>
                  <Link href={`/services/${service.id}`}>
                    {service.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={service.gitHubUrl} isExternal showAnchorIcon>
                    {service.gitHubUrl}
                  </Link>
                </TableCell>
                <TableCell>{service.mainBranch}</TableCell>
                <TableCell>{service.port}</TableCell>
                <TableCell>
                  <Button endContent={<span className="material-symbols-outlined">chevron_right</span>} as={Link} href={`/services/${service.id}`}>
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