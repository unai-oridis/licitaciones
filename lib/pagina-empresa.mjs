// Página de una empresa adjudicataria. La monta functions/empresa/[slug].js con los datos de D1.
import { pagina, esc } from './plantilla.mjs';
import { rutaFicha, slug } from './fichas.mjs';
import { adjComoObjeto } from './empresas.mjs';
import { CPV_SECTORES } from './cpv.mjs';
import { PROVINCIAS } from '../scripts/territorio.mjs';

const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' });
const numero = new Intl.NumberFormat('es-ES', { useGrouping: 'always' });
const fechaCorta = (f) => { const [a, m, d] = String(f).slice(0, 10).split('-'); return a && m && d ? `${Number(d)}/${Number(m)}/${a}` : ''; };
const SECTORES = [...CPV_SECTORES].sort((a, b) => b[0].length - a[0].length);
const sectorDe = (c) => SECTORES.find(([p]) => String(c).startsWith(p));

function top(lista, n) {
  const cuenta = new Map();
  for (const k of lista) if (k) cuenta.set(k, (cuenta.get(k) || 0) + 1);
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

// fila: { slug, nombre, n, total, adj (texto JSON), actualizado }; fichas: contenido de /licitacion/fichas.json
export function paginaEmpresa(fila, fichas) {
  const adj = JSON.parse(fila.adj).map(adjComoObjeto);
  const ruta = `/empresa/${fila.slug}`;
  const nombre = fila.nombre;
  const conFicha = (a) => fichas && (((a.g === 'J' || a.g === 'F') && a.fa >= fichas.adjDesde && a.fa <= fichas.adjHasta));
  const enlace = (a) => (conFicha(a)
    ? `<a href="${rutaFicha({ id: a.id, t: a.t })}">${esc(a.t || 'Sin título')}</a>`
    : `<a href="${esc(a.u)}" rel="noopener nofollow" target="_blank">${esc(a.t || 'Sin título')}</a>`);

  const clientes = top(adj.map((a) => a.o), 8);
  const provincias = top(adj.map((a) => a.p), 8);
  const sectores = top(adj.map((a) => sectorDe(a.c)?.[1]), 8);
  const sectorSlug = new Map(CPV_SECTORES.map(([, n]) => [n, slug(n)]));

  const lista = adj.map((a) => `<li class="adj">
  <h3>${enlace(a)}</h3>
  <p class="organo">${esc(a.o)}${PROVINCIAS[a.p] ? ` · ${esc(PROVINCIAS[a.p])}` : ''}${a.fa ? ` · ${fechaCorta(a.fa)}` : ''}</p>
  <p class="ganador">${a.i ? `<b>${euros.format(a.i)}</b> sin IVA` : 'Importe no indicado'}${a.of ? ` · ${a.of} ${a.of === 1 ? 'oferta recibida' : 'ofertas recibidas'}` : ''}${a.lo > 1 ? ` · ${a.lo} lotes` : ''}</p>
</li>`).join('');

  const bloque = (titulo, filas, enlazar) => (filas.length ? `<div class="grupo"><h3>${titulo}</h3><ul>${filas.map(([k, n]) =>
    `<li>${enlazar ? enlazar(k) : esc(k)} <span>${numero.format(n)}</span></li>`).join('')}</ul></div>` : '');
  const avisar = `/#alerta=empresa&emp=${encodeURIComponent(nombre).replace(/%20/g, '+')}`;
  const buscador = `/#q=${encodeURIComponent(nombre).replace(/%20/g, '+')}&est=J,F&per=6`;

  const cuerpo = `
  <h1>${esc(nombre)}: licitaciones adjudicadas</h1>
  <p class="intro">Contratos públicos adjudicados a ${esc(nombre)}, con el organismo, el importe y el número de ofertas, según lo publicado por los órganos de contratación. Incluye las adjudicaciones cuyos anuncios se han publicado o actualizado en los últimos 6 meses.</p>
  <section class="resumen">
    <div><b>${numero.format(fila.n)}</b><span>${fila.n === 1 ? 'adjudicación' : 'adjudicaciones'}</span></div>
    <div><b>${fila.total ? euros.format(fila.total) : '—'}</b><span>adjudicado, sin IVA</span></div>
    <div class="acciones"><a class="boton principal" href="${avisar}">Avisarme cuando gane otra</a><a class="boton" href="${buscador}">Ver en el buscador</a></div>
  </section>
  <div class="grupos">
    ${bloque('Principales clientes', clientes)}
    ${bloque('Dónde trabaja', provincias.filter(([p]) => PROVINCIAS[p] && p !== '00' && p !== '99').map(([p, n]) => [p, n]),
      (p) => `<a href="/licitaciones/${slug(PROVINCIAS[p])}/">${esc(PROVINCIAS[p])}</a>`)}
    ${bloque('Sectores', sectores, (s) => `<a href="/licitaciones/sector/${sectorSlug.get(s)}/">${esc(s)}</a>`)}
  </div>
  <h2>Últimas adjudicaciones</h2>
  ${fila.n > adj.length ? `<p class="intro-adj">Se muestran las ${numero.format(adj.length)} más recientes de ${numero.format(fila.n)}.</p>` : ''}
  <ol class="lista-adj">${lista}</ol>
  <p class="volver"><a href="/empresas/">Empresas que más contratos públicos ganan</a> · <a href="/licitaciones/">Licitaciones por provincia y sector</a></p>`;

  const desc = `${nombre} ha ganado ${numero.format(fila.n)} ${fila.n === 1 ? 'licitación pública' : 'licitaciones públicas'}${fila.total ? ` por ${euros.format(fila.total)}` : ''}${clientes[0] ? `. Principales clientes: ${clientes.slice(0, 3).map(([o]) => o).join(', ')}` : ''}.`;
  return pagina({
    ruta,
    titulo: `${nombre}: licitaciones adjudicadas`,
    descripcion: desc.slice(0, 300),
    migas: [['Inicio', '/'], ['Empresas', '/empresas/'], [nombre.length > 50 ? nombre.slice(0, 48) + '…' : nombre, ruta]],
    cuerpo,
    ldExtra: { '@context': 'https://schema.org', '@type': 'Organization', name: nombre },
    pieDatos: `Información pública publicada por los órganos de contratación en la Plataforma de Contratación del Sector Público, conforme a la Ley 9/2017 de Contratos del Sector Público. Actualizado el ${fechaCorta(fila.actualizado)}. ¿Eres ${esc(nombre)} y ves un error? Escríbenos a <a href="mailto:contacto@licitaempresa.es">contacto@licitaempresa.es</a>.`,
  });
}
