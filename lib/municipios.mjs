// Municipios: agrupa las licitaciones por municipio para las páginas /municipio/{slug}.
// Una licitación cuenta en un municipio si se ejecuta allí (campo m) o, si no se indica, si el organismo
// que la convoca tiene allí su sede (campo om). Lo guarda scripts/actualizar.mjs.
// Lo usan scripts/subir-empresas.mjs (sube los datos a D1), scripts/generar-paginas.mjs (sitemap, índice y enlaces)
// y functions/municipio/[slug].js (muestra la página).

import { slug } from './fichas.mjs';
import { tienePagina, slugEmpresa } from './empresas.mjs';
import { slugOrganismo, nombreOrganismo } from './organismos.mjs';
import { PROVINCIAS } from '../scripts/territorio.mjs';

export const MIN_LICITACIONES = 2;   // por debajo, el municipio no tiene página propia
export const MAX_ABIERTAS = 60;
export const MAX_ADJ = 40;
export const CAMPOS_ABIERTA = ['id', 't', 'o', 'i', 'f', 'c', 'g', 'u'];
export const CAMPOS_ADJUDICADA = ['id', 't', 'o', 'i', 'fa', 'emp', 'imp', 'of', 'nad', 'u', 'g'];
export const comoObjeto = (campos, a) => Object.fromEntries(campos.map((k, i) => [k, a[i]]));

const NOMBRES_PROV = new Set(Object.values(PROVINCIAS).flatMap((n) => n.split('/')).map((n) => slug(n)));
const MINUSCULAS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'i', 'e', 'en', 'a', 'o', 'da', 'do', 'das', 'dos', 'les', 'els', "d'", "l'"]);

// Nombres que aparecen de varias formas: se unifican (clave: slug del nombre + código de provincia)
const ALIAS = {
  'san-sebastian|20': 'Donostia-San Sebastián', 'donostia|20': 'Donostia-San Sebastián',
  'vitoria|01': 'Vitoria-Gasteiz', 'gasteiz|01': 'Vitoria-Gasteiz',
  'bilbo|48': 'Bilbao', 'pamplona|31': 'Pamplona/Iruña', 'iruna|31': 'Pamplona/Iruña', 'pamplona-iruna|31': 'Pamplona/Iruña',
  'la-coruna|15': 'A Coruña', 'coruna|15': 'A Coruña', 'orense|32': 'Ourense', 'lerida|25': 'Lleida', 'gerona|17': 'Girona',
  'alacant|03': 'Alicante/Alacant', 'alicante|03': 'Alicante/Alacant',
  'castellon-de-la-plana|12': 'Castelló de la Plana', 'castellon|12': 'Castelló de la Plana', 'castello|12': 'Castelló de la Plana',
  'valencia|46': 'València', 'palma-de-mallorca|07': 'Palma', 'elche|03': 'Elche/Elx', 'elx|03': 'Elche/Elx',
  'gijon|33': 'Gijón', 'xixon|33': 'Gijón', 'renteria|20': 'Errenteria', 'pasajes|20': 'Pasaia', 'fuenterrabia|20': 'Hondarribia',
  'mondragon|20': 'Arrasate-Mondragón', 'arrasate|20': 'Arrasate-Mondragón', 'guecho|48': 'Getxo', 'baracaldo|48': 'Barakaldo',
  'santa-cruz-de-tenerife|38': 'Santa Cruz de Tenerife', 'las-palmas|35': 'Las Palmas de Gran Canaria',
};

function titulo(s) {
  return s.toLowerCase().split(/(\s+|-|\/)/).map((w, i) => {
    if (!w.trim() || w === '-' || w === '/') return w;
    if (i > 0 && MINUSCULAS.has(w)) return w;
    const ap = w.match(/^([dl]['’])(.*)$/);
    if (ap) return i > 0 ? ap[1] + ap[2].charAt(0).toUpperCase() + ap[2].slice(1) : ap[1].toUpperCase() + ap[2].charAt(0).toUpperCase() + ap[2].slice(1);
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join('');
}

// Limpia el nombre: «28001 MADRID», «Pasaia (Gipuzkoa)», «ALCALÁ DE HENARES» → «Madrid», «Pasaia», «Alcalá de Henares»
export function limpiarMunicipio(nombre) {
  let n = String(nombre || '').replace(/\s+/g, ' ').trim()
    .replace(/^\d{4,5}\s*[-,]?\s*/, '').replace(/\s*[-,]?\s*\d{5}$/, '')
    .replace(/\s*\/\s*/g, '/').replace(/\s+-\s+/g, '-');
  const par = n.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
  if (par && (NOMBRES_PROV.has(slug(par[2])) || /^(espa[ñn]a|spain)$/i.test(par[2]))) n = par[1];
  n = n.replace(/[\s.,;:]+$/, '');
  if (!/[a-zà-ÿ]/.test(n)) n = titulo(n); // estaba todo en mayúsculas
  else if (n === n.toLowerCase()) n = titulo(n);
  return n;
}

const provDeCP = (z) => (z && PROVINCIAS[z.slice(0, 2)] && Number(z.slice(0, 2)) <= 52 ? z.slice(0, 2) : '');
const provValida = (p) => p && p !== '00' && p !== '99' && PROVINCIAS[p];

// Municipio de una licitación: { nombre, p } o null
export function municipioDe(x) {
  const crudo = x.m || x.om;
  if (!crudo) return null;
  const nombre = limpiarMunicipio(crudo);
  const s = slug(nombre);
  if (s.length < 2 || /^\d+$/.test(s) || /^(espana|spain|varios|varias|todo|toda|todos|nacional|sin-especificar)$/.test(s)) return null;
  const p = provDeCP(x.m ? x.mz : x.oz) || (provValida(x.p) ? x.p : '');
  if (!p) return null;
  return { nombre: ALIAS[`${s}|${p}`] || nombre, p };
}

export function slugMunicipio(nombre, p) {
  const s = slug(nombre);
  const sp = slug(PROVINCIAS[p] || '');
  return s === sp ? s : `${s}-${sp}`;
}
export const rutaMunicipio = (nombre, p) => `/municipio/${slugMunicipio(nombre, p)}`;

// items: todas las licitaciones. Devuelve Map slug -> { nombre, p, n, nAbiertas, nAdj, totalAdj, abiertas, adj, organismos, empresas }
export function agruparMunicipios(items, hoy = new Date().toISOString().slice(0, 10)) {
  const grupos = new Map();
  for (const x of items) {
    const mun = municipioDe(x);
    if (!mun) continue;
    const clave = `${slug(mun.nombre)}|${mun.p}`;
    if (!grupos.has(clave)) grupos.set(clave, { nombres: new Map(), p: mun.p, items: [] });
    const g = grupos.get(clave);
    g.nombres.set(mun.nombre, (g.nombres.get(mun.nombre) || 0) + 1);
    g.items.push(x);
  }
  // Nombres bilingües («Donostia-San Sebastián», «Vitoria-Gasteiz»): se unen las formas cortas a la completa
  const porProv = new Map();
  for (const [clave, g] of grupos) {
    if (!porProv.has(g.p)) porProv.set(g.p, new Map());
    porProv.get(g.p).set(clave.split('|')[0], clave);
  }
  for (const [clave, g] of [...grupos]) {
    const s = clave.split('|')[0];
    const nombre = [...g.nombres.entries()].sort((a, b) => b[1] - a[1])[0][0];
    if (!/[/-]/.test(nombre)) continue;
    for (const mitad of nombre.split(/[/-]/).map((m) => slug(m)).filter((m) => m && m !== s)) {
      const otra = porProv.get(g.p).get(mitad);
      if (!otra || otra === clave || !grupos.has(otra)) continue;
      const o = grupos.get(otra);
      g.items.push(...o.items);
      for (const [n, k] of o.nombres) g.nombres.set(nombre, (g.nombres.get(nombre) || 0) + k);
      grupos.delete(otra);
    }
  }

  const resultado = new Map();
  for (const g of grupos.values()) {
    if (g.items.length < MIN_LICITACIONES) continue;
    // El nombre más usado, preferiblemente con tildes y mayúsculas bien puestas
    const nombre = [...g.nombres.entries()].sort((a, b) => b[1] - a[1] || (/[áéíóúñàèòç]/i.test(b[0]) ? 1 : 0) - (/[áéíóúñàèòç]/i.test(a[0]) ? 1 : 0))[0][0];
    const s = slugMunicipio(nombre, g.p);
    if (resultado.has(s)) continue;
    const abiertas = g.items.filter((x) => x.g === 'A' || x.g === 'P')
      .sort((a, b) => ((a.f || '9999') < (b.f || '9999') ? -1 : 1));
    const adj = g.items.filter((x) => (x.g === 'J' || x.g === 'F') && x.ad?.length)
      .map((x) => ({ x, fa: String(x.fa || x.a || '').slice(0, 10) }))
      .filter(({ fa }) => fa && fa <= hoy)
      .sort((a, b) => (a.fa < b.fa ? 1 : -1));
    const org = new Map();
    for (const x of g.items) {
      if (!x.o) continue;
      const k = slugOrganismo(x.o);
      const e = org.get(k) || { nombre: nombreOrganismo(x.o), n: 0 };
      e.n++; org.set(k, e);
    }
    const emp = new Map();
    let totalAdj = 0;
    for (const { x } of adj) {
      const vistas = new Set();
      for (const [nom, imp] of x.ad) {
        totalAdj += imp || 0;
        if (!tienePagina(nom)) continue;
        const k = slugEmpresa(nom);
        if (vistas.has(k)) continue;
        vistas.add(k);
        const e = emp.get(k) || { nombre: nom, n: 0, imp: 0 };
        e.n++; e.imp += imp || 0;
        emp.set(k, e);
      }
    }
    resultado.set(s, {
      nombre, p: g.p, n: g.items.length, nAbiertas: abiertas.length, nAdj: adj.length, totalAdj: Math.round(totalAdj),
      abiertas: abiertas.slice(0, MAX_ABIERTAS).map((x) => [x.id, String(x.t || '').slice(0, 220), nombreOrganismo(x.o).slice(0, 120), Math.round(x.i || 0), x.f || '', (x.c || [])[0] || '', x.g, x.u]),
      adj: adj.slice(0, MAX_ADJ).map(({ x, fa }) => {
        const [e, imp, of] = x.ad[0];
        return [x.id, String(x.t || '').slice(0, 220), nombreOrganismo(x.o).slice(0, 120), Math.round(x.i || 0), fa, e, Math.round(imp || 0), of || 0, x.nad || x.ad.length, x.u, x.g];
      }),
      organismos: [...org.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 12).map(([k, e]) => [e.nombre, k, e.n]),
      empresas: [...emp.entries()].sort((a, b) => b[1].n - a[1].n || b[1].imp - a[1].imp).slice(0, 10)
        .map(([k, e]) => [e.nombre, k, e.n, Math.round(e.imp)]),
    });
  }
  return resultado;
}
