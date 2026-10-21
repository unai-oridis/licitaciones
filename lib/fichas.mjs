// Dirección de la ficha de cada licitación (/licitacion/{titulo}-{numero}/).
// La usan scripts/generar-paginas.mjs y los emails de alertas. public/index.html tiene una copia de la
// misma regla (función rutaFicha): si se cambia aquí, cambiarla también allí.

export const slug = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export function slugCorto(t) {
  let s = slug(t || '');
  if (s.length > 70) s = s.slice(0, 70).replace(/-[^-]*$/, '');
  return s || 'licitacion';
}

export const numeroId = (x) => String(x.id).split('/').pop().replace(/[^0-9A-Za-z]/g, '');
export const rutaFicha = (x) => `/licitacion/${slugCorto(x.t)}-${numeroId(x)}/`;
