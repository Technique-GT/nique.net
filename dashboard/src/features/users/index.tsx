import { Main } from '@/components/layout/main'
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from '@/components/ui/badge'
import { columns } from './components/users-columns'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersTable } from './components/users-table'
import UsersProvider from './context/users-context'
import { useUsers } from './context/users-context'
import { useAuthStore } from '@/stores/authStore'
import { canManageStaff } from '@/lib/permissions'

function UsersContent() {
  const {
    users,
    loading,
    pagination,
    setPagination,
    sorting,
    setSorting,
    pageCount,
  } = useUsers()
  const user = useAuthStore((state) => state.auth.user)
  const hasEditAccess = canManageStaff(user)

  if (loading) {
    return (
      <Main>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading users...</div>
        </div>
      </Main>
    )
  }

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
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <UsersTable
            data={users}
            columns={columns}
            pagination={pagination}
            setPagination={setPagination}
            sorting={sorting}
            setSorting={setSorting}
            pageCount={pageCount}
          />
        </div>
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
