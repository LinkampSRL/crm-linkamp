# CRM Linkamp — Estado del Proyecto

**Última actualización:** 2026-11-20
**Commit de referencia:** `1734e0d`
**URL de producción:** https://crm-linkamp.vercel.app
**Repositorio:** https://github.com/LinkampSRL/crm-linkamp

---

## 1. Arquitectura y tecnologías

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript (strict mode) |
| Estilos | Tailwind CSS |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Cookie httpOnly (`CRM_PASSWORD`) — usuario único |
| Deploy | Vercel (auto-deploy desde `main`) |
| Runtime | Node.js / Edge Middleware |

### Variables de entorno requeridas

```
NEXT_PUBLIC_SUPABASE_URL=        # URL pública del proyecto Supabase
SUPABASE_SERVICE_ROLE_KEY=       # Clave de servicio (NO tiene prefijo NEXT_PUBLIC_)
CRM_PASSWORD=                    # Contraseña única de acceso al CRM
```

> **Regla crítica:** `SUPABASE_SERVICE_ROLE_KEY` nunca debe tener el prefijo `NEXT_PUBLIC_`.
> Todas las operaciones a Supabase se hacen desde el servidor usando `supabaseAdmin` (service role key).

### Decisiones de arquitectura

- **Sin autenticación de usuarios:** acceso único por contraseña compartida almacenada en cookie httpOnly. Rate limiting en memoria (5 intentos / 10 min por IP) en la ruta `/api/auth`.
- **Whitelist explícita en APIs:** los endpoints POST y PATCH nunca hacen spread del body. Cada campo permitido está enumerado explícitamente.
- **RLS deshabilitado:** Supabase tiene RLS desactivado en las tres tablas. La seguridad se maneja desde el servidor con la service role key. Si en el futuro se agregan múltiples usuarios reales, activar RLS.
- **Timezone Argentina:** ART = UTC-3, sin horario de verano. Los cálculos de fecha usan `Date.UTC(año, mes, día + N, 12, 0, 0, 0)` — 12:00 UTC equivale a 09:00 ART. No se usa `date-fns-tz` ni ninguna dependencia externa para esto.

---

## 2. Estructura de Supabase

### Tablas

#### `leads`
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | UUID PK | `gen_random_uuid()` |
| `marca_comercial` | TEXT NOT NULL | CHECK: `'Linkamp'`, `'Pampera'`. Default: `'Linkamp'` |
| `empresa` | TEXT | nullable |
| `nombre` | TEXT NOT NULL | |
| `telefono` | TEXT NOT NULL | |
| `email` | TEXT | nullable |
| `ciudad_provincia` | TEXT | nullable |
| `producto_consultado` | TEXT | descripción libre |
| `producto_categoria` | TEXT | CHECK: ver categorías abajo. nullable |
| `origen` | TEXT | CHECK: ver orígenes abajo. nullable |
| `fecha_ingreso` | DATE | default `CURRENT_DATE` |
| `estado` | TEXT NOT NULL | CHECK: ver estados abajo. Default: `'Pendiente de contacto'` |
| `ultimo_contacto` | TIMESTAMPTZ | nullable |
| `proximo_contacto` | TIMESTAMPTZ | nullable |
| `proximo_contacto_manual` | BOOLEAN NOT NULL | Default: `false`. Si `true`, impide que los cambios de estado sobreescriban la fecha |
| `observaciones` | TEXT | nullable |
| `responsable` | TEXT | nullable |
| `created_at` | TIMESTAMPTZ | default `NOW()` |
| `updated_at` | TIMESTAMPTZ | actualizado automáticamente por trigger |

#### `templates`
| Columna | Tipo |
|---------|------|
| `id` | TEXT PK |
| `body` | TEXT NOT NULL |

#### `lead_history`
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | UUID PK | |
| `lead_id` | UUID | FK → `leads.id` ON DELETE CASCADE |
| `fecha` | TIMESTAMPTZ | default `NOW()` |
| `estado_anterior` | TEXT | nullable |
| `estado_nuevo` | TEXT NOT NULL | |
| `observacion` | TEXT | nullable |

### Índices
- `idx_leads_estado` en `leads(estado)`
- `idx_leads_proximo_contacto` en `leads(proximo_contacto)`
- `idx_lead_history_lead_id` en `lead_history(lead_id)`
- `idx_lead_history_fecha` en `lead_history(fecha DESC)`

### Migraciones aplicadas (en orden)

| Archivo | Estado | Contenido |
|---------|--------|-----------|
| `supabase_schema.sql` | ✅ aplicado | Schema inicial: tablas, índices, trigger, templates `mensaje_1` y `mensaje_2` |
| `supabase_rls_migration.sql` | ✅ aplicado | Desactiva RLS en las tres tablas |
| `supabase_incremental.sql` | ✅ aplicado | Agrega columnas `producto_categoria` y `responsable` |
| `supabase_sprint1.sql` | ✅ aplicado | Elimina `'Mensaje 1 enviado'` del CHECK de estado; agrega `'BPL'` a producto_categoria; agrega columna `proximo_contacto_manual`; inserta template `seguimiento_cotizacion` |
| `supabase_sprint2.sql` | ✅ aplicado | Agrega columna `marca_comercial`; amplía CHECK de producto_categoria (Celdas de carga, Pampera 40/65/80); inserta 6 templates por marca |
| `supabase_origen_bbc.sql` | ✅ aplicado | Agrega `'Base de datos BBC'` al CHECK de `origen` |

> **Nota:** los archivos SQL en el repositorio son de referencia histórica. No volver a ejecutarlos.

---

## 3. Dominio del negocio

### Estados comerciales

Los estados siguen un flujo unidireccional. Cambiar el estado desde el CRM actualiza automáticamente `ultimo_contacto` y `proximo_contacto` según las reglas de flow.

| Estado | Color | `proximo_contacto` automático |
|--------|-------|-------------------------------|
| `Pendiente de contacto` | gris | — (sin fecha) |
| `Recontactar en 48 hs` | amarillo | +2 días calendario a las 00:00 ART |
| `Respondió - cotizar` | verde | — |
| `Cotización enviada` | amarillo | +2 días calendario a las 00:00 ART |
| `Seguimiento cotización` | amarillo | +2 días calendario a las 00:00 ART |
| `Ganado` | verde oscuro | — |
| `Perdido` | rojo | — |
| `No interesado` | rojo | — |

**Regla de seguimiento automático:** los +2 días se cuentan como días calendario completos en Argentina. El timestamp se almacena a las **03:00 UTC (= 00:00 ART)**. Ejemplo: contacto el 18/11 a las 16:30 ART → `proximo_contacto = 2026-11-20T03:00:00Z` → el lead aparece en "Contactar hoy" a partir de las 00:00 ART del 20/11.

**Filtro "Contactar hoy":** compara la fecha calendario ART del `proximo_contacto` (no el timestamp exacto) contra la fecha de hoy en Argentina. Esto garantiza que un lead programado para el 20/11 aparezca durante todo el 20/11, independientemente de la hora almacenada (03:00 UTC o 12:00 UTC). Los leads vencidos de días anteriores también aparecen. La función `shouldContactarHoy()` en `lib/flow.ts` encapsula esta lógica y es la única usada en toda la aplicación (contactar-hoy, dashboard, MetricCards).

**Actualización automática:** "Contactar hoy" se refresca automáticamente al cambiar el día calendario argentino (medianoche ART = 03:00 UTC), sin necesidad de cerrar ni recargar el CRM.

**Fecha manual de próximo contacto:**
- El usuario puede sobrescribir la fecha desde el formulario (`proximo_contacto_manual = true`).
- Mientras está activa, los cambios de estado no sobreescriben la fecha.
- Al borrar la fecha manual, el sistema recalcula automáticamente según el estado actual.

### Marcas comerciales

| Marca | Categorías de producto |
|-------|----------------------|
| `Linkamp` | PWS, LPS, BBC, MCS, BPL, Celdas de carga, Otros |
| `Pampera` | Pampera 40, Pampera 65, Pampera 80 |

La compatibilidad entre marca y categoría se valida tanto en el frontend como en las APIs (POST y PATCH de leads e importación CSV).

### Orígenes de leads

`Meta` · `Web` · `WhatsApp` · `Referido` · `Agrofy` · `Google Ads` · `Mercado Libre` · `Base histórica` · `Base de datos inicial` · `Base de datos BBC` · `Otro`

### Responsables

`Sol` · `Martín` · `Cristian` · `Andrés` · `Thomas`

---

## 4. Plantillas de WhatsApp

Hay 9 plantillas almacenadas en Supabase, editables desde `/crm/plantillas`:

| ID | Descripción | Marca |
|----|-------------|-------|
| `linkamp_mensaje_1` | Primer contacto Linkamp | Linkamp |
| `linkamp_mensaje_2` | Recontacto Linkamp | Linkamp |
| `linkamp_seguimiento_cotizacion` | Seguimiento de cotización Linkamp | Linkamp |
| `pampera_mensaje_1` | Primer contacto Pampera | Pampera |
| `pampera_mensaje_2` | Recontacto Pampera | Pampera |
| `pampera_seguimiento_cotizacion` | Seguimiento de cotización Pampera | Pampera |
| `mensaje_1` | Primer contacto (legacy) | — |
| `mensaje_2` | Recontacto (legacy) | — |
| `seguimiento_cotizacion` | Seguimiento (legacy) | — |

**Selección automática de plantilla:** la función `templateIdForLead(marca, estado)` en `lib/templates.ts` elige el template correcto:
- `Recontactar en 48 hs` → `{marca}_mensaje_2`
- `Cotización enviada` o `Seguimiento cotización` → `{marca}_seguimiento_cotizacion`
- Cualquier otro estado → `{marca}_mensaje_1`

**Variables disponibles en templates:** `[Nombre]`, `[Empresa]`, `[Producto]`, `[Telefono]`

Los cambios en plantillas se guardan directamente en Supabase vía `/api/templates/[id]` (PATCH).

---

## 5. Funcionalidades implementadas por Sprint

### Sprint 1 — commit `4df6576`
- Eliminación del estado `'Mensaje 1 enviado'` (consolidado en `'Pendiente de contacto'`)
- Seguimiento automático de próximo contacto al cambiar estado
- Campo `proximo_contacto_manual` para fechas manuales protegidas
- Al limpiar fecha manual, recálculo automático según estado
- Template `seguimiento_cotizacion` en Supabase

### Sprint 2 — commit `20383aa`
- Campo `marca_comercial` (Linkamp/Pampera) con toggle en el formulario
- Categorías de producto separadas y validadas por marca
- 6 plantillas independientes por marca, editables desde el CRM
- Selección automática de plantilla según marca y estado del lead
- Validación servidor de compatibilidad marca/categoría en POST, PATCH e importación
- Filtros por marca en "Todos los leads" y "Contactar hoy"
- Dashboard con secciones por marca y producto
- Origen `'Base de datos BBC'` como opción independiente

### Hotfix: seguimiento por días calendario — commit `1734e0d`
- **Problema corregido:** los seguimientos se guardaban a las 12:00 UTC (09:00 ART) y el filtro comparaba timestamps exactos, por lo que un lead programado para el 20/11 no aparecía hasta las 09:00 ART en lugar de las 00:00.
- `lib/flow.ts`: `nextARTDate()` ahora guarda a las 03:00 UTC (= 00:00 ART).
- `lib/flow.ts`: nueva función `shouldContactarHoy()` que compara la fecha calendario ART — es la única función de filtrado usada en todo el CRM.
- `lib/flow.ts`: nuevas utilidades exportadas: `isoToARTCalendarDate()`, `todayARTDate()`, `msUntilMidnightART()`.
- `app/crm/contactar-hoy/page.tsx`: auto-refresh al cambiar el día calendario ART (timeout hacia las 03:00 UTC).
- **Sin SQL:** los leads existentes con timestamps a las 12:00 UTC funcionan correctamente con el nuevo filtro sin necesidad de migración.
- **Tests automatizados:** 38 pruebas en `__tests__/flow.test.ts` con Jest + ts-jest. Cubren: timestamps a distintas horas, vencidos, cruces de mes y año, fechas manuales, estados cerrados, `msUntilMidnightART`. Ejecutar con `npm test`.

---

## 6. Estructura de archivos del proyecto

```
crm-linkamp/
├── app/
│   ├── api/
│   │   ├── auth/route.ts          # Login con rate limiting
│   │   ├── leads/route.ts         # GET todos, POST nuevo lead
│   │   ├── leads/[id]/route.ts    # PATCH actualizar, DELETE eliminar
│   │   ├── import/route.ts        # Importación masiva CSV
│   │   ├── templates/route.ts     # GET todas las plantillas
│   │   └── templates/[id]/route.ts# PATCH actualizar plantilla
│   ├── crm/
│   │   ├── layout.tsx             # Sidebar de navegación
│   │   ├── page.tsx               # Tabla "Todos los leads"
│   │   ├── contactar-hoy/page.tsx # Lista de leads prioritarios
│   │   ├── plantillas/page.tsx    # Editor de plantillas WhatsApp
│   │   └── dashboard/page.tsx     # Métricas y gráficos
│   ├── login/page.tsx
│   └── layout.tsx
├── components/
│   ├── LeadForm.tsx               # Formulario crear/editar lead
│   └── LeadsTable.tsx             # Tabla con acciones y botón WhatsApp
├── lib/
│   ├── types.ts                   # Tipos TypeScript y constantes del dominio
│   ├── estados.ts                 # Colores y lista de estados
│   ├── flow.ts                    # Lógica de seguimiento automático
│   ├── templates.ts               # Defaults, labels y selección de plantillas
│   ├── supabase-server.ts         # Cliente Supabase con service role key
│   └── api-auth.ts                # Helper de autenticación por cookie
├── middleware.ts                  # Redirección / protección de rutas
├── __tests__/
│   └── flow.test.ts               # 38 pruebas de lógica de fechas ART y filtros
├── jest.config.js                 # Configuración de Jest + ts-jest
├── supabase_schema.sql            # Schema original (referencia)
├── supabase_sprint1.sql           # Migración Sprint 1 (ya aplicada)
├── supabase_sprint2.sql           # Migración Sprint 2 (ya aplicada)
└── supabase_origen_bbc.sql        # Migración origen BBC (ya aplicada)
```

---

## 7. Instrucciones para retomar el desarrollo

### Levantar el entorno local

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo de entorno (si no existe)
# Copiar .env.local.example o crear .env.local con las tres variables de entorno

# 3. Iniciar el servidor de desarrollo
npm run dev
# → http://localhost:3000
```

### Antes de hacer un push

```bash
npm test        # Ejecuta las 38 pruebas automatizadas (debe pasar sin errores)
npm run build   # Verifica tipos y linting — debe terminar sin errores
git status      # Revisar que no haya archivos sensibles (.env, .next)
git add <archivos específicos>   # NUNCA git add -A sin revisar
git commit -m "feat/fix/chore: descripción"
git push origin main
```

Vercel despliega automáticamente al hacer push a `main`.

### Reglas de desarrollo a respetar

1. **No hacer `git push` ni deploy sin autorización explícita.**
2. **No ejecutar SQL en Supabase sin autorización explícita.** Preparar archivos `.sql` primero.
3. **No usar `NEXT_PUBLIC_` en `SUPABASE_SERVICE_ROLE_KEY`.**
4. **Nunca spread del body en las APIs.** Siempre whitelist explícita de campos.
5. **Al modificar estados o categorías:** actualizar `lib/tipos.ts`, `lib/estados.ts`, los CHECK constraints de Supabase y los SET/arrays en `app/api/import/route.ts`.
6. **Al agregar nuevas plantillas:** crear la fila en Supabase + agregar el ID a `ACTIVE_TEMPLATE_IDS` en `app/crm/plantillas/page.tsx` + actualizar `templateIdForLead()` si aplica.

### Supabase — acceso

- Panel: https://supabase.com (proyecto configurado en `NEXT_PUBLIC_SUPABASE_URL`)
- Las migraciones se ejecutan en: **SQL Editor → New query**
- Los leads e historial se pueden inspeccionar en: **Table Editor**

---

## 8. Posibles mejoras futuras (no comprometidas)

- Búsqueda full-text de leads por nombre, empresa o teléfono
- Exportación CSV de leads filtrados
- Paginación del lado del servidor (hoy carga hasta 5000 leads)
- Autenticación multiusuario con RLS en Supabase
- Notificaciones automáticas para leads con `proximo_contacto` vencido
- Historial de cambios visible desde el formulario de edición
- Dominio propio para Vercel
