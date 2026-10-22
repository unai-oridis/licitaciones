// Resumen diario para el administrador: alertas creadas, envíos, visitas y licitaciones.
// Lo lanza cada día a las 7:00 (hora de Madrid) el despertador de Cloudflare (workflow resumen-admin.yml).
//
// Variables de entorno (secretos de GitHub): CF_ACCOUNT_ID, CF_D1_ID, CF_API_TOKEN, BREVO_API_KEY, EMAIL_ADMIN

import fs from 'node:fs/promises';
import path from 'node:path';
import { emailResumenAdmin, enviarEmail, normalizarFiltros } from '../lib/alertas.mjs';

const DIR_DATOS = process.env.DIR_DATOS || 'public/data';
const SITIO = process.env.SITIO || 'https://licitaempresa.es';
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const { CF_ACCOUNT_ID, CF_D1_ID, CF_API_TOKEN } = process.env;

async function d1(sql, params = []) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_ID}/query`, {
    method: 'POST', headers: { authorization: `Bearer ${CF_API_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify({ sql, params }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.success === false) throw new Error(`D1: ${r.status} ${JSON.stringify(d.errors || d).slice(0, 300)}`);
  return d.result?.[0]?.results || [];
}

// Visitas de ayer en Cloudflare Web Analytics. Necesita que la llave de Cloudflare tenga permiso
// «Account Analytics: Read»; si no lo tiene, el resumen se envía igualmente sin este apartado.
async function visitasDeAyer(dia) {
  try {
    const q = `query($cuenta: String!, $dia: Date!) { viewer { accounts(filter: { accountTag: $cuenta }) {
      total: rumPageloadEventsAdaptiveGroups(limit: 1, filter: { date: $dia }) { count sum { visits } }
      top: rumPageloadEventsAdaptiveGroups(limit: 5, filter: { date: $dia }, orderBy: [count_DESC]) { count dimensions { requestPath } }
    } } }`;
    const r = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST', headers: { authorization: `Bearer ${CF_API_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ query: q, variables: { cuenta: CF_ACCOUNT_ID, dia } }),
    });
    const d = await r.json();
    const c = d?.data?.viewer?.accounts?.[0];
    if (!c) { log('Visitas no disponibles:', JSON.stringify(d.errors || d).slice(0, 200)); return null; }
    return {
      visitas: c.total?.[0]?.sum?.visits || 0, paginas: c.total?.[0]?.count || 0,
      top: (c.top || []).map((x) => [x.dimensions.requestPath, x.count]),
    };
  } catch (e) { log('Visitas no disponibles:', e.message); return null; }
}

async function main() {
  if (!CF_ACCOUNT_ID || !CF_D1_ID || !CF_API_TOKEN || !process.env.EMAIL_ADMIN) {
    log('Faltan secretos (Cloudflare o EMAIL_ADMIN). No se envía el resumen.');
    return;
  }
  const ahora = new Date();
  const desde = new Date(ahora.getTime() - 864e5).toISOString().slice(0, 16);
  const ayer = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date(ahora.getTime() - 864e5));
  const fecha = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', weekday: 'long', day: 'numeric', month: 'long' }).format(ahora);
  const hora = (iso) => new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    .format(new Date(iso.length <= 16 ? iso + ':00Z' : iso));

  const nuevas = (await d1('SELECT email, filtros, confirmada, creada FROM alertas WHERE creada >= ? ORDER BY creada', [desde]))
    .map((a) => ({ email: a.email, confirmada: a.confirmada === 1, hora: hora(a.creada), filtros: normalizarFiltros(JSON.parse(a.filtros || '{}')) }));
  const [t] = await d1(`SELECT SUM(confirmada = 1) AS confirmadas, SUM(confirmada = 0) AS pendientes,
    COUNT(DISTINCT CASE WHEN confirmada = 1 THEN email END) AS personas, SUM(confirmada = 1 AND confirmada_en >= ?) AS confirmadas24 FROM alertas`, [desde]);
  const envioRaw = (await d1("SELECT valor FROM control WHERE clave = 'ultimo_resumen'"))[0]?.valor;
  let envio = null;
  if (envioRaw) { envio = JSON.parse(envioRaw); envio.fecha = hora(envio.fecha); }

  const indice = JSON.parse(await fs.readFile(path.join(DIR_DATOS, 'indice.json'), 'utf8'));
  const abiertas = JSON.parse(await fs.readFile(path.join(DIR_DATOS, indice.archivos.abiertas.f), 'utf8')).items;
  const nowIso = ahora.toISOString().slice(0, 16);
  const licitaciones = {
    abiertas: abiertas.filter((x) => x.g === 'A' && (!x.f || x.f >= nowIso)).length,
    nuevas24: abiertas.filter((x) => (x.vt || '') >= desde).length,
    actualizado: hora(indice.actualizado),
  };

  const correo = emailResumenAdmin({
    sitio: SITIO, fecha, nuevas, envio, licitaciones, visitas: await visitasDeAyer(ayer),
    totales: { confirmadas: t?.confirmadas || 0, pendientes: t?.pendientes || 0, personas: t?.personas || 0, confirmadas24: t?.confirmadas24 || 0 },
  });
  const r = await enviarEmail(process.env, { para: process.env.EMAIL_ADMIN, ...correo });
  if (!r.ok) throw new Error(r.error);
  log(`Resumen enviado: ${nuevas.length} alertas nuevas.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
