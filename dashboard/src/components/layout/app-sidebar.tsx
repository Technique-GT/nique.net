import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar'
import { CardTitle } from '@/components/ui/card'
import { NavGroup } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { sidebarData } from './data/sidebar-data'
import { useAuthStore } from '@/stores/authStore'
import { isAdminUser } from '@/lib/permissions'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore((state) => state.auth)
  const isAdmin = isAdminUser(user)
  const restrictedUrls = new Set(['/stats', '/comments', '/spotify'])

  const visibleNavGroups = isAdmin
    ? sidebarData.navGroups
    : sidebarData.navGroups
        .map((group) => {
          const items = group.items
            .map((item) => {
              if ('items' in item && item.items) {
                const filteredItems = item.items.filter((child) => {
                  if (typeof child.url !== 'string') return true
                  return !restrictedUrls.has(child.url)
                })
                if (filteredItems.length === 0) return null
                return { ...item, items: filteredItems }
              }

              if (typeof item.url === 'string' && restrictedUrls.has(item.url)) return null
              return item
            })
            .filter(
              (item): item is (typeof group.items)[number] => item !== null
            )

          if (items.length === 0) return null
          return { ...group, items }
        })
        .filter(
          (group): group is (typeof sidebarData.navGroups)[number] =>
            group !== null
        )

  // Fallback user if auth store is empty (shouldn't happen in protected routes)
  const displayUser = user ? {
    name: user.name,
    email: user.email || 'No email',
    avatar: user.avatar || '/avatars/shadcn.jpg',
  } : sidebarData.user

  return (
    <Sidebar collapsible='none' variant='floating' {...props}>
      <SidebarHeader>
        <CardTitle className="text-lg p-2 overflow-hidden whitespace-nowrap text-ellipsis">Technique</CardTitle>
      </SidebarHeader>
      <SidebarContent>
        {visibleNavGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={displayUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
