import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import useDialogState from '@/hooks/use-dialog-state'
import { User, userListSchema } from '../data/schema'
import { getUsersPage, type PaginationMeta, type User as ApiUser } from '@/services/users'
import { queryKeys } from '@/hooks/use-queries'
import type { ColumnFiltersState, PaginationState } from '@tanstack/react-table'
import type { SortingState } from '@tanstack/react-table'

type UsersDialogType = 'invite' | 'add' | 'edit' | 'delete' | 'merge'

interface UsersContextType {
  open: UsersDialogType | null
  setOpen: (str: UsersDialogType | null) => void
  currentRow: User | null
  setCurrentRow: React.Dispatch<React.SetStateAction<User | null>>
  users: User[]
  loading: boolean
  columnFilters: ColumnFiltersState
  setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>
  pagination: PaginationState
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>
  sorting: SortingState
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>
  pageCount: number
  total: number
  refetchUsers: () => Promise<void>
}

const UsersContext = React.createContext<UsersContextType | null>(null)

interface Props {
  children: React.ReactNode
}

type RawUser = ApiUser & {
  bio?: string
  email?: string
  googleSub?: string
  profilePictureUrl?: string
  socialLinks?: unknown[]
}

export default function UsersProvider({ children }: Props) {
  const [open, setOpen] = useDialogState<UsersDialogType>(null)
  const [currentRow, setCurrentRow] = useState<User | null>(null)
  const queryClient = useQueryClient()
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const page = pagination.pageIndex + 1
  const limit = pagination.pageSize
  const sortBy = sorting[0]?.id
  const sortDir = sorting[0]?.desc ? 'desc' : 'asc'
  const nameFilterValue = columnFilters.find((filter) => filter.id === 'name')?.value
  const search =
    typeof nameFilterValue === 'string' && nameFilterValue.trim().length > 0
      ? nameFilterValue.trim()
      : undefined
  const adminFilterValue = columnFilters.find((filter) => filter.id === 'isAdmin')?.value
  const adminFilter = Array.isArray(adminFilterValue)
    ? adminFilterValue[0]
    : adminFilterValue
  const isAdmin =
    adminFilter === 'true' ? true : adminFilter === 'false' ? false : undefined

  // Use TanStack Query for users (not persisted - contains PII)
  const { data: usersResponse, isLoading } = useQuery({
    queryKey: queryKeys.users({ page, limit, search, sortBy, sortDir, isAdmin }),
    queryFn: () => getUsersPage({ page, limit, search, sortBy, sortDir, isAdmin }),
    staleTime: 30 * 1000, // 30 seconds
  })
  const rawUsers = (usersResponse?.data ?? []) as RawUser[]
  const paginationMeta: PaginationMeta | undefined = usersResponse?.pagination

  // Map backend users to frontend User schema
  const users: User[] = React.useMemo(() => {
      const mappedUsers = rawUsers.map((u) => ({
        _id: u._id,
        id: u._id,
        name: typeof u.name === 'string' ? u.name : 'Unknown',
        bio: typeof u.bio === 'string' ? u.bio : undefined,
        isAdmin: !!u.isAdmin,
        email: typeof u.email === 'string' ? u.email : undefined,
        googleSub: typeof u.googleSub === 'string' ? u.googleSub : undefined,
        profilePictureUrl: typeof u.profilePictureUrl === 'string' ? u.profilePictureUrl : undefined,
        socialLinks: Array.isArray(u.socialLinks) ? u.socialLinks : [],
      }))

    // Validate against schema to be safe
    try {
      return userListSchema.parse(mappedUsers)
    } catch {
      return mappedUsers as User[]
    }
  }, [rawUsers])

  const refetchUsers = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['users'] })
  }, [queryClient])
  const pageCount = Math.max(paginationMeta?.pages ?? 1, 1)
  const total = paginationMeta?.total ?? rawUsers.length

  return (
    <UsersContext.Provider value={{ 
      open, 
      setOpen, 
      currentRow, 
      setCurrentRow, 
      users,
      loading: isLoading,
      columnFilters,
      setColumnFilters,
      pagination,
      setPagination,
      sorting,
      setSorting,
      pageCount,
      total,
      refetchUsers
    }}>
      {children}
    </UsersContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUsers = () => {
  const usersContext = React.useContext(UsersContext)

  if (!usersContext) {
    throw new Error('useUsers has to be used within <UsersContext>')
  }

  return usersContext
}
