// app/providers.tsx
'use client'

import { NextUIProvider } from '@nextui-org/react';
import { useRouter } from 'next/navigation'

export function GlobalProviders({ children }: { children: React.ReactNode }) {

  // TODO: Setup Routing: navigate={router.push}
  return (
    <NextUIProvider>
      {children}
    </NextUIProvider>
  )
}