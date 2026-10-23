// Recuadro para insertar en otras webs (/recuadro/{clave}): las últimas licitaciones abiertas de una provincia,
// un sector, un oficio, un sector en una provincia o un municipio, con enlace a LicitaEmpresa.
// scripts/subir-empresas.mjs guarda en D1 (tabla «recuadros») las listas ya preparadas; los municipios se leen
// de la tabla «municipios». functions/recuadro/[clave].js monta el recuadro y /recuadro/ (scripts/generar-paginas.mjs)
// es la página para elegirlo y copiar el código.

import { slug } from './fichas.mjs';
import { CPV_SECTORES } from './cpv.mjs';
import { OFICIOS, enOficio } from './oficios.mjs';
import { nombreOrganismo } from './organismos.mjs';
import { PROVINCIAS } from '../scripts/territorio.mjs';

export const MAX_ITEMS = 10;
export const MIN_COMBO = 3; // como las páginas sector + provincia
export const CAMPOS = ['id', 't', 'o', 'i', 'f'];
export const comoObjeto = (a) => Object.fromEntries(CAMPOS.map((k, i) => [k, a[i]]));

const minus = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const codProv = Object.keys(PROVINCIAS).filter((p) => p !== '00' && p !== '99');
const slugProv = (p) => slug(PROVINCIAS[p]);
export const SECTORES = CPV_SECTORES.filter(([c]) => c.length === 2).map(([c, n]) => ({ c, n, s: slug(n) }));

// abiertas: licitaciones en plazo. Devuelve Map clave -> { titulo, url, n, items }
export function construirRecuadros(abiertas) {
  const recientes = [...abiertas].sort((a, b) => ((b.vt || '') > (a.vt || '') ? 1 : (b.vt || '') < (a.vt || '') ? -1 : 0));
  const res = new Map();
  const poner = (clave, titulo, url, lista) => {
    if (!lista.length) return;
    res.set(clave, {
      titulo, url, n: lista.length,
      items: lista.slice(0, MAX_ITEMS).map((x) => [x.id, String(x.t || '').slice(0, 200), nombreOrganismo(x.o).slice(0, 100), Math.round(x.i || 0), x.f || '']),
    });
  };
  const enSector = (x, c) => (x.c || []).some((k) => k.startsWith(c));

  poner('espana', 'Licitaciones abiertas en España', '/', recientes);
  for (const p of codProv) {
    const dep = recientes.filter((x) => x.p === p);
    poner(`provincia-${slugProv(p)}`, `Licitaciones abiertas en ${PROVINCIAS[p]}`, `/licitaciones/${slugProv(p)}/`, dep);
    for (const s of SECTORES) {
      const l = dep.filter((x) => enSector(x, s.c));
      if (l.length >= MIN_COMBO) poner(`provincia-${slugProv(p)}-sector-${s.s}`, `Licitaciones de ${minus(s.n)} en ${PROVINCIAS[p]}`, `/licitaciones/${slugProv(p)}/${s.s}/`, l);
    }
  }
  for (const s of SECTORES) poner(`sector-${s.s}`, `Licitaciones de ${minus(s.n)}`, `/licitaciones/sector/${s.s}/`, recientes.filter((x) => enSector(x, s.c)));
  for (const [s, n, frase, pref] of OFICIOS) poner(`oficio-${s}`, `Licitaciones ${frase}`, `/licitaciones/oficio/${s}/`, recientes.filter((x) => enOficio(x, pref)));
  return res;
}

// Lista de opciones para la página /recuadro/ (provincias, sectores, oficios)
export function opcionesRecuadro() {
  return {
    provincias: codProv.map((p) => [slugProv(p), PROVINCIAS[p]]).sort((a, b) => a[1].localeCompare(b[1], 'es')),
    sectores: SECTORES.map((s) => [s.s, s.n]),
    oficios: OFICIOS.map(([s, n]) => [s, n]),
  };
}
