"use client"
import { AuthContext } from '@/contexts/AuthContext'
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Textarea } from '@nextui-org/react'
import { Admin } from '@prisma/client'
import React, { useContext, useEffect, useMemo, useState } from 'react'

export default function SettingsPage() {
  const { currentAdmin: currentAdmin, logout } = useContext(AuthContext)
  const [adminInfo, setAdminInfo] = useState<Admin>()

  const getAdminInfo = async () => {
    const resBody = await fetch(`/api/admins/${currentAdmin?.id}`).then((res) => res.json())

    if (resBody.code !== "OK") {
      return alert("Failed to fetch admin info")
    }

    setAdminInfo(resBody.data)
  }

  const handleGithubKeySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
    <div className='space-y-4 p-4'>
      <h1 className='font-semibold text-2xl'>Settings</h1>

      <section>
        <h2 className='font-semibold text-xl'>GitHub Key</h2>
        <GithubKeyForm githubKey={adminInfo?.githubKey || ":"} adminId={currentAdmin?.id || 0} />
      </section>

      <section>
        <h2 className='font-semibold text-xl'>Change Password</h2>
        <ChangePasswordForm adminId={currentAdmin?.id || 0} />
      </section>

      <AdminsSection />

      <section>
        <h2 className='font-semibold text-xl'>Logout</h2>
        <Button onClick={logout} color='danger' variant='bordered' startContent={<span className='material-symbols-outlined'>logout</span>}>
          Logout
        </Button>
      </section>
    </div>
  )
}

function GithubKeyForm({ githubKey, adminId }: { githubKey: string; adminId: number }) {
  const [username, githubToken] = useMemo(() => githubKey.split(":"), [githubKey])
  const [form, setForm] = useState({ username: "", githubToken: "" })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const resBody = await fetch(`/api/admins/${adminId}/githubKey`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ githubKey: `${form.username}:${form.githubToken}` }),
    }).then((res) => res.json())

    if (resBody.code !== "OK") {
      console.log(resBody)
      return alert("Failed to update GitHub Key")
    }

    alert("GitHub Key updated successfully!")
  }

  useEffect(() => {
    setForm({ username, githubToken })
  }, [username, githubToken])

  return (
    <form onSubmit={handleSubmit}>
      <Input label="GitHub Username" placeholder="Username" onValueChange={(value) => setForm({ ...form, username: value })} value={form.username} />
      <Textarea label="Github Token" placeholder="Token" onValueChange={(value) => setForm({ ...form, githubToken: value })} value={form.githubToken} />
      <Button type="submit">Save Key</Button>
    </form>
  )
}

function ChangePasswordForm({ adminId }: { adminId: number }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (form.newPassword !== form.confirmPassword) {
      return alert("Passwords do not match")
    }

    const reqBody = {
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
      confirmPassword: form.confirmPassword,
    }

    const resBody = await fetch(`/api/admins/${adminId}/password`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqBody),
    }).then((res) => res.json())

    if (resBody.code !== "OK") {
      console.log(resBody)
      return alert("Failed to update password")
    }

    alert("Password updated successfully!")
    setForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input label="Current Password" type="password" placeholder="Current Password" onValueChange={(value) => setForm({ ...form, currentPassword: value })} />
      <Input label="New Password" type="password" placeholder="New Password" onValueChange={(value) => setForm({ ...form, newPassword: value })} />
      <Input label="Confirm Password" type="password" placeholder="Confirm Password" onValueChange={(value) => setForm({ ...form, confirmPassword: value })} />
      <Button type="submit">Change Password</Button>
    </form>
  )
}

function AdminsSection() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const { currentAdmin } = useContext(AuthContext)

  const getAdmins = async () => {
    const resBody = await fetch(`/api/admins`).then((res) => res.json())

    if (resBody.code !== "OK") {
      return alert("Failed to fetch admins")
    }

    console.log(resBody.data)
    setAdmins(resBody.data)
  }

  useEffect(() => {
    getAdmins()
  }, [])

  return (
    <section>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='font-semibold text-xl'>Admins</h2>
        <CreateAdminModal onComplete={getAdmins} />
      </div>

      <Table aria-label='Admins Table'>
        <TableHeader>
          <TableColumn>ID</TableColumn>
          <TableColumn>Name</TableColumn>
        </TableHeader>
        <TableBody emptyContent="No admins found">
          {admins.map((admin) => {
            const isCurrentAdmin = admin.id === currentAdmin?.id

            return (
              <TableRow key={admin.id} >
                <TableCell className={isCurrentAdmin ? 'font-semibold' : ''}>{admin.id}</TableCell>
                <TableCell className={isCurrentAdmin ? 'font-semibold' : ''}>{admin.username} {isCurrentAdmin && "(You)"}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </section>
  )
}

function CreateAdminModal({ onComplete }: { onComplete?: () => void }) {
  const [form, setForm] = useState({ username: "", password: "" })
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const resBody = await fetch(`/api/admins`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    }).then((res) => res.json())

    if (resBody.code !== "OK") {
      console.log(resBody)
      return alert("Failed to create admin")
    }

    onComplete?.()
    alert("Admin created successfully!")
    handleCloseModal()
  }

  const handleCloseModal = () => {
    setIsOpen(false)
    setForm({ username: "", password: "" })
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} startContent={<span className='material-symbols-outlined'>add</span>} color='secondary' variant='bordered'>
        Create Admin
      </Button>

      <Modal isOpen={isOpen} onClose={handleCloseModal}>
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>Create Admin</ModalHeader>
            <ModalBody>
              <Input label="Username" placeholder="Username" onValueChange={(value) => setForm({ ...form, username: value })} value={form.username} />
              <Input label="Password" placeholder="Password" type='password' onValueChange={(value) => setForm({ ...form, password: value })} value={form.password} />
            </ModalBody>
            <ModalFooter>
              <Button onClick={handleCloseModal} color='default' variant='bordered'>Cancel</Button>
              <Button type="submit" color='primary'>Create Admin</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  )
}