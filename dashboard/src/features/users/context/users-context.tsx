import React, { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import useDialogState from '@/hooks/use-dialog-state'
import { User, userListSchema } from '../data/schema'

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
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  const refetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      // apiClient response interceptor unwraps { success: true, data: ... } -> returns data
      // So 'data' here should be the array of users directly, or { users: [], pagination: {} } depending on backend?
      // Backend GET /users returns { success: true, data: [...], pagination: {...} }
      // The interceptor returns response.data.data if present.
      // So 'response' here will be the array of users.
      // Wait, let's check the interceptor logic again.
      // if (response.data && response.data.success && response.data.data) -> returns response.data.data
      // So yes, we get the array.
      
      const response = await apiClient.get('/users')
      const rawUsers = Array.isArray(response) ? response : (response as any).data || []

      const mappedUsers = rawUsers.map((u: any) => ({
        _id: u._id,
        id: u._id,
        name: typeof u.name === 'string' ? u.name : 'Unknown',
        bio: typeof u.bio === 'string' ? u.bio : undefined,
        isAdmin: !!u.isAdmin,
        googleSub: typeof u.googleSub === 'string' ? u.googleSub : undefined,
        profilePictureMediaId: typeof u.profilePictureMediaId === 'string' ? u.profilePictureMediaId : undefined,
        socialLinks: Array.isArray(u.socialLinks) ? u.socialLinks : [],
      }))

      // Validate against schema to be safe, or just trust the mapping
      const validatedUsers = userListSchema.parse(mappedUsers)
      setUsers(validatedUsers)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetchUsers()
  }, [refetchUsers])

  return (
    <UsersContext.Provider value={{ 
      open, 
      setOpen, 
      currentRow, 
      setCurrentRow,
      users,
      loading,
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
