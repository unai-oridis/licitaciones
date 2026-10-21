// GET /empresa/{slug}: página de una empresa adjudicataria, montada con los datos de D1
// (los sube scripts/subir-empresas.mjs en cada actualización).
import { paginaEmpresa } from '../../lib/pagina-empresa.mjs';

const CACHE_SEGUNDOS = 3 * 3600;

async function noEncontrada(env, request) {
  const r = await env.ASSETS.fetch(new URL('/404', request.url));
  return new Response(r.body, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

export async function onRequestGet({ params, env, request, waitUntil }) {
  const s = String(params.slug || '').toLowerCase();
  if (!/^[a-z0-9-]{3,80}$/.test(s)) return noEncontrada(env, request);
  // Las direcciones con mayúsculas o barra final se redirigen a la forma única
  const url = new URL(request.url);
  if (url.pathname !== `/empresa/${s}`) return Response.redirect(`${url.origin}/empresa/${s}`, 301);

  const cache = caches.default;
  const guardada = await cache.match(request);
  if (guardada) return guardada;
  if (!env.DB) return noEncontrada(env, request);

  const fila = await env.DB.prepare('SELECT slug, nombre, n, total, adj, actualizado FROM empresas WHERE slug = ?').bind(s).first();
  if (!fila) return noEncontrada(env, request);
  let fichas = null;
  try { fichas = await (await env.ASSETS.fetch(new URL('/licitacion/fichas.json', request.url))).json(); } catch {}

  const r = new Response(paginaEmpresa(fila, fichas), {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': `public, max-age=600, s-maxage=${CACHE_SEGUNDOS}` },
  });
  waitUntil(cache.put(request, r.clone()));
  return r;
}
