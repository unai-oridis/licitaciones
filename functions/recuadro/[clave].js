// GET /recuadro/{clave}: recuadro con las últimas licitaciones abiertas, para insertar en otras webs con un <iframe>.
// Claves: espana · provincia-{p} · provincia-{p}-sector-{s} · sector-{s} · oficio-{o} · municipio-{m}
// Parámetros: ?n=6 (entre 3 y 10 licitaciones) · ?tema=oscuro
// Datos: tabla «recuadros» de D1 (y «municipios» para los municipios), que sube scripts/subir-empresas.mjs.
import { rutaFicha } from '../../lib/fichas.mjs';
import { comoObjeto } from '../../lib/recuadros.mjs';
import { CAMPOS_ABIERTA, comoObjeto as comoAbierta } from '../../lib/municipios.mjs';

const CACHE_SEGUNDOS = 3600;
const SITIO = 'https://licitaempresa.es';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' });
const fecha = (f) => new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(new Date(`${String(f).slice(0, 10)}T12:00:00Z`)).replace('.', '');

function ahoraMadrid() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
    .formatToParts(new Date()).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

function html({ titulo, url, n, items, oscuro }) {
  const ahora = ahoraMadrid();
  const lista = items.map((x) => {
    let plazo = '';
    if (x.f) {
      const dias = Math.floor((Date.parse(x.f.slice(0, 16) + ':00Z') - Date.parse(ahora + ':00Z')) / 864e5);
      plazo = dias < 1 ? '<b class="u">Cierra hoy</b>' : `<span class="${dias <= 3 ? 'u' : ''}">Cierra el ${fecha(x.f)}</span>`;
    }
    return `<li><a href="${SITIO}${rutaFicha(x)}" target="_blank" rel="noopener">${esc(x.t || 'Licitación')}</a>
<p>${x.o ? `<span>${esc(x.o)}</span>` : ''}${plazo}${x.i ? `<b>${euros.format(x.i)}</b>` : ''}</p></li>`;
  }).join('');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)} · LicitaEmpresa</title><meta name="robots" content="noindex">
<style>
:root{--fondo:#fff;--ink:#17324D;--muted:#5B7085;--linea:#E3ECF2;--acento:#0A7A8F;--cielo:#EEF6FA;--rojo:#B42318}
${oscuro ? ':root{--fondo:#13222F;--ink:#EAF2F7;--muted:#A9BBCB;--linea:#253A4C;--acento:#5CC6D8;--cielo:#1B3042;--rojo:#FF8A7A}' : ''}
*{box-sizing:border-box}html,body{margin:0;height:100%}
body{font:15px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink);background:var(--fondo);display:flex;flex-direction:column;border:1px solid var(--linea);border-radius:14px;overflow:hidden}
header{display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--cielo)}
header i{flex:none;width:26px;height:26px;border-radius:8px;background:var(--acento);color:#fff;font:800 15px/26px system-ui,sans-serif;text-align:center;font-style:normal}
header h1{margin:0;font-size:15px;line-height:1.25;font-weight:800}
ol{list-style:none;margin:0;padding:0 14px;overflow:auto;flex:1}
li{padding:10px 0;border-top:1px solid var(--linea)}li:first-child{border-top:0}
li a{color:var(--ink);font-weight:700;text-decoration:none;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
li a:hover{color:var(--acento);text-decoration:underline}
li p{margin:4px 0 0;font-size:13px;color:var(--muted);display:flex;flex-wrap:wrap;gap:2px 10px}
li p span:first-child{flex-basis:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
li p b{color:var(--ink)}.u{color:var(--rojo)}
.vacio{padding:16px 14px;margin:0;color:var(--muted);flex:1}
footer{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:10px 14px;border-top:1px solid var(--linea);font-size:13px}
footer a{color:var(--acento);font-weight:700;text-decoration:none}footer a:hover{text-decoration:underline}
</style></head><body>
<header><i aria-hidden="true">L</i><h1>${esc(titulo)}</h1></header>
${items.length ? `<ol>${lista}</ol>` : '<p class="vacio">Ahora mismo no hay licitaciones abiertas aquí. Se publican nuevas cada día.</p>'}
<footer><a href="${SITIO}${url}" target="_blank" rel="noopener">${n > items.length ? `Ver las ${n.toLocaleString('es-ES')} en LicitaEmpresa →` : 'Ver más en LicitaEmpresa →'}</a><a href="${SITIO}/#alerta=1" target="_blank" rel="noopener">Alertas gratis</a></footer>
</body></html>`;
}

export async function onRequestGet({ params, env, request, waitUntil }) {
  const clave = String(params.clave || '').toLowerCase();
  const url = new URL(request.url);
  if (!/^(espana|(provincia|sector|oficio|municipio)-[a-z0-9-]{2,120})$/.test(clave)) {
    return new Response('Recuadro no encontrado', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
  const cache = caches.default;
  const guardada = await cache.match(request);
  if (guardada) return guardada;

  const cuantos = Math.min(10, Math.max(3, Number(url.searchParams.get('n')) || 6));
  const oscuro = url.searchParams.get('tema') === 'oscuro';
  const ahora = ahoraMadrid();
  let datos = { titulo: 'Licitaciones abiertas', url: '/', n: 0, items: [] };
  if (env.DB) {
    if (clave.startsWith('municipio-')) {
      const s = clave.slice(10);
      const fila = await env.DB.prepare('SELECT nombre, datos FROM municipios WHERE slug = ?').bind(s).first().catch(() => null);
      if (fila) {
        const d = JSON.parse(fila.datos);
        const ab = d.abiertas.map((a) => comoAbierta(CAMPOS_ABIERTA, a)).filter((a) => a.g === 'A' && (!a.f || a.f >= ahora));
        datos = { titulo: `Licitaciones abiertas en ${fila.nombre}`, url: `/municipio/${s}`, n: ab.length, items: ab };
      }
    } else {
      const fila = await env.DB.prepare('SELECT nombre, n, datos FROM recuadros WHERE slug = ?').bind(clave).first().catch(() => null);
      if (fila) {
        const d = JSON.parse(fila.datos);
        const items = d.items.map(comoObjeto).filter((a) => !a.f || a.f >= ahora);
        datos = { titulo: fila.nombre, url: d.url, n: Math.max(fila.n - (d.items.length - items.length), items.length), items };
      }
    }
  }
  datos.items = datos.items.slice(0, cuantos);

  const r = new Response(html({ ...datos, oscuro }), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': `public, max-age=900, s-maxage=${CACHE_SEGUNDOS}`,
      'content-security-policy': "frame-ancestors *",
      'x-robots-tag': 'noindex',
    },
  });
  waitUntil(cache.put(request, r.clone()));
  return r;
}
