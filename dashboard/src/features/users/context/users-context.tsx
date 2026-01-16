import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../../config'
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

  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options,
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }
      
      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Transform backend data to include both _id and id
  const transformUserData = (data: any[]): User[] => {
    return data.map(user => ({
      ...user,
      id: user._id // Add id field for frontend compatibility
    }))
  }

  const refetchUsers = async () => {
    setLoading(true)
    try {
      const data = await apiRequest('/users')
      const validatedUsers = userListSchema.parse(data.data)
      const transformedUsers = transformUserData(validatedUsers)
      setUsers(transformedUsers)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refetchUsers()
  }, [])

  return (
    <UsersContext value={{ 
      open, 
      setOpen, 
      currentRow, 
      setCurrentRow,
      users,
      loading,
      refetchUsers
    }}>
      {children}
    </UsersContext>
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
