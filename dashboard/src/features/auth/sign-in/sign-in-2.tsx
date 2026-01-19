import { useEffect } from 'react'
import { toast } from 'sonner'
import ViteLogo from '@/assets/logo.svg'
import { UserAuthForm } from './components/user-auth-form'

export default function SignIn2() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')
    
    if (error) {
      toast.error('Authentication Error', {
        description: error === 'access_denied' 
          ? 'Access was denied. Please try again.' 
          : error
      })
      
      // Optional: Clean up URL
      const newUrl = window.location.pathname + (params.get('redirect') ? `?redirect=${params.get('redirect')}` : '')
      window.history.replaceState({}, '', newUrl)
    }
  }, [])

  return (
    <div className='relative container grid h-svh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <div className='bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-linear-to-br/shorter from-nique-light-blue to-nique-blue' />
        <div className='relative z-20 flex items-center text-lg font-medium'>
          Technique Dashboard
        </div>

        <img
          src={ViteLogo}
          className='relative m-auto'
          width={301}
          height={60}
          alt='Vite'
        />
      </div>
      <div className='lg:p-8'>
        <div className='mx-auto flex w-full flex-col justify-center space-y-2 sm:w-87.5'>
          <div className='flex flex-col space-y-2 text-left'>
            <h1 className='text-2xl font-semibold tracking-tight'>Login</h1>
          </div>
          <UserAuthForm />
        </div>
      </div>
    </div>
  )
}
