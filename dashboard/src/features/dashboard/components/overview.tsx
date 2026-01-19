import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { useDashboardMetrics } from './useDashboardMetrics'

export function Overview() {
  const { data, isLoading, isError } = useDashboardMetrics()

  if (isLoading) {
    return <div className='text-muted-foreground flex h-[350px] items-center justify-center text-sm'>Loading chart…</div>
  }

  if (isError || !data) {
    return <div className='text-muted-foreground flex h-[350px] items-center justify-center text-sm'>Failed to load chart.</div>
  }

  return (
    <ResponsiveContainer width='100%' height={350}>
      <BarChart data={data.publishedByMonth}>
        <XAxis dataKey='name' stroke='#888888' fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke='#888888' fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} />
        <Bar dataKey='total' fill='currentColor' radius={[4, 4, 0, 0]} className='fill-primary' />
      </BarChart>
    </ResponsiveContainer>
  )
}
