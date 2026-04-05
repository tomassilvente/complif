'use client'

import { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useUpdateBusinessStatus } from '@/hooks/useBusinesses'
import { BusinessStatus } from '@/types'
import { toast } from 'sonner'

interface StatusChangeModalProps {
  open: boolean
  onClose: () => void
  businessId: string
  currentStatus: BusinessStatus
}

const statusOptions = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'IN_REVIEW', label: 'En Revisión' },
  { value: 'APPROVED', label: 'Aprobada' },
  { value: 'REJECTED', label: 'Rechazada' },
]

export function StatusChangeModal({
  open,
  onClose,
  businessId,
  currentStatus,
}: StatusChangeModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>(currentStatus)
  const [comment, setComment] = useState('')
  const mutation = useUpdateBusinessStatus()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedStatus === currentStatus) {
      toast.warning('Seleccione un estado diferente al actual.')
      return
    }
    try {
      await mutation.mutateAsync({
        id: businessId,
        status: selectedStatus,
        comment: comment.trim() || undefined,
      })
      toast.success('Estado actualizado correctamente.')
      onClose()
    } catch {
      toast.error('No se pudo actualizar el estado.')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Cambiar Estado">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Nuevo Estado"
          options={statusOptions}
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        />
        <Textarea
          label="Comentario (opcional)"
          placeholder="Motivo del cambio de estado..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            Confirmar Cambio
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
