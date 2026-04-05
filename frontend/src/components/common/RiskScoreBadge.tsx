import { cn } from '@/lib/utils'

interface RiskScoreBadgeProps {
  score: number
  className?: string
  showLabel?: boolean
}

function getRiskLevel(score: number): {
  label: string
  classes: string
} {
  if (score <= 30) {
    return { label: 'Bajo', classes: 'bg-green-100 text-green-800' }
  } else if (score <= 70) {
    return { label: 'Medio', classes: 'bg-amber-100 text-amber-800' }
  } else {
    return { label: 'Alto', classes: 'bg-red-100 text-red-800' }
  }
}

export function RiskScoreBadge({
  score,
  className,
  showLabel = true,
}: RiskScoreBadgeProps) {
  const { label, classes } = getRiskLevel(score)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        classes,
        className
      )}
      title={`Riesgo: ${score}/100`}
    >
      {score}
      {showLabel && <span className="opacity-75">· {label}</span>}
    </span>
  )
}
