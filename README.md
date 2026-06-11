# CRM Linkamp Precisión SRL

CRM comercial para gestión de leads de la campaña de balanzas portátiles.

---

## Requisitos previos

- [Node.js 18+](https://nodejs.org) instalado en tu computadora
- Cuenta en [Supabase](https://supabase.com) (gratis)
- Cuenta en [Vercel](https://vercel.com) (gratis)

---

## 1. Configurar Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá un proyecto nuevo.
   - Nombre sugerido: `crm-linkamp`
   - Elegí la región más cercana (ej: South America)

2. Una vez creado el proyecto, andá a **SQL Editor → New query**.

3. Pegá el contenido del archivo `supabase_schema.sql` y hacé clic en **Run**.
   - Esto crea las tablas `leads` y `templates` con los datos de ejemplo.

4. Anotá estas dos claves (las vas a necesitar después):
   - **Project URL**: Settings → API → Project URL
   - **Anon key**: Settings → API → Project API keys → `anon public`

---

## 2. Configurar variables de entorno

Copiá el archivo de ejemplo:

```bash
cp .env.example .env.local
```

Abrí `.env.local` y completá los valores:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
CRM_PASSWORD=tu_contraseña_aqui
```

Dónde encontrar las claves en Supabase: **Settings → API**
- `NEXT_PUBLIC_SUPABASE_URL` → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon public
- `SUPABASE_SERVICE_ROLE_KEY` → service_role ⚠️ **NUNCA compartir esta clave**

> **CRM_PASSWORD**: elegí una contraseña segura. Esta es la única contraseña para acceder al CRM.

---

## 2b. Habilitar Row Level Security (RLS)

Después de crear las tablas con `supabase_schema.sql`, ejecutar también:

**SQL Editor → New query → pegar el contenido de `supabase_rls_migration.sql` → Run**

Esto bloquea el acceso público a la base de datos. El CRM usa la `service_role` key
del servidor para acceder, que bypassa RLS de forma segura.

---

## 3. Instalar dependencias y correr localmente

```bash
npm install
npm run dev
```

Abrí el navegador en [http://localhost:3000](http://localhost:3000).

---

## 4. Agregar el logo

Copiá el archivo `Logo Linkamp sin texto.png` a la carpeta `public/` con el nombre `logo.png`:

```
public/logo.png
```

---

## 5. Deploy en Vercel

### Opción A: desde GitHub (recomendado)

1. Subí el proyecto a un repositorio de GitHub (privado está bien).
2. Entrá a [vercel.com](https://vercel.com) → **New Project** → importá el repo.
3. Configurá las variables de entorno en Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **obligatoria — sin esta clave las APIs no funcionan**
   - `CRM_PASSWORD`
4. Hacé clic en **Deploy**.

### Opción B: desde la terminal (Vercel CLI)

```bash
npm install -g vercel
vercel
```

Seguí las instrucciones. Cuando te pida las variables de entorno, ingresalas ahí.

### Obtener el link final

Una vez deployado, Vercel te da una URL del tipo:
```
https://crm-linkamp.vercel.app
```

Compartí esa URL con quien vaya a usar el CRM.

---

## 6. Cambiar la contraseña

La contraseña se configura únicamente como variable de entorno `CRM_PASSWORD`.

- **Localmente**: editá `.env.local` y reiniciá el servidor con `npm run dev`.
- **En Vercel**: Settings → Environment Variables → editá `CRM_PASSWORD` → redeploy.

---

## Estructura del proyecto

```
app/
  login/          → Pantalla de acceso
  crm/
    page.tsx      → Todos los leads (tabla + filtros)
    contactar-hoy/ → Vista principal del día
    plantillas/   → Editor de mensajes WhatsApp
  api/
    auth/         → Verificación de contraseña
    import/       → Importación de CSV/Excel
components/       → Componentes reutilizables
lib/              → Lógica de negocio (flujo, teléfonos, plantillas)
```

---

## Importar leads desde Excel/CSV

1. Preparar el archivo con columnas:
   `nombre`, `telefono`, `empresa`, `email`, `ciudad_provincia`, `origen`, `observaciones`

2. En el CRM: **Todos los leads → Importar CSV/Excel**

3. El sistema asigna automáticamente estado `Pendiente de contacto` si no se indica otro.

---

## Flujo automático de estados

| Acción | Estado siguiente | Próximo contacto |
|--------|-----------------|-----------------|
| Marcar "Mensaje 1 enviado" | Mensaje 1 enviado | +48 horas |
| Marcar "Recontactar en 48 hs" | Recontactar en 48 hs | +48 horas |
| Marcar "Cotización enviada" | Cotización enviada | +3 días |
| Marcar "Ganado/Perdido/No interesado" | — | Sin fecha |
