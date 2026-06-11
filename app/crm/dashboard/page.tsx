'use client'
import { useEffect, useState } from 'react'
import { ESTADOS, ESTADO_COLOR } from '@/lib/estados'
import type { Lead, LeadEstado } from '@/lib/types'

// ─── helpers ────────────────────────────────────────────────────────────────

function pct(num: number, den: number) {
  if (den === 0) return '—'
  return `${Math.round((num / den) * 100)}%`
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-44 shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${w}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-800 w-8 text-right">{value}</span>
    </div>
  )
}

function StatCard({
  label, value, sub, color,
}: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className={`rounded-xl border p-4 ${color ?? 'bg-gray-50 border-gray-200'}`}>
      <div className="text-3xl font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-600 mt-0.5 leading-snug">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}

// ─── page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leads').then(r => r.json()).then(data => {
      setLeads(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Cargando dashboard...</div>
  }

  const hoy        = new Date().toISOString()
  const total      = leads.length
  const ganados    = leads.filter(l => l.estado === 'Ganado').length
  const perdidos   = leads.filter(l => l.estado === 'Perdido' || l.estado === 'No interesado').length
  const cerrados   = ganados + perdidos

  const contactarHoy = leads.filter(l =>
    l.estado === 'Pendiente de contacto' ||
    (l.proximo_contacto && l.proximo_contacto <= hoy && !['Ganado','Perdido','No interesado'].includes(l.estado))
  ).length

  const pendientes     = leads.filter(l => l.estado === 'Pendiente de contacto').length
  const msg1           = leads.filter(l => l.estado === 'Mensaje 1 enviado').length
  const respondieron   = leads.filter(l => l.estado === 'Respondió - cotizar').length
  const cotEnviadas    = leads.filter(l => l.estado === 'Cotización enviada').length
  const cotActivas     = leads.filter(l => l.estado === 'Cotización enviada' || l.estado === 'Seguimiento cotización').length

  // Leads por estado
  const porEstado = ESTADOS.map(e => ({
    estado: e,
    count:  leads.filter(l => l.estado === e).length,
  })).filter(e => e.count > 0)
  const maxEstado = Math.max(...porEstado.map(e => e.count), 1)

  // Leads por origen
  const origenMap = leads.reduce<Record<string, number>>((acc, l) => {
    const k = l.origen || 'Sin origen'
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})
  const porOrigen = Object.entries(origenMap).sort((a, b) => b[1] - a[1])
  const maxOrigen = Math.max(...porOrigen.map(o => o[1]), 1)

  // Color de barra por estado
  const estadoBarColor: Record<LeadEstado, string> = {
    'Pendiente de contacto':  'bg-gray-400',
    'Mensaje 1 enviado':      'bg-yellow-400',
    'Recontactar en 48 hs':   'bg-yellow-500',
    'Respondió - cotizar':    'bg-green-400',
    'Cotización enviada':     'bg-yellow-500',
    'Seguimiento cotización': 'bg-yellow-400',
    'Ganado':                 'bg-green-600',
    'Perdido':                'bg-red-400',
    'No interesado':          'bg-red-300',
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* ── Métricas principales ── */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Resumen general</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <StatCard label="Total de leads"          value={total}        color="bg-gray-50 border-gray-200" />
          <StatCard label="Contactar hoy"           value={contactarHoy} color="bg-orange-50 border-orange-300" />
          <StatCard label="Pendientes de contacto"  value={pendientes}   color="bg-gray-50 border-gray-200" />
          <StatCard label="Mensaje 1 enviado"       value={msg1}         color="bg-yellow-50 border-yellow-300" />
          <StatCard label="Respondieron / cotizar"  value={respondieron} color="bg-green-50 border-green-300" />
          <StatCard label="Cotizaciones enviadas"   value={cotEnviadas}  color="bg-yellow-50 border-yellow-300" />
          <StatCard label="Cotizaciones activas"    value={cotActivas}   color="bg-yellow-50 border-yellow-400"
            sub="Enviadas + en seguimiento" />
          <StatCard label="Ganados"                 value={ganados}      color="bg-green-50 border-green-400" />
          <StatCard label="Perdidos / No interesados" value={perdidos}   color="bg-red-50 border-red-200" />
          <StatCard
            label="Conversión total"
            value={pct(ganados, total)}
            sub={`${ganados} ganados de ${total} leads`}
            color="bg-petrol-50 border-petrol-100"
          />
          <StatCard
            label="Tasa de cierre"
            value={pct(ganados, cerrados)}
            sub={`${ganados} ganados de ${cerrados} cerrados`}
            color="bg-petrol-50 border-petrol-100"
          />
        </div>
      </section>

      {/* ── Leads por estado ── */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Leads por estado</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          {porEstado.length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos.</p>
          ) : (
            porEstado.map(({ estado, count }) => (
              <BarRow
                key={estado}
                label={estado}
                value={count}
                max={maxEstado}
                color={estadoBarColor[estado as LeadEstado] ?? 'bg-gray-400'}
              />
            ))
          )}
        </div>
      </section>

      {/* ── Leads por origen ── */}
      {porOrigen.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Leads por origen</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            {porOrigen.map(([origen, count]) => (
              <BarRow
                key={origen}
                label={origen}
                value={count}
                max={maxOrigen}
                color="bg-petrol-500"
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Tabla resumen por estado ── */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Tabla de estados</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Leads</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">% del total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ESTADOS.map(estado => {
                const count = leads.filter(l => l.estado === estado).length
                return (
                  <tr key={estado} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLOR[estado]}`}>
                        {estado}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{count}</td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{pct(count, total)}</td>
                  </tr>
                )
              })}
              <tr className="border-t border-gray-200 bg-gray-50">
                <td className="px-4 py-2.5 font-semibold text-gray-700">Total</td>
                <td className="px-4 py-2.5 text-right font-bold text-gray-900">{total}</td>
                <td className="px-4 py-2.5 text-right text-gray-500">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
