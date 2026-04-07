'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useBusiness, useDeleteBusiness } from '@/hooks/useBusinesses'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { BusinessStatusBadge } from '@/components/business/BusinessStatusBadge'
import { RiskScoreBadge } from '@/components/common/RiskScoreBadge'
import { StatusTimeline } from '@/components/business/StatusTimeline'
import { StatusChangeModal } from '@/components/business/StatusChangeModal'
import { DocumentUpload } from '@/components/document/DocumentUpload'
import { DocumentList } from '@/components/document/DocumentList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowLeft,
  Building2,
  MapPin,
  Briefcase,
  Calendar,
  User,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

type Tab = 'info' | 'documents' | 'history'

const tabs: { key: Tab; label: string }[] = [
  { key: 'info', label: 'Información' },
  { key: 'documents', label: 'Documentos' },
  { key: 'history', label: 'Historial' },
]

export default function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [showStatusModal, setShowStatusModal] = useState(false)
  const deleteMutation = useDeleteBusiness()

  const { data: business, isLoading, error } = useBusiness(id)

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro que querés eliminar esta empresa? Esta acción no se puede deshacer.')) return
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Empresa eliminada.')
      router.push('/businesses')
    } catch {
      toast.error('No se pudo eliminar la empresa.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" label="Cargando empresa..." />
      </div>
    )
  }

  if (error || !business) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-8 text-center max-w-lg mx-auto mt-8">
        <p className="text-red-700 font-medium">No se encontró la empresa.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => router.push('/businesses')}
        >
          Volver a Empresas
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-1.5 -ml-1"
      >
        <ArrowLeft size={15} />
        Volver
      </Button>

      {/* Header card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#1e3a5f]/10 flex items-center justify-center flex-shrink-0">
                <Building2 size={24} className="text-[#1e3a5f]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {business.name}
                </h2>
                <p className="text-sm text-gray-500 font-mono mt-0.5">
                  {business.taxId}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <BusinessStatusBadge status={business.status} />
                  <RiskScoreBadge score={business.riskScore} />
                </div>
              </div>
            </div>
            {user?.role === 'ADMIN' && (
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowStatusModal(true)}
                  size="sm"
                  className="gap-1.5"
                >
                  <RefreshCw size={14} />
                  Cambiar Estado
                </Button>
                <Button
                  onClick={handleDelete}
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                  isLoading={deleteMutation.isPending}
                >
                  <Trash2 size={14} />
                  Eliminar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-[#1e3a5f] text-[#1e3a5f]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.label}
              {tab.key === 'documents' && business.documents && (
                <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">
                  {business.documents.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'info' && (
        <Card>
          <CardHeader>
            <CardTitle>Datos de la Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              <InfoRow
                icon={<MapPin size={15} />}
                label="País"
                value={business.country}
              />
              <InfoRow
                icon={<Briefcase size={15} />}
                label="Industria"
                value={business.industry}
              />
              <InfoRow
                icon={<Calendar size={15} />}
                label="Fecha de registro"
                value={format(new Date(business.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
              />
              <InfoRow
                icon={<Calendar size={15} />}
                label="Última actualización"
                value={format(new Date(business.updatedAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
              />
              {business.creator && (
                <InfoRow
                  icon={<User size={15} />}
                  label="Registrado por"
                  value={
                    business.creator.firstName
                      ? `${business.creator.firstName} ${business.creator.lastName ?? ''}`
                      : business.creator.email
                  }
                />
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentList documents={business.documents ?? []} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <DocumentUpload businessId={business.id} />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusTimeline history={business.statusHistory ?? []} />
          </CardContent>
        </Card>
      )}

      {/* Status change modal */}
      {showStatusModal && (
        <StatusChangeModal
          open={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          businessId={business.id}
          currentStatus={business.status}
        />
      )}
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
        {icon}
        {label}
      </dt>
      <dd className="text-sm text-gray-900 font-medium">{value}</dd>
    </div>
  )
}
