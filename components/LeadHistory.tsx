'use client'
import { useEffect, useState } from 'react'
import type { LeadHistory } from '@/lib/types'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export default function LeadHistoryPanel({ leadId }: { leadId: string }) {
  const [history, setHistory] = useState<LeadHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/history/${leadId}`)
      .then(r => r.json())
      .then(data => {
        setHistory(Array.isArray(data) ? data : [])
        setLoading(false)
      })
  }, [leadId])

  if (loading) return <p className="text-xs text-gray-400 py-2">Cargando historial...</p>
  if (history.length === 0) return <p className="text-xs text-gray-400 py-2">Sin movimientos registrados.</p>

  return (
    <div className="space-y-2">
      {history.map(h => (
        <div key={h.id} className="flex items-start gap-2 text-xs">
          <span className="text-gray-400 whitespace-nowrap pt-0.5">
            {format(parseISO(h.fecha), "d MMM HH:mm", { locale: es })}
          </span>
          <div className="flex-1">
            <span className="text-gray-500">{h.estado_anterior ?? '—'}</span>
            <span className="mx-1 text-gray-400">→</span>
            <span className="font-medium text-gray-700">{h.estado_nuevo}</span>
            {h.observacion && (
              <span className="text-gray-400 ml-2">· {h.observacion}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
