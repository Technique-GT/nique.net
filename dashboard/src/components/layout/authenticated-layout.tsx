import { Outlet } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { SearchProvider } from '@/context/search-context'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Header } from '@/components/layout/header'
import { Search } from '@/components/search'
import { Notifications } from '@/components/notifications'
import SkipToMain from '@/components/skip-to-main'

interface Props {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: Props) {
  return (
    <SearchProvider>
      <SidebarProvider defaultOpen={true}>
        <SkipToMain />
        <AppSidebar />
        <div
          id='content'
          className={cn(
            'ml-auto w-full max-w-full',
            'sm:w-[calc(100%-var(--sidebar-width))]',
            'flex h-svh flex-col',
            'group-data-[scroll-locked=1]/body:h-full',
            'has-[main.fixed-main]:group-data-[scroll-locked=1]/body:h-svh'
          )}
        >
          <Header>
            <div className='ml-auto flex items-center space-x-2 sm:space-x-4'>
              <Search />
              <Notifications />
            </div>
          </Header>
          {children ? children : <Outlet />}
        </div>
      </SidebarProvider>
    </SearchProvider>
  )
}
