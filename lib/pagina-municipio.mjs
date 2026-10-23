// Página de un municipio. La monta functions/municipio/[slug].js con los datos de D1.
import { pagina, esc } from './plantilla.mjs';
import { rutaFicha, slug } from './fichas.mjs';
import { CAMPOS_ABIERTA, CAMPOS_ADJUDICADA, comoObjeto } from './municipios.mjs';
import { tienePagina, rutaEmpresa } from './empresas.mjs';
import { rutaOrganismo } from './organismos.mjs';
import { CPV_SECTORES } from './cpv.mjs';
import { PROVINCIAS } from '../scripts/territorio.mjs';

const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' });
const numero = new Intl.NumberFormat('es-ES', { useGrouping: 'always' });
const fechaCorta = (f) => { const [a, m, d] = String(f).slice(0, 10).split('-'); return a && m && d ? `${Number(d)}/${Number(m)}/${a}` : ''; };
const SECTORES = [...CPV_SECTORES].sort((a, b) => b[0].length - a[0].length);
const sectorDe = (c) => SECTORES.find(([p]) => String(c).startsWith(p))?.[1];

function ahoraMadrid() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
    .formatToParts(new Date()).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

// fila: { slug, nombre, n, total, datos (JSON), actualizado }; fichas: contenido de /licitacion/fichas.json
export function paginaMunicipio(fila, fichas) {
  const d = JSON.parse(fila.datos);
  const ahora = ahoraMadrid();
  const abiertas = d.abiertas.map((a) => comoObjeto(CAMPOS_ABIERTA, a)).filter((a) => a.g === 'P' || !a.f || a.f >= ahora);
  const adj = d.adj.map((a) => comoObjeto(CAMPOS_ADJUDICADA, a));
  const ruta = `/municipio/${fila.slug}`;
  const nombre = fila.nombre;
  const prov = PROVINCIAS[d.p] || '';
  const rutaProv = prov ? `/licitaciones/${slug(prov)}/` : '/licitaciones/';
  const conFichaAdj = (a) => fichas && a.fa >= fichas.adjDesde && a.fa <= fichas.adjHasta;
  const enlace = (a, ficha) => (ficha
    ? `<a href="${rutaFicha({ id: a.id, t: a.t })}">${esc(a.t || 'Sin título')}</a>`
    : `<a href="${esc(a.u)}" rel="noopener nofollow" target="_blank">${esc(a.t || 'Sin título')}</a>`);
  const organo = (o) => (o ? `<a href="${rutaOrganismo(o)}">${esc(o)}</a>` : '');
  const presupuesto = abiertas.reduce((s, a) => s + (a.i || 0), 0);

  const filaAbierta = (a) => {
    let plazo;
    if (a.g === 'P') plazo = '<b class="sinfecha">Previo</b><span>Anuncio previo</span>';
    else if (a.f) {
      const dias = Math.floor((Date.parse(a.f.slice(0, 16) + ':00Z') - Date.parse(ahora + ':00Z')) / 864e5);
      plazo = `<b class="${dias <= 3 ? 'urgente' : ''}">${dias < 1 ? 'Cierra hoy' : `${dias} ${dias === 1 ? 'día' : 'días'}`}</b><span>Cierra el ${fechaCorta(a.f)}</span>`;
    } else plazo = '<b class="sinfecha">Sin fecha</b><span>Consulta el anuncio</span>';
    return `<li class="lic"><div class="plazo">${plazo}</div><div class="cuerpo"><h3>${enlace(a, true)}</h3>
<p class="organo">${organo(a.o)}</p>
<p class="datos">${sectorDe(a.c) ? `<span>${esc(sectorDe(a.c))}</span>` : ''}${a.c ? `<span>CPV ${esc(a.c)}</span>` : ''}</p></div>
<div class="importe">${a.i ? `<b>${euros.format(a.i)}</b><span>sin IVA</span>` : '<span>Importe no indicado</span>'}</div></li>`;
  };
  const filaAdj = (a) => `<li class="adj"><h3>${enlace(a, conFichaAdj(a))}</h3>
<p class="organo">${organo(a.o)}${a.o ? ' · ' : ''}${fechaCorta(a.fa)}${a.of ? ` · ${a.of} ${a.of === 1 ? 'oferta' : 'ofertas'}` : ''}</p>
<p class="ganador">Adjudicada a <b>${tienePagina(a.emp) ? `<a href="${rutaEmpresa(a.emp)}">${esc(a.emp)}</a>` : esc(a.emp)}</b>${a.imp ? ` por ${euros.format(a.imp)}` : ''}${a.nad > 1 ? ` y ${a.nad - 1} ${a.nad === 2 ? 'lote más' : 'lotes más'}` : ''}</p></li>`;

  const alerta = `/#q=${encodeURIComponent(nombre.split('/')[0]).replace(/%20/g, '+')}${d.p ? `&prov=${d.p}` : ''}`;
  const cuerpo = `
  <h1>Licitaciones en ${esc(nombre)}</h1>
  <p class="intro">Concursos públicos abiertos y últimas adjudicaciones en ${esc(nombre)}${prov && prov !== nombre ? ` (${esc(prov)})` : ''}: los del ayuntamiento y los de otros organismos que contratan allí o tienen allí su sede. Con su plazo, presupuesto y empresa ganadora. Se actualiza varias veces al día.</p>
  <section class="resumen">
    <div><b>${numero.format(abiertas.length)}</b><span>${abiertas.length === 1 ? 'licitación abierta' : 'licitaciones abiertas'}</span></div>
    <div><b>${presupuesto ? euros.format(presupuesto) : '—'}</b><span>en juego, sin IVA</span></div>
    <div class="acciones"><a class="boton principal" href="${alerta}&alerta=1">Avisarme de las nuevas</a><a class="boton" href="${rutaProv}">Toda la provincia</a></div>
  </section>
  <h2>Licitaciones abiertas en ${esc(nombre)}</h2>
  ${abiertas.length ? `<ol class="lista">${abiertas.map(filaAbierta).join('')}</ol>`
    : `<p class="vacio">Ahora mismo no hay licitaciones abiertas en ${esc(nombre)}. <a href="${alerta}&alerta=1">Crea una alerta</a> y te avisaremos por email en cuanto salga una, o mira las de <a href="${rutaProv}">${esc(prov || 'toda España')}</a>.</p>`}
  ${adj.length ? `<h2>Últimas adjudicaciones en ${esc(nombre)}</h2><p class="intro-adj">Qué empresas han ganado los últimos contratos y por cuánto${fila.total ? `: ${euros.format(fila.total)} en total, sin IVA` : ''}.</p><ol class="lista-adj">${adj.slice(0, 30).map(filaAdj).join('')}</ol>` : ''}
  ${d.organismos?.length ? `<h2>Organismos que licitan en ${esc(nombre)}</h2><ul class="enlaces">${d.organismos.map(([n, s, k]) =>
    `<li><a href="/organismo/${esc(s)}">${esc(n)}</a> <span>${numero.format(k)} ${k === 1 ? 'licitación' : 'licitaciones'}</span></li>`).join('')}</ul>` : ''}
  ${d.empresas?.length ? `<h2>Empresas que más contratos ganan en ${esc(nombre)}</h2><ul class="enlaces">${d.empresas.map(([n, s, k]) =>
    `<li><a href="/empresa/${esc(s)}">${esc(n)}</a> <span>${numero.format(k)} ${k === 1 ? 'contrato' : 'contratos'}</span></li>`).join('')}</ul>` : ''}
  <p class="volver">${prov ? `<a href="${rutaProv}">Licitaciones en ${esc(prov)}</a> · ` : ''}<a href="/municipios/">Municipios con más licitaciones</a> · <a href="/guias/como-presentarse-a-una-licitacion-publica/">Cómo presentarse a una licitación</a></p>`;

  const desc = `${numero.format(abiertas.length)} ${abiertas.length === 1 ? 'licitación pública abierta' : 'licitaciones públicas abiertas'} en ${nombre}${prov && prov !== nombre ? ` (${prov})` : ''}${presupuesto ? ` por ${euros.format(presupuesto)}` : ''}: ayuntamiento y otros organismos, adjudicaciones y empresas ganadoras. Gratis y actualizado a diario.`;
  return pagina({
    ruta, titulo: `Licitaciones en ${nombre}${prov && prov !== nombre ? ` (${prov})` : ''}`, descripcion: desc.slice(0, 300),
    migas: [['Inicio', '/'], ...(prov ? [[prov, rutaProv]] : []), [nombre.length > 50 ? nombre.slice(0, 48) + '…' : nombre, ruta]],
    cuerpo,
    ldExtra: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `Licitaciones en ${nombre}`, about: { '@type': 'City', name: nombre, ...(prov ? { containedInPlace: { '@type': 'AdministrativeArea', name: prov } } : {}) } },
    pieDatos: `Datos publicados en la Plataforma de Contratación del Sector Público. Actualizado el ${fechaCorta(fila.actualizado)}. Comprueba siempre plazos y pliegos en el anuncio oficial.`,
  });
}
