// Genera páginas estáticas para buscadores (Google) a partir de los datos:
//   /licitaciones/                         índice de provincias, comunidades y sectores
//   /licitaciones/{provincia}/             por provincia
//   /licitaciones/{comunidad}/             por comunidad (solo las de varias provincias)
//   /licitaciones/sector/{sector}/         por sector CPV
//   /licitaciones/{provincia}/{sector}/    sector + provincia (si hay al menos MIN_COMBO abiertas)
//   /licitacion/{titulo}-{numero}/         ficha de cada licitación abierta y de las adjudicaciones más recientes
//   /licitacion/fichas.json                qué licitaciones tienen ficha (lo usa el buscador)
//   /sitemap.xml
// Lo ejecuta Cloudflare Pages al publicar (comando de compilación), así las páginas no se guardan en GitHub.

import fs from 'node:fs/promises';
import path from 'node:path';
import { CPV_SECTORES } from '../lib/cpv.mjs';
import { slug, rutaFicha } from '../lib/fichas.mjs';

const RAIZ = process.env.DIR_PUBLICO || 'public';
const DIR_DATOS = path.join(RAIZ, 'data');
const SITIO = 'https://licitaempresa.es';
const MIN_COMBO = 3;          // mínimo de licitaciones abiertas para crear una página sector + provincia
const MAX_LISTA = 100;        // licitaciones abiertas que se muestran por página
const MAX_ADJ = 15;           // adjudicaciones recientes que se muestran por página
// Cloudflare Pages (plan gratuito) admite como máximo 20.000 archivos por publicación.
// Dejamos margen: las fichas de licitaciones ocupan lo que sobre hasta este límite.
const LIMITE_ARCHIVOS = 19000;
const MAX_RELACIONADAS = 6;   // otras licitaciones que se enlazan desde cada ficha
const AHORA = new Date();

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
  return { meta, abiertas, adjudicadas, vivas };
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

function pagina({ ruta, titulo, descripcion, migas, cuerpo, actualizado, pieDatos }) {
  const url = SITIO + ruta;
  const ld = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: migas.map(([nombre, r], i) => ({ '@type': 'ListItem', position: i + 1, name: nombre, item: SITIO + r })),
  };
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)} | LicitaEmpresa</title>
<meta name="description" content="${esc(descripcion)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="LicitaEmpresa">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="es_ES">
<link rel="stylesheet" href="/fuentes.css">
<link rel="stylesheet" href="/paginas.css">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
</head>
<body>
<header class="cabecera">
  <div class="cabecera-in">
    <a class="marca" href="/">LicitaEmpresa</a>
    <nav class="nav"><a href="/licitaciones/">Provincias y sectores</a><a href="/">Buscador</a></nav>
  </div>
</header>
<main class="marco">
  <nav class="migas" aria-label="Estás en">${migas.map(([n, r], i) => (i < migas.length - 1 ? `<a href="${r}">${esc(n)}</a><span aria-hidden="true">›</span>` : `<span aria-current="page">${esc(n)}</span>`)).join('')}</nav>
  ${cuerpo}
  <p class="actualizado">${pieDatos || `Datos actualizados el ${esc(actualizado)}. Fuente: Plataforma de Contratación del Sector Público (Ministerio de Hacienda) y plataformas autonómicas.`}</p>
</main>
<footer class="pie">
  <p>Esta web no es oficial. Antes de presentar una oferta, comprueba plazos y pliegos en el anuncio original.</p>
  <nav><span>© ${AHORA.getFullYear()} Soluciones Globales Echeyde 360, S.L.U.</span><a href="/anunciate.html">Anúnciate</a><a href="/aviso-legal.html">Aviso legal</a><a href="/privacidad.html">Privacidad</a><a href="/cookies.html">Cookies</a><a href="mailto:contacto@licitaempresa.es">contacto@licitaempresa.es</a></nav>
</footer>
</body>
</html>
`;
}

let tieneFicha = () => false;
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
    plazo = d < 1 ? '<b class="urgente">Cierra hoy</b>' : `<b class="${d <= 3 ? 'urgente' : d <= 7 ? 'pronto' : ''}">${d} ${d === 1 ? 'día' : 'días'}</b>`;
    plazo += `<span>Cierra el ${fechaCorta(x.f)}</span>`;
  } else {
    plazo = '<b class="sinfecha">Sin fecha</b><span>Consulta el anuncio</span>';
  }
  return `<li class="lic">
  <div class="plazo">${plazo}</div>
  <div class="cuerpo">
    <h3>${enlaceTitulo(x)}</h3>
    <p class="organo">${esc(x.o)}</p>
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
  <p class="organo">${esc(x.o)} · ${esc(provincias[x.p] || '')} · ${fechaCorta(x.fa)}</p>
  <p class="ganador">Adjudicada a <b>${esc(empresa)}</b>${importe ? ` por ${euros.format(importe)}` : ''}${ofertas ? `, ${ofertas} ${ofertas === 1 ? 'oferta' : 'ofertas'}` : ''}${mas > 0 ? ` y ${mas} ${mas === 1 ? 'lote más' : 'lotes más'}` : ''}</p>
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
  const { meta, abiertas, adjudicadas, vivas } = await cargar();
  const provincias = meta.provincias || {};
  const actualizado = fechaHora.format(new Date(meta.actualizado));
  const sitemap = [];

  // Limpiar lo generado en ejecuciones anteriores (en local)
  await fs.rm(path.join(RAIZ, 'licitaciones'), { recursive: true, force: true });
  await fs.rm(path.join(RAIZ, 'licitacion'), { recursive: true, force: true });

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
  const paginasListado = codProv.length + comunidades.length + combos.size + 1
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
  ${enlacesRelacionados(`Licitaciones por sector en ${nombre}`, sectoresAqui)}`;
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
  ${enlacesRelacionados(`Licitaciones ${frase} por provincia`, provsAqui)}`;
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
  <ul class="ganadores">${x.ad.map(([empresa, importe, ofertas]) => `<li><b>${esc(empresa)}</b><span>${importe ? euros.format(importe) + ' sin IVA' : 'Importe no indicado'}${ofertas ? ` · ${ofertas} ${ofertas === 1 ? 'oferta recibida' : 'ofertas recibidas'}` : ''}</span></li>`).join('')}</ul>
  ${(x.nad || x.ad.length) > x.ad.length ? `<p class="nota">Hay ${x.nad - x.ad.length} adjudicaciones más (lotes). Consulta el detalle en el anuncio oficial.</p>` : ''}
  <p class="aviso-empresa"><a class="boton" href="/#alerta=empresa&emp=${encodeURIComponent(x.ad[0][0]).replace(/%20/g, '+')}">Avisarme cuando ${esc(nombreCorto(x.ad[0][0]))} gane otra licitación</a></p>` : '';

    const datos = [
      ['Organismo', esc(x.o)],
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
    ].filter(Boolean);

    const cuerpo = `
  <p class="estado"><span class="badge" data-g="${adjudicada ? x.g : vencida ? 'E' : x.g}">${estado}</span></p>
  <h1 class="titulo-ficha">${esc(titulo)}</h1>
  <p class="intro">${esc(x.o)}${nombreProv ? ` · ${esc(nombreProv)}` : ''}</p>
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
  ${enlacesRelacionados('Por sector', listaSectores)}`,
    actualizado,
  }), sitemap, '0.9');

  // --- sitemap.xml
  const hoy = AHORA.toISOString().slice(0, 10);
  const urls = [['/', '1.0'], ...sitemap, ['/anunciate.html', '0.3'], ['/aviso-legal.html', '0.2'], ['/privacidad.html', '0.2'], ['/cookies.html', '0.2']];
  await fs.writeFile(path.join(RAIZ, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([r, pr, lm]) => `  <url><loc>${SITIO}${encodeURI(r)}</loc><lastmod>${/^\d{4}-\d{2}-\d{2}/.test(lm || '') ? lm.slice(0, 10) : hoy}</lastmod><priority>${pr}</priority></url>`).join('\n')}
</urlset>
`);

  console.log(`Páginas generadas: ${sitemap.length} (${codProv.length} provincias, ${comunidades.length} comunidades, ${combos.size} sector+provincia, ${fichas.length} fichas de licitación; adjudicaciones desde ${adjDesde}) en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}

main().catch((e) => { console.error(e); process.exit(1); });
