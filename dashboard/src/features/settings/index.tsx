import { Outlet } from '@tanstack/react-router'
import {
  IconPalette,
  IconUser,
} from '@tabler/icons-react'
import { Separator } from '@/components/ui/separator'
import { Main } from '@/components/layout/main'
import SidebarNav from './components/sidebar-nav'

export default function Settings() {
  return (
    <Main fixed>
      <div className='space-y-0.5'>
          <h1 className='text-xl font-bold tracking-tight sm:text-2xl md:text-3xl'>
            Settings
          </h1>
          <p className='text-muted-foreground text-sm'>
            Manage your preferences.
          </p>
        </div>
        <Separator className='my-4 lg:my-6' />
        <div className='flex flex-1 flex-col space-y-4 overflow-hidden lg:flex-row lg:space-y-0 lg:space-x-12'>
          <aside className='shrink-0 lg:sticky lg:top-0 lg:w-1/5'>
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className='flex-1 overflow-y-auto p-1'>
            <Outlet />
          </div>
        </div>
      </Main>
  )
}

const sidebarNavItems = [
  {
    title: 'Profile',
    icon: <IconUser size={18} />,
    href: '/settings/profile',
  },
  {
    title: 'Appearance',
    icon: <IconPalette size={18} />,
    href: '/settings/appearance',
  }
]
