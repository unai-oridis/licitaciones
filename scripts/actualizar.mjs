// Descarga las licitaciones de la Plataforma de Contratación del Sector Público
// (perfiles alojados + plataformas autonómicas agregadas), se queda solo con las
// que están en plazo y guarda el resultado en public/data/licitaciones.json.
//
// Funciona de forma incremental: la primera vez recorre DIAS_INICIALES días hacia
// atrás; después solo lee lo publicado desde la última ejecución.

import fs from 'node:fs/promises';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import { COMUNIDADES, PROVINCIAS, provinciaDesdeNuts, provinciaDesdeCP } from './territorio.mjs';

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

const RUTA_DATOS = process.env.RUTA_DATOS || 'public/data/licitaciones.json';
const DIAS_INICIALES = Number(process.env.DIAS_INICIALES || 120);
const MAX_PAGINAS = Number(process.env.MAX_PAGINAS || 3000);
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
    ['entry', 'deleted-entry', 'link', 'ProcurementProjectLot', 'RequiredCommodityClassification'].includes(nombre),
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
        signal: AbortSignal.timeout(120_000),
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
  for (const lugar of lugares) {
    if (!lugar) continue;
    const porNuts = provinciaDesdeNuts(txt(lugar.CountrySubentityCode));
    if (porNuts && porNuts !== '00') return porNuts;
    const porCP = provinciaDesdeCP(txt(lugar.Address?.PostalZone));
    if (porCP) return porCP;
    if (porNuts) return porNuts;
  }
  const party = cfs.LocatedContractingParty?.Party;
  return provinciaDesdeCP(txt(party?.PostalAddress?.PostalZone)) || '99';
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

function sigueAbierta(item) {
  if (item.f) return item.f >= AHORA_MADRID;
  return item.a >= LIMITE_SIN_PLAZO;
}

// ---------- recorrido de un feed ----------

async function recorrerFeed(feed, desdeIso) {
  const desde = ms(desdeIso);
  const cambios = new Map(); // id -> { ts, leida | null (borrada) }
  let url = feed.url;
  let paginas = 0;
  let masReciente = desdeIso;

  while (url && paginas < MAX_PAGINAS) {
    const xml = await descargar(url);
    paginas++;
    const doc = parser.parse(xml).feed || {};
    let masAntigua = Infinity;

    for (const e of doc.entry || []) {
      const ts = ms(txt(e.updated));
      masAntigua = Math.min(masAntigua, ts);
      if (ts <= desde) continue;
      if (ts > ms(masReciente)) masReciente = txt(e.updated);
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

    if (paginas % 20 === 0) log(`  ${feed.clave}: ${paginas} páginas, ${cambios.size} licitaciones con cambios`);
    if (masAntigua <= desde) break;

    const siguiente = (doc.link || []).find((l) => l['@_rel'] === 'next');
    url = siguiente ? new URL(siguiente['@_href'], url).href : null;
  }
  if (paginas >= MAX_PAGINAS) log(`  aviso: ${feed.clave} alcanzó el máximo de ${MAX_PAGINAS} páginas`);
  return { cambios, paginas, masReciente };
}

// ---------- programa principal ----------

async function cargarAnterior() {
  try {
    const datos = JSON.parse(await fs.readFile(RUTA_DATOS, 'utf8'));
    return { meta: datos.meta || {}, items: datos.items || [] };
  } catch {
    return { meta: {}, items: [] };
  }
}

async function guardar(meta, items) {
  items.sort((a, b) => (a.id < b.id ? -1 : 1));
  // Una licitación por línea: así el historial de git ocupa poco.
  const texto = `{"meta":${JSON.stringify(meta)},\n"items":[\n${items.map((x) => JSON.stringify(x)).join(',\n')}\n]}\n`;
  await fs.mkdir(path.dirname(RUTA_DATOS), { recursive: true });
  await fs.writeFile(RUTA_DATOS, texto);
}

async function main() {
  const anterior = await cargarAnterior();
  const porId = new Map(anterior.items.map((x) => [x.id, x]));
  const fuentesMeta = { ...(anterior.meta.fuentes || {}) };
  let fallos = 0;

  for (const feed of FEEDS) {
    const previo = fuentesMeta[feed.clave];
    const desde = previo?.hasta || new Date(AHORA.getTime() - DIAS_INICIALES * 864e5).toISOString();
    log(`${feed.nombre}: leyendo cambios desde ${desde}${previo ? '' : ' (primera carga)'}`);
    try {
      const { cambios, paginas, masReciente } = await recorrerFeed(feed, desde);
      let altas = 0;
      let bajas = 0;
      for (const [id, { leida }] of cambios) {
        const abierta = leida && leida.estado === 'PUB' && sigueAbierta(leida.item);
        if (abierta) {
          const antes = porId.get(id);
          porId.set(id, { id, ...leida.item, fp: antes?.fp || leida.item.a });
          if (!antes) altas++;
        } else if (porId.delete(id)) {
          bajas++;
        }
      }
      fuentesMeta[feed.clave] = { nombre: feed.nombre, hasta: masReciente, ultimaLectura: AHORA.toISOString(), paginas };
      log(`  ${paginas} páginas leídas · ${cambios.size} con cambios · ${altas} nuevas abiertas · ${bajas} cerradas`);
    } catch (e) {
      fallos++;
      log(`  ERROR en ${feed.clave}: ${e.message}. Se mantienen los datos anteriores de esta fuente.`);
    }
  }

  if (fallos === FEEDS.length) {
    console.error('No se pudo leer ninguna fuente. No se guarda nada.');
    process.exit(1);
  }

  // Quitar las que ya han cerrado plazo.
  let caducadas = 0;
  for (const [id, item] of porId) if (!sigueAbierta(item)) { porId.delete(id); caducadas++; }

  const items = [...porId.values()];
  const meta = {
    actualizado: AHORA.toISOString(),
    total: items.length,
    fuentes: fuentesMeta,
    provincias: PROVINCIAS,
    comunidades: COMUNIDADES,
    tipos: TIPOS,
    procedimientos: PROCEDIMIENTOS,
  };
  await guardar(meta, items);
  log(`Listo: ${items.length} licitaciones abiertas (${caducadas} retiradas por fin de plazo).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
