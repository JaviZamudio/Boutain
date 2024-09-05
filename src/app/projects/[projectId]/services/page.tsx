"use client";

import { getServiceRuntime, getServiceType, ServiceRuntimeId, ServiceTypeId, serviceTypes } from "@/types";
import { Table, TableBody, TableCell, TableHeader, TableRow, TableColumn, Button, Spinner, Link, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import { Project as PrismaProject, Service as PrismaService } from "@prisma/client";
import { useEffect, useState } from "react";

interface Service extends PrismaService {
  Project: PrismaProject
}

export default function ServicesPage({ params }: { params: { projectId: string } }) {
  const [services, setServices] = useState<Service[]>();

  const fetchServices = async () => {
    const response = await fetch(`/api/projects/${params.projectId}/services`);
    const resBody = await response.json();
    setServices(resBody.data);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return (
    <>
      <h1 className="text-4xl font-bold text-center">Services</h1>

      <Dropdown>
        <DropdownTrigger className="my-4">
          <Button
            className="self-end"
            endContent={<span className="material-symbols-outlined">add</span>}
          >
            New service
          </Button>
        </DropdownTrigger>
        <DropdownMenu>
          {serviceTypes.map((serviceType) => (
            <DropdownItem
              as={Link}
              href={`/projects/${params.projectId}/services/new/${serviceType.routePrefix}`}
              startContent={<span className="material-symbols-outlined">{serviceType.icon}</span>}
              key={serviceType.id}
            >
              {serviceType.name}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>

      <Table aria-label="Example static collection table">
        <TableHeader>
          <TableColumn>Name</TableColumn>
          <TableColumn>Type</TableColumn>
          <TableColumn>Runtime</TableColumn>
          <TableColumn>Port</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody isLoading={!services} loadingContent={<Spinner label="Loading services..." />} emptyContent={"No services found"}>
          {!services ? [] :
            services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>
                  <Link href={`/projects/${params.projectId}/services/${service.id}/${getServiceType(service.serviceType as ServiceTypeId)?.routePrefix}`}>
                    {service.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined">{getServiceType(service.serviceType as ServiceTypeId)?.icon}</span>
                    {getServiceType(service.serviceType as ServiceTypeId)?.name}
                  </div>
                </TableCell>
                <TableCell>
                  {getServiceRuntime(service.serviceRuntime as ServiceRuntimeId)?.name}
                </TableCell>
                <TableCell>{service.port}</TableCell>
                <TableCell>
                  <Button endContent={<span className="material-symbols-outlined">chevron_right</span>} as={Link} href={`/projects/${params.projectId}/services/${service.id}/${getServiceType(service.serviceType as ServiceTypeId)?.routePrefix}`}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody >
      </Table >
    </ >
  );
}