import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useCreateArticleDraft } from '@/hooks/use-queries'

function NewArticleRoute() {
  const navigate = useNavigate()
  const createDraftMutation = useCreateArticleDraft()

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const draft = await createDraftMutation.mutateAsync()
        if (cancelled) return
        navigate({
          to: '/articles/$articleId/edit' as any,
          params: { articleId: draft._id } as any,
          replace: true,
        })
      } catch {
        // If draft creation fails, send them back to the library.
        if (cancelled) return
        navigate({ to: '/articles', replace: true })
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [createDraftMutation, navigate])

  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/articles/new' as any)({
  component: NewArticleRoute,
})
