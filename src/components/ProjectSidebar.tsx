"use client"

import { Listbox, ListboxItem } from '@nextui-org/react'
import { Project } from '@prisma/client'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ProjectSidebar() {
  const [project, setProject] = useState<Project>()
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()


  const getProject = async () => {
    const resBody = await fetch(`/api/projects/${params.projectId}`).then(res => res.json())

    if (resBody.code !== "OK") {
      return alert("Failed to load project")
    }

    setProject(resBody.data)
  }

  useEffect(() => {
    getProject()
  }, [])

  return (
    <div className='flex flex-col grow w-full max-w-60 bg-content2 shrink-0'>
      <h1 className='text-2xl p-4'>{project?.name}</h1>

      <Listbox aria-label="Project navigation" className='flex-grow'>
        <ListboxItem
          key={`/projects/${params.projectId}`}
          href={`/projects/${params.projectId}`}
          className={"py-3 px-4 " + (pathname === `/projects/${params.projectId}` ? 'bg-primary text-primary-foreground' : '')}
          startContent={<span className='material-symbols-outlined'>home</span>}
        >
          Overview
        </ListboxItem>

        <ListboxItem
          key={`/projects/${params.projectId}/services`}
          href={`/projects/${params.projectId}/services`}
          className={"py-3 px-4 " + (pathname === `/projects/${params.projectId}/services` ? 'bg-primary text-primary-foreground' : '')}
          startContent={<span className='material-symbols-outlined'>api</span>}
        >
          Services
        </ListboxItem>

        <ListboxItem
          key={`/projects/${params.projectId}/deployments`}
          href={`/projects/${params.projectId}/deployments`}
          className={"py-3 px-4 " + (pathname === `/projects/${params.projectId}/deployments` ? 'bg-primary text-primary-foreground' : '')}
          startContent={<span className='material-symbols-outlined'>cloud</span>}
        >
          Deployments
        </ListboxItem>

        <ListboxItem
          key={`/projects/${params.projectId}/settings`}
          href={`/projects/${params.projectId}/settings`}
          className={"py-3 px-4 " + (pathname === `/projects/${params.projectId}/settings` ? 'bg-primary text-primary-foreground' : '')}
          startContent={<span className='material-symbols-outlined'>settings</span>}
        >
          Settings
        </ListboxItem>
      </Listbox>
    </div >
  )
}
