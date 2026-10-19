// GET /api/confirmar?t=CODIGO: confirma la alerta (doble verificación del email).
const ahora = () => new Date().toISOString().slice(0, 16);

export async function onRequestGet({ request, env }) {
  const t = new URL(request.url).searchParams.get('t') || '';
  const ir = (estado) => Response.redirect(new URL(`/alerta.html?estado=${estado}`, request.url).toString(), 303);
  if (!/^[0-9a-f]{32}$/.test(t) || !env.DB) return ir('no-encontrada');

  const alerta = await env.DB.prepare('SELECT confirmada FROM alertas WHERE id = ?').bind(t).first();
  if (!alerta) return ir('no-encontrada');
  if (!alerta.confirmada) {
    const momento = ahora();
    // A partir de ahora: solo se avisará de licitaciones publicadas después de confirmar.
    await env.DB.prepare('UPDATE alertas SET confirmada = 1, confirmada_en = ?, ultimo_envio = ? WHERE id = ?')
      .bind(momento, momento, t).run();
  }
  return ir('confirmada');
}
