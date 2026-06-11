import type { Lead } from '@/lib/types'

interface Props {
  leads: Lead[]
  hoy: string
}

export default function MetricCards({ leads, hoy }: Props) {
  const total         = leads.length
  const pendiente     = leads.filter(l => l.estado === 'Pendiente de contacto').length
  const contactarHoy  = leads.filter(l =>
    (l.estado === 'Pendiente de contacto') ||
    (l.proximo_contacto && l.proximo_contacto <= hoy && !['Ganado','Perdido','No interesado'].includes(l.estado))
  ).length
  const cotizaciones  = leads.filter(l => l.estado === 'Cotización enviada' || l.estado === 'Seguimiento cotización').length
  const ganados       = leads.filter(l => l.estado === 'Ganado').length
  const perdidos      = leads.filter(l => l.estado === 'Perdido' || l.estado === 'No interesado').length
  const cerrados      = ganados + perdidos
  const conversion    = cerrados > 0 ? Math.round((ganados / cerrados) * 100) : null

  const metrics = [
    { label: 'Total leads',           value: total,         color: 'bg-gray-50 border-gray-200',    textColor: 'text-gray-800' },
    { label: 'Contactar hoy',         value: contactarHoy,  color: 'bg-orange-50 border-orange-300', textColor: 'text-orange-700' },
    { label: 'Pendientes',            value: pendiente,     color: 'bg-gray-50 border-gray-200',    textColor: 'text-gray-800' },
    { label: 'Cotizaciones activas',  value: cotizaciones,  color: 'bg-yellow-50 border-yellow-300',textColor: 'text-yellow-800' },
    { label: 'Ganados',               value: ganados,       color: 'bg-green-50 border-green-300',  textColor: 'text-green-800' },
    { label: 'Perdidos / No interes.',value: perdidos,      color: 'bg-red-50 border-red-200',      textColor: 'text-red-700' },
    {
      label: 'Conversión',
      value: conversion !== null ? `${conversion}%` : '—',
      color: 'bg-petrol-50 border-petrol-100',
      textColor: 'text-petrol-700',
    },
  ]

  // Leads por origen (solo los que tienen origen)
  const byOrigen = leads.reduce<Record<string, number>>((acc, l) => {
    if (l.origen) acc[l.origen] = (acc[l.origen] || 0) + 1
    return acc
  }, {})

  const origenEntries = Object.entries(byOrigen)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  return (
    <div className="mb-6 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {metrics.map(m => (
          <div key={m.label} className={`rounded-xl border p-3 ${m.color}`}>
            <div className={`text-2xl font-bold ${m.textColor}`}>{m.value}</div>
            <div className="text-xs text-gray-500 mt-0.5 leading-tight">{m.label}</div>
          </div>
        ))}
      </div>

      {origenEntries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Leads por origen</p>
          <div className="flex flex-wrap gap-2">
            {origenEntries.map(([origen, count]) => (
              <div key={origen} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <span className="text-sm font-semibold text-gray-800">{count}</span>
                <span className="text-xs text-gray-500">{origen}</span>
                {total > 0 && (
                  <span className="text-xs text-gray-400">({Math.round(count / total * 100)}%)</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
