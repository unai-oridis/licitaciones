// Sube a la base de datos D1 de Cloudflare los datos de las páginas que se montan al visitarlas:
//   tabla «empresas»   → /empresa/{slug}   (functions/empresa/[slug].js)
//   tabla «organismos» → /organismo/{slug} (functions/organismo/[slug].js)
//   tabla «municipios» → /municipio/{slug} (functions/municipio/[slug].js)
//   tabla «recuadros»  → /recuadro/{clave} (functions/recuadro/[clave].js), el recuadro para otras webs
// Solo escribe las filas que han cambiado, para no pasar del límite gratuito de escrituras de D1.
//
// Variables de entorno (secretos de GitHub): CF_ACCOUNT_ID, CF_D1_ID, CF_API_TOKEN

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { agruparEmpresas } from '../lib/empresas.mjs';
import { agruparOrganismos } from '../lib/organismos.mjs';
import { agruparMunicipios } from '../lib/municipios.mjs';
import { construirRecuadros } from '../lib/recuadros.mjs';

const DIR_DATOS = process.env.DIR_DATOS || 'public/data';
const MAX_ESCRITURAS = Number(process.env.MAX_ESCRITURAS || 40000); // D1 gratis: 100.000 filas escritas al día
const EN_PARALELO = 6;
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

async function d1(sql, params = []) {
  const { CF_ACCOUNT_ID, CF_D1_ID, CF_API_TOKEN } = process.env;
  for (let intento = 1; ; intento++) {
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_ID}/query`, {
      method: 'POST',
      headers: { authorization: `Bearer ${CF_API_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ sql, params }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok && d.success !== false) return d.result?.[0]?.results || [];
    if (intento >= 4) throw new Error(`D1: ${r.status} ${JSON.stringify(d.errors || d).slice(0, 300)}`);
    await new Promise((res) => setTimeout(res, intento * 2000));
  }
}

async function enParalelo(tareas, n) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < tareas.length) await tareas[i++](); }));
}

const hash = (texto) => crypto.createHash('sha1').update(texto).digest('base64').slice(0, 12);

// filas: [[slug, nombre, n, total, datosJSON]] ordenadas por importancia; devuelve cuántas se escribieron
async function sincronizar(tabla, filas, cupo) {
  await d1(`CREATE TABLE IF NOT EXISTS ${tabla} (
    slug TEXT PRIMARY KEY, nombre TEXT NOT NULL, n INTEGER NOT NULL, total INTEGER NOT NULL,
    ${tabla === 'empresas' ? 'adj' : 'datos'} TEXT NOT NULL, h TEXT NOT NULL, actualizado TEXT NOT NULL)`);
  const col = tabla === 'empresas' ? 'adj' : 'datos';
  const existentes = new Map((await d1(`SELECT slug, h FROM ${tabla}`)).map((r) => [r.slug, r.h]));
  const ahora = new Date().toISOString().slice(0, 16);
  const nuevas = new Set(filas.map((f) => f[0]));
  const cambiadas = [];
  for (const [s, nombre, n, total, datos] of filas) {
    const h = hash(`${nombre}|${n}|${total}|${datos}`);
    if (existentes.get(s) !== h) cambiadas.push([s, nombre, n, total, datos, h, ahora]);
  }
  const borrar = [...existentes.keys()].filter((s) => !nuevas.has(s));
  const aEscribir = cambiadas.slice(0, Math.max(0, cupo - borrar.length));
  log(`${tabla}: ${filas.length} en total, ${cambiadas.length} nuevas o cambiadas, ${borrar.length} para borrar`
    + (aEscribir.length < cambiadas.length ? ` (ahora se escriben ${aEscribir.length}; el resto, en la próxima actualización)` : ''));

  // 7 valores por fila; D1 admite 100 por consulta → 14 filas por consulta (o menos si son muy grandes)
  const tareas = [];
  let lote = [], bytes = 0;
  const cerrar = () => {
    if (!lote.length) return;
    const l = lote; lote = []; bytes = 0;
    tareas.push(() => d1(
      `INSERT INTO ${tabla} (slug, nombre, n, total, ${col}, h, actualizado) VALUES ${l.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ')}
       ON CONFLICT(slug) DO UPDATE SET nombre = excluded.nombre, n = excluded.n, total = excluded.total,
       ${col} = excluded.${col}, h = excluded.h, actualizado = excluded.actualizado`, l.flat()));
  };
  for (const f of aEscribir) {
    if (lote.length >= 14 || bytes + f[4].length > 600000) cerrar();
    lote.push(f); bytes += f[4].length;
  }
  cerrar();
  for (let i = 0; i < borrar.length; i += 90) {
    const b = borrar.slice(i, i + 90);
    tareas.push(() => d1(`DELETE FROM ${tabla} WHERE slug IN (${b.map(() => '?').join(', ')})`, b));
  }
  let hechas = 0;
  await enParalelo(tareas.map((t) => async () => { await t(); if (++hechas % 200 === 0) log(`  ${tabla}: ${hechas}/${tareas.length} lotes`); }), EN_PARALELO);
  log(`  ${tabla}: listo (${aEscribir.length} escritas, ${borrar.length} borradas)`);
  return aEscribir.length + borrar.length;
}

async function main() {
  if (!process.env.CF_ACCOUNT_ID || !process.env.CF_D1_ID || !process.env.CF_API_TOKEN) {
    log('Faltan los secretos de Cloudflare. No se suben empresas, organismos, municipios ni recuadros.');
    return;
  }
  const indice = JSON.parse(await fs.readFile(path.join(DIR_DATOS, 'indice.json'), 'utf8'));
  const todas = [];
  for (const h of [indice.archivos.abiertas, ...(indice.archivos.historico || [])]) {
    if (h?.f) todas.push(...JSON.parse(await fs.readFile(path.join(DIR_DATOS, h.f), 'utf8')).items);
  }

  let cupo = MAX_ESCRITURAS;
  // Recuadros: las listas de los recuadros para otras webs (pocas filas)
  const ahora = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
    .format(new Date()).replace(' ', 'T');
  const enPlazo = todas.filter((x) => x.g === 'A' && (!x.f || x.f >= ahora));
  const recuadros = [...construirRecuadros(enPlazo)]
    .map(([k, r]) => [k, r.titulo, r.n, 0, JSON.stringify({ url: r.url, items: r.items })]);
  cupo -= await sincronizar('recuadros', recuadros, cupo);

  const municipios = [...agruparMunicipios(todas)].sort((a, b) => b[1].n - a[1].n)
    .map(([s, m]) => [s, m.nombre, m.n, m.totalAdj, JSON.stringify({ p: m.p, nAbiertas: m.nAbiertas, nAdj: m.nAdj, abiertas: m.abiertas, adj: m.adj, organismos: m.organismos, empresas: m.empresas })]);
  cupo -= await sincronizar('municipios', municipios, cupo);

  const empresas = [...agruparEmpresas(todas)].sort((a, b) => b[1].n - a[1].n)
    .map(([s, e]) => [s, e.nombre, e.n, e.total, JSON.stringify(e.adj)]);
  cupo -= await sincronizar('empresas', empresas, cupo);

  const organismos = [...agruparOrganismos(todas)].sort((a, b) => b[1].n - a[1].n)
    .map(([s, o]) => [s, o.nombre, o.n, o.totalAdj, JSON.stringify({ p: o.p, nAbiertas: o.nAbiertas, nAdj: o.nAdj, abiertas: o.abiertas, adj: o.adj, empresas: o.empresas })]);
  await sincronizar('organismos', organismos, cupo);
}

main().catch((e) => { console.error(e); process.exit(1); });
