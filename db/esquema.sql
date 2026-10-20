-- Base de datos de alertas (Cloudflare D1). Se ejecuta una vez desde la consola de D1.
CREATE TABLE IF NOT EXISTS alertas (
  id TEXT PRIMARY KEY,             -- código secreto: sirve para confirmar y dar de baja
  email TEXT NOT NULL,
  filtros TEXT NOT NULL,           -- JSON con CPV, provincias, texto, tipo e importes
  confirmada INTEGER NOT NULL DEFAULT 0,
  creada TEXT NOT NULL,            -- fecha y hora UTC (AAAA-MM-DDTHH:MM)
  confirmada_en TEXT,
  ultimo_envio TEXT,
  consentimiento TEXT              -- texto aceptado, para poder acreditar el consentimiento
);
CREATE INDEX IF NOT EXISTS idx_alertas_email ON alertas(email);
CREATE INDEX IF NOT EXISTS idx_alertas_confirmada ON alertas(confirmada);

-- Control del envío diario (para no enviar dos veces el mismo día)
CREATE TABLE IF NOT EXISTS control (
  clave TEXT PRIMARY KEY,
  valor TEXT
);
