import { cn } from '@/lib/utils'

export function Table({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className={cn('min-w-full divide-y divide-gray-200', className)}>
        {children}
      </table>
    </div>
  )
}

export function TableHead({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <thead className={cn('bg-gray-50', className)}>{children}</thead>
}

export function TableBody({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <tbody className={cn('divide-y divide-gray-200 bg-white', className)}>
      {children}
    </tbody>
  )
}

export function TableRow({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        onClick && 'cursor-pointer hover:bg-gray-50 transition-colors',
        className
      )}
    >
      {children}
    </tr>
  )
}

export function TableTh({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500',
        className
      )}
    >
      {children}
    </th>
  )
}

export function TableTd({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <td className={cn('px-4 py-3 text-sm text-gray-700', className)}>
      {children}
    </td>
  )
}
