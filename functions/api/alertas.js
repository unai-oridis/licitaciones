// POST /api/alertas: crea una alerta pendiente de confirmar y envía el email de confirmación.
import {
  normalizarFiltros, tieneAlgunFiltro, emailValido, token, emailConfirmacion, enviarEmail,
  MAX_ALERTAS_POR_EMAIL, TEXTO_CONSENTIMIENTO,
} from '../../lib/alertas.mjs';

const json = (datos, status = 200) =>
  new Response(JSON.stringify(datos), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const ahora = () => new Date().toISOString().slice(0, 16);

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Petición no válida.' }, 400); }

  if (body.web) return json({ ok: true }); // campo trampa para robots: se ignora sin avisar

  const email = String(body.email || '').trim().toLowerCase();
  if (!emailValido(email)) return json({ error: 'Revisa el email: no parece válido.' }, 400);
  if (body.acepto !== true) return json({ error: 'Para crear la alerta tienes que aceptar la política de privacidad.' }, 400);

  const filtros = normalizarFiltros(body.filtros);
  if (!tieneAlgunFiltro(filtros)) return json({ error: 'Añade al menos un código CPV, una provincia, un texto de búsqueda o el nombre de una empresa.' }, 400);
  if (!env.DB) return json({ error: 'Las alertas no están disponibles ahora mismo. Inténtalo más tarde.' }, 503);

  const hace24h = new Date(Date.now() - 864e5).toISOString().slice(0, 16);
  const uso = await env.DB.prepare(
    'SELECT COUNT(*) AS n, SUM(CASE WHEN confirmada = 0 AND creada > ? THEN 1 ELSE 0 END) AS pendientes FROM alertas WHERE email = ?',
  ).bind(hace24h, email).first();
  if ((uso?.n || 0) >= MAX_ALERTAS_POR_EMAIL) {
    return json({ error: `Ya tienes ${MAX_ALERTAS_POR_EMAIL} alertas con este email, que es el máximo. Da de baja alguna para crear otra.` }, 409);
  }
  if ((uso?.pendientes || 0) >= 3) {
    return json({ error: 'Hay varias alertas pendientes de confirmar con este email. Revisa tu bandeja de entrada y la carpeta de spam.' }, 429);
  }

  const id = token();
  await env.DB.prepare('INSERT INTO alertas (id, email, filtros, confirmada, creada, consentimiento) VALUES (?, ?, ?, 0, ?, ?)')
    .bind(id, email, JSON.stringify(filtros), ahora(), TEXTO_CONSENTIMIENTO).run();

  const sitio = env.SITIO || new URL(request.url).origin;
  const correo = emailConfirmacion({ sitio, id, filtros });
  const r = await enviarEmail(env, { para: email, ...correo });
  if (!r.ok) {
    await env.DB.prepare('DELETE FROM alertas WHERE id = ?').bind(id).run();
    console.error(r.error);
    return json({ error: 'No hemos podido enviar el email de confirmación. Inténtalo de nuevo más tarde.' }, 502);
  }
  // En modo prueba se devuelve el enlace de confirmación para poder probar sin email.
  return json({ ok: true, ...(env.MODO_PRUEBA === '1' ? { enlacePrueba: `${sitio}/api/confirmar?t=${id}` } : {}) });
}

// GET /api/alertas: dice a la web si las alertas están configuradas (para mostrar o no el botón).
export async function onRequestGet({ env }) {
  const activas = Boolean(env.DB && (env.BREVO_API_KEY || env.MODO_PRUEBA === '1'));
  return json({ activas });
}

export async function onRequest() {
  return json({ error: 'Método no permitido.' }, 405);
}
