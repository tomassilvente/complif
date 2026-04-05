'use client'

import { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import api from '@/lib/api'
import { UploadCloud, FileUp } from 'lucide-react'
import { DocumentType } from '@/types'

interface DocumentUploadProps {
  businessId: string
}

const docTypeOptions = [
  { value: 'TAX_CERTIFICATE', label: 'Certificado Fiscal' },
  { value: 'REGISTRATION', label: 'Registro Comercial' },
  { value: 'INSURANCE_POLICY', label: 'Póliza de Seguro' },
  { value: 'INCORPORATION_DEED', label: 'Acta de Constitución' },
  { value: 'POWER_OF_ATTORNEY', label: 'Poder Notarial' },
  { value: 'OTHER', label: 'Otro' },
]

export function DocumentUpload({ businessId }: DocumentUploadProps) {
  const [docType, setDocType] = useState<DocumentType>('OTHER')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  const handleUpload = async () => {
    if (!file) {
      toast.warning('Seleccione un archivo primero.')
      return
    }
    setUploading(true)
    setProgress(0)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', docType)
      formData.append('businessId', businessId)

      await api.post(`/api/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (event.total) {
            setProgress(Math.round((event.loaded / event.total) * 100))
          }
        },
      })
      toast.success('Documento subido correctamente.')
      setFile(null)
      setProgress(0)
      if (fileRef.current) fileRef.current.value = ''
      queryClient.invalidateQueries({ queryKey: ['business', businessId] })
    } catch {
      toast.error('Error al subir el documento.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-5 bg-gray-50 space-y-4">
      <div className="flex items-center gap-2 text-gray-500">
        <UploadCloud size={20} />
        <span className="text-sm font-medium">Subir nuevo documento</span>
      </div>
      <Select
        label="Tipo de documento"
        options={docTypeOptions}
        value={docType}
        onChange={(e) => setDocType(e.target.value as DocumentType)}
      />
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">
          Archivo
        </label>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-[#1e3a5f] file:text-white file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-[#162d4a] file:cursor-pointer"
        />
        {file && (
          <p className="mt-1 text-xs text-gray-500">
            {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>
      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-[#3b82f6] h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <Button
        onClick={handleUpload}
        isLoading={uploading}
        disabled={!file}
        size="sm"
        className="gap-1.5"
      >
        <FileUp size={15} />
        {uploading ? `Subiendo… ${progress}%` : 'Subir documento'}
      </Button>
    </div>
  )
}
