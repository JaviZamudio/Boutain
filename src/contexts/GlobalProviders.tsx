// app/providers.tsx
'use client'

import { NextUIProvider } from '@nextui-org/react';
import { useRouter } from 'next/navigation'

import Link from 'next/link';
import Image from 'next/image';
import { ThemeProvider } from 'bout-themes';

export { Link as NextLink };
export { Image as NextImage };

export function GlobalProviders({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path)
  }

  return (
    <ThemeProvider useSystemTheme={true} defaultTheme='dark'>
      <NextUIProvider navigate={handleNavigate} className='h-screen flex flex-col grow'>
        {children}
      </NextUIProvider>
    </ThemeProvider>
  )
}