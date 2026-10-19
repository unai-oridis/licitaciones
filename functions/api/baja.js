// Baja de alertas.
// GET  /api/baja?t=CODIGO[&todas=1]  -> muestra la página para confirmar la baja (evita bajas por
//                                     programas que abren los enlaces de los emails automáticamente).
// POST /api/baja                    -> da de baja (formulario de la web o «baja en un clic» del gestor de correo).

export async function onRequestGet({ request }) {
  const u = new URL(request.url);
  const t = u.searchParams.get('t') || '';
  const todas = u.searchParams.get('todas') === '1' ? '&todas=1' : '';
  return Response.redirect(new URL(`/alerta.html?baja=${encodeURIComponent(t)}${todas}`, request.url).toString(), 303);
}

export async function onRequestPost({ request, env }) {
  const u = new URL(request.url);
  let datos = {};
  const tipo = request.headers.get('content-type') || '';
  if (tipo.includes('form')) datos = Object.fromEntries(await request.formData());
  const t = String(datos.t || u.searchParams.get('t') || '');
  const todas = String(datos.todas || u.searchParams.get('todas') || '') === '1';
  const unClic = String(datos['List-Unsubscribe'] || '') === 'One-Click';
  const responder = (estado) => (unClic
    ? new Response('ok', { status: 200 })
    : Response.redirect(new URL(`/alerta.html?estado=${estado}`, request.url).toString(), 303));

  if (!/^[0-9a-f]{32}$/.test(t) || !env.DB) return responder('no-encontrada');
  const alerta = await env.DB.prepare('SELECT email FROM alertas WHERE id = ?').bind(t).first();
  if (!alerta) return responder('baja');

  if (todas) await env.DB.prepare('DELETE FROM alertas WHERE email = ?').bind(alerta.email).run();
  else await env.DB.prepare('DELETE FROM alertas WHERE id = ?').bind(t).run();
  return responder(todas ? 'baja-todas' : 'baja');
}
