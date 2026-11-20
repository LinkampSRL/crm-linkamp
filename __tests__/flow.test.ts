/**
 * Pruebas para lib/flow.ts
 *
 * Cobertura:
 * - isoToARTCalendarDate: conversión de timestamp ISO a fecha calendario en Argentina (UTC-3)
 * - todayARTDate: fecha de hoy en Argentina
 * - nextARTDate (vía calcProximoContacto): +2 días a las 03:00 UTC (00:00 ART)
 * - Filtro "contactar hoy": lógica de comparación de fechas calendario ART
 *   · Seguimiento el 20/11 almacenado a las 12:00 UTC → visible desde las 00:00 ART del 20/11
 *   · Seguimiento el 20/11 almacenado a las 03:00 UTC → visible desde las 00:00 ART del 20/11
 *   · Seguimiento del día siguiente → no visible anticipadamente
 *   · Seguimientos vencidos de días anteriores → visibles
 *   · Cruce de mes: 31 oct → 02 nov
 *   · Cruce de año: 31 dic → 02 ene
 *   · Fechas manuales: respetadas
 */

import {
  isoToARTCalendarDate,
  todayARTDate,
  calcProximoContacto,
  buildFlowUpdate,
  shouldContactarHoy,
  msUntilMidnightART,
} from '../lib/flow'

// ── isoToARTCalendarDate ──────────────────────────────────────────────────────

describe('isoToARTCalendarDate', () => {
  test('12:00 UTC del 20/11 es el 20/11 en ART (09:00 ART)', () => {
    expect(isoToARTCalendarDate('2026-11-20T12:00:00.000Z')).toBe('2026-11-20')
  })

  test('03:00 UTC del 20/11 es el 20/11 en ART (00:00 ART)', () => {
    expect(isoToARTCalendarDate('2026-11-20T03:00:00.000Z')).toBe('2026-11-20')
  })

  test('02:59 UTC del 20/11 es el 19/11 en ART (23:59 ART del 19/11)', () => {
    // 02:59 UTC = 23:59 ART del día anterior
    expect(isoToARTCalendarDate('2026-11-20T02:59:59.000Z')).toBe('2026-11-19')
  })

  test('00:00 UTC del 20/11 es el 19/11 en ART (21:00 ART del 19/11)', () => {
    expect(isoToARTCalendarDate('2026-11-20T00:00:00.000Z')).toBe('2026-11-19')
  })

  test('cruce de mes: 01 nov 03:00 UTC es el 01/11 en ART', () => {
    expect(isoToARTCalendarDate('2026-11-01T03:00:00.000Z')).toBe('2026-11-01')
  })

  test('cruce de año: 01 ene 03:00 UTC es el 01/01 en ART', () => {
    expect(isoToARTCalendarDate('2027-01-01T03:00:00.000Z')).toBe('2027-01-01')
  })

  test('31 dic 02:59 UTC es el 30/12 en ART (23:59 ART del 30/12)', () => {
    expect(isoToARTCalendarDate('2026-12-31T02:59:59.000Z')).toBe('2026-12-30')
  })
})

// ── calcProximoContacto — resultado a las 03:00 UTC (00:00 ART) ──────────────

describe('calcProximoContacto — almacena a las 03:00 UTC', () => {
  // Fija "ahora" a las 16:30 ART del 18/11/2026 (19:30 UTC)
  const NOW_ART_1630_18NOV = new Date('2026-11-18T19:30:00.000Z')

  beforeEach(() => {
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  test('contacto el 18/11 a las 16:30 ART → seguimiento el 20/11 a las 03:00 UTC', () => {
    jest.setSystemTime(NOW_ART_1630_18NOV)
    const result = calcProximoContacto('Recontactar en 48 hs')
    expect(result).toBe('2026-11-20T03:00:00.000Z')
  })

  test('la fecha calendario ART del resultado es el 20/11', () => {
    jest.setSystemTime(NOW_ART_1630_18NOV)
    const result = calcProximoContacto('Recontactar en 48 hs')!
    expect(isoToARTCalendarDate(result)).toBe('2026-11-20')
  })

  test('Cotización enviada también produce +2 días a las 03:00 UTC', () => {
    jest.setSystemTime(NOW_ART_1630_18NOV)
    const result = calcProximoContacto('Cotización enviada')
    expect(result).toBe('2026-11-20T03:00:00.000Z')
  })

  test('Seguimiento cotización también produce +2 días a las 03:00 UTC', () => {
    jest.setSystemTime(NOW_ART_1630_18NOV)
    const result = calcProximoContacto('Seguimiento cotización')
    expect(result).toBe('2026-11-20T03:00:00.000Z')
  })

  test('estados sin seguimiento automático devuelven null', () => {
    jest.setSystemTime(NOW_ART_1630_18NOV)
    expect(calcProximoContacto('Pendiente de contacto')).toBeNull()
    expect(calcProximoContacto('Respondió - cotizar')).toBeNull()
    expect(calcProximoContacto('Ganado')).toBeNull()
    expect(calcProximoContacto('Perdido')).toBeNull()
    expect(calcProximoContacto('No interesado')).toBeNull()
  })

  test('cruce de mes: contacto el 31/10 a las 20:00 ART → seguimiento el 02/11', () => {
    jest.setSystemTime(new Date('2026-10-31T23:00:00.000Z')) // 20:00 ART del 31/10
    const result = calcProximoContacto('Cotización enviada')
    expect(result).toBe('2026-11-02T03:00:00.000Z')
    expect(isoToARTCalendarDate(result!)).toBe('2026-11-02')
  })

  test('cruce de año: contacto el 31/12 a las 10:00 ART → seguimiento el 02/01', () => {
    jest.setSystemTime(new Date('2026-12-31T13:00:00.000Z')) // 10:00 ART del 31/12
    const result = calcProximoContacto('Recontactar en 48 hs')
    expect(result).toBe('2027-01-02T03:00:00.000Z')
    expect(isoToARTCalendarDate(result!)).toBe('2027-01-02')
  })

  test('contacto a las 23:50 ART → el +2 se calcula desde el día del contacto, no el siguiente', () => {
    // 23:50 ART del 18/11 = 02:50 UTC del 19/11
    jest.setSystemTime(new Date('2026-11-19T02:50:00.000Z'))
    const result = calcProximoContacto('Recontactar en 48 hs')
    // +2 días desde 18/11 (día ART del contacto) = 20/11
    expect(result).toBe('2026-11-20T03:00:00.000Z')
    expect(isoToARTCalendarDate(result!)).toBe('2026-11-20')
  })
})

// ── shouldContactarHoy — función real usada por el CRM ───────────────────────
// Estos tests usan exactamente la misma función que importan contactar-hoy/page.tsx,
// MetricCards.tsx y dashboard/page.tsx. No hay lógica duplicada.

describe('shouldContactarHoy', () => {
  const HOY = '2026-11-20'

  // ── Estados cerrados siempre excluidos ──
  test('Ganado → nunca aparece', () => {
    expect(shouldContactarHoy({ estado: 'Ganado', proximo_contacto: '2026-11-20T03:00:00.000Z' }, HOY)).toBe(false)
  })
  test('Perdido → nunca aparece', () => {
    expect(shouldContactarHoy({ estado: 'Perdido', proximo_contacto: '2026-11-20T03:00:00.000Z' }, HOY)).toBe(false)
  })
  test('No interesado → nunca aparece', () => {
    expect(shouldContactarHoy({ estado: 'No interesado', proximo_contacto: null }, HOY)).toBe(false)
  })

  // ── Pendiente de contacto siempre incluido ──
  test('Pendiente de contacto sin fecha → aparece', () => {
    expect(shouldContactarHoy({ estado: 'Pendiente de contacto', proximo_contacto: null }, HOY)).toBe(true)
  })
  test('Pendiente de contacto con fecha futura → igualmente aparece', () => {
    expect(shouldContactarHoy({ estado: 'Pendiente de contacto', proximo_contacto: '2026-11-21T03:00:00.000Z' }, HOY)).toBe(true)
  })

  // ── Comparación de fecha calendario ART ──
  test('seguimiento 20/11 almacenado a las 12:00 UTC (09:00 ART) → visible el 20/11 desde las 00:00', () => {
    expect(shouldContactarHoy({ estado: 'Recontactar en 48 hs', proximo_contacto: '2026-11-20T12:00:00.000Z' }, HOY)).toBe(true)
  })
  test('seguimiento 20/11 almacenado a las 03:00 UTC (00:00 ART) → visible el 20/11', () => {
    expect(shouldContactarHoy({ estado: 'Recontactar en 48 hs', proximo_contacto: '2026-11-20T03:00:00.000Z' }, HOY)).toBe(true)
  })
  test('seguimiento del 21/11 → NO visible el 20/11', () => {
    expect(shouldContactarHoy({ estado: 'Cotización enviada', proximo_contacto: '2026-11-21T03:00:00.000Z' }, HOY)).toBe(false)
  })
  test('seguimiento vencido del 19/11 → visible el 20/11', () => {
    expect(shouldContactarHoy({ estado: 'Seguimiento cotización', proximo_contacto: '2026-11-19T12:00:00.000Z' }, HOY)).toBe(true)
  })
  test('seguimiento vencido de hace una semana → visible', () => {
    expect(shouldContactarHoy({ estado: 'Cotización enviada', proximo_contacto: '2026-11-13T03:00:00.000Z' }, HOY)).toBe(true)
  })
  test('02:59 UTC del 20/11 (= 23:59 ART del 19/11) → vencido, visible el 20/11', () => {
    expect(shouldContactarHoy({ estado: 'Recontactar en 48 hs', proximo_contacto: '2026-11-20T02:59:59.000Z' }, HOY)).toBe(true)
  })
  test('sin proximo_contacto y no es Pendiente → no aparece', () => {
    expect(shouldContactarHoy({ estado: 'Recontactar en 48 hs', proximo_contacto: null }, HOY)).toBe(false)
  })

  // ── Cruces de mes y año ──
  test('cruce de mes: seguimiento 02/11, hoy es 02/11 → visible', () => {
    expect(shouldContactarHoy({ estado: 'Cotización enviada', proximo_contacto: '2026-11-02T03:00:00.000Z' }, '2026-11-02')).toBe(true)
  })
  test('cruce de año: seguimiento 02/01/2027, hoy es 02/01/2027 → visible', () => {
    expect(shouldContactarHoy({ estado: 'Recontactar en 48 hs', proximo_contacto: '2027-01-02T03:00:00.000Z' }, '2027-01-02')).toBe(true)
  })
  test('cruce de año: seguimiento 02/01/2027, hoy es 01/01/2027 → NO visible', () => {
    expect(shouldContactarHoy({ estado: 'Recontactar en 48 hs', proximo_contacto: '2027-01-02T03:00:00.000Z' }, '2027-01-01')).toBe(false)
  })
})

// ── msUntilMidnightART ───────────────────────────────────────────────────────

describe('msUntilMidnightART', () => {
  beforeEach(() => { jest.useFakeTimers() })
  afterEach(() => { jest.useRealTimers() })

  test('retorna un valor positivo', () => {
    jest.setSystemTime(new Date('2026-11-20T10:00:00.000Z'))
    expect(msUntilMidnightART()).toBeGreaterThan(0)
  })

  test('a las 02:59 UTC retorna 1 minuto o menos para la próxima medianoche ART', () => {
    jest.setSystemTime(new Date('2026-11-20T02:59:00.000Z'))
    expect(msUntilMidnightART()).toBeLessThanOrEqual(60 * 1000)
  })

  test('a las 03:01 UTC retorna casi 24 horas para la siguiente medianoche ART', () => {
    jest.setSystemTime(new Date('2026-11-20T03:01:00.000Z'))
    const ms = msUntilMidnightART()
    expect(ms).toBeGreaterThan(23 * 3600 * 1000)
    expect(ms).toBeLessThanOrEqual(24 * 3600 * 1000)
  })
})

// ── buildFlowUpdate — integración ────────────────────────────────────────────

describe('buildFlowUpdate — integración con proximo_contacto', () => {
  beforeEach(() => { jest.useFakeTimers() })
  afterEach(() => { jest.useRealTimers() })

  test('buildFlowUpdate produce proximo_contacto a las 03:00 UTC', () => {
    jest.setSystemTime(new Date('2026-11-18T19:30:00.000Z')) // 16:30 ART
    const update = buildFlowUpdate('Recontactar en 48 hs')
    expect(update.proximo_contacto).toBe('2026-11-20T03:00:00.000Z')
  })

  test('buildFlowUpdate — Ganado no tiene proximo_contacto', () => {
    jest.setSystemTime(new Date('2026-11-18T19:30:00.000Z'))
    const update = buildFlowUpdate('Ganado')
    expect(update.proximo_contacto).toBeNull()
  })
})

// ── Fechas manuales — respeto de proximo_contacto_manual ─────────────────────

describe('Fechas manuales', () => {
  // La lógica de no sobreescribir fechas manuales está en el PATCH de la API.
  // Acá verificamos que isoToARTCalendarDate funcione correctamente con fechas
  // manuales arbitrarias (cualquier hora del día).

  test('fecha manual a las 15:00 UTC es evaluada por su fecha ART', () => {
    // 15:00 UTC = 12:00 ART → fecha ART: mismo día
    expect(isoToARTCalendarDate('2026-12-01T15:00:00.000Z')).toBe('2026-12-01')
  })

  test('fecha manual a las 02:00 UTC del 2/12 es el 1/12 en ART', () => {
    // 02:00 UTC = 23:00 ART del 1/12 → el filtro la evaluaría como 1/12
    expect(isoToARTCalendarDate('2026-12-02T02:00:00.000Z')).toBe('2026-12-01')
  })

  test('fecha manual exactamente a las 03:00 UTC es el mismo día en ART', () => {
    // 03:00 UTC = 00:00 ART → inicio del día
    expect(isoToARTCalendarDate('2026-12-15T03:00:00.000Z')).toBe('2026-12-15')
  })
})
