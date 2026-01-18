import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import useDialogState from '@/hooks/use-dialog-state'
import { User, userListSchema } from '../data/schema'
import { getUsers } from '@/services/users'
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
}

const UsersContext = React.createContext<UsersContextType | null>(null)

interface Props {
  children: React.ReactNode
}

export default function UsersProvider({ children }: Props) {
  const [open, setOpen] = useDialogState<UsersDialogType>(null)
  const [currentRow, setCurrentRow] = useState<User | null>(null)
  const queryClient = useQueryClient()

  // Use TanStack Query for users (not persisted - contains PII)
  const { data: rawUsers = [], isLoading } = useQuery({
    queryKey: queryKeys.users(),
    queryFn: () => getUsers(),
    staleTime: 30 * 1000, // 30 seconds
    // No meta.persist - users contain PII
  })

  // Map backend users to frontend User schema
  const users: User[] = React.useMemo(() => {
      const mappedUsers = rawUsers.map((u: any) => ({
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
  }, [rawUsers])

  const refetchUsers = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.users() })
  }, [queryClient])

  return (
    <UsersContext.Provider value={{ 
      open, 
      setOpen, 
      currentRow, 
      setCurrentRow,
      users,
      loading: isLoading,
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
