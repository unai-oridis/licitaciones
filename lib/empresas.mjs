// Empresas adjudicatarias: agrupa las adjudicaciones por empresa para las páginas /empresa/{slug}.
// Lo usan scripts/subir-empresas.mjs (sube los datos a la base de datos D1), scripts/generar-paginas.mjs
// (sitemap, índice de empresas y enlaces) y functions/empresa/[slug].js (muestra la página).
//
// Privacidad: solo se crean páginas de personas jurídicas (sociedades, UTE, asociaciones, fundaciones…).
// Los adjudicatarios que parecen personas físicas (autónomos) no tienen página propia ni se pueden seguir.

import { slug } from './fichas.mjs';

// Forma jurídica al final del nombre («…, S.L.», «… SA (A12345678)») o UTE en cualquier sitio
const FORMA = /(^|[^a-z0-9])(s\.?\s?l\.?\s?(u|l|p|ne)?|s\.?\s?a\.?\s?(u|t|l)?|s\.?\s?coop|c\.?\s?b|s\.?\s?c\.?\s?p?|s\.?r\.?l|ltd|limited|gmbh|inc|llc|sas|b\.?v|a\.?g|ab|oy|s\.?p\.?a|a\.?i\.?e|s\.?m\.?e)[\s.,]*(\([^)]*\))?[\s.,]*$/i;
const UTE = /(^|[^a-z0-9])u\.?\s?t\.?\s?e(?=[^a-z0-9]|$)/i;
const ORGANIZACION = /(sociedad|soziet|asociaci|elkarte|fundaci|cooperativ|kooperatib|consorcio|agrupaci|federaci|corporaci|instituto|universi|hospital|colegio|centro|mutua|empresa|grupo|club|ayuntamiento|diputaci|comunidad de|compa[nñ]i|company|associaci|fundaci|taldea|confederaci)/i;
const CIF = /(^|[^a-z0-9])[abcdefghjnpqrsuvw]-?\d{7}[0-9a-j](?=[^a-z0-9]|$)/i;

export function esPersonaJuridica(nombre) {
  const n = String(nombre || '');
  return FORMA.test(n) || UTE.test(n) || ORGANIZACION.test(n) || CIF.test(n);
}

// Formas jurídicas y CIF que se quitan para agrupar variantes del mismo nombre
// («SACYR FACILITIES, S.A.» y «SACYR FACILITIES SA» son la misma empresa).
const FINALES = new Set(['s', 'l', 'a', 'u', 'sl', 'sa', 'slu', 'sau', 'sll', 'slp', 'slne', 'sal', 'sat', 'scoop', 'coop', 'cb', 'sc', 'scp',
  'srl', 'ltd', 'limited', 'gmbh', 'inc', 'llc', 'sas', 'bv', 'ag', 'ab', 'oy', 'spa', 'sociedad', 'limitada', 'anonima', 'unipersonal',
  'laboral', 'cooperativa', 'm', 'sme', 'y', 'de', 'del', 'e']);
export function slugEmpresa(nombre) {
  const sinCif = String(nombre || '').replace(/\(?\b[abcdefghjnpqrsuvw]-?\d{7}[0-9a-j]\b\)?/gi, ' ');
  const partes = slug(sinCif).split('-').filter(Boolean);
  while (partes.length > 1 && FINALES.has(partes[partes.length - 1])) partes.pop();
  return partes.join('-').slice(0, 80).replace(/-+$/, '');
}
export const rutaEmpresa = (nombre) => `/empresa/${slugEmpresa(nombre)}`;
export const tienePagina = (nombre) => esPersonaJuridica(nombre) && slugEmpresa(nombre).length >= 3;

export const MAX_ADJ_POR_EMPRESA = 150;
// Orden de los campos de cada adjudicación guardada
export const CAMPOS_ADJ = ['id', 't', 'o', 'p', 'c', 'i', 'of', 'lo', 'fa', 'u', 'g'];
export const adjComoObjeto = (a) => Object.fromEntries(CAMPOS_ADJ.map((k, i) => [k, a[i]]));

// items: licitaciones (con x.ad). Devuelve Map slug -> { nombre, n, total, adj: [[...CAMPOS_ADJ]] }
export function agruparEmpresas(items, hoy = new Date().toISOString().slice(0, 10)) {
  const porSlug = new Map();
  for (const x of items) {
    if (!(x.g === 'J' || x.g === 'F') || !x.ad?.length) continue;
    const fa = String(x.fa || x.a || '').slice(0, 10);
    if (!fa || fa > hoy) continue; // fechas imposibles (errores de origen)
    const vistas = new Set();
    for (const [nombre, importe, ofertas] of x.ad) {
      if (!tienePagina(nombre)) continue;
      const s = slugEmpresa(nombre);
      if (vistas.has(s)) continue; // varios lotes de la misma licitación: una sola línea
      vistas.add(s);
      const lotes = x.ad.filter(([n]) => slugEmpresa(n) === s);
      const suma = lotes.reduce((t, [, imp]) => t + (imp || 0), 0);
      if (!porSlug.has(s)) porSlug.set(s, { nombres: new Map(), n: 0, total: 0, adj: [] });
      const e = porSlug.get(s);
      e.nombres.set(nombre, (e.nombres.get(nombre) || 0) + 1);
      e.n++;
      e.total += suma;
      // Formato compacto (para ocupar poco en la base de datos): ver CAMPOS_ADJ
      e.adj.push([x.id, String(x.t || '').slice(0, 220), String(x.o || '').slice(0, 120), x.p || '', (x.c || [])[0] || '',
        Math.round(suma || importe || 0), lotes.length === 1 ? ofertas || 0 : 0, lotes.length, fa, x.u, x.g]);
    }
  }
  const resultado = new Map();
  for (const [s, e] of porSlug) {
    // El nombre que más se repite es el que se muestra
    const nombre = [...e.nombres.entries()].sort((a, b) => b[1] - a[1])[0][0].replace(/\s+/g, ' ').trim();
    e.adj.sort((a, b) => (a[8] < b[8] ? 1 : -1));
    resultado.set(s, { nombre, n: e.n, total: Math.round(e.total), adj: e.adj.slice(0, MAX_ADJ_POR_EMPRESA) });
  }
  return resultado;
}
