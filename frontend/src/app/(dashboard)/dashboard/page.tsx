'use client'

import { useBusinesses } from '@/hooks/useBusinesses'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { BusinessStatusBadge } from '@/components/business/BusinessStatusBadge'
import { RiskScoreBadge } from '@/components/common/RiskScoreBadge'
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableTd,
  TableTh,
} from '@/components/ui/table'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Business, BusinessStatus } from '@/types'
import {
  Building2,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  TrendingUp,
} from 'lucide-react'

interface StatCardProps {
  label: string
  value: number
  icon: React.ReactNode
  colorClass: string
}

function StatCard({ label, value, icon, colorClass }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function countByStatus(
  businesses: Business[],
  status: BusinessStatus
): number {
  return businesses.filter((b) => b.status === status).length
}

export default function DashboardPage() {
  const { data, isLoading, error } = useBusinesses({ limit: 100 })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" label="Cargando datos..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-center">
        <p className="text-red-700 font-medium">
          No se pudieron cargar los datos.
        </p>
        <p className="text-red-500 text-sm mt-1">
          Verifique su conexión o intente nuevamente.
        </p>
      </div>
    )
  }

  const all = data?.businesses ?? []
  const recent = [...all]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5)

  const stats = {
    total: all.length,
    pending: countByStatus(all, 'PENDING'),
    inReview: countByStatus(all, 'IN_REVIEW'),
    approved: countByStatus(all, 'APPROVED'),
    rejected: countByStatus(all, 'REJECTED'),
  }

  // Risk distribution
  const low = all.filter((b) => b.riskScore <= 30).length
  const medium = all.filter((b) => b.riskScore > 30 && b.riskScore <= 70).length
  const high = all.filter((b) => b.riskScore > 70).length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total"
          value={stats.total}
          icon={<Building2 size={22} className="text-[#1e3a5f]" />}
          colorClass="bg-[#1e3a5f]/10"
        />
        <StatCard
          label="Pendientes"
          value={stats.pending}
          icon={<Clock size={22} className="text-gray-600" />}
          colorClass="bg-gray-100"
        />
        <StatCard
          label="En Revisión"
          value={stats.inReview}
          icon={<Eye size={22} className="text-amber-600" />}
          colorClass="bg-amber-100"
        />
        <StatCard
          label="Aprobadas"
          value={stats.approved}
          icon={<CheckCircle size={22} className="text-green-600" />}
          colorClass="bg-green-100"
        />
        <StatCard
          label="Rechazadas"
          value={stats.rejected}
          icon={<XCircle size={22} className="text-red-600" />}
          colorClass="bg-red-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent businesses */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Empresas Recientes</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              {recent.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  No hay empresas registradas aún.
                </p>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableTh>Empresa</TableTh>
                      <TableTh>Estado</TableTh>
                      <TableTh>Riesgo</TableTh>
                      <TableTh>Fecha</TableTh>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recent.map((biz) => (
                      <TableRow
                        key={biz.id}
                        onClick={() =>
                          (window.location.href = `/businesses/${biz.id}`)
                        }
                      >
                        <TableTd>
                          <div>
                            <p className="font-medium text-gray-900">
                              {biz.name}
                            </p>
                            <p className="text-xs text-gray-400">{biz.taxId}</p>
                          </div>
                        </TableTd>
                        <TableTd>
                          <BusinessStatusBadge status={biz.status} />
                        </TableTd>
                        <TableTd>
                          <RiskScoreBadge score={biz.riskScore} />
                        </TableTd>
                        <TableTd>
                          <span className="text-gray-500 text-xs">
                            {format(new Date(biz.createdAt), 'd MMM yyyy', {
                              locale: es,
                            })}
                          </span>
                        </TableTd>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {all.length > 5 && (
                <div className="px-6 py-3">
                  <Link
                    href="/businesses"
                    className="text-sm text-[#3b82f6] hover:underline"
                  >
                    Ver todas las empresas →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Risk distribution */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-[#1e3a5f]" />
                <CardTitle>Distribución de Riesgo</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {all.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  Sin datos
                </p>
              ) : (
                <div className="space-y-4">
                  <RiskBar
                    label="Bajo (0–30)"
                    count={low}
                    total={all.length}
                    colorClass="bg-green-500"
                  />
                  <RiskBar
                    label="Medio (31–70)"
                    count={medium}
                    total={all.length}
                    colorClass="bg-amber-400"
                  />
                  <RiskBar
                    label="Alto (71–100)"
                    count={high}
                    total={all.length}
                    colorClass="bg-red-500"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function RiskBar({
  label,
  count,
  total,
  colorClass,
}: {
  label: string
  count: number
  total: number
  colorClass: string
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-800">
          {count} <span className="text-gray-400 font-normal">({pct}%)</span>
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`${colorClass} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
