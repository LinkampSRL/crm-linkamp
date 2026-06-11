'use client'
import LeadForm from './LeadForm'
import type { Lead } from '@/lib/types'

interface Props {
  lead?: Lead
  onClose: () => void
  onSaved: () => void
}

export default function LeadModal({ lead, onClose, onSaved }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-800">
            {lead ? 'Editar lead' : 'Nuevo lead'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold">×</button>
        </div>
        <LeadForm lead={lead} onSaved={onSaved} onCancel={onClose} />
      </div>
    </div>
  )
}
