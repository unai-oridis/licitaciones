// Sube a la base de datos D1 de Cloudflare los datos de cada empresa adjudicataria,
// para las páginas /empresa/{slug} (las muestra functions/empresa/[slug].js).
// Solo escribe las empresas que han cambiado, para no pasar del límite gratuito de escrituras de D1.
//
// Variables de entorno (secretos de GitHub): CF_ACCOUNT_ID, CF_D1_ID, CF_API_TOKEN

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { agruparEmpresas } from '../lib/empresas.mjs';

const DIR_DATOS = process.env.DIR_DATOS || 'public/data';
const MAX_ESCRITURAS = Number(process.env.MAX_ESCRITURAS || 40000); // D1 gratis: 100.000 filas escritas al día
const FILAS_POR_CONSULTA = 14; // 7 valores por fila; D1 admite 100 por consulta
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

async function main() {
  if (!process.env.CF_ACCOUNT_ID || !process.env.CF_D1_ID || !process.env.CF_API_TOKEN) {
    log('Faltan los secretos de Cloudflare. No se suben las empresas.');
    return;
  }
  const indice = JSON.parse(await fs.readFile(path.join(DIR_DATOS, 'indice.json'), 'utf8'));
  const items = [];
  for (const h of indice.archivos.historico || []) {
    if (!h.grupos?.J && !h.grupos?.F) continue;
    items.push(...JSON.parse(await fs.readFile(path.join(DIR_DATOS, h.f), 'utf8')).items);
  }
  const empresas = agruparEmpresas(items);
  log(`${empresas.size} empresas con adjudicaciones`);

  await d1(`CREATE TABLE IF NOT EXISTS empresas (
    slug TEXT PRIMARY KEY, nombre TEXT NOT NULL, n INTEGER NOT NULL, total INTEGER NOT NULL,
    adj TEXT NOT NULL, h TEXT NOT NULL, actualizado TEXT NOT NULL)`);
  const existentes = new Map((await d1('SELECT slug, h FROM empresas')).map((r) => [r.slug, r.h]));
  log(`${existentes.size} empresas ya en la base de datos`);

  const ahora = new Date().toISOString().slice(0, 16);
  // Primero las empresas con más adjudicaciones (si hay que repartir la carga en varios días)
  const cambiadas = [];
  for (const [slug, e] of [...empresas].sort((a, b) => b[1].n - a[1].n)) {
    const adj = JSON.stringify(e.adj);
    const h = crypto.createHash('sha1').update(`${e.nombre}|${e.n}|${e.total}|${adj}`).digest('base64').slice(0, 12);
    if (existentes.get(slug) !== h) cambiadas.push([slug, e.nombre, e.n, e.total, adj, h, ahora]);
  }
  const borrar = [...existentes.keys()].filter((s) => !empresas.has(s));
  const aEscribir = cambiadas.slice(0, Math.max(0, MAX_ESCRITURAS - borrar.length));
  log(`${cambiadas.length} nuevas o cambiadas, ${borrar.length} para borrar${aEscribir.length < cambiadas.length ? ` (hoy se escriben ${aEscribir.length}; el resto, en la próxima actualización)` : ''}`);

  const tareas = [];
  for (let i = 0; i < aEscribir.length; i += FILAS_POR_CONSULTA) {
    const lote = aEscribir.slice(i, i + FILAS_POR_CONSULTA);
    tareas.push(() => d1(
      `INSERT INTO empresas (slug, nombre, n, total, adj, h, actualizado) VALUES ${lote.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ')}
       ON CONFLICT(slug) DO UPDATE SET nombre = excluded.nombre, n = excluded.n, total = excluded.total,
       adj = excluded.adj, h = excluded.h, actualizado = excluded.actualizado`,
      lote.flat(),
    ));
  }
  for (let i = 0; i < borrar.length; i += 90) {
    const lote = borrar.slice(i, i + 90);
    tareas.push(() => d1(`DELETE FROM empresas WHERE slug IN (${lote.map(() => '?').join(', ')})`, lote));
  }
  let hechas = 0;
  await enParalelo(tareas.map((t) => async () => { await t(); if (++hechas % 200 === 0) log(`  ${hechas}/${tareas.length} lotes`); }), EN_PARALELO);
  log(`Listo: ${aEscribir.length} empresas escritas y ${borrar.length} borradas.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
