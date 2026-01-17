import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { CardTitle } from '@/components/ui/card'
import { NavGroup } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { sidebarData } from './data/sidebar-data'
import { useAuthStore } from '@/stores/authStore'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore((state) => state.auth)

  // Fallback user if auth store is empty (shouldn't happen in protected routes)
  const displayUser = user ? {
    name: user.name,
    email: user.email || 'No email',
    avatar: user.avatar || '/avatars/shadcn.jpg',
  } : sidebarData.user

  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader>
        <CardTitle className="text-lg p-2 overflow-hidden whitespace-nowrap text-ellipsis">Technique</CardTitle>
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={displayUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
