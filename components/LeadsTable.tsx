'use client'
import { useState } from 'react'
import { ESTADOS } from '@/lib/estados'
import StatusBadge from './StatusBadge'
import WhatsAppButton from './WhatsAppButton'
import type { Lead, LeadEstado, Template } from '@/lib/types'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  leads: Lead[]
  templates: Template[]
  onEdit: (lead: Lead) => void
  onRefresh: () => void
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  try { return format(parseISO(iso), 'd MMM', { locale: es }) } catch { return iso }
}

function dateAlertClass(iso: string | null, estado: LeadEstado): string {
  if (!iso || ['Ganado', 'Perdido', 'No interesado'].includes(estado)) return 'text-gray-500'
  const diffH = (new Date(iso).getTime() - Date.now()) / 3600000
  if (diffH < 0)  return 'text-red-600 font-semibold'
  if (diffH < 24) return 'text-orange-500 font-semibold'
  return 'text-green-600'
}

export default function LeadsTable({ leads, templates, onEdit, onRefresh }: Props) {
  const [updating, setUpdating] = useState<string | null>(null)

  const msg1 = templates.find(t => t.id === 'mensaje_1') || null

  async function changeEstado(lead: Lead, newEstado: LeadEstado) {
    setUpdating(lead.id)
    await fetch(`/api/leads/${lead.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ estado: newEstado }),
    })
    setUpdating(null)
    onRefresh()
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">No hay leads en esta vista.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Empresa / Nombre</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Teléfono</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Ciudad</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Origen</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Últ. contacto</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Próx. contacto</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {leads.map(lead => (
            <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{lead.empresa || '—'}</div>
                <div className="text-gray-500 text-xs">{lead.nombre}</div>
                {lead.observaciones && (
                  <div className="text-xs text-gray-400 mt-0.5 max-w-[200px] truncate" title={lead.observaciones}>
                    📝 {lead.observaciones}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{lead.telefono}</td>
              <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{lead.ciudad_provincia || '—'}</td>
              <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{lead.origen || '—'}</td>
              <td className="px-4 py-3">
                <StatusBadge estado={lead.estado} />
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell whitespace-nowrap">
                {fmtDate(lead.ultimo_contacto)}
              </td>
              <td className="px-4 py-3 text-xs hidden md:table-cell whitespace-nowrap">
                {lead.proximo_contacto ? (
                  <span className={dateAlertClass(lead.proximo_contacto, lead.estado)}>
                    {fmtDate(lead.proximo_contacto)}
                  </span>
                ) : '—'}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <WhatsAppButton lead={lead} template={msg1} />
                  <select
                    value={lead.estado}
                    disabled={updating === lead.id}
                    onChange={e => changeEstado(lead, e.target.value as LeadEstado)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-petrol-500 disabled:opacity-50"
                  >
                    {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button
                    onClick={() => onEdit(lead)}
                    className="text-xs text-petrol-600 hover:text-petrol-800 border border-petrol-200 hover:border-petrol-400 rounded-lg px-2.5 py-1.5 transition-colors"
                  >
                    Editar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
