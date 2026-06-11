import { ESTADO_COLOR, ESTADO_DOT } from '@/lib/estados'
import type { LeadEstado } from '@/lib/types'

export default function StatusBadge({ estado }: { estado: LeadEstado }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${ESTADO_COLOR[estado]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ESTADO_DOT[estado]}`} />
      {estado}
    </span>
  )
}
