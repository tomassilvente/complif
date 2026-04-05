import Link from 'next/link'
import { Business } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { BusinessStatusBadge } from './BusinessStatusBadge'
import { RiskScoreBadge } from '@/components/common/RiskScoreBadge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Building2, FileText, Globe } from 'lucide-react'

interface BusinessCardProps {
  business: Business
}

export function BusinessCard({ business }: BusinessCardProps) {
  return (
    <Link href={`/businesses/${business.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="pt-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center">
                <Building2 size={18} className="text-[#1e3a5f]" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate text-sm">
                  {business.name}
                </p>
                <p className="text-xs text-gray-500">{business.taxId}</p>
              </div>
            </div>
            <BusinessStatusBadge status={business.status} />
          </div>
          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <Globe size={13} />
              <span>{business.country}</span>
              <span className="text-gray-300">·</span>
              <span>{business.industry}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText size={13} />
              <span>{business._count?.documents ?? 0} documentos</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <RiskScoreBadge score={business.riskScore} />
            <span className="text-xs text-gray-400">
              {format(new Date(business.createdAt), 'd MMM yyyy', {
                locale: es,
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
