import { BusinessStatus } from '@/types'
import { Badge } from '@/components/ui/badge'

interface BusinessStatusBadgeProps {
  status: BusinessStatus
  className?: string
}

const statusConfig: Record<
  BusinessStatus,
  { label: string; variant: 'gray' | 'warning' | 'success' | 'danger' }
> = {
  PENDING: { label: 'Pendiente', variant: 'gray' },
  IN_REVIEW: { label: 'En Revisión', variant: 'warning' },
  APPROVED: { label: 'Aprobada', variant: 'success' },
  REJECTED: { label: 'Rechazada', variant: 'danger' },
}

export function BusinessStatusBadge({
  status,
  className,
}: BusinessStatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, variant: 'gray' as const }
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}
