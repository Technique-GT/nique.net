import React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  actions?: React.ReactNode
  badge?: React.ReactNode
}

/**
 * Standardized page header component for consistent title/description/actions layout.
 * Use inside <Main> after <Header> for a consistent look across all pages.
 */
export function PageHeader({
  title,
  description,
  actions,
  badge,
  className,
  children,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn('mb-4 flex items-center justify-between', className)}
      {...props}
    >
      <div className='space-y-1'>
        <div className='flex items-center gap-2'>
          <h1 className='text-2xl font-bold tracking-tight'>{title}</h1>
          {badge}
        </div>
        {description && (
          <p className='text-muted-foreground text-sm'>{description}</p>
        )}
      </div>
      {actions && (
        <div className='flex items-center gap-2'>{actions}</div>
      )}
      {children}
    </div>
  )
}

PageHeader.displayName = 'PageHeader'
