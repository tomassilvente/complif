'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Download, Loader2, FileX } from 'lucide-react'
import api from '@/lib/api'
import { Document } from '@/types'
import { toast } from 'sonner'

interface DocumentPreviewProps {
  doc: Document | null
  onClose: () => void
}

export function DocumentPreview({ doc, onClose }: DocumentPreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!doc) return

    setBlobUrl(null)
    setError(false)
    setLoading(true)

    api
      .get(`/api/documents/${doc.id}/download`, { responseType: 'blob' })
      .then((res) => {
        const url = URL.createObjectURL(new Blob([res.data], { type: doc.mimeType }))
        setBlobUrl(url)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))

    return () => {
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [doc])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (doc) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKey)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKey)
    }
  }, [doc, onClose])

  if (!doc) return null

  function handleDownload() {
    if (!blobUrl || !doc) return
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = doc.fileName
    a.click()
  }

  const isPdf = doc.mimeType === 'application/pdf'
  const isImage = doc.mimeType.startsWith('image/')

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative z-10 flex flex-col w-full max-w-4xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{doc.fileName}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{doc.mimeType}</p>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            {blobUrl && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1e3a5f] border border-[#1e3a5f]/30 rounded-lg hover:bg-[#1e3a5f]/5 transition-colors"
              >
                <Download size={13} />
                Descargar
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden bg-gray-100 flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <Loader2 size={32} className="animate-spin" />
              <span className="text-sm">Cargando documento…</span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <FileX size={40} />
              <span className="text-sm">No se pudo cargar el documento.</span>
            </div>
          )}

          {!loading && !error && blobUrl && isPdf && (
            <iframe
              src={blobUrl}
              className="w-full h-full border-0"
              title={doc.fileName}
            />
          )}

          {!loading && !error && blobUrl && isImage && (
            <img
              src={blobUrl}
              alt={doc.fileName}
              className="max-w-full max-h-full object-contain p-4"
            />
          )}

          {!loading && !error && blobUrl && !isPdf && !isImage && (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <FileX size={40} />
              <span className="text-sm">Preview no disponible para este tipo de archivo.</span>
              <button
                onClick={handleDownload}
                className="text-sm text-[#1e3a5f] underline"
              >
                Descargar para ver
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}