// Plantilla HTML común de las páginas públicas (las genera scripts/generar-paginas.mjs y,
// para las empresas, functions/empresa/[slug].js en el momento de la visita).

export const SITIO = 'https://licitaempresa.es';
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function pagina({ ruta, titulo, descripcion, migas, cuerpo, actualizado, pieDatos, ldExtra }) {
  const url = SITIO + ruta;
  const ld = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: migas.map(([nombre, r], i) => ({ '@type': 'ListItem', position: i + 1, name: nombre, item: SITIO + r })),
  };
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)} | LicitaEmpresa</title>
<meta name="description" content="${esc(descripcion)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="LicitaEmpresa">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="es_ES">
<link rel="stylesheet" href="/fuentes.css">
<link rel="stylesheet" href="/paginas.css">
<script type="application/ld+json">${JSON.stringify(ldExtra ? [ld, ldExtra] : ld).replace(/</g, '\\u003c')}</script>
</head>
<body>
<header class="cabecera">
  <div class="cabecera-in">
    <a class="marca" href="/">LicitaEmpresa</a>
    <nav class="nav"><a href="/licitaciones/">Provincias y sectores</a><a href="/empresas/">Empresas</a><a href="/">Buscador</a></nav>
  </div>
</header>
<main class="marco">
  <nav class="migas" aria-label="Estás en">${migas.map(([n, r], i) => (i < migas.length - 1 ? `<a href="${r}">${esc(n)}</a><span aria-hidden="true">›</span>` : `<span aria-current="page">${esc(n)}</span>`)).join('')}</nav>
  ${cuerpo}
  <p class="actualizado">${pieDatos || `Datos actualizados el ${esc(actualizado)}. Fuente: Plataforma de Contratación del Sector Público (Ministerio de Hacienda) y plataformas autonómicas.`}</p>
</main>
<footer class="pie">
  <p>Esta web no es oficial. Antes de presentar una oferta, comprueba plazos y pliegos en el anuncio original.</p>
  <nav><span>© ${new Date().getFullYear()} Soluciones Globales Echeyde 360, S.L.U.</span><a href="/anunciate">Anúnciate</a><a href="/aviso-legal">Aviso legal</a><a href="/privacidad">Privacidad</a><a href="/cookies">Cookies</a><a href="mailto:contacto@licitaempresa.es">contacto@licitaempresa.es</a></nav>
</footer>
</body>
</html>
`;
}
