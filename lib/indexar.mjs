// Qué páginas se piden a Google. Las que no llegan al mínimo siguen existiendo en la web y enlazadas,
// pero llevan «noindex» y no van en el sitemap: así Google dedica su tiempo a las páginas con contenido.
// Lo usan scripts/generar-paginas.mjs (sitemap y páginas sector + provincia) y las funciones de
// empresa, organismo y municipio. Se recalcula con cada actualización, así que una página entra sola
// en Google cuando alcanza el mínimo.
export const MIN_INDEXAR = {
  empresa: 3,     // adjudicaciones en los últimos 6 meses
  organismo: 3,   // licitaciones (abiertas + adjudicadas)
  municipio: 5,   // licitaciones
  combo: 6,       // licitaciones abiertas de un sector en una provincia
};
export const indexable = (tipo, n) => (Number(n) || 0) >= MIN_INDEXAR[tipo];
export const ROBOTS_NOINDEX = 'noindex, follow';
