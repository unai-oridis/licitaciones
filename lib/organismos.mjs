// Organismos convocantes: agrupa las licitaciones por organismo para las páginas /organismo/{slug}.
// Lo usan scripts/subir-empresas.mjs (sube los datos a D1), scripts/generar-paginas.mjs (sitemap, índice y enlaces)
// y functions/organismo/[slug].js (muestra la página).

import { slug } from './fichas.mjs';
import { tienePagina, slugEmpresa } from './empresas.mjs';

// Cargos u órganos internos que se quitan del final del nombre («Ayuntamiento de Azkoitia-Alcalde»)
const CARGO = '(alcald|pleno|junta de gobierno|presiden|concejal|teniente|secretar|gerente|director|consejo de administraci|comisi[oó]n|mesa|[oó]rgano|[aá]rea|departamento|servicio de contrataci|delegaci|vicealcald|diputado|consejer|rector|subdirec)';
const COLA = new RegExp(`\\s*[-–]\\s*${CARGO}[^]*$`, 'i');
// Entidades locales: «Junta de Gobierno del Ayuntamiento de Málaga» → «Ayuntamiento de Málaga»
const LOCAL = /\b((?:Excmo\.?\s+)?(?:Ayuntamiento|Ajuntament|Concello|Udala|Diputaci[oó]n(?: Foral| Provincial)?|Diputació|Cabildo(?: Insular)?|Consell(?: Comarcal| Insular)?|Mancomunidad|Comarca)\s+(?:de\s+la\s+|de\s+los\s+|de\s+|del\s+|d['’]\s*|da\s+|do\s+)?[^,;()]+)/i;

export function nombreOrganismo(o) {
  let n = String(o || '').replace(/\s+/g, ' ').trim();
  n = n.replace(COLA, '').trim();
  const m = n.match(LOCAL);
  if (m) n = m[1].replace(COLA, '').replace(/^Excmo\.?\s+/i, '').trim();
  return n.replace(/[\s.,;:-]+$/, '');
}
export function slugOrganismo(o) {
  const s = slug(nombreOrganismo(o));
  return s.length <= 90 ? s : s.slice(0, 90).replace(/-[^-]*$/, '');
}
export const rutaOrganismo = (o) => `/organismo/${slugOrganismo(o)}`;

export const MIN_LICITACIONES = 1;   // por debajo, el organismo no tiene página propia (1 = todos, así el buscador puede enlazarlos siempre)
export const MAX_ABIERTAS = 60;
export const MAX_ADJ = 60;
// Formato compacto de cada licitación guardada
export const CAMPOS_ABIERTA = ['id', 't', 'i', 'f', 'c', 'g', 'u', 'a'];
export const CAMPOS_ADJUDICADA = ['id', 't', 'i', 'fa', 'emp', 'imp', 'of', 'nad', 'u', 'g'];
export const comoObjeto = (campos, a) => Object.fromEntries(campos.map((k, i) => [k, a[i]]));

// items: todas las licitaciones. Devuelve Map slug -> { nombre, p, n, nAbiertas, nAdj, totalAdj, abiertas, adj, empresas }
export function agruparOrganismos(items, hoy = new Date().toISOString().slice(0, 10)) {
  const grupos = new Map();
  for (const x of items) {
    if (!x.o) continue;
    const s = slugOrganismo(x.o);
    if (s.length < 3) continue;
    if (!grupos.has(s)) grupos.set(s, { nombres: new Map(), provs: new Map(), items: [] });
    const g = grupos.get(s);
    const n = nombreOrganismo(x.o);
    g.nombres.set(n, (g.nombres.get(n) || 0) + 1);
    if (x.p) g.provs.set(x.p, (g.provs.get(x.p) || 0) + 1);
    g.items.push(x);
  }
  const resultado = new Map();
  for (const [s, g] of grupos) {
    if (g.items.length < MIN_LICITACIONES) continue;
    const nombre = [...g.nombres.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const p = [...g.provs.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    const abiertas = g.items.filter((x) => x.g === 'A' || x.g === 'P')
      .sort((a, b) => ((a.f || '9999') < (b.f || '9999') ? -1 : 1));
    const adj = g.items.filter((x) => (x.g === 'J' || x.g === 'F') && x.ad?.length)
      .map((x) => ({ x, fa: String(x.fa || x.a || '').slice(0, 10) }))
      .filter(({ fa }) => fa && fa <= hoy)
      .sort((a, b) => (a.fa < b.fa ? 1 : -1));
    // Empresas que más contratos le ganan (solo personas jurídicas, como en las páginas de empresas)
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
      nombre, p, n: g.items.length, nAbiertas: abiertas.length, nAdj: adj.length, totalAdj: Math.round(totalAdj),
      abiertas: abiertas.slice(0, MAX_ABIERTAS).map((x) => [x.id, String(x.t || '').slice(0, 220), Math.round(x.i || 0), x.f || '', (x.c || [])[0] || '', x.g, x.u, String(x.a || '').slice(0, 10)]),
      adj: adj.slice(0, MAX_ADJ).map(({ x, fa }) => {
        const [e, imp, of] = x.ad[0];
        return [x.id, String(x.t || '').slice(0, 220), Math.round(x.i || 0), fa, e, Math.round(imp || 0), of || 0, x.nad || x.ad.length, x.u, x.g];
      }),
      empresas: [...emp.entries()].sort((a, b) => b[1].n - a[1].n || b[1].imp - a[1].imp).slice(0, 10)
        .map(([k, e]) => [e.nombre, k, e.n, Math.round(e.imp)]),
    });
  }
  return resultado;
}

// «del Ayuntamiento de Irun», «de la Diputación de Álava», «de OSAKIDETZA»
const MASCULINOS = /^(ayuntamiento|ajuntament|concello|consell|cabildo|consorcio|consorci|servicio|servei|instituto|institut|gobierno|govern|departamento|departament|ministerio|hospital|organismo|patronato|ente|centro|museo|puerto|port|parlamento|tribunal|consejo|ayto)\b/i;
const FEMENINOS = /^(diputaci[oó]n|diputació|mancomunidad|universidad|universitat|junta|consejer[ií]a|conselleria|agencia|agència|comarca|direcci[oó]n|direcció|gerencia|gerència|fundaci[oó]n|fundació|empresa|sociedad|confederaci[oó]n|comunidad|comunitat|autoridad|entidad|secretar[ií]a|subdirecci[oó]n|delegaci[oó]n|administraci[oó]n|corporaci[oó]n|intervenci[oó]n|jefatura|presidencia|vicepresidencia|consejer[ií]a|tesorer[ií]a|mutua|federaci[oó]n|c[aá]mara)\b/i;
export function deOrganismo(nombre) {
  if (MASCULINOS.test(nombre)) return `del ${nombre}`;
  if (FEMENINOS.test(nombre)) return `de la ${nombre}`;
  return `de ${nombre}`;
}
