// GET /organismo/{slug}: página de un organismo convocante, montada con los datos de D1
// (los sube scripts/subir-empresas.mjs en cada actualización).
import { paginaOrganismo } from '../../lib/pagina-organismo.mjs';

const CACHE_SEGUNDOS = 3 * 3600;

async function noEncontrada(env, request) {
  const r = await env.ASSETS.fetch(new URL('/404', request.url));
  return new Response(r.body, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

export async function onRequestGet({ params, env, request, waitUntil }) {
  const s = String(params.slug || '').toLowerCase();
  if (!/^[a-z0-9-]{3,90}$/.test(s)) return noEncontrada(env, request);
  const url = new URL(request.url);
  if (url.pathname !== `/organismo/${s}`) return Response.redirect(`${url.origin}/organismo/${s}`, 301);

  const cache = caches.default;
  const guardada = await cache.match(request);
  if (guardada) return guardada;
  if (!env.DB) return noEncontrada(env, request);

  const fila = await env.DB.prepare('SELECT slug, nombre, n, total, datos, actualizado FROM organismos WHERE slug = ?').bind(s).first();
  if (!fila) return noEncontrada(env, request);
  let fichas = null;
  try { fichas = await (await env.ASSETS.fetch(new URL('/licitacion/fichas.json', request.url))).json(); } catch {}

  const r = new Response(paginaOrganismo(fila, fichas), {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': `public, max-age=600, s-maxage=${CACHE_SEGUNDOS}` },
  });
  waitUntil(cache.put(request, r.clone()));
  return r;
}
