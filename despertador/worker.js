// Despertador de LicitaEmpresa (Cloudflare Worker con Cron Trigger).
// Cada 3 horas pide a GitHub que ejecute "Actualizar y publicar", por si GitHub se salta su horario.
// Necesita el secreto GITHUB_TOKEN: token "fine-grained" solo para el repositorio licitaciones,
// con el permiso "Actions: Read and write".
const URL_GITHUB =
  'https://api.github.com/repos/unai-oridis/licitaciones/actions/workflows/actualizar.yml/dispatches';

async function despertar(env) {
  const r = await fetch(URL_GITHUB, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'licitaempresa-despertador',
    },
    body: JSON.stringify({ ref: 'main', inputs: { automatico: 'true' } }),
  });
  if (!r.ok) throw new Error(`GitHub respondió ${r.status}: ${await r.text()}`);
  console.log('Actualización lanzada');
}

export default {
  async scheduled(evento, env, ctx) {
    ctx.waitUntil(despertar(env));
  },
  // Si alguien abre la dirección del Worker en el navegador, no hace nada.
  async fetch() {
    return new Response('LicitaEmpresa', { status: 404 });
  },
};
