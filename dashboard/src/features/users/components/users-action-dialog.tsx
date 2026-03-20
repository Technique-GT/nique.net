'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

const formSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  isAdmin: z.boolean(),
  email: z.string().trim().email('Please enter a valid email.').optional().or(z.literal('')),
  profilePictureUrl: z.string().optional(),
  bio: z.string().optional(),
})
type UserForm = z.infer<typeof formSchema>

interface Props {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersActionDialog({ currentRow, open, onOpenChange }: Props) {
  const isEdit = !!currentRow
  const { refetchUsers } = useUsers()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          name: currentRow.name,
          isAdmin: currentRow.isAdmin,
          email: currentRow.email || '',
          profilePictureUrl: currentRow.profilePictureUrl || '',
          bio: currentRow.bio || '',
        }
      : {
          name: '',
          isAdmin: false,
          email: '',
          profilePictureUrl: '',
          bio: '',
        },
  })

  const onSubmit = async (values: UserForm) => {
    setSubmitting(true)
    try {
      if (isEdit && currentRow) {
        const bio = values.bio?.trim()
        const userData = {
          name: values.name.trim(),
          isAdmin: values.isAdmin,
          ...(values.email?.trim() ? { email: values.email.trim() } : {}),
          ...(values.profilePictureUrl?.trim()
            ? { profilePictureUrl: values.profilePictureUrl.trim() }
            : {}),
          bio: bio && bio.length > 0 ? bio : null,
        }
        
        await apiClient.put(`/users/${currentRow._id}`, userData)
      } else {
        // Create user
        const bio = values.bio?.trim()
        const userData = {
          name: values.name.trim(),
          isAdmin: values.isAdmin,
          ...(values.email?.trim() ? { email: values.email.trim() } : {}),
          ...(values.profilePictureUrl?.trim()
            ? { profilePictureUrl: values.profilePictureUrl.trim() }
            : {}),
          ...(bio && bio.length > 0 ? { bio } : {}),
        }

        await apiClient.post('/users', userData)
      }
      
      await refetchUsers()
      form.reset()
      onOpenChange(false)
    } catch (_error) {
      // You might want to show an error toast here
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-left'>
          <DialogTitle>{isEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the user here. ' : 'Create new user here. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className='-mr-4 h-[26.25rem] w-full overflow-y-auto py-1 pr-4'>
          <Form {...form}>
            <form
              id='user-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 p-0.5'
            >
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Jane Doe'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Email (optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='name@example.com'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='profilePictureUrl'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Profile Picture URL
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='https://cdn.example.com/avatar.jpg'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='bio'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right pt-2'>
                      Bio
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Short author bio'
                        className='col-span-4 min-h-20'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='isAdmin'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Admin
                    </FormLabel>
                    <FormControl>
                      <div className='col-span-4 flex items-center justify-start'>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </div>
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
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
