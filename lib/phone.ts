/**
 * Normaliza un número de teléfono argentino al formato requerido por wa.me
 * Formato destino: 549XXXXXXXXXX (código país 54 + 9 móvil + número)
 */
export function normalizePhone(raw: string): string {
  // Quitar todo excepto dígitos y +
  let num = raw.replace(/[^\d+]/g, '')

  // Si empieza con +, quitar el +
  num = num.replace(/^\+/, '')

  // Si ya empieza con 549 y tiene 13 dígitos, está bien
  if (/^549\d{10}$/.test(num)) return num

  // Si empieza con 54 (sin el 9 de móvil)
  if (/^54/.test(num)) {
    const rest = num.slice(2)
    // Si el resto empieza con 9, ya tiene el 9
    if (rest.startsWith('9')) return '54' + rest
    // Si empieza con 11 (CABA) o código de área de 3 dígitos
    return '549' + rest
  }

  // Si empieza con 0 (número local con código de área, ej: 011, 0341)
  if (num.startsWith('0')) {
    num = num.slice(1) // quitar el 0
    return '549' + num
  }

  // Si empieza con 15 (número de celular local sin código de área) — caso raro
  if (num.startsWith('15')) {
    return '549' + num
  }

  // Número sin código de país ni 0 inicial: asumir argentino
  return '549' + num
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const normalized = normalizePhone(phone)
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}
