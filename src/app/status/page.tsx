"use client"

import React, { useEffect, useState } from 'react'

export default function StatusPage() {
  const [status, setStatus] = useState<{ docker: boolean }>()

  const getStatus = async () => {
    const resBody = await fetch("/api/status").then(res => res.json())

    if (resBody.code !== "OK") {
      return alert("Error fetching status")
    }

    setStatus(resBody.data)
  }

  useEffect(() => {
    getStatus
  }, [])


  return (
    <main>
      Docker: {status?.docker ? "All Good" : "Error"}
    </main>
  )
}
