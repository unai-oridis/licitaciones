// POST /api/reenviar { email }: vuelve a enviar el email para activar la alerta más reciente sin confirmar.
// Como máximo 2 reenvíos por alerta y uno por minuto. Responde siempre igual, exista o no la alerta,
// para no revelar qué emails tienen alertas.
import { emailValido, emailConfirmacion, enviarEmail, normalizarFiltros } from '../../lib/alertas.mjs';

const json = (datos, status = 200) =>
  new Response(JSON.stringify(datos), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const MAX_REENVIOS = 2;

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Petición no válida.' }, 400); }
  const email = String(body.email || '').trim().toLowerCase();
  if (!emailValido(email)) return json({ error: 'Revisa el email: no parece válido.' }, 400);
  if (!env.DB) return json({ error: 'No disponible ahora mismo. Inténtalo más tarde.' }, 503);

  // Columnas para controlar los reenvíos (se crean la primera vez)
  for (const col of ['reenvios INTEGER NOT NULL DEFAULT 0', 'ultimo_reenvio TEXT']) {
    try { await env.DB.prepare(`ALTER TABLE alertas ADD COLUMN ${col}`).run(); } catch { /* ya existe */ }
  }
  const hace7d = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 16);
  const a = await env.DB.prepare(`SELECT id, filtros, creada, reenvios, ultimo_reenvio FROM alertas
    WHERE email = ? AND confirmada = 0 AND creada > ? ORDER BY creada DESC LIMIT 1`).bind(email, hace7d).first();
  const ok = json({ ok: true });
  if (!a) return ok;
  if ((a.reenvios || 0) >= MAX_REENVIOS) return json({ error: 'Ya te lo hemos reenviado varias veces. Busca «LicitaEmpresa» en tu correo, también en Promociones y Spam.' }, 429);
  const ultimo = Date.parse(`${a.ultimo_reenvio || a.creada}:00Z`);
  if (Date.now() - ultimo < 60_000) return json({ error: 'Espera un minuto antes de pedirlo otra vez: a veces el email tarda un poco en llegar.' }, 429);

  const sitio = env.SITIO || new URL(request.url).origin;
  const n = Math.max(0, Math.min(100000, Math.round(Number(body.n) || 0)));
  const r = await enviarEmail(env, { para: email, ...emailConfirmacion({ sitio, id: a.id, filtros: normalizarFiltros(JSON.parse(a.filtros)), n }) });
  if (!r.ok) { console.error(r.error); return json({ error: 'No hemos podido reenviarlo. Inténtalo de nuevo en unos minutos.' }, 502); }
  await env.DB.prepare('UPDATE alertas SET reenvios = reenvios + 1, ultimo_reenvio = ? WHERE id = ?')
    .bind(new Date().toISOString().slice(0, 16), a.id).run();
  return ok;
}

export async function onRequest() {
  return json({ error: 'Método no permitido.' }, 405);
}
