'use client'
import { useEffect, useState, useCallback } from 'react'
import StatusBadge from '@/components/StatusBadge'
import WhatsAppButton from '@/components/WhatsAppButton'
import LeadModal from '@/components/LeadModal'
import { ESTADOS } from '@/lib/estados'
import type { Lead, LeadEstado, Template } from '@/lib/types'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const CLOSED = new Set<LeadEstado>(['Ganado', 'Perdido', 'No interesado'])

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  try { return format(parseISO(iso), "d 'de' MMMM", { locale: es }) } catch { return iso }
}

function dateAlertClass(iso: string | null): string {
  if (!iso) return 'text-gray-500'
  const diffH = (new Date(iso).getTime() - Date.now()) / 3600000
  if (diffH < 0)  return 'text-red-600 font-semibold'
  if (diffH < 24) return 'text-orange-500 font-semibold'
  return 'text-green-600'
}

function dateBorderClass(iso: string | null, estado: LeadEstado): string {
  if (estado === 'Pendiente de contacto') return 'border-l-4 border-l-gray-300'
  if (!iso) return 'border-l-4 border-l-gray-200'
  const diffH = (new Date(iso).getTime() - Date.now()) / 3600000
  if (diffH < 0)  return 'border-l-4 border-l-red-400'
  if (diffH < 24) return 'border-l-4 border-l-orange-400'
  return 'border-l-4 border-l-green-400'
}

export default function ContactarHoyPage() {
  const [leads, setLeads]               = useState<Lead[]>([])
  const [templates, setTemplates]       = useState<Template[]>([])
  const [editLead, setEditLead]         = useState<Lead | null>(null)
  const [loading, setLoading]           = useState(true)
  const [updating, setUpdating]         = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const hoy = new Date().toISOString()
  const todayLabel = format(new Date(), "EEEE d 'de' MMMM", { locale: es })

  const fetchData = useCallback(async () => {
    const [leadsRes, tmplRes] = await Promise.all([
      fetch('/api/leads'),
      fetch('/api/templates'),
    ])
    if (leadsRes.ok) {
      const data: Lead[] = await leadsRes.json()
      // Ordenar por proximo_contacto ascendente, nulls al inicio
      data.sort((a, b) => {
        if (!a.proximo_contacto) return -1
        if (!b.proximo_contacto) return 1
        return a.proximo_contacto.localeCompare(b.proximo_contacto)
      })
      setLeads(data)
    }
    if (tmplRes.ok) setTemplates(await tmplRes.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const contactarHoy = leads.filter(l => {
    if (CLOSED.has(l.estado)) return false
    if (l.estado === 'Pendiente de contacto') return true
    return l.proximo_contacto ? l.proximo_contacto <= hoy : false
  })

  const msg1 = templates.find(t => t.id === 'mensaje_1') || null
  const msg2 = templates.find(t => t.id === 'mensaje_2') || null

  function templateForLead(lead: Lead): Template | null {
    return lead.estado === 'Recontactar en 48 hs' ? msg2 : msg1
  }

  async function changeEstado(lead: Lead, newEstado: LeadEstado) {
    setUpdating(lead.id)
    await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: newEstado }),
    })
    setUpdating(null)
    // Resetear índice y recargar para evitar desincronización (bug C3)
    setCurrentIndex(0)
    fetchData()
  }

  function siguienteLead() {
    const next = currentIndex + 1
    if (next < contactarHoy.length) {
      setCurrentIndex(next)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const leadActual = contactarHoy[currentIndex] || null

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Contactar hoy</h1>
          <p className="text-sm text-gray-500 capitalize mt-0.5">{todayLabel}</p>
        </div>
        {!loading && contactarHoy.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 border border-orange-300 text-orange-800 font-semibold text-base px-4 py-2 rounded-xl">
              {currentIndex + 1} / {contactarHoy.length}
            </div>
            {currentIndex < contactarHoy.length - 1 && (
              <button
                onClick={siguienteLead}
                className="bg-petrol-600 hover:bg-petrol-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              >
                Siguiente lead →
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Cargando...</div>
      ) : contactarHoy.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">🎉</div>
          <p className="text-xl font-semibold text-gray-700">¡Todo al día!</p>
          <p className="text-gray-500 mt-1">No tenés leads para contactar hoy.</p>
        </div>
      ) : leadActual ? (
        <>
          <div className={`bg-white rounded-xl border border-gray-200 shadow-md p-5 mb-6 ${dateBorderClass(leadActual.proximo_contacto, leadActual.estado)}`}>
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-lg font-bold text-gray-900">
                    {leadActual.empresa ? `${leadActual.empresa} — ` : ''}{leadActual.nombre}
                  </span>
                  <StatusBadge estado={leadActual.estado} />
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600 mb-3">
                  <span>📞 {leadActual.telefono}</span>
                  {leadActual.ciudad_provincia && <span>📍 {leadActual.ciudad_provincia}</span>}
                  {leadActual.email && <span>✉️ {leadActual.email}</span>}
                  {leadActual.proximo_contacto && (
                    <span className={dateAlertClass(leadActual.proximo_contacto)}>
                      🗓 {fmtDate(leadActual.proximo_contacto)}
                    </span>
                  )}
                </div>
                {leadActual.observaciones && (
                  <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-3">
                    📝 {leadActual.observaciones}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <WhatsAppButton lead={leadActual} template={templateForLead(leadActual)} />
                  <button
                    onClick={() => setEditLead(leadActual)}
                    className="text-sm text-petrol-600 hover:text-petrol-800 border border-petrol-200 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    Editar / notas
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:items-end shrink-0">
                <label className="text-xs text-gray-500 font-medium">Cambiar estado:</label>
                <select
                  value={leadActual.estado}
                  disabled={updating === leadActual.id}
                  onChange={e => changeEstado(leadActual, e.target.value as LeadEstado)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-petrol-500 disabled:opacity-50 min-w-[200px]"
                >
                  {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {currentIndex < contactarHoy.length - 1 && (
                  <button
                    onClick={siguienteLead}
                    className="mt-1 text-sm bg-petrol-600 hover:bg-petrol-700 text-white font-medium px-4 py-2 rounded-lg transition-colors w-full"
                  >
                    Siguiente lead →
                  </button>
                )}
              </div>
            </div>
          </div>

          {contactarHoy.length > 1 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">
                Pendientes ({contactarHoy.length - currentIndex - 1} más)
              </p>
              <div className="space-y-2">
                {contactarHoy.slice(currentIndex + 1).map((lead, i) => (
                  <div
                    key={lead.id}
                    onClick={() => setCurrentIndex(currentIndex + 1 + i)}
                    className={`bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50 flex items-center gap-3 ${dateBorderClass(lead.proximo_contacto, lead.estado)}`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm text-gray-800">
                        {lead.empresa ? `${lead.empresa} — ` : ''}{lead.nombre}
                      </span>
                      {lead.proximo_contacto && (
                        <span className={`ml-2 text-xs ${dateAlertClass(lead.proximo_contacto)}`}>
                          {fmtDate(lead.proximo_contacto)}
                        </span>
                      )}
                    </div>
                    <StatusBadge estado={lead.estado} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}

      {editLead && (
        <LeadModal
          lead={editLead}
          onClose={() => setEditLead(null)}
          onSaved={() => { setEditLead(null); setCurrentIndex(0); fetchData() }}
        />
      )}
    </div>
  )
}
