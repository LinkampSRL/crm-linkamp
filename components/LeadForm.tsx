'use client'
import { useState } from 'react'
import { ESTADOS } from '@/lib/estados'
import LeadHistoryPanel from './LeadHistory'
import type { Lead, LeadEstado, LeadOrigen, ProductoCategoria } from '@/lib/types'
import { PRODUCTO_CATEGORIAS, RESPONSABLES } from '@/lib/types'

const ORIGENES: LeadOrigen[] = [
  'Meta', 'Web', 'WhatsApp', 'Referido', 'Agrofy',
  'Google Ads', 'Mercado Libre', 'Base histórica', 'Base de datos inicial', 'Otro',
]

interface Props {
  lead?: Lead
  onSaved: () => void
  onCancel: () => void
}

type FormData = {
  empresa: string
  nombre: string
  telefono: string
  email: string
  ciudad_provincia: string
  producto_consultado: string
  producto_categoria: ProductoCategoria | ''
  origen: LeadOrigen | ''
  observaciones: string
  responsable: string
  estado: LeadEstado
}

export default function LeadForm({ lead, onSaved, onCancel }: Props) {
  const isEdit = !!lead
  const [form, setForm] = useState<FormData>({
    empresa:             lead?.empresa || '',
    nombre:              lead?.nombre || '',
    telefono:            lead?.telefono || '',
    email:               lead?.email || '',
    ciudad_provincia:    lead?.ciudad_provincia || '',
    producto_consultado: lead?.producto_consultado || '',
    producto_categoria:  lead?.producto_categoria || '',
    origen:              lead?.origen || '',
    observaciones:       lead?.observaciones || '',
    responsable:         lead?.responsable || '',
    estado:              lead?.estado || 'Pendiente de contacto',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function set(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.telefono.trim()) {
      setError('Nombre y teléfono son obligatorios.')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      empresa:             form.empresa.trim() || null,
      nombre:              form.nombre.trim(),
      telefono:            form.telefono.trim(),
      email:               form.email.trim() || null,
      ciudad_provincia:    form.ciudad_provincia.trim() || null,
      producto_consultado: form.producto_consultado.trim() || null,
      producto_categoria:  form.producto_categoria || null,
      origen:              form.origen || null,
      observaciones:       form.observaciones.trim() || null,
      responsable:         form.responsable || null,
      estado:              form.estado,
    }

    const res = isEdit
      ? await fetch(`/api/leads/${lead.id}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        })
      : await fetch('/api/leads', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        })

    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({ error: 'Error al guardar' }))
      setError(msg || 'Error al guardar')
      setSaving(false)
      return
    }
    onSaved()
  }

  const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-petrol-500'
  const label = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Empresa</label>
          <input className={input} value={form.empresa} onChange={e => set('empresa', e.target.value)} />
        </div>
        <div>
          <label className={label}>Nombre <span className="text-red-500">*</span></label>
          <input className={input} value={form.nombre} onChange={e => set('nombre', e.target.value)} required />
        </div>
        <div>
          <label className={label}>Teléfono <span className="text-red-500">*</span></label>
          <input className={input} value={form.telefono} onChange={e => set('telefono', e.target.value)} required placeholder="Ej: 3415001234" />
        </div>
        <div>
          <label className={label}>Email</label>
          <input className={input} type="email" value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div>
          <label className={label}>Ciudad / Provincia</label>
          <input className={input} value={form.ciudad_provincia} onChange={e => set('ciudad_provincia', e.target.value)} />
        </div>
        <div>
          <label className={label}>Producto consultado</label>
          <input className={input} value={form.producto_consultado} onChange={e => set('producto_consultado', e.target.value)} placeholder="Balanza portátil pesaje por ejes" />
        </div>
        <div>
          <label className={label}>Categoría de producto</label>
          <select className={input} value={form.producto_categoria} onChange={e => set('producto_categoria', e.target.value)}>
            <option value="">— Seleccionar —</option>
            {PRODUCTO_CATEGORIAS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Origen</label>
          <select className={input} value={form.origen} onChange={e => set('origen', e.target.value)}>
            <option value="">— Seleccionar —</option>
            {ORIGENES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Responsable</label>
          <select className={input} value={form.responsable} onChange={e => set('responsable', e.target.value)}>
            <option value="">— Sin asignar —</option>
            {RESPONSABLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        {isEdit && (
          <div>
            <label className={label}>Estado</label>
            <select className={input} value={form.estado} onChange={e => set('estado', e.target.value as LeadEstado)}>
              {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className={label}>Observaciones</label>
        <textarea
          className={`${input} h-24 resize-none`}
          value={form.observaciones}
          onChange={e => set('observaciones', e.target.value)}
          placeholder="Notas, comentarios del contacto..."
        />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {isEdit && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Historial de estados</p>
          <LeadHistoryPanel leadId={lead.id} />
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={saving}
          className="px-5 py-2 text-sm bg-petrol-600 hover:bg-petrol-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors">
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear lead'}
        </button>
      </div>
    </form>
  )
}
