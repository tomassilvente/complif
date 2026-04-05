'use client'

import { useRouter } from 'next/navigation'
import { useCreateBusiness } from '@/hooks/useBusinesses'
import { BusinessForm, BusinessFormValues } from '@/components/business/BusinessForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'

export default function NewBusinessPage() {
  const router = useRouter()
  const createMutation = useCreateBusiness()

  const handleSubmit = async (data: BusinessFormValues) => {
    try {
      const newBusiness = await createMutation.mutateAsync(data)
      toast.success('Empresa registrada correctamente.')
      router.push(`/businesses/${newBusiness.id}`)
    } catch {
      toast.error('Error al registrar la empresa. Intente nuevamente.')
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-1.5 -ml-1"
      >
        <ArrowLeft size={15} />
        Volver
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Registrar Nueva Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-5">
            Complete los datos básicos de la empresa. Podrá adjuntar documentos
            luego de crearla.
          </p>
          <BusinessForm
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending}
            submitLabel="Registrar Empresa"
          />
        </CardContent>
      </Card>
    </div>
  )
}
