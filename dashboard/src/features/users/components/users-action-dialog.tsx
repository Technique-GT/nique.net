'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { API_BASE_URL } from '../../../config'
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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { User } from '../data/schema'
import { useUsers } from '../context/users-context'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  bio: z.string().optional(),
  isAdmin: z.boolean(),
  googleSub: z.string().optional(),
  profilePictureMediaId: z.string().optional(),
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
          bio: currentRow.bio || '',
          isAdmin: currentRow.isAdmin,
          googleSub: currentRow.googleSub || '',
          profilePictureMediaId: currentRow.profilePictureMediaId || '',
        }
      : {
          name: '',
          bio: '',
          isAdmin: false,
          googleSub: '',
          profilePictureMediaId: '',
        },
  })

  const onSubmit = async (values: UserForm) => {
    setSubmitting(true)
    try {
      if (isEdit && currentRow) {
        const userData = {
          name: values.name.trim(),
          ...(values.bio?.trim() ? { bio: values.bio.trim() } : {}),
          isAdmin: values.isAdmin,
          ...(values.googleSub?.trim() ? { googleSub: values.googleSub.trim() } : {}),
          ...(values.profilePictureMediaId?.trim()
            ? { profilePictureMediaId: values.profilePictureMediaId.trim() }
            : {}),
        }
        
        const response = await fetch(`${API_BASE_URL}/users/${currentRow._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        })
        
        if (!response.ok) {
          throw new Error('Failed to update user')
        }
      } else {
        // Create user
        const userData = {
          name: values.name.trim(),
          ...(values.bio?.trim() ? { bio: values.bio.trim() } : {}),
          isAdmin: values.isAdmin,
          ...(values.googleSub?.trim() ? { googleSub: values.googleSub.trim() } : {}),
          ...(values.profilePictureMediaId?.trim()
            ? { profilePictureMediaId: values.profilePictureMediaId.trim() }
            : {}),
        }
        
        const response = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        })
        
        if (!response.ok) {
          throw new Error('Failed to create user')
        }
      }
      
      await refetchUsers()
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save user:', error)
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
                name='bio'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Bio
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Short bio (optional)'
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
                name='googleSub'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Google Sub
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Google subject (optional)'
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
                name='profilePictureMediaId'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Profile Media ID
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Media ID (optional)'
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
