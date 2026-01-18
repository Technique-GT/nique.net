import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import LongText from '@/components/long-text'
import { User } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

export const columns: ColumnDef<User>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-[2px]'
      />
    ),
    meta: {
      className: cn(
        'sticky md:table-cell left-0 z-10 rounded-tl',
        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted'
      ),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-40'>{row.getValue('name')}</LongText>
    ),
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)] lg:drop-shadow-none',
        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
        'sticky left-6 md:table-cell'
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: 'bio',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Bio' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-56 text-muted-foreground'>
        {row.getValue('bio') || '—'}
      </LongText>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-48'>{row.getValue('email') || '—'}</LongText>
    ),
    enableHiding: false,
  },
  {
    accessorFn: (row) => String(row.isAdmin),
    id: 'isAdmin',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Admin' />
    ),
    cell: ({ row }) => {
      const isAdmin = row.original.isAdmin
      return (
        <div className='flex space-x-2'>
          <Badge
            variant='outline'
            className={cn(isAdmin ? 'border-emerald-200 text-emerald-700' : 'border-muted')}
          >
            {isAdmin ? 'Admin' : 'User'}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(String(row.getValue(id)))
    },
    enableHiding: false,
    enableSorting: false,
  },
  {
    accessorKey: 'googleSub',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Google Sub' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-48 font-mono text-xs'>
        {row.getValue('googleSub') || '—'}
      </LongText>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'socialLinks',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Social Links' />
    ),
    cell: ({ row }) => {
      const links = row.getValue('socialLinks') as Array<{ platform: string; url: string }>
      return <div>{links?.length ? links.length : '—'}</div>
    },
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
