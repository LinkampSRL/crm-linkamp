-- ============================================================
-- CRM Linkamp Precisión SRL — Script SQL para Supabase
-- Ejecutar en: Supabase > SQL Editor > New query
-- ============================================================

-- Tabla principal de leads
CREATE TABLE IF NOT EXISTS leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa             TEXT,
  nombre              TEXT NOT NULL,
  telefono            TEXT NOT NULL,
  email               TEXT,
  ciudad_provincia    TEXT,
  producto_consultado TEXT,
  origen              TEXT CHECK (origen IN (
                        'Meta','Web','WhatsApp','Referido','Agrofy',
                        'Google Ads','Mercado Libre','Base histórica','Base de datos inicial','Otro'
                      )),
  fecha_ingreso       DATE NOT NULL DEFAULT CURRENT_DATE,
  estado              TEXT NOT NULL DEFAULT 'Pendiente de contacto'
                      CHECK (estado IN (
                        'Pendiente de contacto',
                        'Mensaje 1 enviado',
                        'Recontactar en 48 hs',
                        'Respondió - cotizar',
                        'Cotización enviada',
                        'Seguimiento cotización',
                        'Ganado',
                        'Perdido',
                        'No interesado'
                      )),
  ultimo_contacto     TIMESTAMPTZ,
  proximo_contacto    TIMESTAMPTZ,
  observaciones       TEXT,
  responsable         TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_leads_estado ON leads(estado);
CREATE INDEX IF NOT EXISTS idx_leads_proximo_contacto ON leads(proximo_contacto);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Tabla de plantillas de WhatsApp
CREATE TABLE IF NOT EXISTS templates (
  id   TEXT PRIMARY KEY,
  body TEXT NOT NULL
);

-- Plantillas por defecto
INSERT INTO templates (id, body) VALUES
(
  'mensaje_1',
  E'Hola [Nombre], ¿cómo estás?\n\nTe escribo de Linkamp Precisión. Hace un tiempo nos habías consultado por la balanza portátil para pesaje por ejes.\n\nEstamos retomando consultas anteriores porque durante junio y julio 2026 tenemos precio promocional y posibilidad de financiación de hasta 36 meses con BNA PyME y BNA Agro.\n\n¿Querés que te pasemos la propuesta actualizada?'
),
(
  'mensaje_2',
  E'Hola [Nombre], ¿cómo estás?\n\nTe consulto nuevamente por la balanza portátil para pesaje por ejes.\n\nDurante junio y julio tenemos condiciones especiales: precio promocional y financiación hasta 36 meses con BNA PyME / BNA Agro.\n\n¿Te interesa que te enviemos la cotización actualizada?'
)
ON CONFLICT (id) DO NOTHING;

-- Tabla de historial de cambios de estado
CREATE TABLE IF NOT EXISTS lead_history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  fecha            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado_anterior  TEXT,
  estado_nuevo     TEXT NOT NULL,
  observacion      TEXT
);

CREATE INDEX IF NOT EXISTS idx_lead_history_lead_id ON lead_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_history_fecha   ON lead_history(fecha DESC);

-- Row Level Security: deshabilitar para uso con anon key (app de un solo usuario)
-- Si en el futuro se agrega autenticación real, habilitar RLS aquí.
ALTER TABLE leads        DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates    DISABLE ROW LEVEL SECURITY;
ALTER TABLE lead_history DISABLE ROW LEVEL SECURITY;
