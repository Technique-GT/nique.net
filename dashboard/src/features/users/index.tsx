import { Main } from '@/components/layout/main'
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { columns } from './components/users-columns'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersTable } from './components/users-table'
import UsersProvider from './context/users-context'
import { useUsers } from './context/users-context'
import { useAuthStore } from '@/stores/authStore'
import { canManageStaff } from '@/lib/permissions'

function UsersContent() {
  const { users, loading, pagination, setPage, setLimit, limit } = useUsers()
  const user = useAuthStore((state) => state.auth.user)
  const hasEditAccess = canManageStaff(user)

  return (
    <>
      <Main>
        <PageHeader
          title="Staff Members"
          description="Manage your users and access details here."
          badge={
            !hasEditAccess ? (
              <Badge variant="destructive" className="text-xs">
                View only
              </Badge>
            ) : null
          }
          actions={
            <>
              <UsersPrimaryButtons />
            </>
          }
        />
        
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              A list of all registered users in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsersTable 
              data={users} 
              columns={columns} 
              isLoading={loading}
              pagination={pagination}
              onPageChange={setPage}
              onRowsPerPageChange={setLimit}
            />
          </CardContent>
        </Card>
      </Main>

      <UsersDialogs />
    </>
  )
}

export default function Users() {
  return (
    <UsersProvider>
      <UsersContent />
    </UsersProvider>
  )
}
