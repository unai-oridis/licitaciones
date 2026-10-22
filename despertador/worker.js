// Despertador de LicitaEmpresa (Cloudflare Worker con activadores cron).
// - Cada 3 horas (cron «40 */3 * * *»): lanza «Actualizar y publicar» en GitHub.
// - A las 7:00 de Madrid (crons «0 5 * * *» y «0 6 * * *», uno vale en verano y otro en invierno):
//   lanza «Resumen diario para el administrador».
// Necesita el secreto GITHUB_TOKEN (token fine-grained solo para el repositorio licitaciones, permiso Actions: Read and write).
const REPO = 'https://api.github.com/repos/unai-oridis/licitaciones/actions/workflows';

async function lanzar(env, workflow, inputs) {
  const r = await fetch(`${REPO}/${workflow}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'licitaempresa-despertador',
    },
    body: JSON.stringify({ ref: 'main', ...(inputs ? { inputs } : {}) }),
  });
  if (!r.ok) throw new Error(`GitHub respondió ${r.status}: ${await r.text()}`);
  console.log(`Lanzado ${workflow}`);
}

const horaMadrid = () => Number(new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', hour12: false }).format(new Date()));

export default {
  async scheduled(evento, env, ctx) {
    if (evento.cron === '0 5 * * *' || evento.cron === '0 6 * * *') {
      if (horaMadrid() === 7) ctx.waitUntil(lanzar(env, 'resumen-admin.yml'));
      return;
    }
    ctx.waitUntil(lanzar(env, 'actualizar.yml', { automatico: 'true' }));
  },
  async fetch() {
    return new Response('LicitaEmpresa', { status: 404 });
  },
};
