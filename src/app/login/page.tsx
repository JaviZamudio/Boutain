"use client"

import { AuthContext } from '@/contexts/AuthContext'
import { Button, Card, CardBody, Input } from '@nextui-org/react'
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
    <div className='flex flex-grow'>
      <Card className='max-w-sm w-full'>
        <CardBody>
          <h1 className='text-4xl'>Login</h1>
          <form onSubmit={handleSubmit}>
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
