// Panel de administración de alertas (solo para el titular de la web).
// Protegido con la contraseña guardada en Cloudflare como secreto ADMIN_CLAVE.
//   GET    /api/admin            -> resumen y lista de alertas
//   DELETE /api/admin?id=CODIGO  -> borra una alerta

const json = (datos, status = 200) =>
  new Response(JSON.stringify(datos), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
  });
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// Comparación que tarda lo mismo acierte o no (evita adivinar la contraseña por tiempos).
async function iguales(a, b) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(String(a))),
    crypto.subtle.digest('SHA-256', enc.encode(String(b))),
  ]);
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let dif = 0;
  for (let i = 0; i < x.length; i++) dif |= x[i] ^ y[i];
  return dif === 0;
}

async function autorizado(request, env) {
  if (!env.ADMIN_CLAVE || String(env.ADMIN_CLAVE).length < 10) return 'sin-configurar';
  const clave = request.headers.get('x-admin-clave') || '';
  if (clave && (await iguales(clave, env.ADMIN_CLAVE))) return 'ok';
  await espera(1500); // frena a quien pruebe contraseñas
  return 'no';
}

async function comprobar(request, env) {
  if (!env.DB) return json({ error: 'La base de datos de alertas no está conectada.' }, 503);
  const a = await autorizado(request, env);
  if (a === 'sin-configurar') return json({ error: 'El panel no está configurado: falta el secreto ADMIN_CLAVE (mínimo 10 caracteres) en Cloudflare.' }, 503);
  if (a === 'no') return json({ error: 'Contraseña incorrecta.' }, 401);
  return null;
}

export async function onRequestGet({ request, env }) {
  const error = await comprobar(request, env);
  if (error) return error;

  const [lista, control] = await Promise.all([
    env.DB.prepare('SELECT id, email, filtros, confirmada, creada, confirmada_en, ultimo_envio FROM alertas ORDER BY creada DESC LIMIT 2000').all(),
    env.DB.prepare('SELECT clave, valor FROM control').all(),
  ]);
  const alertas = (lista.results || []).map((a) => ({ ...a, filtros: JSON.parse(a.filtros || '{}') }));
  const ctrl = Object.fromEntries((control.results || []).map((c) => [c.clave, c.valor]));
  let ultimoResumen = null;
  try { ultimoResumen = ctrl.ultimo_resumen ? JSON.parse(ctrl.ultimo_resumen) : null; } catch {}

  const confirmadas = alertas.filter((a) => a.confirmada);
  return json({
    resumen: {
      total: alertas.length,
      confirmadas: confirmadas.length,
      pendientes: alertas.length - confirmadas.length,
      personas: new Set(confirmadas.map((a) => a.email)).size,
    },
    envio: { ultimoDia: ctrl.ultimo_envio_diario || null, ultimoResumen },
    alertas,
  });
}

export async function onRequestDelete({ request, env }) {
  const error = await comprobar(request, env);
  if (error) return error;
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^[0-9a-f]{32}$/.test(id)) return json({ error: 'Código de alerta no válido.' }, 400);
  await env.DB.prepare('DELETE FROM alertas WHERE id = ?').bind(id).run();
  return json({ ok: true });
}

export async function onRequest() {
  return json({ error: 'Método no permitido.' }, 405);
}
