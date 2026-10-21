// Envío diario de alertas por email.
// Lee las alertas confirmadas de Cloudflare D1, busca las licitaciones en plazo aparecidas desde el último
// envío de cada alerta y manda un único email por persona (con todas sus alertas) a través de Brevo.
//
// Variables de entorno (secretos de GitHub):
//   CF_ACCOUNT_ID, CF_D1_ID, CF_API_TOKEN  acceso a la base de datos D1
//   BREVO_API_KEY                          envío de emails
//   SITIO                                  https://licitaempresa.es
// Para pruebas: ALERTAS_JSON=archivo.json (en vez de D1) y MODO_PRUEBA=1 (no envía, solo muestra).

import fs from 'node:fs/promises';
import path from 'node:path';
import { coincide, emailDiario, enviarEmail, normalizarFiltros, esAlertaEmpresa } from '../lib/alertas.mjs';

const DIR_DATOS = process.env.DIR_DATOS || 'public/data';
const SITIO = process.env.SITIO || 'https://licitaempresa.es';
const MAX_EMAILS = Number(process.env.MAX_EMAILS || 290); // margen bajo los 300 diarios del plan gratuito de Brevo
const AHORA = new Date().toISOString().slice(0, 16);
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

// ---------- acceso a D1 (o a un archivo, para pruebas) ----------

async function d1(sql, params = []) {
  const { CF_ACCOUNT_ID, CF_D1_ID, CF_API_TOKEN } = process.env;
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_ID}/query`, {
    method: 'POST',
    headers: { authorization: `Bearer ${CF_API_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify({ sql, params }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.success === false) throw new Error(`D1: ${r.status} ${JSON.stringify(d.errors || d).slice(0, 300)}`);
  return d.result?.[0]?.results || [];
}

async function leerAlertas() {
  if (process.env.ALERTAS_JSON) return JSON.parse(await fs.readFile(process.env.ALERTAS_JSON, 'utf8'));
  return d1('SELECT id, email, filtros, confirmada_en, ultimo_envio FROM alertas WHERE confirmada = 1 ORDER BY email');
}

async function marcarEnviado(email) {
  if (process.env.ALERTAS_JSON) return;
  await d1('UPDATE alertas SET ultimo_envio = ? WHERE email = ? AND confirmada = 1', [AHORA, email]);
}

// ---------- programa principal ----------

async function main() {
  const usaD1 = process.env.CF_ACCOUNT_ID && process.env.CF_D1_ID && process.env.CF_API_TOKEN;
  if (!usaD1 && !process.env.ALERTAS_JSON) {
    log('Alertas sin configurar todavía (faltan los secretos de Cloudflare). No se envía nada.');
    return;
  }
  if (!process.env.BREVO_API_KEY && process.env.MODO_PRUEBA !== '1') {
    log('Falta BREVO_API_KEY. No se envía nada.');
    return;
  }

  // Una vez al día: en la primera ejecución a partir de las 6:00 de Madrid (salvo envío forzado a mano).
  // El Ministerio publica las novedades de madrugada, así que a esa hora ya están todas.
  const hoyMadrid = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date());
  const horaMadrid = Number(new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', hour12: false }).format(new Date()));
  if (!process.env.ALERTAS_JSON && process.env.FORZAR !== '1') {
    if (horaMadrid < 6) { log(`Son las ${horaMadrid} h en Madrid: las alertas se envían a partir de las 6.`); return; }
    const ultimo = (await d1("SELECT valor FROM control WHERE clave = 'ultimo_envio_diario'"))[0]?.valor;
    if (ultimo === hoyMadrid) { log('Las alertas de hoy ya se enviaron.'); return; }
  }

  const indice = JSON.parse(await fs.readFile(path.join(DIR_DATOS, 'indice.json'), 'utf8'));
  const abiertas = JSON.parse(await fs.readFile(path.join(DIR_DATOS, indice.archivos.abiertas.f), 'utf8')).items
    .filter((x) => x.g === 'A' && (!x.f || x.f >= AHORA)); // nunca avisar de algo ya cerrado
  log(`${abiertas.length} licitaciones en plazo cargadas`);
  // Adjudicaciones (para las alertas de empresas), solo si alguien tiene una alerta de ese tipo
  let adjudicadas = null;
  async function cargarAdjudicadas() {
    if (adjudicadas) return adjudicadas;
    adjudicadas = [];
    for (const h of indice.archivos.historico || []) {
      if (!h.grupos?.J && !h.grupos?.F) continue;
      for (const x of JSON.parse(await fs.readFile(path.join(DIR_DATOS, h.f), 'utf8')).items) {
        if ((x.g === 'J' || x.g === 'F') && x.ad?.length && x.vadj) adjudicadas.push(x);
      }
    }
    log(`${adjudicadas.length} adjudicaciones cargadas`);
    return adjudicadas;
  }

  // Borrar las alertas que nadie confirmó en 7 días (no se guardan emails sin consentimiento confirmado).
  if (!process.env.ALERTAS_JSON) {
    const limite = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 16);
    await d1('DELETE FROM alertas WHERE confirmada = 0 AND creada < ?', [limite]);
  }

  const alertas = await leerAlertas();
  const porEmail = new Map();
  for (const a of alertas) {
    if (!porEmail.has(a.email)) porEmail.set(a.email, []);
    porEmail.get(a.email).push(a);
  }
  log(`${alertas.length} alertas confirmadas de ${porEmail.size} personas`);

  let enviados = 0, sinNovedades = 0, fallos = 0, aplazados = 0;
  for (const [email, suyas] of porEmail) {
    const secciones = [];
    for (const a of suyas) {
      const filtros = normalizarFiltros(typeof a.filtros === 'string' ? JSON.parse(a.filtros) : a.filtros);
      const desde = a.ultimo_envio || a.confirmada_en || AHORA;
      const items = esAlertaEmpresa(filtros)
        ? (await cargarAdjudicadas()).filter((x) => x.vadj > desde && coincide(x, filtros))
          .sort((x, y) => ((x.fa || '') < (y.fa || '') ? 1 : -1)) // las más recientes, primero
        : abiertas
          .filter((x) => (x.vt || '') > desde && coincide(x, filtros))
          .sort((x, y) => (x.f || '9999') < (y.f || '9999') ? -1 : 1); // las que cierran antes, primero
      if (items.length) secciones.push({ alerta: { id: a.id, filtros }, items });
    }
    if (!secciones.length) { sinNovedades++; await marcarEnviado(email); continue; }
    if (enviados >= MAX_EMAILS) { aplazados++; continue; } // se enviarán mañana, con las novedades acumuladas

    const correo = emailDiario({ sitio: SITIO, secciones, provincias: indice.provincias, tipos: indice.tipos });
    const r = await enviarEmail(process.env, {
      para: email, ...correo, bajaUrl: `${SITIO}/api/baja?t=${secciones[0].alerta.id}&todas=1`,
    });
    if (r.ok) { enviados++; await marcarEnviado(email); }
    else { fallos++; log(`  fallo enviando a una dirección: ${r.error}`); }
  }
  if (!process.env.ALERTAS_JSON) {
    const guardar = (clave, valor) => d1('INSERT INTO control (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor', [clave, valor]);
    if (enviados || !fallos) await guardar('ultimo_envio_diario', hoyMadrid);
    // Resumen para el panel de administración
    await guardar('ultimo_resumen', JSON.stringify({
      fecha: new Date().toISOString(), alertas: alertas.length, personas: porEmail.size, enviados, sinNovedades, aplazados, fallos,
      licitacionesEnPlazo: abiertas.length,
    }));
  }
  log(`Listo: ${enviados} emails enviados, ${sinNovedades} sin novedades, ${aplazados} aplazados por límite diario, ${fallos} fallos.`);
  if (fallos && !enviados) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
