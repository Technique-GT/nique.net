import { createFileRoute } from '@tanstack/react-router'
import Categories from '@/features/articles/categories/categories'

export const Route = createFileRoute('/_authenticated/articles/categories')({
  component: Categories,
})
