"use client"

import { AuthContext } from '@/contexts/AuthContext'
import { Button, Card, CardBody, CardFooter, CardHeader, Input } from '@nextui-org/react'
import React, { useContext, useState } from 'react'

export default function LoginPage() {
  const { login } = useContext(AuthContext)
  const [form, setForm] = useState({
    username: "",
    password: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    login(form.username, form.password)
  }

  return (
    <div className='flex flex-grow justify-center items-center'>
      <Card className='max-w-sm w-full p-2'>
        <CardHeader>
          <h1 className='text-4xl'>Login</h1>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className='flex flex-col items-end gap-4'>
            <Input label="username" autoFocus onValueChange={(value) => setForm({ ...form, username: value })} />
            <Input label="password" type='password' onValueChange={(value) => setForm({ ...form, password: value })} />
            <Button type='submit'>
              Login
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
