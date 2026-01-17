import { apiClient } from '@/lib/api-client'

export type Collaborator = {
  _id: string
  name: string
  title: string
  email?: string
  status: 'active' | 'inactive'
  joinDate: string
  createdAt: string
  updatedAt: string
}

export type CollaboratorQuery = {
  search?: string
  status?: 'active' | 'inactive' | 'all'
}

export async function getCollaborators(query: CollaboratorQuery = {}): Promise<Collaborator[]> {
  const res = await apiClient.get('/collaborators', {
    params: query,
  })
  
  // Backend returns { success: true, data: collaborators, count: number }
  // Our api-client interceptor might unwrap it to the envelope if it has other fields than data/success.
  // In the case of /collaborators, it has 'count'.
  
  if (res && typeof res === 'object' && !Array.isArray(res) && 'data' in (res as { data?: unknown })) {
    return (res as { data: Collaborator[] }).data
  }
  
  return res as unknown as Collaborator[]
}

export async function createCollaborator(data: Partial<Collaborator>): Promise<Collaborator> {
  const res = await apiClient.post('/collaborators', data)
  return res as unknown as Collaborator
}

export async function updateCollaborator(id: string, data: Partial<Collaborator>): Promise<Collaborator> {
  const res = await apiClient.put(`/collaborators/${id}`, data)
  return res as unknown as Collaborator
}

export async function deleteCollaborator(id: string): Promise<void> {
  await apiClient.delete(`/collaborators/${id}`)
}
