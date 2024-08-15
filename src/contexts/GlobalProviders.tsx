// app/providers.tsx
'use client'

import { NextUIProvider } from '@nextui-org/react';
import { useRouter } from 'next/navigation'

export function GlobalProviders({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path)
  }

  return (
    <NextUIProvider navigate={handleNavigate}>
      {children}
    </NextUIProvider>
  )
}