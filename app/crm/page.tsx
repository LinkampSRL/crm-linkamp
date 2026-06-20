'use client'
import { useEffect, useState, useCallback } from 'react'
import { ESTADOS } from '@/lib/estados'
import { PRODUCTO_CATEGORIAS, RESPONSABLES } from '@/lib/types'
import MetricCards from '@/components/MetricCards'
import LeadsTable from '@/components/LeadsTable'
import LeadModal from '@/components/LeadModal'
import ImportModal from '@/components/ImportModal'
import type { Lead, Template } from '@/lib/types'

const FILTROS_ESTADO = [
  { label: 'Todos los estados', value: 'todos' },
  ...ESTADOS.map(e => ({ label: e, value: e })),
]

export default function LeadsPage() {
  const [leads, setLeads]           = useState<Lead[]>([])
  const [templates, setTemplates]   = useState<Template[]>([])
  const [filtroEstado, setFiltroEstado]       = useState('todos')
  const [filtroProducto, setFiltroProducto]   = useState('')
  const [filtroResponsable, setFiltroResponsable] = useState('')
  const [search, setSearch]         = useState('')
  const [showNew, setShowNew]       = useState(false)
  const [editLead, setEditLead]     = useState<Lead | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [loading, setLoading]       = useState(true)

  const hoy = new Date().toISOString()

  const fetchLeads = useCallback(async () => {
    const res = await fetch('/api/leads')
    if (res.ok) setLeads(await res.json())
    setLoading(false)
  }, [])

  const fetchTemplates = useCallback(async () => {
    const res = await fetch('/api/templates')
    if (res.ok) setTemplates(await res.json())
  }, [])

  useEffect(() => {
    fetchLeads()
    fetchTemplates()
  }, [fetchLeads, fetchTemplates])

  const filtered = leads.filter(l => {
    const matchEstado      = filtroEstado === 'todos' || l.estado === filtroEstado
    const matchProducto    = !filtroProducto || l.producto_categoria === filtroProducto
    const matchResponsable = !filtroResponsable || l.responsable === filtroResponsable
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (l.empresa || '').toLowerCase().includes(q) ||
      l.nombre.toLowerCase().includes(q) ||
      l.telefono.includes(q) ||
      (l.ciudad_provincia || '').toLowerCase().includes(q)
    return matchEstado && matchProducto && matchResponsable && matchSearch
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Todos los leads</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="text-sm border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Importar CSV/Excel
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="text-sm bg-brand-orange hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Nuevo lead
          </button>
        </div>
      </div>

      <MetricCards leads={leads} hoy={hoy} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por empresa, nombre, teléfono o ciudad..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="lg:col-span-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-petrol-500"
        />
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-petrol-500"
        >
          {FILTROS_ESTADO.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <select
          value={filtroProducto}
          onChange={e => setFiltroProducto(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-petrol-500"
        >
          <option value="">Todos los productos</option>
          {PRODUCTO_CATEGORIAS.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={filtroResponsable}
          onChange={e => setFiltroResponsable(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-petrol-500"
        >
          <option value="">Todos los responsables</option>
          {RESPONSABLES.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Cargando leads...</div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-2">{filtered.length} lead{filtered.length !== 1 ? 's' : ''}</p>
          <LeadsTable
            leads={filtered}
            templates={templates}
            onEdit={setEditLead}
            onRefresh={fetchLeads}
          />
        </>
      )}

      {(showNew || editLead) && (
        <LeadModal
          lead={editLead || undefined}
          onClose={() => { setShowNew(false); setEditLead(null) }}
          onSaved={() => { setShowNew(false); setEditLead(null); fetchLeads() }}
        />
      )}

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={fetchLeads}
        />
      )}
    </div>
  )
}
