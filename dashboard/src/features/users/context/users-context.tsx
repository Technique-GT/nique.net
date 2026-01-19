import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import useDialogState from '@/hooks/use-dialog-state'
import { User, userListSchema } from '../data/schema'
import { getUsers, PaginatedUsersResponse } from '@/services/users'
import { queryKeys } from '@/hooks/use-queries'

type UsersDialogType = 'invite' | 'add' | 'edit' | 'delete'

interface UsersContextType {
  open: UsersDialogType | null
  setOpen: (str: UsersDialogType | null) => void
  currentRow: User | null
  setCurrentRow: React.Dispatch<React.SetStateAction<User | null>>
  users: User[]
  loading: boolean
  refetchUsers: () => Promise<void>
  pagination: PaginatedUsersResponse['pagination']
  page: number
  setPage: (page: number) => void
  limit: number
  setLimit: (limit: number) => void
}

const UsersContext = React.createContext<UsersContextType | null>(null)

interface Props {
  children: React.ReactNode
}

export default function UsersProvider({ children }: Props) {
  const [open, setOpen] = useDialogState<UsersDialogType>(null)
  const [currentRow, setCurrentRow] = useState<User | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const queryClient = useQueryClient()

  // Use TanStack Query for users (not persisted - contains PII)
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.usersList(page, limit), // Include pagination in key
    queryFn: () => getUsers({ page, limit }),
    staleTime: 30 * 1000, // 30 seconds
  })

  // Normalize data to always ensure we have valid pagination even if loading/error
  const responseData = data || { 
    data: [], 
    pagination: { total: 0, page: 1, pages: 1, limit: 10 } 
  };

  // Map backend users to frontend User schema
  const users: User[] = React.useMemo(() => {
      const mappedUsers = responseData.data.map((u: any) => ({
        _id: u._id,
        id: u._id,
        name: typeof u.name === 'string' ? u.name : 'Unknown',
        bio: typeof u.bio === 'string' ? u.bio : undefined,
        isAdmin: !!u.isAdmin,
        email: typeof u.email === 'string' ? u.email : undefined,
        googleSub: typeof u.googleSub === 'string' ? u.googleSub : undefined,
        profilePictureMediaId: typeof u.profilePictureMediaId === 'string' ? u.profilePictureMediaId : undefined,
        socialLinks: Array.isArray(u.socialLinks) ? u.socialLinks : [],
      }))

    // Validate against schema to be safe
    try {
      return userListSchema.parse(mappedUsers)
    } catch {
      return mappedUsers as User[]
    }
  }, [responseData.data])

  const refetchUsers = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.usersList(page, limit) })
  }, [queryClient, page, limit])

  return (
    <UsersContext.Provider value={{ 
      open, 
      setOpen, 
      currentRow, 
      setCurrentRow, 
      users,
      loading: isLoading,
      refetchUsers,
      pagination: responseData.pagination,
      page,
      setPage,
      limit,
      setLimit
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
