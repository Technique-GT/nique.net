import { apiClient } from '@/lib/api-client'

export type Category = {
  _id: string
  name: string
  slug: string
  description?: string
  createdAt: string
  updatedAt: string
}

export type SubCategory = {
  _id: string
  name: string
  slug: string
  categoryId: string | Category
  description?: string
  createdAt: string
  updatedAt: string
}

export type Tag = {
  _id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
}

export async function getCategories(): Promise<Category[]> {
  const res = await apiClient.get('/categories')
  return res as unknown as Category[]
}

export async function getSubCategories(): Promise<SubCategory[]> {
  const res = await apiClient.get('/sub-categories')
  return res as unknown as SubCategory[]
}

export async function getTags(): Promise<Tag[]> {
  const res = await apiClient.get('/tags')
  return res as unknown as Tag[]
}
