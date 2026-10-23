// Descarga las licitaciones de la Plataforma de Contratación del Sector Público
// (perfiles alojados + plataformas autonómicas agregadas) en todos sus estados y guarda:
//   public/data/indice.json          resumen, catálogos y lista de archivos
//   public/data/abiertas.json        licitaciones en plazo (lo que la web carga al entrar)
//   public/data/historico-AAAA-MM-N.json  resto de estados, por mes de última actualización
// Las que no están en plazo se conservan MESES_HISTORICO meses.
//
// Funciona de forma incremental:
// - La primera vez descarga los ficheros ZIP mensuales de los últimos MESES_INICIALES meses
//   (mucho más rápido que ir página a página, porque el servidor del Ministerio es lento).
// - Después solo lee las páginas del feed publicadas desde la última ejecución.

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
import { COMUNIDADES, PROVINCIAS, provinciaDesdeNuts, provinciaDesdeCP, provinciaEnNuts } from './territorio.mjs';

const FEEDS = [
  {
    clave: 'estado',
    nombre: 'Plataforma de Contratación del Sector Público',
    url: process.env.FEED_ESTADO ||
      'https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom',
  },
  {
    clave: 'agregadas',
    nombre: 'Plataformas autonómicas agregadas',
    url: process.env.FEED_AGREGADAS ||
      'https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_1044/PlataformasAgregadasSinMenores.atom',
  },
];

const DIR_DATOS = process.env.DIR_DATOS || 'public/data';
const MESES_INICIALES = Number(process.env.MESES_INICIALES || 6);
const MESES_HISTORICO = Number(process.env.MESES_HISTORICO || 6);
const MAX_POR_ARCHIVO = 12000; // licitaciones por archivo de histórico (Cloudflare admite hasta 25 MB por archivo)
const DIAS_RESPALDO = 7; // si no hay ZIP disponible, días que se leen página a página
const MAX_PAGINAS = Number(process.env.MAX_PAGINAS || 400);
const MAX_MINUTOS = Number(process.env.MAX_MINUTOS || 300); // margen bajo el límite de GitHub
const INICIO = Date.now();
const ejecutar = promisify(execFile);
const DIAS_SIN_PLAZO = 45; // licitaciones en plazo que no indican fecha límite
const AHORA = process.env.AHORA ? new Date(process.env.AHORA) : new Date();

const TIPOS = {
  '1': 'Suministros', '2': 'Servicios', '3': 'Obras',
  '21': 'Gestión de servicios públicos', '22': 'Concesión de servicios',
  '31': 'Concesión de obras públicas', '32': 'Concesión de obras',
  '40': 'Colaboración público-privada', '7': 'Administrativo especial',
  '8': 'Privado', '50': 'Patrimonial', '999': 'Otros',
};
const PROCEDIMIENTOS = {
  '1': 'Abierto', '2': 'Restringido', '3': 'Negociado con publicidad', '4': 'Negociado sin publicidad',
  '5': 'Diálogo competitivo', '6': 'Concurso de proyectos', '7': 'Abierto simplificado',
  '8': 'Asociación para la innovación', '9': 'Derivado de acuerdo marco', '10': 'Licitación con negociación',
  '11': 'Otros', '100': 'Normas internas', '999': 'Otros',
};
const RESULTADOS = {
  '1': 'Adjudicado provisionalmente', '2': 'Adjudicado definitivamente', '3': 'Desierto provisionalmente',
  '4': 'Desierto definitivamente', '5': 'Desistimiento', '6': 'Renuncia', '7': 'Desierto',
  '8': 'Adjudicado', '9': 'Formalizado',
};
const SIN_ADJUDICAR = new Set(['3', '4', '5', '6', '7']);
// Grupos que ve el usuario
const GRUPOS = {
  A: 'En plazo', P: 'Anuncio previo', E: 'En evaluación', J: 'Adjudicada', F: 'Formalizada', N: 'Anulada o desierta',
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  processEntities: true,
  htmlEntities: true,
  isArray: (nombre) =>
    ['entry', 'deleted-entry', 'link', 'ProcurementProjectLot', 'RequiredCommodityClassification', 'TenderResult', 'WinningParty'].includes(nombre),
});

// ---------- utilidades ----------

const txt = (v) => {
  if (v == null) return '';
  if (Array.isArray(v)) return txt(v[0]);
  if (typeof v === 'object') return v['#text'] != null ? String(v['#text']).trim() : '';
  return String(v).trim();
};
const num = (v) => {
  const n = parseFloat(txt(v).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
};
const ms = (iso) => {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
};
const espera = (t) => new Promise((r) => setTimeout(r, t));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

async function descargar(url) {
  if (url.startsWith('file:')) return fs.readFile(new URL(url), 'utf8');
  let ultimoError;
  for (let intento = 1; intento <= 5; intento++) {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': 'licitaciones-abiertas/1.0 (consulta pública gratuita)', Accept: 'application/atom+xml,*/*' },
        signal: AbortSignal.timeout(360_000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.text();
    } catch (e) {
      ultimoError = e;
      log(`  fallo descargando (intento ${intento}/5): ${e.message}`);
      await espera(intento * 5000);
    }
  }
  throw ultimoError;
}

// ---------- lectura de una licitación ----------

function cpvsDe(proyecto, conjunto) {
  for (const rc of proyecto?.RequiredCommodityClassification || []) {
    const c = txt(rc.ItemClassificationCode).replace(/\D/g, '').slice(0, 8);
    if (c.length === 8) conjunto.add(c);
  }
}

function provinciaDe(cfs) {
  const pp = cfs.ProcurementProject || {};
  const lugares = [pp.RealizedLocation, ...(cfs.ProcurementProjectLot || []).map((l) => l.ProcurementProject?.RealizedLocation)];
  let nutsAmplio = null; // código de comunidad o de toda España
  for (const lugar of lugares) {
    if (!lugar) continue;
    const codigo = txt(lugar.CountrySubentityCode);
    const porNuts = provinciaDesdeNuts(codigo);
    if (porNuts && porNuts !== '00') return porNuts;
    const porCP = provinciaDesdeCP(txt(lugar.Address?.PostalZone));
    if (porCP) return porCP;
    if (porNuts && !nutsAmplio) nutsAmplio = codigo;
  }
  const party = cfs.LocatedContractingParty?.Party;
  const cpOrgano = provinciaDesdeCP(txt(party?.PostalAddress?.PostalZone));
  if (nutsAmplio) {
    // Solo se indica la comunidad: si el organismo está en una provincia de esa comunidad, se usa esa.
    return provinciaEnNuts(cpOrgano, nutsAmplio) ? cpOrgano : '00';
  }
  return cpOrgano || '99';
}

// Municipio: donde se ejecuta el contrato (si se indica) y donde tiene su sede el organismo.
// Se guarda el nombre tal cual; lib/municipios.mjs lo limpia al agrupar.
const ciudad = (v) => txt(v).replace(/\s+/g, ' ').slice(0, 80);
const cp = (v) => { const c = txt(v).replace(/\D/g, ''); return c.length === 5 ? c : ''; };
function municipioDe(cfs) {
  const pp = cfs.ProcurementProject || {};
  const lugares = [pp.RealizedLocation, ...(cfs.ProcurementProjectLot || []).map((l) => l.ProcurementProject?.RealizedLocation)];
  const r = {};
  for (const lugar of lugares) {
    const m = ciudad(lugar?.Address?.CityName);
    if (m) { r.m = m; const z = cp(lugar.Address.PostalZone); if (z) r.mz = z; break; }
  }
  const dir = cfs.LocatedContractingParty?.Party?.PostalAddress;
  const om = ciudad(dir?.CityName);
  if (om) { r.om = om; const z = cp(dir.PostalZone); if (z) r.oz = z; }
  return r;
}

function adjudicacionDe(cfs) {
  const ad = [];
  let rc = '';
  let fa = '';
  for (const r of cfs.TenderResult || []) {
    const codigo = txt(r.ResultCode);
    if (codigo && !rc) rc = codigo;
    const fecha = txt(r.AwardDate).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha) && fecha > fa) fa = fecha;
    const ofertas = parseInt(txt(r.ReceivedTenderQuantity), 10);
    const total = r.AwardedTenderedProject?.LegalMonetaryTotal || {};
    const importe = num(total.TaxExclusiveAmount) ?? num(total.PayableAmount);
    for (const w of r.WinningParty || []) {
      const nombre = txt(w.PartyName?.Name);
      if (nombre) ad.push([nombre, importe, Number.isFinite(ofertas) ? ofertas : null]);
    }
  }
  return { rc, fa, ad };
}

function leerEntrada(e, fuente) {
  const cfs = e.ContractFolderStatus;
  if (!cfs) return null;
  const pp = cfs.ProcurementProject || {};
  const plazo = cfs.TenderingProcess?.TenderSubmissionDeadlinePeriod || {};

  const fecha = txt(plazo.EndDate).slice(0, 10);
  const hora = txt(plazo.EndTime).slice(0, 5) || '23:59';
  const cpvs = new Set();
  cpvsDe(pp, cpvs);
  for (const lote of cfs.ProcurementProjectLot || []) cpvsDe(lote.ProcurementProject, cpvs);

  const enlace = (e.link || []).find((l) => l['@_href'] && (!l['@_rel'] || l['@_rel'] === 'alternate'));
  const presupuesto = pp.BudgetAmount || {};
  const { rc, fa, ad } = adjudicacionDe(cfs);

  return {
    id: txt(e.id).replace(/^https?:\/\/[^/]+\/sindicacion\//, ''),
    estado: txt(cfs.ContractFolderStatusCode),
    actualizado: txt(e.updated),
    item: {
      t: txt(e.title) || txt(pp.Name),
      o: txt(cfs.LocatedContractingParty?.Party?.PartyName?.Name),
      e: txt(cfs.ContractFolderID),
      p: provinciaDe(cfs),
      c: [...cpvs],
      i: num(presupuesto.TaxExclusiveAmount) ?? num(presupuesto.EstimatedOverallContractAmount) ?? num(presupuesto.TotalAmount),
      f: /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? `${fecha}T${hora}` : null,
      tc: txt(pp.TypeCode),
      pr: txt(cfs.TenderingProcess?.ProcedureCode),
      u: enlace ? enlace['@_href'] : '',
      fu: fuente === 'estado' ? 'E' : 'A',
      a: txt(e.updated).slice(0, 10),
      s: txt(cfs.ContractFolderStatusCode),
      ...municipioDe(cfs),
      ...(rc ? { rc } : {}),
      ...(fa ? { fa } : {}),
      ...(ad.length ? { ad: ad.slice(0, 5), nad: ad.length } : {}),
    },
  };
}

// Plazo en hora peninsular aproximada: se compara con la fecha/hora local de Madrid.
function horaMadrid(d) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(d).map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
const AHORA_MADRID = horaMadrid(AHORA);
const LIMITE_SIN_PLAZO = new Date(AHORA.getTime() - DIAS_SIN_PLAZO * 864e5).toISOString().slice(0, 10);

const LIMITE_HISTORICO = new Date(Date.UTC(AHORA.getUTCFullYear(), AHORA.getUTCMonth() - MESES_HISTORICO, AHORA.getUTCDate()))
  .toISOString().slice(0, 10);

function sigueAbierta(item) {
  if (item.f) return item.f >= AHORA_MADRID;
  return item.a >= LIMITE_SIN_PLAZO;
}

function grupoDe(item) {
  switch (item.s) {
    case 'PRE': return 'P';
    case 'PUB': return sigueAbierta(item) ? 'A' : 'E'; // plazo vencido: pendiente de adjudicar
    case 'EV': return 'E';
    case 'ADJ': return SIN_ADJUDICAR.has(item.rc) ? 'N' : 'J';
    case 'RES': return SIN_ADJUDICAR.has(item.rc) ? 'N' : 'F';
    case 'ANUL': return 'N';
    default: return 'E';
  }
}

// Se conservan las abiertas y, del resto, las actualizadas en los últimos MESES_HISTORICO meses.
function conservar(item) {
  return item.g === 'A' || item.a >= LIMITE_HISTORICO;
}

// ---------- lectura de páginas ----------

// Procesa una página ATOM y apunta en `cambios` la versión más reciente de cada licitación.
// cambios: id -> { ts, leida }  (leida = null si se ha borrado)
function procesarPagina(xml, feed, cambios, desde, estado) {
  const doc = parser.parse(xml).feed || {};
  let masAntigua = Infinity;

  for (const e of doc.entry || []) {
    const actualizado = txt(e.updated);
    const ts = ms(actualizado);
    masAntigua = Math.min(masAntigua, ts);
    if (ts <= desde) continue;
    if (ts > ms(estado.masReciente)) estado.masReciente = actualizado;
    const leida = leerEntrada(e, feed.clave);
    if (!leida || !leida.id) continue;
    const previo = cambios.get(leida.id);
    if (!previo || ts > previo.ts) cambios.set(leida.id, { ts, leida });
  }
  for (const d of doc['deleted-entry'] || []) {
    const ts = ms(d['@_when']);
    if (ts <= desde) continue;
    const id = String(d['@_ref'] || '').replace(/^https?:\/\/[^/]+\/sindicacion\//, '');
    const previo = cambios.get(id);
    if (id && (!previo || ts > previo.ts)) cambios.set(id, { ts, leida: null });
  }
  const siguiente = (doc.link || []).find((l) => l['@_rel'] === 'next');
  return { masAntigua, siguiente: siguiente?.['@_href'] };
}

// Lee el feed en vivo, de lo más nuevo a lo más antiguo, hasta llegar a `desdeIso`.
async function recorrerFeed(feed, desdeIso, cambios, estado) {
  const desde = ms(desdeIso);
  let url = feed.url;
  let paginas = 0;

  while (url && paginas < MAX_PAGINAS) {
    if (Date.now() - INICIO > MAX_MINUTOS * 60_000) {
      log(`  aviso: se acaba el tiempo; ${feed.clave} se completará en la próxima ejecución`);
      break;
    }
    const xml = await descargar(url);
    paginas++;
    const { masAntigua, siguiente } = procesarPagina(xml, feed, cambios, desde, estado);
    if (paginas % 5 === 0) log(`  ${feed.clave}: ${paginas} páginas, ${cambios.size} licitaciones con cambios`);
    if (masAntigua <= desde) break;
    url = siguiente ? new URL(siguiente, url).href : null;
  }
  if (paginas >= MAX_PAGINAS) log(`  aviso: ${feed.clave} alcanzó el máximo de ${MAX_PAGINAS} páginas`);
  return paginas;
}

// ---------- primera carga con los ZIP mensuales ----------

async function descargarArchivo(url, destino) {
  if (url.startsWith('file:')) return fs.copyFile(fileURLToPath(url), destino);
  await ejecutar('curl', [
    '-fsSL', '--retry', '4', '--retry-delay', '20', '--connect-timeout', '60', '--max-time', '7200',
    '-A', 'licitaciones-abiertas/1.0 (consulta pública gratuita)', '-o', destino, url,
  ], { maxBuffer: 1 << 20 });
}

async function listarAtom(dir) {
  const salida = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const ruta = path.join(dir, e.name);
    if (e.isDirectory()) salida.push(...(await listarAtom(ruta)));
    else if (e.name.endsWith('.atom')) salida.push(ruta);
  }
  return salida;
}

async function cargaInicialZip(feed, cambios, estado) {
  const meses = [];
  for (let k = MESES_INICIALES - 1; k >= 0; k--) {
    const d = new Date(Date.UTC(AHORA.getUTCFullYear(), AHORA.getUTCMonth() - k, 1));
    meses.push(`${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  const base = await fs.mkdtemp(path.join(os.tmpdir(), `lic-${feed.clave}-`));
  try {
    // Descarga los meses a la vez: el servidor es lento por conexión.
    log(`  descargando ZIP mensuales: ${meses.join(', ')}`);
    const descargas = await Promise.all(meses.map(async (m) => {
      const url = feed.url.replace(/\.atom$/, `_${m}.zip`);
      const destino = path.join(base, `${m}.zip`);
      const t0 = Date.now();
      try {
        await descargarArchivo(url, destino);
        const mb = (await fs.stat(destino)).size / 1e6;
        log(`  ${m}.zip descargado: ${mb.toFixed(1)} MB en ${Math.round((Date.now() - t0) / 60000)} min`);
        return { m, destino };
      } catch (e) {
        log(`  ${m}.zip no disponible (${String(e.message).split('\n')[0]})`);
        return null;
      }
    }));

    let leidos = 0;
    for (const d of descargas.filter(Boolean)) {
      const carpeta = path.join(base, d.m);
      await ejecutar('unzip', ['-q', '-o', d.destino, '-d', carpeta], { maxBuffer: 1 << 24 });
      await fs.rm(d.destino);
      const ficheros = await listarAtom(carpeta);
      for (const f of ficheros) procesarPagina(await fs.readFile(f, 'utf8'), feed, cambios, 0, estado);
      await fs.rm(carpeta, { recursive: true, force: true });
      leidos++;
      log(`  ${d.m}: ${ficheros.length} páginas procesadas, ${cambios.size} licitaciones acumuladas`);
    }
    return leidos;
  } finally {
    await fs.rm(base, { recursive: true, force: true });
  }
}

// ---------- programa principal ----------

const lineas = (items) => items.map((x) => JSON.stringify(x)).join(',\n');

async function leerJSON(ruta) {
  return JSON.parse(await fs.readFile(ruta, 'utf8'));
}

async function cargarAnterior() {
  // Formato actual: indice.json + archivos
  try {
    const indice = await leerJSON(path.join(DIR_DATOS, 'indice.json'));
    const archivos = [indice.archivos?.abiertas?.f, ...(indice.archivos?.historico || []).map((h) => h.f)].filter(Boolean);
    const items = [];
    for (const f of archivos) items.push(...((await leerJSON(path.join(DIR_DATOS, f))).items || []));
    return { meta: indice, items };
  } catch {}
  // Formato antiguo (solo abiertas): se reaprovecha
  try {
    const viejo = await leerJSON(path.join(DIR_DATOS, 'licitaciones.json'));
    return { meta: viejo.meta || {}, items: (viejo.items || []).map((x) => ({ s: 'PUB', ...x })) };
  } catch {}
  return { meta: {}, items: [] };
}

async function guardar(meta, items) {
  await fs.mkdir(DIR_DATOS, { recursive: true });
  items.sort((a, b) => (a.id < b.id ? -1 : 1));
  const escritos = new Set(['indice.json']);

  // Abiertas: una licitación por línea, así el historial de git ocupa poco.
  const abiertas = items.filter((x) => x.g === 'A');
  await fs.writeFile(path.join(DIR_DATOS, 'abiertas.json'), `{"items":[\n${lineas(abiertas)}\n]}\n`);
  escritos.add('abiertas.json');

  // Histórico por mes de última actualización, en trozos de MAX_POR_ARCHIVO.
  const porMes = new Map();
  for (const x of items) {
    if (x.g === 'A') continue;
    const mes = x.a.slice(0, 7);
    if (!porMes.has(mes)) porMes.set(mes, []);
    porMes.get(mes).push(x);
  }
  const historico = [];
  for (const mes of [...porMes.keys()].sort().reverse()) {
    const lista = porMes.get(mes);
    for (let k = 0; k * MAX_POR_ARCHIVO < lista.length; k++) {
      const trozo = lista.slice(k * MAX_POR_ARCHIVO, (k + 1) * MAX_POR_ARCHIVO);
      const f = `historico-${mes}-${k + 1}.json`;
      await fs.writeFile(path.join(DIR_DATOS, f), `{"items":[\n${lineas(trozo)}\n]}\n`);
      escritos.add(f);
      const grupos = {};
      for (const x of trozo) grupos[x.g] = (grupos[x.g] || 0) + 1;
      historico.push({ f, mes, n: trozo.length, grupos });
    }
  }

  const totales = {};
  for (const x of items) totales[x.g] = (totales[x.g] || 0) + 1;
  const indice = {
    ...meta,
    total: abiertas.length,
    totales,
    mesesHistorico: MESES_HISTORICO,
    archivos: { abiertas: { f: 'abiertas.json', n: abiertas.length }, historico },
  };
  await fs.writeFile(path.join(DIR_DATOS, 'indice.json'), JSON.stringify(indice) + '\n');

  // Borrar archivos de datos que ya no se usan (incluido el formato antiguo).
  for (const f of await fs.readdir(DIR_DATOS)) {
    if (f.endsWith('.json') && !escritos.has(f)) await fs.rm(path.join(DIR_DATOS, f));
  }
  return { abiertas: abiertas.length, historico: items.length - abiertas.length, archivos: historico.length + 2 };
}

async function main() {
  const anterior = await cargarAnterior();
  const porId = new Map(anterior.items.map((x) => [x.id, x]));
  const fuentesMeta = { ...(anterior.meta.fuentes || {}) };
  let fallos = 0;

  // Una sola vez (botón «completar_municipios»): vuelve a leer los ZIP mensuales solo para añadir el municipio
  // a las licitaciones guardadas antes de que se recogiera. No cambia nada más (ni fechas, ni estados).
  if (process.env.COMPLETAR_MUNICIPIOS === '1') {
    for (const feed of FEEDS) {
      try {
        log(`${feed.nombre}: completando municipios con los ZIP mensuales`);
        const cambios = new Map();
        await cargaInicialZip(feed, cambios, { masReciente: '1970-01-01T00:00:00Z' });
        let n = 0;
        for (const [id, { leida }] of cambios) {
          const x = leida && porId.get(id);
          if (!x || x.om || x.m) continue;
          for (const k of ['m', 'mz', 'om', 'oz']) if (leida.item[k]) x[k] = leida.item[k];
          if (x.om || x.m) n++;
        }
        log(`  ${n} licitaciones completadas con su municipio`);
      } catch (e) {
        log(`  no se pudieron completar los municipios de ${feed.clave}: ${e.message}`);
      }
    }
  }

  for (const feed of FEEDS) {
    const previo = fuentesMeta[feed.clave];
    try {
      const cambios = new Map();
      const estado = { masReciente: previo?.hasta || '1970-01-01T00:00:00Z' };
      let desde = previo?.hasta;
      if (!desde) {
        log(`${feed.nombre}: primera carga (${MESES_INICIALES} meses)`);
        const meses = await cargaInicialZip(feed, cambios, estado);
        desde = meses ? estado.masReciente : new Date(AHORA.getTime() - DIAS_RESPALDO * 864e5).toISOString();
      }
      log(`${feed.nombre}: leyendo novedades desde ${desde}`);
      const paginas = await recorrerFeed(feed, desde, cambios, estado);
      let altas = 0;
      let bajas = 0;
      for (const [id, { leida }] of cambios) {
        if (!leida) { if (porId.delete(id)) bajas++; continue; }
        const antes = porId.get(id);
        // vt: cuándo la vimos por primera vez (para las alertas). En la primera carga se usa su fecha de publicación,
        // para que una recarga completa no haga que todo parezca nuevo.
        const vt = antes?.vt || (previo ? AHORA.toISOString().slice(0, 16) : `${leida.item.a}T00:00`);
        const item = { id, ...leida.item, fp: antes?.fp || leida.item.a, vt };
        // vadj: cuándo vimos por primera vez que estaba adjudicada (para las alertas de empresas).
        if (item.ad?.length) {
          item.vadj = antes?.vadj
            || (antes?.ad?.length || !previo ? `${String(item.fa || item.a || AHORA.toISOString()).slice(0, 10)}T00:00` : AHORA.toISOString().slice(0, 16));
        }
        item.g = grupoDe(item);
        if (conservar(item)) { porId.set(id, item); if (!antes) altas++; }
        else if (porId.delete(id)) bajas++;
      }
      fuentesMeta[feed.clave] = { nombre: feed.nombre, hasta: estado.masReciente, ultimaLectura: AHORA.toISOString(), paginas };
      log(`  ${paginas} páginas leídas · ${cambios.size} con cambios · ${altas} nuevas · ${bajas} retiradas`);
    } catch (e) {
      fallos++;
      log(`  ERROR en ${feed.clave}: ${e.message}. Se mantienen los datos anteriores de esta fuente.`);
    }
  }

  if (fallos === FEEDS.length) {
    console.error('No se pudo leer ninguna fuente. No se guarda nada.');
    process.exit(1);
  }

  // Las licitaciones antiguas, sin municipio: se toma el de la sede del mismo organismo si ya lo conocemos.
  const sedes = new Map();
  for (const x of porId.values()) if (x.om && x.o && !sedes.has(x.o)) sedes.set(x.o, [x.om, x.oz]);
  for (const x of porId.values()) {
    if (x.om || !x.o || !sedes.has(x.o)) continue;
    const [om, oz] = sedes.get(x.o);
    x.om = om; if (oz) x.oz = oz;
  }

  // Recalcular estados (una abierta puede haber cerrado plazo) y aplicar el límite del histórico.
  let retiradas = 0;
  for (const [id, item] of porId) {
    if (!item.s) item.s = 'PUB';
    if (!item.vt) item.vt = `${item.fp || item.a}T00:00`;
    if (item.ad?.length && !item.vadj) item.vadj = `${String(item.fa || item.a || AHORA.toISOString()).slice(0, 10)}T00:00`;
    item.g = grupoDe(item);
    if (!conservar(item)) { porId.delete(id); retiradas++; }
  }

  const meta = {
    actualizado: AHORA.toISOString(),
    fuentes: fuentesMeta,
    provincias: PROVINCIAS,
    comunidades: COMUNIDADES,
    tipos: TIPOS,
    procedimientos: PROCEDIMIENTOS,
    resultados: RESULTADOS,
    grupos: GRUPOS,
  };
  const r = await guardar(meta, [...porId.values()]);
  log(`Listo: ${r.abiertas} en plazo y ${r.historico} en histórico, en ${r.archivos} archivos (${retiradas} retiradas por antigüedad).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
