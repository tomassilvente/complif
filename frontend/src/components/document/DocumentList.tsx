'use client'

import { useState } from 'react'
import { Document, DocumentType } from '@/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  FileText,
  File,
  FileImage,
  Shield,
  Download,
  Building,
  Eye,
} from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'
import { DocumentPreview } from './DocumentPreview'

interface DocumentListProps {
  documents: Document[]
}

const docTypeLabels: Record<DocumentType, string> = {
  TAX_CERTIFICATE: 'Certificado Fiscal',
  REGISTRATION: 'Registro Comercial',
  INSURANCE_POLICY: 'Póliza de Seguro',
  INCORPORATION_DEED: 'Acta de Constitución',
  POWER_OF_ATTORNEY: 'Poder Notarial',
  OTHER: 'Otro',
}

function DocTypeIcon({ type }: { type: DocumentType }) {
  const props = { size: 18, className: 'text-[#1e3a5f]' }
  switch (type) {
    case 'TAX_CERTIFICATE':
      return <FileText {...props} />
    case 'INSURANCE_POLICY':
      return <Shield {...props} />
    case 'INCORPORATION_DEED':
      return <Building {...props} />
    case 'REGISTRATION':
      return <File {...props} />
    case 'POWER_OF_ATTORNEY':
      return <FileImage {...props} />
    default:
      return <File {...props} />
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function DocumentList({ documents }: DocumentListProps) {
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)

  if (!documents || documents.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-6">
        No hay documentos cargados aún.
      </p>
    )
  }

  async function handleDownload(doc: Document) {
    try {
      const response = await api.get(`/api/documents/${doc.id}/download`, {
        responseType: 'blob',
      })
      const url = URL.createObjectURL(new Blob([response.data], { type: doc.mimeType }))
      const a = document.createElement('a')
      a.href = url
      a.download = doc.fileName
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('No se pudo descargar el archivo.')
    }
  }

  return (
    <ul className="divide-y divide-gray-100">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex items-center gap-3 py-3 hover:bg-gray-50 rounded-md px-2 transition-colors"
        >
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center">
            <DocTypeIcon type={doc.documentType} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {doc.fileName}
            </p>
            <p className="text-xs text-gray-500">
              {docTypeLabels[doc.documentType]} &middot;{' '}
              {formatBytes(doc.fileSize)} &middot;{' '}
              {format(new Date(doc.uploadedAt), 'd MMM yyyy', { locale: es })}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setPreviewDoc(doc)}
              className="p-1.5 rounded-md text-gray-400 hover:text-[#1e3a5f] hover:bg-gray-100 transition-colors"
              title="Vista previa"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => handleDownload(doc)}
              className="p-1.5 rounded-md text-gray-400 hover:text-[#1e3a5f] hover:bg-gray-100 transition-colors"
              title="Descargar"
            >
              <Download size={16} />
            </button>
          </div>
        </li>
      ))}

      <DocumentPreview doc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </ul>
  )
}
