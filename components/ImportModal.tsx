'use client'
import { useRef, useState } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface Props {
  onClose: () => void
  onImported: () => void
}

interface ImportResult {
  imported: number
  errors: string[]
}

export default function ImportModal({ onClose, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [parseError, setParseError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setParseError('')
    setResult(null)

    try {
      let rows: Record<string, string>[] = []

      if (file.name.endsWith('.csv')) {
        rows = await new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: r => resolve(r.data as Record<string, string>[]),
            error: reject,
          })
        })
      } else {
        const buf = await file.arrayBuffer()
        const wb = XLSX.read(buf, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })
      }

      if (rows.length === 0) {
        setParseError('El archivo está vacío o no tiene el formato esperado.')
        setLoading(false)
        return
      }

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      const data: ImportResult = await res.json()
      setResult(data)
      if (data.imported > 0) onImported()
    } catch {
      setParseError('Error al procesar el archivo.')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Importar leads</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold">×</button>
        </div>

        {!result ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Subí un archivo <strong>CSV o Excel (.xlsx)</strong> con los leads.<br/>
              El archivo debe tener columnas con encabezados. Las columnas obligatorias son
              <strong> nombre</strong> y <strong>telefono</strong>.
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center mb-4">
              <p className="text-sm text-gray-500 mb-3">Seleccioná el archivo a importar</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFile}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={loading}
                className="bg-petrol-600 hover:bg-petrol-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
              >
                {loading ? 'Procesando...' : 'Elegir archivo'}
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
              <strong>Columnas disponibles:</strong> empresa, nombre, telefono, email,
              ciudad_provincia, producto_consultado, origen, observaciones, responsable,
              fecha_ingreso
            </div>

            {parseError && <p className="mt-3 text-sm text-red-600">{parseError}</p>}
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="font-semibold text-green-800 text-lg">{result.imported} leads importados</p>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="font-medium text-red-700 mb-2">{result.errors.length} filas con errores:</p>
                <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                  {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-petrol-600 hover:bg-petrol-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
