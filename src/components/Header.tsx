"use client"

import { AuthContext } from '@/contexts/AuthContext'
import { Link } from '@nextui-org/react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import React, { useContext } from 'react'

export default function Header() {
  const { currentAdmin } = useContext(AuthContext)
  const pathname = usePathname()

  return (
    <div className='flex justify-between h-16 px-8 py-2 bg-zinc-800'>
      {/* LOGO */}
      <div className='flex items-center space-x-2'>
        <Image src={"/images/BoutainLogo.svg"} alt="Boutain Logo" width={100} height={100} className='h-12 w-auto' />
        <span className='text-white font-semibold text-2xl'>Boutain</span>
      </div>

      {/* NAVIGATION */}
      {currentAdmin &&
        <nav className='flex justify-end items-center space-x-4'>
          <Link href='/' className={`text-white font-semibold border-b-2 ${pathname === '/' ? 'border-secondary' : 'border-transparent'}`}>Home</Link>
          <Link href='/projects' className={`text-white font-semibold border-b-2 ${pathname === '/projects' ? 'border-secondary' : 'border-transparent'}`}>Projects</Link>
        </nav>
      }
    </div>
  )
}
