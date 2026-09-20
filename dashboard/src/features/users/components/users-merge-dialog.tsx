'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  IconArrowRight,
  IconGitMerge,
  IconAlertTriangle,
  IconCheck,
} from '@tabler/icons-react'
import { apiClient } from '@/lib/api-client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { User } from '../data/schema'
import { useUsers } from '../context/users-context'

type FieldChoice = 'source' | 'target'
type KeepFields = {
  name: FieldChoice
  bio: FieldChoice
  email: FieldChoice
  profilePictureUrl: FieldChoice
  socialLinks: FieldChoice
  isAdmin: FieldChoice
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

const FIELD_LABELS: Record<keyof KeepFields, string> = {
  name: 'Name',
  bio: 'Bio',
  email: 'Email',
  profilePictureUrl: 'Profile Picture',
  socialLinks: 'Social Links',
  isAdmin: 'Admin Status',
}

const getInitial = (name: string) =>
  (name || 'U').trim().charAt(0).toUpperCase() || 'U'

const displayValue = (user: User, field: keyof KeepFields): string => {
  switch (field) {
    case 'name':
      return user.name || '—'
    case 'bio':
      return user.bio || '—'
    case 'email':
      return user.email || '—'
    case 'profilePictureUrl':
      return user.profilePictureUrl ? '✓ Has photo' : '—'
    case 'socialLinks':
      return user.socialLinks?.length
        ? user.socialLinks.map((l) => l.platform).join(', ')
        : '—'
    case 'isAdmin':
      return user.isAdmin ? 'Admin' : 'Regular'
    default:
      return '—'
  }
}

export function UsersMergeDialog({ open, onOpenChange, currentRow }: Props) {
  const { users, refetchUsers } = useUsers()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [targetId, setTargetId] = useState<string>('')
  const [keepFields, setKeepFields] = useState<KeepFields>({
    name: 'target',
    bio: 'target',
    email: 'target',
    profilePictureUrl: 'target',
    socialLinks: 'target',
    isAdmin: 'target',
  })
  const [confirmValue, setConfirmValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [articleCount, setArticleCount] = useState<number | null>(null)
  const [loadingCount, setLoadingCount] = useState(false)

  const sourceUser = currentRow

  const targetOptions = useMemo(
    () => users.filter((u) => u._id !== sourceUser._id),
    [users, sourceUser._id]
  )

  const targetUser = useMemo(
    () => targetOptions.find((u) => u._id === targetId) ?? null,
    [targetOptions, targetId]
  )

  useEffect(() => {
    if (!open) return
    setStep(1)
    setTargetId('')
    setKeepFields({
      name: 'target',
      bio: 'target',
      email: 'target',
      profilePictureUrl: 'target',
      socialLinks: 'target',
      isAdmin: 'target',
    })
    setConfirmValue('')
    setArticleCount(null)
  }, [open])

  useEffect(() => {
    if (step !== 3 || !sourceUser._id) return

    let cancelled = false
    setLoadingCount(true)

    apiClient
      .get(`/users/${sourceUser._id}/article-count`)
      .then((res: unknown) => {
        if (!cancelled) {
          const data = res as { count?: number } | undefined
          setArticleCount(
            typeof data?.count === 'number' ? data.count : 0
          )
        }
      })
      .catch(() => {
        if (!cancelled) setArticleCount(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingCount(false)
      })

    return () => {
      cancelled = true
    }
  }, [step, sourceUser._id])

  const handleMerge = async () => {
    if (!targetId || confirmValue.trim() !== sourceUser.name) return

    setSubmitting(true)
    try {
      await apiClient.post('/users/merge', {
        sourceId: sourceUser._id,
        targetId,
        keepFields,
      })

      toast.success('Users merged successfully', {
        description: `"${sourceUser.name}" has been merged into "${targetUser?.name}".`,
      })

      await refetchUsers()
      onOpenChange(false)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      const msg = axiosErr?.response?.data?.message || 'Merge failed'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const updateField = (field: keyof KeepFields, value: FieldChoice) => {
    setKeepFields((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-xl'>
        <DialogHeader className='text-left'>
          <DialogTitle className='flex items-center gap-2'>
            <IconGitMerge size={20} />
            Merge Users
            <Badge variant='outline' className='text-xs font-normal'>
              Step {step} of 3
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {step === 1 && 'Select the user to merge into (the one that will be kept).'}
            {step === 2 && 'Choose which profile information to keep for each field.'}
            {step === 3 && 'Review and confirm the merge. This action cannot be undone.'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className='space-y-4 py-2'>
            <div className='space-y-2'>
              <Label className='text-muted-foreground text-xs uppercase tracking-wide'>
                User to remove (source)
              </Label>
              <div className='bg-muted/50 flex items-center gap-3 rounded-md border p-3'>
                <Avatar className='size-10'>
                  <AvatarImage src={sourceUser.profilePictureUrl} />
                  <AvatarFallback>{getInitial(sourceUser.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className='text-sm font-medium'>{sourceUser.name}</p>
                  <p className='text-muted-foreground text-xs'>
                    {sourceUser.email || 'No email'}
                  </p>
                </div>
                <Badge variant='destructive' className='ml-auto text-xs'>
                  Will be deleted
                </Badge>
              </div>
            </div>

            <div className='flex items-center justify-center'>
              <IconArrowRight
                size={20}
                className='text-muted-foreground rotate-90'
              />
            </div>

            <div className='space-y-2'>
              <Label className='text-muted-foreground text-xs uppercase tracking-wide'>
                Merge into (target)
              </Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select target user...' />
                </SelectTrigger>
                <SelectContent>
                  {targetOptions.map((u) => (
                    <SelectItem key={u._id} value={u._id}>
                      <div className='flex items-center gap-2'>
                        <Avatar className='size-5'>
                          <AvatarImage src={u.profilePictureUrl} />
                          <AvatarFallback className='text-[10px]'>
                            {getInitial(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{u.name}</span>
                        {u.email && (
                          <span className='text-muted-foreground text-xs'>
                            ({u.email})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 2 && targetUser && (
          <ScrollArea className='h-80'>
            <div className='space-y-1 pr-4'>
              {(Object.keys(FIELD_LABELS) as (keyof KeepFields)[]).map(
                (field) => (
                  <div key={field} className='space-y-2 py-3'>
                    <Label className='text-xs font-medium uppercase tracking-wide'>
                      {FIELD_LABELS[field]}
                    </Label>
                    <RadioGroup
                      value={keepFields[field]}
                      onValueChange={(v) =>
                        updateField(field, v as FieldChoice)
                      }
                      className='grid grid-cols-2 gap-3'
                    >
                      <Label
                        htmlFor={`${field}-source`}
                        className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 transition-colors ${keepFields[field] === 'source'
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                          }`}
                      >
                        <RadioGroupItem
                          value='source'
                          id={`${field}-source`}
                          className='mt-0.5'
                        />
                        <div className='min-w-0 flex-1'>
                          <p className='text-muted-foreground text-[10px] uppercase'>
                            {sourceUser.name}
                          </p>
                          <p className='truncate text-sm'>
                            {displayValue(sourceUser, field)}
                          </p>
                        </div>
                      </Label>

                      <Label
                        htmlFor={`${field}-target`}
                        className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 transition-colors ${keepFields[field] === 'target'
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                          }`}
                      >
                        <RadioGroupItem
                          value='target'
                          id={`${field}-target`}
                          className='mt-0.5'
                        />
                        <div className='min-w-0 flex-1'>
                          <p className='text-muted-foreground text-[10px] uppercase'>
                            {targetUser.name}
                          </p>
                          <p className='truncate text-sm'>
                            {displayValue(targetUser, field)}
                          </p>
                        </div>
                      </Label>
                    </RadioGroup>
                    <Separator />
                  </div>
                )
              )}
            </div>
          </ScrollArea>
        )}

        {step === 3 && targetUser && (
          <div className='space-y-4 py-2'>
            <div className='bg-muted/50 rounded-md border p-4 space-y-2'>
              <div className='flex items-center gap-2 text-sm'>
                <IconCheck size={16} className='text-green-500' />
                <span>
                  <strong>{targetUser.name}</strong> will be kept with
                  the selected profile information.
                </span>
              </div>
              <div className='flex items-center gap-2 text-sm'>
                <IconAlertTriangle size={16} className='text-destructive' />
                <span>
                  <strong>{sourceUser.name}</strong> will be permanently
                  deleted.
                </span>
              </div>
              <div className='flex items-center gap-2 text-sm'>
                <IconGitMerge size={16} className='text-blue-500' />
                <span>
                  {loadingCount ? (
                    'Counting articles...'
                  ) : articleCount !== null ? (
                    <>
                      <strong>{articleCount}</strong>{' '}
                      {articleCount === 1 ? 'article' : 'articles'} will
                      be transferred.
                    </>
                  ) : (
                    'Article count unavailable.'
                  )}
                </span>
              </div>
            </div>

            <Label className='space-y-2'>
              <span>
                Type <strong>{sourceUser.name}</strong> to confirm:
              </span>
              <Input
                value={confirmValue}
                onChange={(e) => setConfirmValue(e.target.value)}
                placeholder={sourceUser.name}
                autoComplete='off'
              />
            </Label>

            <Alert variant='destructive'>
              <AlertTitle>Warning!</AlertTitle>
              <AlertDescription>
                <p>
                  This action cannot be undone. All articles from{' '}
                  <strong>{sourceUser.name}</strong> will be transferred
                  to <strong>{targetUser.name}</strong>, and{' '}
                  <strong>{sourceUser.name}</strong> will be permanently
                  deleted.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter className='gap-2 sm:gap-0'>
          {step > 1 && (
            <Button
              type='button'
              variant='outline'
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              disabled={submitting}
            >
              Back
            </Button>
          )}

          {step === 1 && (
            <Button
              type='button'
              onClick={() => setStep(2)}
              disabled={!targetId}
            >
              Next
            </Button>
          )}

          {step === 2 && (
            <Button type='button' onClick={() => setStep(3)}>
              Review
            </Button>
          )}

          {step === 3 && (
            <Button
              type='button'
              variant='destructive'
              onClick={handleMerge}
              disabled={
                submitting || confirmValue.trim() !== sourceUser.name
              }
            >
              {submitting ? 'Merging...' : 'Confirm Merge'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
