// TODO - finish wiring up social links to frontend author pages

'use client'

import { useEffect, useMemo, useState } from 'react'
import { AxiosError } from 'axios'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { apiClient } from '@/lib/api-client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { User } from '../data/schema'
import { useUsers } from '../context/users-context'
import { IconX } from '@tabler/icons-react';

const ACCEPTED_HEADSHOT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]
const MAX_HEADSHOT_SIZE_BYTES = 10 * 1024 * 1024

const isExpectedSocialDomain = (rawUrl: string, expectedDomain: string): boolean => {
  try {
    const parsed = new URL(rawUrl)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    const hostname = parsed.hostname.toLowerCase()
    return hostname === expectedDomain || hostname.endsWith(`.${expectedDomain}`)
  } catch {
    return false
  }
}

const extractSocialUrl = (user: User | undefined, platform: 'instagram' | 'linkedin'): string => {
  if (!user?.socialLinks?.length) return ''
  const match = user.socialLinks.find(
    (link) => link.platform.trim().toLowerCase() === platform
  )
  return match?.url ?? ''
}

const buildSocialLinks = (instagramUrl?: string, linkedinUrl?: string) => {
  const links: Array<{ platform: 'instagram' | 'linkedin'; url: string }> = []
  const instagram = instagramUrl?.trim()
  const linkedin = linkedinUrl?.trim()

  if (instagram) {
    links.push({ platform: 'instagram', url: instagram })
  }
  if (linkedin) {
    links.push({ platform: 'linkedin', url: linkedin })
  }

  return links
}

const buildDefaultValues = (user?: User) => ({
  name: user?.name ?? '',
  isAdmin: user?.isAdmin ?? false,
  email: user?.email ?? '',
  bio: user?.bio ?? '',
  instagramUrl: extractSocialUrl(user, 'instagram'),
  linkedinUrl: extractSocialUrl(user, 'linkedin'),
})

const formSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  isAdmin: z.boolean(),
  email: z.string().trim().email('Please enter a valid email.').optional().or(z.literal('')),
  bio: z.string().optional(),
  instagramUrl: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || isExpectedSocialDomain(value, 'instagram.com'), {
      message: 'Instagram URL must use instagram.com',
    }),
  linkedinUrl: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || isExpectedSocialDomain(value, 'linkedin.com'), {
      message: 'LinkedIn URL must use linkedin.com',
    }),
})
type UserForm = z.infer<typeof formSchema>

type UploadMediaResponse = {
  url: string
  key: string
}

interface Props {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersActionDialog({ currentRow, open, onOpenChange }: Props) {
  const isEdit = !!currentRow
  const { refetchUsers } = useUsers()
  const [submitting, setSubmitting] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [selectedHeadshotFile, setSelectedHeadshotFile] = useState<File | null>(null)
  const [selectedHeadshotPreviewUrl, setSelectedHeadshotPreviewUrl] = useState<string | null>(null)
  const [removeHeadshot, setRemoveHeadshot] = useState(false)

  const defaultValues = useMemo(() => buildDefaultValues(currentRow), [currentRow])

  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const existingHeadshotUrl =
    typeof currentRow?.profilePictureUrl === 'string' && currentRow.profilePictureUrl.trim().length > 0
      ? currentRow.profilePictureUrl.trim()
      : null

  const displayedHeadshotUrl = removeHeadshot
    ? null
    : selectedHeadshotPreviewUrl || existingHeadshotUrl

  const canRemoveHeadshot = !!displayedHeadshotUrl

  useEffect(() => {
    if (!open) return

    form.reset(defaultValues)
    setAvatarError(null)
    setSubmitError(null)
    setSelectedHeadshotFile(null)
    setSelectedHeadshotPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return null
    })
    setRemoveHeadshot(false)
  }, [defaultValues, form, open])

  useEffect(() => {
    return () => {
      if (selectedHeadshotPreviewUrl) {
        URL.revokeObjectURL(selectedHeadshotPreviewUrl)
      }
    }
  }, [selectedHeadshotPreviewUrl])

  const handleHeadshotPick = (file?: File) => {
    if (!file) return

    if (!ACCEPTED_HEADSHOT_TYPES.includes(file.type)) {
      setAvatarError('Invalid file type. Use JPEG, PNG, GIF, WebP, or SVG.')
      return
    }

    if (file.size > MAX_HEADSHOT_SIZE_BYTES) {
      setAvatarError('File too large. Maximum size is 10 MB.')
      return
    }

    setAvatarError(null)
    setRemoveHeadshot(false)
    setSelectedHeadshotFile(file)
    setSelectedHeadshotPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return URL.createObjectURL(file)
    })
  }

  const handleRemoveHeadshot = () => {
    setAvatarError(null)
    setRemoveHeadshot(true)
    setSelectedHeadshotFile(null)
    setSelectedHeadshotPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return null
    })
  }

  const onSubmit = async (values: UserForm) => {
    setSubmitting(true)
    setSubmitError(null)
    setAvatarError(null)

    try {
      let uploadedHeadshotUrl: string | undefined

      if (!removeHeadshot && selectedHeadshotFile) {
        const formData = new FormData()
        formData.append('file', selectedHeadshotFile)

        const uploadResult = await apiClient.post<unknown, UploadMediaResponse>(
          '/admin/media/upload',
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        )
        uploadedHeadshotUrl = uploadResult.url
      }

      const bio = values.bio?.trim()
      const socialLinks = buildSocialLinks(values.instagramUrl, values.linkedinUrl)

      if (isEdit && currentRow) {
        const userData: Record<string, unknown> = {
          name: values.name.trim(),
          isAdmin: values.isAdmin,
          socialLinks,
          bio: bio && bio.length > 0 ? bio : null,
        }

        if (values.email?.trim()) {
          userData.email = values.email.trim()
        }

        if (removeHeadshot) {
          userData.profilePictureUrl = null
        } else if (uploadedHeadshotUrl) {
          userData.profilePictureUrl = uploadedHeadshotUrl
        }

        await apiClient.put(`/users/${currentRow._id}`, userData)
      } else {
        const userData: Record<string, unknown> = {
          name: values.name.trim(),
          isAdmin: values.isAdmin,
          socialLinks,
        }

        if (values.email?.trim()) {
          userData.email = values.email.trim()
        }

        if (bio && bio.length > 0) {
          userData.bio = bio
        }

        if (uploadedHeadshotUrl) {
          userData.profilePictureUrl = uploadedHeadshotUrl
        }

        await apiClient.post('/users', userData)
      }

      await refetchUsers()
      onOpenChange(false)
    } catch (error) {
      const apiMessage =
        error instanceof AxiosError
          ? (error.response?.data as { message?: string } | undefined)?.message
          : undefined
      setSubmitError(apiMessage || 'Failed to save user. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const fallbackInitial = (form.watch('name') || currentRow?.name || 'U').trim().charAt(0).toUpperCase() || 'U'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-left'>
          <DialogTitle>{isEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
        </DialogHeader>
        <div className='-mr-4 h-112 w-full overflow-y-auto py-1 pr-4'>
          <Form {...form}>
            <form id='user-form' onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 p-0.5'>
              <div className='grid grid-cols-3 items-start gap-x-6 gap-y-1'>
                <div className='col-span-1 space-y-2'>
                  <div className='flex items-start gap-3'>
                    <input
                      id="headshot-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        handleHeadshotPick(event.target.files?.[0])
                        event.target.value = ''
                      }}
                    />

                    <div className='relative w-fit'>
                      <Button
                        type="button"
                        variant='ghost'
                        disabled={submitting}
                        onClick={() => document.getElementById('headshot-input')?.click()}
                        className="
                          p-0! h-auto! w-auto!
                          bg-transparent! border-0! shadow-none!
                          hover:bg-transparent! hover:text-inherit!
                          active:bg-transparent! active:scale-100!
                          focus:outline-none! focus-visible:ring-0! focus-visible:ring-offset-0!
                          disabled:opacity-100!
                        "
                      >
                        <Avatar className="size-36 border">
                          <AvatarImage src={displayedHeadshotUrl ?? undefined} alt="Profile headshot" className='bg-cover' />
                          <AvatarFallback className='text-foreground font-medium'>{fallbackInitial}</AvatarFallback>
                        </Avatar>
                      </Button>

                      {canRemoveHeadshot && (
                        <Button
                          type='button'
                          size='icon'
                          variant='destructive'
                          className='absolute right-1 top-1 z-10 size-3 rounded-full p-0 text-xs'
                          aria-label='Remove headshot'
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            handleRemoveHeadshot()
                          }}
                          disabled={submitting}
                        >
                          <span aria-hidden='true' className='leading-none ciolo'><IconX className='size-3'/></span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {avatarError && <p className='text-sm text-destructive'>{avatarError}</p>}

                  {submitError && <p className='text-sm text-destructive'>{submitError}</p>}
                </div>

                <div className='col-span-2 space-y-2'>
                  <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                      <FormItem className='flex flex-col items-start space-y-1'>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder='Jane Doe' autoComplete='off' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='email'
                    render={({ field }) => (
                      <FormItem className='flex flex-col items-start space-y-1'>
                        <FormLabel>Email (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder='name@example.com' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='bio'
                    render={({ field }) => (
                      <FormItem className='flex flex-col items-start space-y-1'>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea placeholder='Short author bio' className='min-h-20' {...field} />
                        </FormControl>
                        <FormMessage/>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='instagramUrl'
                    render={({ field }) => (
                      <FormItem className='flex flex-col items-start space-y-1'>
                        <FormLabel>Instagram</FormLabel>
                        <FormControl>
                          <Input placeholder='https://instagram.com/username' {...field} />
                        </FormControl>
                        <FormMessage/>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='linkedinUrl'
                    render={({ field }) => (
                      <FormItem className='flex flex-col items-start space-y-1'>
                        <FormLabel>LinkedIn</FormLabel>
                        <FormControl>
                          <Input placeholder='https://linkedin.com/in/username' {...field} />
                        </FormControl>
                        <FormMessage/>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='isAdmin'
                    render={({ field }) => (
                      <FormItem className='flex items-start space-y-1'>
                        <FormLabel>Admin</FormLabel>
                        <FormControl>
                          <div className='flex items-center justify-start'>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </div>
                        </FormControl>
                        <FormMessage/>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='user-form' disabled={submitting}>
            {submitting ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
