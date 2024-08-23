"use client"
import { AuthContext } from '@/contexts/AuthContext'
import { Button, Textarea } from '@nextui-org/react'
import { Admin } from '@prisma/client'
import React, { useContext, useEffect, useState } from 'react'

export default function SettingsPage() {
  const { currentUser: currentAdmin } = useContext(AuthContext)
  const [adminInfo, setAdminInfo] = useState<Admin>()

  const getAdminInfo = async () => {
    const resBody = await fetch(`/api/admins/${currentAdmin?.id}`).then((res) => res.json())

    if (resBody.code !== "OK") {
      return alert("Failed to fetch admin info")
    }

    setAdminInfo(resBody.data)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const resBody = await fetch(`/api/admins/${currentAdmin?.id}/githubKey`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ githubKey: adminInfo?.githubKey }),
    }).then((res) => res.json())

    if (resBody.code !== "OK") {
      console.log(resBody)
      return alert("Failed to update GitHub Key")
    }

    alert("GitHub Key updated successfully!")
    getAdminInfo()
  }

  useEffect(() => {
    if (!currentAdmin) return

    getAdminInfo()
  }, [currentAdmin])

  return (
    <div>
      <h1>Settings</h1>

      <section>
        <h2>GitHub Key</h2>
        <form onSubmit={handleSubmit}>
          <Textarea placeholder="GitHub Key" value={adminInfo?.githubKey || ""} onValueChange={(value) => setAdminInfo({ ...adminInfo as Admin, githubKey: value })} />
          <Button type="submit">Save</Button>
        </form>
      </section>
    </div>
  )
}
