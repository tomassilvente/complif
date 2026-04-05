import { StatusHistory } from '@/types'
import { BusinessStatusBadge } from './BusinessStatusBadge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowRight, User } from 'lucide-react'

interface StatusTimelineProps {
  history: StatusHistory[]
}

export function StatusTimeline({ history }: StatusTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">
        No hay historial de cambios de estado.
      </p>
    )
  }

  return (
    <ol className="relative border-l border-gray-200 ml-3 space-y-6 py-2">
      {history.map((entry, idx) => (
        <li key={entry.id} className="ml-6">
          <span
            className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${
              idx === 0 ? 'bg-[#1e3a5f]' : 'bg-gray-300'
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-white" />
          </span>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {entry.previousStatus ? (
                <>
                  <BusinessStatusBadge status={entry.previousStatus} />
                  <ArrowRight size={14} className="text-gray-400" />
                  <BusinessStatusBadge status={entry.newStatus} />
                </>
              ) : (
                <BusinessStatusBadge status={entry.newStatus} />
              )}
              <span className="ml-auto text-xs text-gray-400">
                {format(new Date(entry.changedAt), "d MMM yyyy 'a las' HH:mm", {
                  locale: es,
                })}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <User size={12} />
              <span>{entry.user?.email ?? entry.changedBy}</span>
            </div>
            {entry.comment && (
              <p className="mt-2 text-sm text-gray-700 italic border-l-2 border-[#3b82f6] pl-2">
                &ldquo;{entry.comment}&rdquo;
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
