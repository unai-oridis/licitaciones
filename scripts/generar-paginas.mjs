// Genera páginas estáticas para buscadores (Google) a partir de los datos:
//   /licitaciones/                         índice de provincias, comunidades y sectores
//   /licitaciones/{provincia}/             por provincia
//   /licitaciones/{comunidad}/             por comunidad (solo las de varias provincias)
//   /licitaciones/sector/{sector}/         por sector CPV
//   /licitaciones/{provincia}/{sector}/    sector + provincia (si hay al menos MIN_COMBO abiertas)
//   /licitacion/{titulo}-{numero}/         ficha de cada licitación abierta y de las adjudicaciones más recientes
//   /licitacion/fichas.json                qué licitaciones tienen ficha (lo usa el buscador)
//   /empresas/                             empresas que más adjudicaciones ganan
//   /guias/ y /guias/{guia}/               guías para empresas (lib/guias.mjs)
//   /organismos/                           organismos que más licitan
//   /licitaciones/oficio/{oficio}/         por oficio (electricista, fontanería…; lib/oficios.mjs)
//   /preguntas/ y /preguntas/{pregunta}/  preguntas frecuentes (lib/preguntas.mjs)
//   /hoy/ y /hoy/{AAAA-MM-DD}/             licitaciones aparecidas en las últimas 24 horas y archivo de los últimos días
// Las páginas de cada organismo (/organismo/{slug}) tampoco son archivos: functions/organismo/[slug].js.
//   /js/                                   copia de lib/fichas.mjs y lib/empresas.mjs para el buscador
//   /sitemap.xml                           índice de sitemaps (páginas y empresas)
// Las páginas de cada empresa (/empresa/{slug}) no son archivos: las monta functions/empresa/[slug].js.
// Lo ejecuta Cloudflare Pages al publicar (comando de compilación), así las páginas no se guardan en GitHub.

import fs from 'node:fs/promises';
import path from 'node:path';
import { CPV_SECTORES } from '../lib/cpv.mjs';
import { slug, rutaFicha } from '../lib/fichas.mjs';
import { pagina, esc, SITIO } from '../lib/plantilla.mjs';
import { agruparEmpresas, tienePagina, rutaEmpresa } from '../lib/empresas.mjs';
import { GUIAS } from '../lib/guias.mjs';
import { agruparOrganismos, slugOrganismo, rutaOrganismo } from '../lib/organismos.mjs';
import { OFICIOS, enOficio } from '../lib/oficios.mjs';
import { PREGUNTAS } from '../lib/preguntas.mjs';

const RAIZ = process.env.DIR_PUBLICO || 'public';
const DIR_DATOS = path.join(RAIZ, 'data');
const MIN_COMBO = 3;          // mínimo de licitaciones abiertas para crear una página sector + provincia
const MAX_LISTA = 100;        // licitaciones abiertas que se muestran por página
const MAX_ADJ = 15;           // adjudicaciones recientes que se muestran por página
// Cloudflare Pages (plan gratuito) admite como máximo 20.000 archivos por publicación.
// Dejamos margen: las fichas de licitaciones ocupan lo que sobre hasta este límite.
const LIMITE_ARCHIVOS = 19000;
const MAX_RELACIONADAS = 6;   // otras licitaciones que se enlazan desde cada ficha
const DIAS_ARCHIVO = 30;      // días con página propia en /hoy/{fecha}/
const MAX_HOY = 600;          // licitaciones como máximo en cada página diaria
const AHORA = new Date();

const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' });
const numero = new Intl.NumberFormat('es-ES', { useGrouping: 'always' });
const fechaLarga = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' });
const fechaHora = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
const minus = (s) => s.charAt(0).toLowerCase() + s.slice(1);

function horaMadrid(d) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
const AHORA_MADRID = horaMadrid(AHORA);
const fechaCorta = (f) => { const [a, m, d] = f.slice(0, 10).split('-'); return `${Number(d)}/${Number(m)}/${a}`; };
function diasHasta(f) {
  const t = Date.parse(f + ':00Z') - Date.parse(AHORA_MADRID + ':00Z');
  return Math.floor(t / 864e5);
}

// ---------- carga de datos ----------

async function leer(ruta) { return JSON.parse(await fs.readFile(ruta, 'utf8')); }

async function cargar() {
  const meta = await leer(path.join(DIR_DATOS, 'indice.json'));
  const todas = [];
  for (const h of [meta.archivos.abiertas, ...(meta.archivos.historico || [])]) {
    if (!h?.f) continue;
    for (const x of (await leer(path.join(DIR_DATOS, h.f))).items) {
      x.c = x.c || [];
      todas.push(x);
    }
  }
  const abiertas = todas.filter((x) => x.g === 'A' && (!x.f || x.f >= AHORA_MADRID));
  const hoy = AHORA_MADRID.slice(0, 10);
  const adjudicadas = todas.filter((x) => (x.g === 'J' || x.g === 'F') && x.ad?.length)
    .map((x) => { x.fa = x.fa || x.a; return x; })
    .filter((x) => x.fa && x.fa <= hoy);
  adjudicadas.sort((a, b) => (a.fa < b.fa ? 1 : -1));
  abiertas.sort((a, b) => (a.f || '9999') < (b.f || '9999') ? -1 : 1);
  // Candidatas a ficha propia: todas las abiertas o en anuncio previo (aunque el plazo haya vencido hace poco)
  const vivas = todas.filter((x) => x.g === 'A' || x.g === 'P');
  return { meta, abiertas, adjudicadas, vivas, todas };
}

// ---------- fichas de licitación ----------

async function contarArchivos(dir) {
  let n = 0;
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    n += e.isDirectory() ? await contarArchivos(path.join(dir, e.name)) : 1;
  }
  return n;
}

// ---------- plantilla HTML ----------

let tieneFicha = () => false;
let nombreOrgano = (o) => esc(o);
const nombreEmpresa = (n) => (tienePagina(n) ? `<a href="${rutaEmpresa(n)}">${esc(n)}</a>` : esc(n));
const nombreCorto = (n) => (n.length > 40 ? n.slice(0, 38).replace(/\s+\S*$/, '') + '…' : n);
function enlaceTitulo(x) {
  return tieneFicha(x)
    ? `<a href="${rutaFicha(x)}">${esc(x.t || 'Sin título')}</a>`
    : `<a href="${esc(x.u)}" rel="noopener nofollow" target="_blank">${esc(x.t || 'Sin título')}</a>`;
}

function filaAbierta(x, provincias) {
  let plazo;
  if (x.f) {
    const d = diasHasta(x.f);
    plazo = x.f < AHORA_MADRID ? '<b class="sinfecha">Plazo cerrado</b>' : d < 1 ? '<b class="urgente">Cierra hoy</b>' : `<b class="${d <= 3 ? 'urgente' : d <= 7 ? 'pronto' : ''}">${d} ${d === 1 ? 'día' : 'días'}</b>`;
    plazo += `<span>${x.f < AHORA_MADRID ? "Cerró" : "Cierra"} el ${fechaCorta(x.f)}</span>`;
  } else {
    plazo = '<b class="sinfecha">Sin fecha</b><span>Consulta el anuncio</span>';
  }
  return `<li class="lic">
  <div class="plazo">${plazo}</div>
  <div class="cuerpo">
    <h3>${enlaceTitulo(x)}</h3>
    <p class="organo">${nombreOrgano(x.o)}</p>
    <p class="datos"><span>${esc(provincias[x.p] || '')}</span>${x.c?.length ? `<span>CPV ${esc(x.c.slice(0, 3).join(', '))}</span>` : ''}</p>
  </div>
  <div class="importe">${x.i ? `<b>${euros.format(x.i)}</b><span>sin IVA</span>` : '<span>Importe no indicado</span>'}</div>
</li>`;
}

function filaAdjudicada(x, provincias) {
  const [empresa, importe, ofertas] = x.ad[0];
  const mas = (x.nad || x.ad.length) - 1;
  return `<li class="adj">
  <h3>${enlaceTitulo(x)}</h3>
  <p class="organo">${nombreOrgano(x.o)} · ${esc(provincias[x.p] || '')} · ${fechaCorta(x.fa)}</p>
  <p class="ganador">Adjudicada a <b>${nombreEmpresa(empresa)}</b>${importe ? ` por ${euros.format(importe)}` : ''}${ofertas ? `, ${ofertas} ${ofertas === 1 ? 'oferta' : 'ofertas'}` : ''}${mas > 0 ? ` y ${mas} ${mas === 1 ? 'lote más' : 'lotes más'}` : ''}</p>
</li>`;
}

function enlaceBuscador({ cpv, prov }) {
  const h = new URLSearchParams();
  if (cpv) h.set('cpv', cpv);
  if (prov?.length) h.set('prov', prov.join(','));
  return '/#' + h.toString().replace(/%2C/g, ',');
}

function bloqueLista({ abiertas, adjudicadas, provincias, frase, buscador }) {
  const total = abiertas.length;
  const importe = abiertas.reduce((s, x) => s + (x.i || 0), 0);
  const lista = abiertas.slice(0, MAX_LISTA).map((x) => filaAbierta(x, provincias)).join('');
  const adj = adjudicadas.slice(0, MAX_ADJ).map((x) => filaAdjudicada(x, provincias)).join('');
  return `
  <section class="resumen">
    <div><b>${numero.format(total)}</b><span>${total === 1 ? 'licitación abierta' : 'licitaciones abiertas'}</span></div>
    <div><b>${importe ? euros.format(importe) : '—'}</b><span>en presupuesto, sin IVA</span></div>
    <div class="acciones"><a class="boton principal" href="${buscador}&alerta=1">Recibir avisos por email</a><a class="boton" href="${buscador}">Filtrar en el buscador</a></div>
  </section>
  <h2>Licitaciones abiertas ${esc(frase)}</h2>
  ${total ? `<ol class="lista">${lista}</ol>${total > MAX_LISTA ? `<p class="mas"><a href="${buscador}">Ver las ${numero.format(total)} en el buscador</a></p>` : ''}`
    : `<p class="vacio">Ahora mismo no hay licitaciones abiertas ${esc(frase)}. <a href="${buscador}&alerta=1">Crea una alerta</a> y te avisaremos por email en cuanto se publique una.</p>`}
  ${adj ? `<h2>Últimas adjudicaciones ${esc(frase)}</h2><p class="intro-adj">Quién ha ganado los últimos concursos y por cuánto.</p><ol class="lista-adj">${adj}</ol>` : ''}`;
}

function enlacesRelacionados(titulo, enlaces) {
  if (!enlaces.length) return '';
  return `<h2>${esc(titulo)}</h2><ul class="enlaces">${enlaces.map(([texto, href, n]) =>
    `<li><a href="${href}">${esc(texto)}</a>${n != null ? ` <span>${numero.format(n)}</span>` : ''}</li>`).join('')}</ul>`;
}

// ---------- generación ----------

async function escribir(ruta, html, sitemap, prioridad = '0.6', lastmod) {
  const archivo = path.join(RAIZ, ruta, 'index.html');
  await fs.mkdir(path.dirname(archivo), { recursive: true });
  await fs.writeFile(archivo, html);
  sitemap.push([ruta, prioridad, lastmod]);
}

async function main() {
  const t0 = Date.now();
  const { meta, abiertas, adjudicadas, vivas, todas } = await cargar();
  const organismos = agruparOrganismos(todas);
  nombreOrgano = (o) => (organismos.has(slugOrganismo(o)) ? `<a href="${rutaOrganismo(o)}">${esc(o)}</a>` : esc(o));
  const empresas = agruparEmpresas(adjudicadas);
  const provincias = meta.provincias || {};
  const actualizado = fechaHora.format(new Date(meta.actualizado));
  const sitemap = [];

  // Limpiar lo generado en ejecuciones anteriores (en local)
  await fs.rm(path.join(RAIZ, 'licitaciones'), { recursive: true, force: true });
  await fs.rm(path.join(RAIZ, 'licitacion'), { recursive: true, force: true });
  await fs.rm(path.join(RAIZ, 'empresas'), { recursive: true, force: true });
  await fs.rm(path.join(RAIZ, 'guias'), { recursive: true, force: true });
  await fs.rm(path.join(RAIZ, 'organismos'), { recursive: true, force: true });
  await fs.rm(path.join(RAIZ, 'hoy'), { recursive: true, force: true });
  await fs.rm(path.join(RAIZ, 'preguntas'), { recursive: true, force: true });
  await fs.rm(path.join(RAIZ, 'js'), { recursive: true, force: true });

  const codProv = Object.keys(provincias).filter((p) => p !== '00' && p !== '99').sort((a, b) => provincias[a].localeCompare(provincias[b], 'es'));
  const slugProv = Object.fromEntries(codProv.map((p) => [p, slug(provincias[p])]));
  const sectores = CPV_SECTORES.map(([c, n]) => ({ c, n, s: slug(n) }));
  const enSector = (x, c) => (x.c || []).some((k) => k.startsWith(c));

  // Índices rápidos
  const abPorProv = new Map(codProv.map((p) => [p, []]));
  for (const x of abiertas) abPorProv.get(x.p)?.push(x);
  const adjPorProv = new Map(codProv.map((p) => [p, []]));
  for (const x of adjudicadas) adjPorProv.get(x.p)?.push(x);
  const abPorSector = new Map(sectores.map((s) => [s.c, abiertas.filter((x) => enSector(x, s.c))]));
  const adjPorSector = new Map(sectores.map((s) => [s.c, adjudicadas.filter((x) => enSector(x, s.c))]));

  // Qué combinaciones sector + provincia tienen página
  const combos = new Map(); // `${p}|${c}` -> abiertas
  for (const s of sectores) {
    for (const x of abPorSector.get(s.c)) {
      if (!slugProv[x.p]) continue;
      const k = `${x.p}|${s.c}`;
      if (!combos.has(k)) combos.set(k, []);
      combos.get(k).push(x);
    }
  }
  for (const [k, v] of combos) if (v.length < MIN_COMBO) combos.delete(k);
  const rutaProv = (p) => `/licitaciones/${slugProv[p]}/`;
  const rutaSector = (s) => `/licitaciones/sector/${s.s}/`;
  const rutaCombo = (p, s) => `/licitaciones/${slugProv[p]}/${s.s}/`;

  // --- Qué licitaciones tienen ficha propia (sin pasar del límite de archivos)
  const comunidades = (meta.comunidades || []).filter(([, provs]) => provs.length > 1);
  const paginasListado = codProv.length + comunidades.length + combos.size + 2 + 3 // + /empresas/, sitemaps
    + 3 // /organismos/, su sitemap y /js/organismos.mjs
    + OFICIOS.length + 1 + DIAS_ARCHIVO + 1 + PREGUNTAS.length + 1
    + GUIAS.length + 1
    + 2 // archivos en /js/
    + sectores.filter((s) => abPorSector.get(s.c).length || adjPorSector.get(s.c).length).length;
  const libres = LIMITE_ARCHIVOS - (await contarArchivos(RAIZ)) - paginasListado - 5;
  const fichas = vivas.slice(0, Math.max(0, libres));
  let adjDesde = '9999-12-31';
  let hueco = libres - fichas.length;
  // Adjudicaciones: días completos, de la más reciente hacia atrás, mientras quepan
  for (let i = 0; i < adjudicadas.length && hueco > 0;) {
    const dia = adjudicadas[i].fa;
    let j = i;
    while (j < adjudicadas.length && adjudicadas[j].fa === dia) j++;
    if (j - i > hueco) break;
    fichas.push(...adjudicadas.slice(i, j));
    hueco -= j - i;
    adjDesde = dia;
    i = j;
  }
  const conFicha = new Set(fichas);
  tieneFicha = (x) => conFicha.has(x);

  // Empresas que más ganan por provincia y por sector (enlaces a sus páginas)
  const topEmpresas = (filtro, n = 10) => {
    const lista = [];
    for (const [s, e] of empresas) {
      const k = e.adj.filter(filtro).length;
      if (k) lista.push([e.nombre, `/empresa/${s}`, k]);
    }
    return lista.sort((a, b) => b[2] - a[2]).slice(0, n);
  };
  // adj compacto: [id, t, o, p, c, i, of, lo, fa, u, g]
  const empresasPorProv = new Map(codProv.map((p) => [p, topEmpresas((a) => a[3] === p)]));
  const organismosPorProv = new Map(codProv.map((p) => [p, []]));
  for (const [s, o] of organismos) organismosPorProv.get(o.p)?.push([o.nombre, `/organismo/${s}`, o.n]);
  for (const l of organismosPorProv.values()) l.sort((a, b) => b[2] - a[2]).splice(12);
  const empresasPorSector = new Map(sectores.map((s) => [s.c, topEmpresas((a) => String(a[4]).startsWith(s.c))]));

  // --- Provincias
  for (const p of codProv) {
    const nombre = provincias[p];
    const ab = abPorProv.get(p);
    const sectoresAqui = sectores
      .filter((s) => combos.has(`${p}|${s.c}`))
      .map((s) => [s.n, rutaCombo(p, s), combos.get(`${p}|${s.c}`).length])
      .sort((a, b) => b[2] - a[2]);
    const cuerpo = `
  <h1>Licitaciones públicas en ${esc(nombre)}</h1>
  <p class="intro">Concursos y contratos públicos de ayuntamientos, diputaciones, gobierno autonómico y organismos del Estado en ${esc(nombre)}, con su plazo de presentación, presupuesto y enlace al anuncio oficial. Se actualiza varias veces al día.</p>
  ${bloqueLista({ abiertas: ab, adjudicadas: adjPorProv.get(p), provincias, frase: `en ${nombre}`, buscador: enlaceBuscador({ prov: [p] }) })}
  ${enlacesRelacionados(`Licitaciones por sector en ${nombre}`, sectoresAqui)}
  ${enlacesRelacionados(`Organismos que más licitan en ${nombre}`, organismosPorProv.get(p))}
  ${enlacesRelacionados(`Empresas que más adjudicaciones ganan en ${nombre}`, empresasPorProv.get(p))}`;
    await escribir(rutaProv(p), pagina({
      ruta: rutaProv(p),
      titulo: `Licitaciones públicas en ${nombre}`,
      descripcion: `${numero.format(ab.length)} licitaciones públicas abiertas en ${nombre}: concursos de ayuntamientos y administraciones con plazos, presupuestos y adjudicatarios. Actualizado a diario.`,
      migas: [['Inicio', '/'], ['Licitaciones', '/licitaciones/'], [nombre, rutaProv(p)]],
      cuerpo, actualizado,
    }), sitemap, '0.8');
  }

  // --- Comunidades con varias provincias
  for (const [com, provs] of comunidades) {
    const ruta = `/licitaciones/${slug(com)}/`;
    const ab = abiertas.filter((x) => provs.includes(x.p));
    const adj = adjudicadas.filter((x) => provs.includes(x.p));
    const cuerpo = `
  <h1>Licitaciones públicas en ${esc(com)}</h1>
  <p class="intro">Todas las licitaciones abiertas en ${esc(com)}, por provincia y sector, con plazos, presupuestos y últimas adjudicaciones.</p>
  ${enlacesRelacionados(`Provincias de ${com}`, provs.map((p) => [provincias[p], rutaProv(p), abPorProv.get(p)?.length || 0]))}
  ${bloqueLista({ abiertas: ab, adjudicadas: adj, provincias, frase: `en ${com}`, buscador: enlaceBuscador({ prov: provs }) })}`;
    await escribir(ruta, pagina({
      ruta, titulo: `Licitaciones públicas en ${com}`,
      descripcion: `${numero.format(ab.length)} licitaciones públicas abiertas en ${com}. Consulta concursos por provincia y sector, con plazos, importes y adjudicatarios.`,
      migas: [['Inicio', '/'], ['Licitaciones', '/licitaciones/'], [com, ruta]],
      cuerpo, actualizado,
    }), sitemap, '0.7');
  }

  // --- Sectores
  for (const s of sectores) {
    const ab = abPorSector.get(s.c);
    const adj = adjPorSector.get(s.c);
    if (!ab.length && !adj.length) continue;
    const provsAqui = codProv.filter((p) => combos.has(`${p}|${s.c}`))
      .map((p) => [provincias[p], rutaCombo(p, s), combos.get(`${p}|${s.c}`).length]).sort((a, b) => b[2] - a[2]);
    const frase = `de ${minus(s.n)}`;
    const cuerpo = `
  <h1>Licitaciones ${esc(frase)}</h1>
  <p class="intro">Licitaciones públicas abiertas ${esc(frase)} en toda España (códigos CPV que empiezan por ${esc(s.c)}), con plazo, presupuesto, organismo y enlace al anuncio oficial.</p>
  ${bloqueLista({ abiertas: ab, adjudicadas: adj, provincias, frase, buscador: enlaceBuscador({ cpv: s.c }) })}
  ${enlacesRelacionados(`Licitaciones ${frase} por provincia`, provsAqui)}
  ${enlacesRelacionados(`Empresas que más adjudicaciones ganan ${frase}`, empresasPorSector.get(s.c))}`;
    await escribir(rutaSector(s), pagina({
      ruta: rutaSector(s), titulo: `Licitaciones ${frase}`,
      descripcion: `${numero.format(ab.length)} licitaciones públicas abiertas ${frase} en España (CPV ${s.c}). Plazos, presupuestos y empresas adjudicatarias, actualizado a diario.`,
      migas: [['Inicio', '/'], ['Licitaciones', '/licitaciones/'], [s.n, rutaSector(s)]],
      cuerpo, actualizado,
    }), sitemap, '0.7');
  }

  // --- Sector + provincia
  for (const s of sectores) {
    for (const p of codProv) {
      const k = `${p}|${s.c}`;
      if (!combos.has(k)) continue;
      const ab = combos.get(k);
      const adj = adjPorSector.get(s.c).filter((x) => x.p === p);
      const nombre = provincias[p];
      const frase = `de ${minus(s.n)} en ${nombre}`;
      const otros = sectores.filter((o) => o.c !== s.c && combos.has(`${p}|${o.c}`))
        .map((o) => [o.n, rutaCombo(p, o), combos.get(`${p}|${o.c}`).length]).sort((a, b) => b[2] - a[2]).slice(0, 12);
      const cuerpo = `
  <h1>Licitaciones ${esc(frase)}</h1>
  <p class="intro">Concursos públicos ${esc(frase)} abiertos ahora, con plazo de presentación, presupuesto y organismo convocante. También verás quién ha ganado las últimas adjudicaciones.</p>
  ${bloqueLista({ abiertas: ab, adjudicadas: adj, provincias, frase, buscador: enlaceBuscador({ cpv: s.c, prov: [p] }) })}
  ${enlacesRelacionados(`Otros sectores en ${nombre}`, otros)}
  <p class="volver"><a href="${rutaProv(p)}">Todas las licitaciones en ${esc(nombre)}</a> · <a href="${rutaSector(s)}">Licitaciones de ${esc(minus(s.n))} en toda España</a></p>`;
      await escribir(rutaCombo(p, s), pagina({
        ruta: rutaCombo(p, s), titulo: `Licitaciones ${frase}`,
        descripcion: `${numero.format(ab.length)} licitaciones ${frase} abiertas: plazos, presupuestos, organismos y adjudicatarios. Actualizado a diario.`,
        migas: [['Inicio', '/'], ['Licitaciones', '/licitaciones/'], [nombre, rutaProv(p)], [s.n, rutaCombo(p, s)]],
        cuerpo, actualizado,
      }), sitemap, '0.6');
    }
  }

  // --- Fichas de cada licitación
  const tipos = meta.tipos || {};
  const procs = meta.procedimientos || {};
  const abiertasPorProv = new Map();
  for (const x of abiertas) if (conFicha.has(x)) {
    if (!abiertasPorProv.has(x.p)) abiertasPorProv.set(x.p, []);
    abiertasPorProv.get(x.p).push(x);
  }
  const sectorDe = (x) => {
    let mejor = null;
    for (const s of sectores) if (enSector(x, s.c) && (!mejor || s.c.length > mejor.c.length)) mejor = s;
    return mejor;
  };
  const fechaTexto = (f) => (f ? fechaLarga.format(new Date(f.slice(0, 10) + 'T12:00:00Z')) : '');
  for (const x of fichas) {
    const ruta = rutaFicha(x);
    const nombreProv = provincias[x.p] || '';
    const conProv = !!slugProv[x.p];
    const sec = sectorDe(x);
    const adjudicada = x.g === 'J' || x.g === 'F';
    const vencida = x.g === 'A' && x.f && x.f < AHORA_MADRID;
    const estado = adjudicada ? (x.g === 'F' ? 'Formalizada' : 'Adjudicada')
      : x.g === 'P' ? 'Anuncio previo' : vencida ? 'Plazo cerrado' : 'En plazo';
    let plazo = '';
    if (!adjudicada) {
      if (x.f) {
        const [d, h] = [x.f.slice(0, 10), x.f.slice(11, 16)];
        plazo = `${fechaTexto(d)}${h && h !== '00:00' ? ` a las ${h}` : ''}`;
      } else plazo = 'Consulta el anuncio oficial';
    }
    const buscador = enlaceBuscador({ cpv: sec?.c, prov: conProv ? [x.p] : [] });
    const titulo = x.t || 'Licitación sin título';
    const cortado = titulo.length > 90 ? titulo.slice(0, 88).replace(/\s+\S*$/, '') + '…' : titulo;

    const bloqueAdj = adjudicada ? `
  <h2>Adjudicación</h2>
  <ul class="ganadores">${x.ad.map(([empresa, importe, ofertas]) => `<li><b>${nombreEmpresa(empresa)}</b><span>${importe ? euros.format(importe) + ' sin IVA' : 'Importe no indicado'}${ofertas ? ` · ${ofertas} ${ofertas === 1 ? 'oferta recibida' : 'ofertas recibidas'}` : ''}</span></li>`).join('')}</ul>
  ${(x.nad || x.ad.length) > x.ad.length ? `<p class="nota">Hay ${x.nad - x.ad.length} adjudicaciones más (lotes). Consulta el detalle en el anuncio oficial.</p>` : ''}
  ${tienePagina(x.ad[0][0]) ? `<p class="aviso-empresa"><a class="boton" href="${rutaEmpresa(x.ad[0][0])}">Ver todo lo que ha ganado ${esc(nombreCorto(x.ad[0][0]))}</a> <a class="boton" href="/#alerta=empresa&emp=${encodeURIComponent(x.ad[0][0]).replace(/%20/g, '+')}">Avisarme cuando gane otra licitación</a></p>` : ''}` : '';

    const datos = [
      ['Organismo', nombreOrgano(x.o)],
      ['Expediente', esc(x.e)],
      ['Tipo de contrato', esc(tipos[x.tc] || '')],
      ['Procedimiento', esc(procs[x.pr] || '')],
      ['Lugar', conProv ? `<a href="${rutaProv(x.p)}">${esc(nombreProv)}</a>` : esc(nombreProv)],
      ['Códigos CPV', x.c.map((c) => { const s2 = sectores.filter((s) => c.startsWith(s.c)).sort((a, b) => b.c.length - a.c.length)[0];
        return s2 ? `${esc(c)} (<a href="${rutaSector(s2)}">${esc(s2.n)}</a>)` : esc(c); }).join('<br>')],
      ['Publicada', fechaTexto(x.fp)],
      ['Última actualización', fechaTexto(x.a)],
      ['Fuente', x.id.startsWith('Plataformas') ? 'Plataformas autonómicas agregadas en la Plataforma de Contratación del Sector Público' : 'Plataforma de Contratación del Sector Público'],
    ].filter(([, v]) => v);

    let parecidas = (abiertasPorProv.get(x.p) || []).filter((o) => o !== x);
    if (sec) {
      const mismas = parecidas.filter((o) => enSector(o, sec.c));
      parecidas = [...mismas, ...parecidas.filter((o) => !enSector(o, sec.c))];
    }
    parecidas = parecidas.slice(0, MAX_RELACIONADAS);

    const relacionados = [
      conProv ? [`Licitaciones en ${nombreProv}`, rutaProv(x.p)] : null,
      conProv && sec && combos.has(`${x.p}|${sec.c}`) ? [`${sec.n} en ${nombreProv}`, rutaCombo(x.p, sec)] : null,
      sec ? [`${sec.n} en toda España`, rutaSector(sec)] : null,
      adjudicada ? null : ['Cómo presentarse a una licitación', '/guias/como-presentarse-a-una-licitacion-publica/'],
    ].filter(Boolean);

    const cuerpo = `
  <p class="estado"><span class="badge" data-g="${adjudicada ? x.g : vencida ? 'E' : x.g}">${estado}</span></p>
  <h1 class="titulo-ficha">${esc(titulo)}</h1>
  <p class="intro">${nombreOrgano(x.o)}${nombreProv ? ` · ${esc(nombreProv)}` : ''}</p>
  <section class="resumen ficha">
    <div><b>${x.i ? euros.format(x.i) : '—'}</b><span>presupuesto sin IVA</span></div>
    <div><b class="plazo-ficha">${adjudicada ? esc(fechaTexto(x.fa)) : esc(plazo)}</b><span>${adjudicada ? 'fecha de adjudicación' : x.g === 'P' ? 'fecha prevista' : 'fin del plazo de presentación'}</span></div>
    <div class="acciones"><a class="boton principal" href="${esc(x.u)}" rel="noopener nofollow" target="_blank">Ver anuncio y pliegos oficiales</a><a class="boton" href="${buscador}&alerta=1">Avisarme de licitaciones parecidas</a></div>
  </section>
  ${bloqueAdj}
  <h2>Datos de la licitación</h2>
  <dl class="ficha-datos">${datos.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
  ${parecidas.length ? `<h2>Otras licitaciones abiertas${nombreProv && conProv ? ` en ${esc(nombreProv)}` : ''}</h2><ol class="lista">${parecidas.map((o) => filaAbierta(o, provincias)).join('')}</ol>` : ''}
  ${relacionados.length ? `<p class="volver">${relacionados.map(([t, r]) => `<a href="${r}">${esc(t)}</a>`).join(' · ')}</p>` : ''}`;

    const desc = adjudicada
      ? `${titulo.slice(0, 80)}. Adjudicada a ${x.ad[0][0]}${x.ad[0][1] ? ` por ${euros.format(x.ad[0][1])}` : ''}. ${x.o}${nombreProv ? `, ${nombreProv}` : ''}.`
      : `${titulo.slice(0, 80)}. ${x.o}${nombreProv ? `, ${nombreProv}` : ''}. ${x.i ? `Presupuesto ${euros.format(x.i)} sin IVA. ` : ''}${x.f ? `Plazo hasta el ${fechaCorta(x.f)}.` : ''}`;
    await escribir(ruta, pagina({
      ruta, titulo: cortado, descripcion: desc.slice(0, 300),
      migas: [['Inicio', '/'], ['Licitaciones', '/licitaciones/'], ...(conProv ? [[nombreProv, rutaProv(x.p)]] : []), [cortado.length > 50 ? cortado.slice(0, 48).replace(/\s+\S*$/, '') + '…' : cortado, ruta]],
      cuerpo,
      pieDatos: 'Información obtenida de la Plataforma de Contratación del Sector Público (Ministerio de Hacienda). Antes de presentar una oferta, revisa los pliegos y los plazos en el anuncio oficial.',
    }), sitemap, adjudicada ? '0.4' : '0.5', x.a);
  }
  await fs.writeFile(path.join(RAIZ, 'licitacion', 'fichas.json'), JSON.stringify({ adjDesde, adjHasta: AHORA_MADRID.slice(0, 10), n: fichas.length }));

  // --- Oficios
  const oficios = OFICIOS.map(([s, n, frase, pref]) => ({ s, n, frase, pref, ruta: `/licitaciones/oficio/${s}/`,
    ab: abiertas.filter((x) => enOficio(x, pref)), adj: adjudicadas.filter((x) => enOficio(x, pref)) }));
  for (const o of oficios) {
    const porProv = codProv.map((p) => [p, o.ab.filter((x) => x.p === p).length]).filter(([, k]) => k).sort((a, b) => b[1] - a[1]);
    const cpvs = o.pref.join(',');
    const cuerpo = `
  <h1>Licitaciones ${esc(o.frase)}</h1>
  <p class="intro">Concursos públicos abiertos ${esc(o.frase)} en toda España: ayuntamientos, diputaciones, hospitales y otros organismos que buscan empresas y autónomos de ${esc(minus(o.n))}. Con su plazo, presupuesto y quién ganó los últimos.</p>
  ${bloqueLista({ abiertas: o.ab, adjudicadas: o.adj, provincias, frase: o.frase, buscador: enlaceBuscador({ cpv: cpvs }) })}
  ${enlacesRelacionados(`Licitaciones ${o.frase} por provincia`, porProv.map(([p, k]) => [provincias[p], enlaceBuscador({ cpv: cpvs, prov: [p] }), k]))}
  ${enlacesRelacionados('Otros oficios', oficios.filter((x) => x !== o).map((x) => [x.n, x.ruta, x.ab.length]))}
  <p class="volver"><a href="/guias/licitaciones-para-autonomos/">Licitaciones para autónomos: cómo empezar</a> · <a href="/guias/contratos-menores/">Contratos menores</a></p>`;
    await escribir(o.ruta, pagina({
      ruta: o.ruta, titulo: `Licitaciones ${o.frase}`,
      descripcion: `${numero.format(o.ab.length)} licitaciones públicas abiertas ${o.frase} en España, con plazos, presupuestos y adjudicatarios. Alertas gratis por email.`,
      migas: [['Inicio', '/'], ['Licitaciones', '/licitaciones/'], ['Por oficio', '/licitaciones/oficio/'], [o.n, o.ruta]],
      cuerpo, actualizado,
    }), sitemap, '0.7');
  }
  const listaOficios = oficios.map((o) => [o.n, o.ruta, o.ab.length]);
  await escribir('/licitaciones/oficio/', pagina({
    ruta: '/licitaciones/oficio/', titulo: 'Licitaciones por oficio: electricistas, fontanería, limpieza…',
    descripcion: 'Licitaciones públicas abiertas por oficio: electricistas, fontanería, pintura, carpintería, jardinería, limpieza, catering y más. Gratis y actualizado a diario.',
    migas: [['Inicio', '/'], ['Licitaciones', '/licitaciones/'], ['Por oficio', '/licitaciones/oficio/']],
    cuerpo: `
  <h1>Licitaciones por oficio</h1>
  <p class="intro">Elige tu oficio y verás los concursos públicos abiertos que encajan, sin necesidad de conocer los códigos CPV.</p>
  ${enlacesRelacionados('Oficios', listaOficios)}`,
    actualizado,
  }), sitemap, '0.8');

  // --- Hoy y archivo diario (por el día en que la licitación apareció en LicitaEmpresa, hora de Madrid)
  const diaMadrid = (vt) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date(vt.slice(0, 16) + ':00Z'));
  const hoyMadrid = AHORA_MADRID.slice(0, 10);
  const porDia = new Map();
  for (const x of todas) {
    if (!x.vt) continue;
    const d = diaMadrid(x.vt);
    if (!porDia.has(d)) porDia.set(d, []);
    porDia.get(d).push(x);
  }
  const dias = [];
  for (let i = 1; i <= DIAS_ARCHIVO; i++) {
    const d = new Date(Date.parse(hoyMadrid + 'T12:00:00Z') - i * 864e5).toISOString().slice(0, 10);
    if (porDia.get(d)?.length) dias.push(d);
  }
  const fechaDia = (d) => new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z'));
  const filaHoy = (x) => (x.g === 'J' || x.g === 'F') && x.ad?.length ? filaAdjudicada({ ...x, fa: x.fa || x.a }, provincias) : filaAbierta(x, provincias);
  const listaDia = (items) => {
    const ordenadas = [...items].sort((a, b) => (a.p || '').localeCompare(b.p || '') || ((a.f || '9999') < (b.f || '9999') ? -1 : 1));
    const grupos = new Map();
    for (const x of ordenadas.slice(0, MAX_HOY)) {
      const k = provincias[x.p] || 'Sin provincia';
      if (!grupos.has(k)) grupos.set(k, []);
      grupos.get(k).push(x);
    }
    return [...grupos].sort((a, b) => a[0].localeCompare(b[0], 'es'))
      .map(([k, l]) => `<h2>${esc(k)} <span class="cuenta">${numero.format(l.length)}</span></h2><ol class="lista">${l.map(filaHoy).join('')}</ol>`).join('')
      + (items.length > MAX_HOY ? `<p class="mas">Se muestran ${numero.format(MAX_HOY)} de ${numero.format(items.length)}. <a href="/#orden=recientes">Ver todas en el buscador</a></p>` : '');
  };
  const archivo = dias.length ? `<h2>Días anteriores</h2><ul class="enlaces">${dias.map((d) => `<li><a href="/hoy/${d}/">${esc(fechaDia(d))}</a> <span>${numero.format(porDia.get(d).length)}</span></li>`).join('')}</ul>` : '';
  const desde24 = new Date(AHORA.getTime() - 864e5).toISOString().slice(0, 16);
  const ultimas = abiertas.filter((x) => (x.vt || '') >= desde24);
  await escribir('/hoy/', pagina({
    ruta: '/hoy/', titulo: 'Licitaciones publicadas hoy',
    descripcion: `${numero.format(ultimas.length)} licitaciones públicas nuevas en las últimas 24 horas en España, por provincia, con plazo y presupuesto. Actualizado varias veces al día.`,
    migas: [['Inicio', '/'], ['Publicadas hoy', '/hoy/']],
    cuerpo: `
  <h1>Licitaciones publicadas hoy</h1>
  <p class="intro">Las <b>${numero.format(ultimas.length)}</b> licitaciones en plazo que han aparecido en las últimas 24 horas, ordenadas por provincia. Si no quieres revisarlas a diario, <a href="/#alerta=1">crea una alerta</a> y te llegarán por email solo las de tu sector.</p>
  ${ultimas.length ? listaDia(ultimas) : '<p class="vacio">Todavía no hay licitaciones nuevas en las últimas 24 horas.</p>'}
  ${archivo}`,
    actualizado,
  }), sitemap, '0.9');
  for (const d of dias) {
    const items = porDia.get(d);
    const ruta = `/hoy/${d}/`;
    await escribir(ruta, pagina({
      ruta, titulo: `Licitaciones publicadas el ${fechaDia(d)}`,
      descripcion: `${numero.format(items.length)} licitaciones públicas publicadas el ${fechaDia(d)} en España, por provincia.`,
      migas: [['Inicio', '/'], ['Publicadas hoy', '/hoy/'], [fechaDia(d), ruta]],
      cuerpo: `
  <h1>Licitaciones publicadas el ${esc(fechaDia(d))}</h1>
  <p class="intro">${numero.format(items.length)} licitaciones aparecieron este día. Su estado puede haber cambiado desde entonces: se muestra el actual.</p>
  ${listaDia(items)}
  ${archivo}`,
      actualizado,
    }), sitemap, '0.4', d);
  }

  // --- Índice general /licitaciones/
  const porComunidad = (meta.comunidades || []).map(([com, provs]) => `<div class="grupo"><h3>${provs.length > 1 ? `<a href="/licitaciones/${slug(com)}/">${esc(com)}</a>` : esc(com)}</h3><ul>${provs
    .map((p) => `<li><a href="${rutaProv(p)}">${esc(provincias[p])}</a> <span>${numero.format(abPorProv.get(p)?.length || 0)}</span></li>`).join('')}</ul></div>`).join('');
  const listaSectores = sectores.filter((s) => abPorSector.get(s.c).length || adjPorSector.get(s.c).length)
    .map((s) => [s.n, rutaSector(s), abPorSector.get(s.c).length]);
  await escribir('/licitaciones/', pagina({
    ruta: '/licitaciones/', titulo: 'Licitaciones públicas por provincia y sector',
    descripcion: `${numero.format(abiertas.length)} licitaciones públicas abiertas en España, organizadas por provincia, comunidad autónoma y sector. Gratis y actualizado a diario.`,
    migas: [['Inicio', '/'], ['Licitaciones', '/licitaciones/']],
    cuerpo: `
  <h1>Licitaciones públicas por provincia y sector</h1>
  <p class="intro">Hay <b>${numero.format(abiertas.length)}</b> licitaciones públicas abiertas en España. Elige tu provincia o tu sector para ver los concursos en plazo y las últimas adjudicaciones.</p>
  <h2>Por provincia</h2>
  <div class="grupos">${porComunidad}</div>
  ${enlacesRelacionados('Por oficio', listaOficios)}
  ${enlacesRelacionados('Por sector', listaSectores)}`,
    actualizado,
  }), sitemap, '0.9');

  // --- Índice de empresas /empresas/
  const ranking = [...empresas].sort((a, b) => b[1].n - a[1].n).slice(0, 500)
    .map(([s, e]) => [e.nombre, `/empresa/${s}`, e.n]);
  await escribir('/empresas/', pagina({
    ruta: '/empresas/', titulo: 'Empresas que más contratos públicos ganan',
    descripcion: `Ranking de las empresas con más licitaciones públicas adjudicadas en España. Consulta qué ha ganado cada una, sus clientes y sus importes.`,
    migas: [['Inicio', '/'], ['Empresas', '/empresas/']],
    cuerpo: `
  <h1>Empresas que más contratos públicos ganan</h1>
  <p class="intro">Las ${numero.format(ranking.length)} empresas con más adjudicaciones (anuncios publicados o actualizados en los últimos 6 meses), de ${numero.format(empresas.size)} empresas adjudicatarias. Entra en cada una para ver qué ha ganado, a qué organismos y por cuánto. También puedes buscar cualquier empresa en el <a href="/#est=J,F&per=6">buscador</a>.</p>
  ${enlacesRelacionados('Ranking por número de adjudicaciones', ranking)}`,
    actualizado,
  }), sitemap, '0.7');

  // --- Guías para empresas
  const listaGuias = `<ul class="guias-lista">${GUIAS.map((g) => `<li><a href="/guias/${g.slug}/">${esc(g.titulo)}</a><p>${esc(g.descripcion)}</p></li>`).join('')}</ul>`;
  for (const g of GUIAS) {
    const ruta = `/guias/${g.slug}/`;
    const otras = GUIAS.filter((o) => o !== g);
    await escribir(ruta, pagina({
      ruta, titulo: g.titulo, descripcion: g.descripcion,
      migas: [['Inicio', '/'], ['Guías', '/guias/'], [g.corto, ruta]],
      cuerpo: `
  <article class="guia">
  <h1>${esc(g.titulo)}</h1>
  ${g.html}
  </article>
  <section class="resumen guia-cta">
    <div><b>${numero.format(abiertas.length)}</b><span>licitaciones abiertas ahora</span></div>
    <div><b>Gratis</b><span>sin registro</span></div>
    <div class="acciones"><a class="boton principal" href="/">Buscar licitaciones</a><a class="boton" href="/#alerta=1">Crear una alerta por email</a></div>
  </section>
  <h2>Otras guías</h2>
  <ul class="enlaces guias">${otras.map((o) => `<li><a href="/guias/${o.slug}/">${esc(o.titulo)}</a></li>`).join('')}</ul>`,
      ldExtra: { '@context': 'https://schema.org', '@type': 'Article', headline: g.titulo, description: g.descripcion, inLanguage: 'es',
        author: { '@type': 'Organization', name: 'LicitaEmpresa' }, publisher: { '@type': 'Organization', name: 'Soluciones Globales Echeyde 360, S.L.U.' },
        mainEntityOfPage: SITIO + ruta },
      pieDatos: 'Guía informativa elaborada por LicitaEmpresa a partir de la Ley 9/2017 de Contratos del Sector Público. Los importes son orientativos y pueden cambiar: en cada licitación mandan sus pliegos. No constituye asesoramiento jurídico.',
    }), sitemap, '0.7');
  }
  await escribir('/guias/', pagina({
    ruta: '/guias/', titulo: 'Guías para presentarse a licitaciones públicas',
    descripcion: 'Guías gratuitas para empresas y autónomos: cómo presentarse a una licitación pública, códigos CPV, procedimientos, documentación y consejos para ganar concursos.',
    migas: [['Inicio', '/'], ['Guías', '/guias/']],
    cuerpo: `
  <h1>Guías para presentarse a licitaciones públicas</h1>
  <p class="intro">Todo lo que necesita saber una empresa o un autónomo para empezar a vender a la Administración, explicado de forma sencilla. ¿Tienes una duda concreta? Mira las <a href="/preguntas/">preguntas frecuentes</a>.</p>
  ${listaGuias}`,
    pieDatos: 'Guías informativas. No constituyen asesoramiento jurídico: en cada licitación mandan sus pliegos.',
  }), sitemap, '0.8');

  // --- Índice de organismos /organismos/
  const rankingOrg = [...organismos].sort((a, b) => b[1].n - a[1].n).slice(0, 500).map(([s, o]) => [o.nombre, `/organismo/${s}`, o.n]);
  const porProvOrg = codProv.filter((p) => organismosPorProv.get(p).length)
    .map((p) => `<div class="grupo"><h3><a href="${rutaProv(p)}">${esc(provincias[p])}</a></h3><ul>${organismosPorProv.get(p).slice(0, 5)
      .map(([n, r, k]) => `<li><a href="${r}">${esc(n)}</a> <span>${numero.format(k)}</span></li>`).join('')}</ul></div>`).join('');
  await escribir('/organismos/', pagina({
    ruta: '/organismos/', titulo: 'Organismos que más licitan: ayuntamientos y administraciones',
    descripcion: `Ayuntamientos, diputaciones, hospitales y organismos públicos con más licitaciones en España. Consulta sus concursos abiertos, a quién adjudican y por cuánto.`,
    migas: [['Inicio', '/'], ['Organismos', '/organismos/']],
    cuerpo: `
  <h1>Organismos que más licitan</h1>
  <p class="intro">${numero.format(organismos.size)} ayuntamientos, diputaciones, hospitales, universidades y otros organismos públicos con licitaciones en los últimos 6 meses. Entra en cada uno para ver sus concursos abiertos y a quién adjudica sus contratos.</p>
  <h2>Por provincia</h2>
  <div class="grupos">${porProvOrg}</div>
  ${enlacesRelacionados('Ranking por número de licitaciones', rankingOrg)}`,
    actualizado,
  }), sitemap, '0.7');

  // --- Preguntas frecuentes
  const titGuia = new Map(GUIAS.map((g) => [g.slug, g.titulo]));
  const textoPlano = (h) => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  for (const [i, [s, pregunta, respuesta, guia]] of PREGUNTAS.entries()) {
    const ruta = `/preguntas/${s}/`;
    const otras = [...PREGUNTAS.slice(i + 1), ...PREGUNTAS.slice(0, i)].filter((q) => q[3] === guia).concat(
      [...PREGUNTAS.slice(i + 1), ...PREGUNTAS.slice(0, i)].filter((q) => q[3] !== guia)).slice(0, 6);
    await escribir(ruta, pagina({
      ruta, titulo: pregunta, descripcion: textoPlano(respuesta).slice(0, 160),
      migas: [['Inicio', '/'], ['Preguntas', '/preguntas/'], [pregunta.length > 50 ? pregunta.slice(0, 48) + '…' : pregunta, ruta]],
      cuerpo: `
  <h1>${esc(pregunta)}</h1>
  <div class="respuesta">${respuesta}</div>
  ${titGuia.has(guia) ? `<p class="volver"><a class="boton" href="/guias/${guia}/">Leer la guía completa: ${esc(titGuia.get(guia))}</a></p>` : ''}
  <section class="resumen guia-cta">
    <div><b>${numero.format(abiertas.length)}</b><span>licitaciones abiertas ahora</span></div>
    <div><b>Gratis</b><span>sin registro</span></div>
    <div class="acciones"><a class="boton principal" href="/">Buscar licitaciones</a><a class="boton" href="/#alerta=1">Crear una alerta por email</a></div>
  </section>
  <h2>Otras preguntas</h2>
  <ul class="enlaces guias">${otras.map((q) => `<li><a href="/preguntas/${q[0]}/">${esc(q[1])}</a></li>`).join('')}</ul>`,
      ldExtra: { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: pregunta,
        acceptedAnswer: { '@type': 'Answer', text: textoPlano(respuesta) } }] },
      pieDatos: 'Respuesta informativa elaborada por LicitaEmpresa a partir de la Ley 9/2017 de Contratos del Sector Público. Los importes son orientativos: en cada licitación mandan sus pliegos. No constituye asesoramiento jurídico.',
    }), sitemap, '0.6');
  }
  await escribir('/preguntas/', pagina({
    ruta: '/preguntas/', titulo: 'Preguntas frecuentes sobre licitaciones públicas',
    descripcion: 'Respuestas cortas a las dudas más habituales sobre licitaciones públicas: autónomos, contratos menores, garantías, ROLECE, DEUC, plazos, recursos y más.',
    migas: [['Inicio', '/'], ['Preguntas', '/preguntas/']],
    cuerpo: `
  <h1>Preguntas frecuentes sobre licitaciones públicas</h1>
  <p class="intro">Respuestas cortas a las dudas más habituales. Si quieres el detalle, cada una enlaza a su <a href="/guias/">guía</a>.</p>
  <ul class="guias-lista">${PREGUNTAS.map(([s, q, r]) => `<li><a href="/preguntas/${s}/">${esc(q)}</a><p>${esc(textoPlano(r).slice(0, 140))}…</p></li>`).join('')}</ul>`,
    pieDatos: 'Respuestas informativas. No constituyen asesoramiento jurídico: en cada licitación mandan sus pliegos.',
  }), sitemap, '0.7');

  // --- Código compartido para el buscador (enlaces a fichas y empresas)
  await fs.mkdir(path.join(RAIZ, 'js'), { recursive: true });
  for (const f of ['fichas.mjs', 'empresas.mjs', 'organismos.mjs']) await fs.copyFile(new URL(`../lib/${f}`, import.meta.url), path.join(RAIZ, 'js', f));

  // --- sitemaps (máximo 50.000 direcciones por archivo)
  const hoy = AHORA.toISOString().slice(0, 10);
  const urls = [['/', '1.0'], ...sitemap, ['/anunciate', '0.3'], ['/aviso-legal', '0.2'], ['/privacidad', '0.2'], ['/cookies', '0.2']];
  const urlsEmpresas = [...empresas.keys()].sort().map((s) => [`/empresa/${s}`, '0.4']);
  const urlsOrganismos = [...organismos.keys()].sort().map((s) => [`/organismo/${s}`, '0.5']);
  const xml = (lista) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${lista.map(([r, pr, lm]) => `  <url><loc>${SITIO}${encodeURI(r)}</loc><lastmod>${/^\d{4}-\d{2}-\d{2}/.test(lm || '') ? lm.slice(0, 10) : hoy}</lastmod><priority>${pr}</priority></url>`).join('\n')}
</urlset>
`;
  const archivos = [['sitemap-paginas.xml', urls]];
  for (let i = 0; i < urlsEmpresas.length; i += 45000) archivos.push([`sitemap-empresas-${i / 45000 + 1}.xml`, urlsEmpresas.slice(i, i + 45000)]);
  for (let i = 0; i < urlsOrganismos.length; i += 45000) archivos.push([`sitemap-organismos-${i / 45000 + 1}.xml`, urlsOrganismos.slice(i, i + 45000)]);
  for (const [f, lista] of archivos) await fs.writeFile(path.join(RAIZ, f), xml(lista));
  await fs.writeFile(path.join(RAIZ, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${archivos.map(([f]) => `  <sitemap><loc>${SITIO}/${f}</loc><lastmod>${hoy}</lastmod></sitemap>`).join('\n')}
</sitemapindex>
`);

  console.log(`Páginas generadas: ${sitemap.length} (${codProv.length} provincias, ${comunidades.length} comunidades, ${combos.size} sector+provincia, ${fichas.length} fichas de licitación; adjudicaciones desde ${adjDesde}; ${empresas.size} empresas y ${organismos.size} organismos en el sitemap) en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}

main().catch((e) => { console.error(e); process.exit(1); });
