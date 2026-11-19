'use client'
import { useEffect, useState } from 'react'
import { DEFAULT_TEMPLATES, TEMPLATE_LABELS, applyTemplate } from '@/lib/templates'
import type { Template } from '@/lib/types'

const ACTIVE_TEMPLATE_IDS = [
  'linkamp_mensaje_1',
  'linkamp_mensaje_2',
  'linkamp_seguimiento_cotizacion',
  'pampera_mensaje_1',
  'pampera_mensaje_2',
  'pampera_seguimiento_cotizacion',
]

const PREVIEW_VARS = {
  nombre:   'Juan',
  empresa:  'Agropecuaria El Sol',
  producto: 'balanza portátil para pesaje por ejes',
  telefono: '3415001234',
}

export default function PlantillasPage() {
  const [templates, setTemplates] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    ACTIVE_TEMPLATE_IDS.forEach(id => { init[id] = DEFAULT_TEMPLATES[id] || '' })
    return init
  })
  const [saving, setSaving] = useState<string | null>(null)
  const [saved,  setSaved]  = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/templates').then(r => r.json()).then((data: Template[]) => {
      if (Array.isArray(data) && data.length > 0) {
        const map: Record<string, string> = {}
        data.forEach(t => { map[t.id] = t.body })
        setTemplates(prev => ({ ...prev, ...map }))
      }
      setLoaded(true)
    })
  }, [])

  async function save(id: string) {
    setSaving(id)
    await fetch(`/api/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: templates[id] }),
    })
    setSaving(null)
    setSaved(id)
    setTimeout(() => setSaved(null), 2000)
  }

  function reset(id: string) {
    setTemplates(prev => ({ ...prev, [id]: DEFAULT_TEMPLATES[id] || '' }))
  }

  if (!loaded) return <div className="text-center py-16 text-gray-400">Cargando plantillas...</div>

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-petrol-500 resize-y'

  function TemplateCard({ id }: { id: string }) {
    return (
      <div key={id} className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-3">{TEMPLATE_LABELS[id] || id}</h3>
        <textarea
          value={templates[id] || ''}
          onChange={e => setTemplates(prev => ({ ...prev, [id]: e.target.value }))}
          rows={8}
          className={inputCls}
        />
        <div className="mt-3 bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
          <p className="font-medium text-gray-700 mb-1">Vista previa:</p>
          <pre className="whitespace-pre-wrap font-sans leading-relaxed">
            {applyTemplate(templates[id] || '', PREVIEW_VARS)}
          </pre>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => save(id)}
            disabled={saving === id}
            className="bg-petrol-600 hover:bg-petrol-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {saving === id ? 'Guardando...' : saved === id ? '✓ Guardado' : 'Guardar'}
          </button>
          <button
            onClick={() => reset(id)}
            className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 hover:border-gray-400 px-4 py-2 rounded-lg transition-colors"
          >
            Restaurar original
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Plantillas de WhatsApp</h1>
        <p className="text-sm text-gray-500 mt-1">
          Editá los mensajes. Variables disponibles:{' '}
          {['[Nombre]', '[Empresa]', '[Producto]', '[Telefono]'].map(v => (
            <code key={v} className="bg-gray-100 px-1 rounded mx-0.5">{v}</code>
          ))}
        </p>
      </div>

      <div className="space-y-10">
        {/* ── Linkamp ── */}
        <section>
          <h2 className="text-sm font-bold text-petrol-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-petrol-600 inline-block" />
            Linkamp
          </h2>
          <div className="space-y-6">
            {ACTIVE_TEMPLATE_IDS.filter(id => id.startsWith('linkamp_')).map(id => (
              <TemplateCard key={id} id={id} />
            ))}
          </div>
        </section>

        {/* ── Pampera ── */}
        <section>
          <h2 className="text-sm font-bold text-orange-600 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
            Pampera
          </h2>
          <div className="space-y-6">
            {ACTIVE_TEMPLATE_IDS.filter(id => id.startsWith('pampera_')).map(id => (
              <TemplateCard key={id} id={id} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
