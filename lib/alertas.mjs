// Lógica compartida de las alertas: la usan las funciones de Cloudflare (alta, confirmación, baja)
// y el script de envío diario (scripts/enviar-alertas.mjs).

import { PROVINCIAS } from '../scripts/territorio.mjs';
import { rutaFicha } from './fichas.mjs';

export const MAX_ALERTAS_POR_EMAIL = 5;
export const MAX_POR_ALERTA_EN_EMAIL = 25;
export const TIPOS = {
  '1': 'Suministros', '2': 'Servicios', '3': 'Obras', '21': 'Gestión de servicios públicos', '22': 'Concesión de servicios',
  '31': 'Concesión de obras públicas', '32': 'Concesión de obras', '40': 'Colaboración público-privada',
  '7': 'Administrativo especial', '8': 'Privado', '50': 'Patrimonial', '999': 'Otros',
};
export const TEXTO_CONSENTIMIENTO = 'He leído la política de privacidad y acepto recibir un email diario con las novedades (licitaciones nuevas o adjudicaciones) que coincidan con esta alerta. Puedo darme de baja en cualquier momento.';
export const EMPRESA = 'Soluciones Globales Echeyde 360, S.L.U. · CIF B75119479 · C/ San Roque 12, bajo dcha., 20110 Pasaia (Gipuzkoa)';

export const quitarTildes = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const euros = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' }).format(n);

export function emailValido(email) {
  return typeof email === 'string' && email.length <= 254 && /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[a-z]{2,}$/i.test(email);
}

// Deja solo filtros válidos y con tamaños razonables.
export function normalizarFiltros(raw = {}) {
  const cpv = [...new Set((Array.isArray(raw.cpv) ? raw.cpv : [])
    .map((c) => String(c).replace(/\D/g, '').slice(0, 8)).filter((c) => c.length >= 2))].slice(0, 20);
  const prov = [...new Set((Array.isArray(raw.prov) ? raw.prov : [])
    .map(String).filter((p) => /^\d{2}$/.test(p) && PROVINCIAS[p]))].slice(0, 60);
  const num = (v) => (v === '' || v == null || !Number.isFinite(Number(v)) || Number(v) < 0 ? '' : String(Math.round(Number(v))));
  return {
    cpv,
    prov,
    estatal: raw.estatal === true,
    q: String(raw.q || '').replace(/\s+/g, ' ').trim().slice(0, 100),
    tipo: /^\d{1,4}$/.test(String(raw.tipo || '')) ? String(raw.tipo) : '',
    min: num(raw.min),
    max: num(raw.max),
    // Alerta de empresa: avisa de las adjudicaciones que gane una empresa (competidor, cliente…)
    emp: String(raw.emp || '').replace(/\s+/g, ' ').trim().slice(0, 100),
  };
}

export const esAlertaEmpresa = (f) => f.emp.length > 0;
export const tieneAlgunFiltro = (f) => f.cpv.length > 0 || f.prov.length > 0 || f.q.length > 0 || palabrasEmpresa(f.emp).length > 0;

// Palabras que identifican a una empresa, sin la forma jurídica (S.L., S.A., etc.) ni signos.
const FORMAS = new Set(['s', 'l', 'a', 'u', 'sl', 'sa', 'slu', 'sau', 'sll', 'slp', 'scoop', 'coop', 'sc', 'cb', 'scp', 'ute',
  'sociedad', 'limitada', 'anonima', 'unipersonal', 'cooperativa', 'y', 'de', 'del', 'la', 'el', 'los', 'las', 'e']);
export function palabrasEmpresa(nombre) {
  return quitarTildes(nombre).replace(/[^a-z0-9ñ]+/g, ' ').split(' ').filter((w) => w && !FORMAS.has(w));
}
// ¿Alguna de las empresas adjudicatarias coincide con el nombre buscado?
export function empresaGanadora(x, emp) {
  const buscadas = palabrasEmpresa(emp);
  if (!buscadas.length) return null;
  for (const [nombre] of x.ad || []) {
    const suyas = palabrasEmpresa(nombre);
    if (buscadas.every((b) => suyas.some((w) => w.startsWith(b)))) return nombre;
  }
  return null;
}

// ¿La licitación encaja con los filtros? (misma lógica que el buscador)
export function coincide(x, f) {
  if (f.emp && !empresaGanadora(x, f.emp)) return false;
  if (f.cpv.length && !(x.c || []).some((c) => f.cpv.some((p) => c.startsWith(p)))) return false;
  if (f.prov.length && !(f.prov.includes(x.p) || (f.estatal && x.p === '00'))) return false;
  if (f.tipo && x.tc !== f.tipo) return false;
  if (f.min !== '' && !(x.i >= Number(f.min))) return false;
  if (f.max !== '' && !(x.i <= Number(f.max))) return false;
  if (f.q) {
    const texto = quitarTildes(`${x.t} ${x.o} ${x.e}`);
    if (!quitarTildes(f.q).split(' ').filter(Boolean).every((w) => texto.includes(w))) return false;
  }
  return true;
}

export function describirFiltros(f, tipos = TIPOS) {
  const partes = [];
  if (f.emp) partes.push(`Adjudicaciones ganadas por «${f.emp}»`);
  if (f.cpv.length) partes.push(`CPV ${f.cpv.join(', ')}`);
  if (f.prov.length) partes.push(f.prov.map((p) => PROVINCIAS[p]).join(', ') + (f.estatal ? ' (y ámbito estatal)' : ''));
  if (f.q) partes.push(`«${f.q}»`);
  if (f.tipo) partes.push(tipos[f.tipo] || `tipo ${f.tipo}`);
  if (f.min !== '' || f.max !== '') {
    partes.push(f.min !== '' && f.max !== '' ? `de ${euros(+f.min)} a ${euros(+f.max)}`
      : f.min !== '' ? `desde ${euros(+f.min)}` : `hasta ${euros(+f.max)}`);
  }
  return partes.join(' · ') || 'Todas las licitaciones';
}

// Enlace al buscador con los mismos filtros
export function urlBusqueda(sitio, f) {
  const h = new URLSearchParams();
  if (f.cpv.length) h.set('cpv', f.cpv.join(','));
  if (f.prov.length) h.set('prov', f.prov.join(','));
  if (f.q || f.emp) h.set('q', f.emp || f.q);
  if (f.emp) h.set('est', 'J,F');
  if (f.tipo) h.set('tipo', f.tipo);
  if (f.min !== '') h.set('min', f.min);
  if (f.max !== '') h.set('max', f.max);
  if (f.estatal) h.set('estatal', '1');
  if (!f.emp) h.set('orden', 'recientes');
  return `${sitio}/#${h.toString().replace(/%2C/g, ',')}`;
}

export function token() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

// ---------- plantillas de email ----------

// Colores del diseño de la web (versión «cercana y luminosa»)
const C = { fondo: '#EEF6FA', ink: '#17324D', muted: '#5B6F82', linea: '#DDE7EE', mar: '#0A7A8F', sol: '#FFC94A', solSuave: '#FFF4D6', solInk: '#7A5A00',
  rojo: '#C62E3A', rojoSuave: '#FDE8EA', menta: '#E3F3EC', ok: '#1F7A52' };
const FUENTE = "Figtree,'Segoe UI',Helvetica,Arial,sans-serif";

function plantilla(titulo, cuerpoHtml, pieHtml, sitio = 'https://licitaempresa.es') {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="light"><title>${esc(titulo)}</title></head>
<body style="margin:0;background:${C.fondo};font-family:${FUENTE};color:${C.ink}">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${C.fondo}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px">
<tr><td style="padding:4px 4px 16px">
  <a href="${sitio}" style="text-decoration:none;color:${C.ink};font-size:21px;font-weight:800;font-family:${FUENTE}"><span style="display:inline-block;width:30px;height:30px;line-height:30px;text-align:center;border-radius:9px;background:${C.mar};color:#FFFFFF;font-size:16px;font-weight:800;margin-right:8px;vertical-align:middle">L</span><span style="vertical-align:middle">LicitaEmpresa</span></a>
</td></tr>
<tr><td style="background:#FFFFFF;border-radius:20px;padding:28px 26px;font-size:15px;line-height:1.5">${cuerpoHtml}</td></tr>
<tr><td style="padding:18px 8px 0;font-size:12px;line-height:1.55;color:${C.muted}">${pieHtml}<br><br>${esc(EMPRESA)}</td></tr>
</table></td></tr></table></body></html>`;
}

const boton = (href, texto) => `<a href="${href}" style="display:inline-block;background:${C.mar};color:#FFFFFF;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:12px;font-family:${FUENTE}">${texto}</a>`;

export function emailConfirmacion({ sitio, id, filtros, tipos = TIPOS }) {
  const confirmar = `${sitio}/api/confirmar?t=${id}`;
  const desc = describirFiltros(filtros, tipos);
  const html = plantilla('Confirma tu alerta', `
<p style="margin:0 0 14px;font-size:22px;font-weight:800;line-height:1.25">Confirma tu alerta de licitaciones</p>
<p style="margin:0 0 12px">Has pedido recibir cada mañana ${esAlertaEmpresa(filtros) ? 'las nuevas adjudicaciones de esta empresa' : 'las licitaciones nuevas que coincidan con'}:</p>
<p style="margin:0 0 22px;padding:14px 16px;background:${C.fondo};border-radius:12px"><strong>${esc(desc)}</strong></p>
<p style="margin:0 0 24px">${boton(confirmar, 'Confirmar alerta')}</p>
<p style="margin:0;color:${C.muted};font-size:13px">Si no has sido tú, ignora este email: no recibirás nada más.</p>`,
  `Has recibido este email porque alguien introdujo esta dirección en ${esc(sitio.replace(/^https?:\/\//, ''))}.`, sitio);
  const texto = `Confirma tu alerta de licitaciones\n\nFiltros: ${desc}\n\nConfirma aquí: ${confirmar}\n\nSi no has sido tú, ignora este email.\n\n${EMPRESA}`;
  return { asunto: 'Confirma tu alerta de licitaciones', html, texto };
}

// Días que faltan hasta una fecha «AAAA-MM-DDTHH:MM» (hora de Madrid)
function diasHasta(f) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
    .formatToParts(new Date()).map((x) => [x.type, x.value]));
  const ahora = Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`);
  return Math.floor((Date.parse(f.slice(0, 16) + ':00Z') - ahora) / 864e5);
}

function fechaCorta(f) {
  if (!f) return '';
  const [a, m, d] = f.slice(0, 10).split('-');
  return `${Number(d)}/${Number(m)}/${a}`;
}

// Las licitaciones en plazo tienen ficha propia en la web; las adjudicaciones, solo si son recientes,
// así que para ellas se enlaza el anuncio oficial.
const enlace = (sitio, x) => (x.g === 'A' || x.g === 'P' ? sitio + rutaFicha(x) : x.u);

// secciones: [{ alerta: {id, filtros}, items: [...] }]
export function emailDiario({ sitio, secciones, provincias = PROVINCIAS, tipos = TIPOS }) {
  const total = secciones.reduce((n, s) => n + s.items.length, 0);
  const bloques = secciones.map(({ alerta, items }) => {
    const desc = describirFiltros(alerta.filtros, tipos);
    const deEmpresa = esAlertaEmpresa(alerta.filtros);
    const lista = items.slice(0, MAX_POR_ALERTA_EN_EMAIL).map((x) => {
      const ganadora = deEmpresa ? (x.ad || []).find(([n]) => n === empresaGanadora(x, alerta.filtros.emp)) : null;
      let etiqueta = '';
      if (!deEmpresa && x.f) {
        const d = diasHasta(x.f);
        const urgente = d <= 3;
        etiqueta = `<span style="display:inline-block;background:${urgente ? C.rojoSuave : C.solSuave};color:${urgente ? C.rojo : C.solInk};font-size:13px;font-weight:700;border-radius:8px;padding:3px 9px;margin-bottom:6px">${d < 1 ? 'Cierra hoy' : `Quedan ${d} ${d === 1 ? 'día' : 'días'}`} · ${fechaCorta(x.f)}</span><br>`;
      }
      return `
<tr><td style="padding:16px 0;border-top:1px solid ${C.linea}">
${etiqueta}<a href="${esc(enlace(sitio, x))}" style="color:${C.ink};font-weight:700;text-decoration:none;font-size:16px;line-height:1.35">${esc(x.t)}</a><br>
${ganadora ? `<span style="display:inline-block;margin-top:4px;color:${C.ok};font-size:14px">Adjudicada a <b>${esc(ganadora[0])}</b>${ganadora[1] ? ' por ' + euros(ganadora[1]) + ' sin IVA' : ''}</span><br>` : ''}
<span style="display:inline-block;margin-top:4px;color:${C.muted};font-size:13px">${esc(x.o)} · ${esc(provincias[x.p] || '')}${ganadora && (x.fa || x.a) ? ' · ' + fechaCorta(x.fa || x.a) : ''}</span>
${!ganadora && x.i ? `<br><span style="display:inline-block;margin-top:4px;font-size:15px;font-weight:800;color:${C.ink}">${euros(x.i)}</span> <span style="font-size:12px;color:${C.muted}">sin IVA</span>` : ''}
</td></tr>`;
    }).join('');
    const mas = items.length > MAX_POR_ALERTA_EN_EMAIL
      ? `<p style="margin:10px 0 0">${boton(urlBusqueda(sitio, alerta.filtros), `Ver las ${items.length} en LicitaEmpresa`)}</p>` : '';
    return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px"><tr><td style="background:${C.fondo};border-radius:12px;padding:10px 14px;font-size:15px;font-weight:800">${deEmpresa ? `${items.length} ${items.length === 1 ? 'adjudicación nueva' : 'adjudicaciones nuevas'} de «${esc(alerta.filtros.emp)}»` : `${items.length} ${items.length === 1 ? 'nueva' : 'nuevas'}: ${esc(desc)}`}</td></tr></table>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:6px">${lista}</table>${mas}
<p style="margin:10px 0 0;font-size:12px"><a href="${sitio}/api/baja?t=${alerta.id}" style="color:${C.muted}">Dar de baja esta alerta</a></p>`;
  }).join('');
  const soloEmpresas = secciones.every((s) => esAlertaEmpresa(s.alerta.filtros));
  const asunto = soloEmpresas
    ? `${total} ${total === 1 ? 'adjudicación nueva' : 'adjudicaciones nuevas'} de las empresas que sigues`
    : `${total} ${total === 1 ? 'novedad' : 'novedades'} para tus alertas`;
  const html = plantilla(asunto, `<p style="margin:0;font-size:22px;font-weight:800;line-height:1.25">${esc(asunto)}</p>
<p style="margin:6px 0 0;color:${C.muted}">Lo nuevo desde tu último aviso, publicado en las plataformas de contratación.</p>${bloques}
<p style="margin:26px 0 0;padding:14px 16px;background:${C.solSuave};border-radius:12px;color:${C.ink};font-size:13px">Comprueba siempre plazos y pliegos en el anuncio oficial antes de presentar una oferta.</p>`,
  `Recibes este email porque creaste y confirmaste una alerta en LicitaEmpresa. Puedes darte de baja de cada alerta con el enlace que aparece debajo de ella, o de todas aquí: <a href="${sitio}/api/baja?t=${secciones[0].alerta.id}&todas=1" style="color:${C.muted}">darme de baja de todas</a>.`, sitio);
  const texto = `${asunto}\n\n` + secciones.map(({ alerta, items }) =>
    `${describirFiltros(alerta.filtros, tipos)}\n` + items.slice(0, MAX_POR_ALERTA_EN_EMAIL).map((x) => `- ${x.t}\n  ${x.o}${x.f && !esAlertaEmpresa(alerta.filtros) ? ', cierra el ' + fechaCorta(x.f) : ''}\n  ${enlace(sitio, x)}`).join('\n')
    + `\nBaja de esta alerta: ${sitio}/api/baja?t=${alerta.id}`).join('\n\n') + `\n\n${EMPRESA}`;
  return { asunto, html, texto };
}

// Resumen diario para el administrador (scripts/resumen-admin.mjs)
export function emailResumenAdmin({ sitio, fecha, nuevas, totales, envio, licitaciones, visitas }) {
  const n = new Intl.NumberFormat('es-ES', { useGrouping: 'always' }).format;
  const fila = (k, v) => `<tr><td style="padding:7px 0;color:${C.muted};border-bottom:1px solid ${C.linea}">${k}</td><td align="right" style="padding:7px 0;font-weight:700;border-bottom:1px solid ${C.linea}">${v}</td></tr>`;
  const tabla = (filas) => `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:15px">${filas.join('')}</table>`;
  const tit = (t) => `<p style="margin:26px 0 8px;font-size:17px;font-weight:800">${t}</p>`;
  const listaNuevas = nuevas.length
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px">${nuevas.map((a) => `<tr><td style="padding:10px 0;border-bottom:1px solid ${C.linea}">
<b>${esc(a.email)}</b> <span style="display:inline-block;font-size:12px;font-weight:700;border-radius:6px;padding:1px 7px;background:${a.confirmada ? C.menta : C.solSuave};color:${a.confirmada ? C.ok : C.solInk}">${a.confirmada ? 'Confirmada' : 'Sin confirmar'}</span><br>
<span style="color:${C.muted}">${esc(describirFiltros(a.filtros))} · ${esc(a.hora)}</span></td></tr>`).join('')}</table>`
    : `<p style="margin:0;color:${C.muted}">Ayer no se creó ninguna alerta nueva.</p>`;
  const vis = visitas
    ? tabla([fila('Visitas', n(visitas.visitas)), fila('Páginas vistas', n(visitas.paginas)),
      ...visitas.top.map(([ruta, k]) => fila(`<span style="font-size:13px">${esc(ruta)}</span>`, n(k)))])
    : `<p style="margin:0;color:${C.muted};font-size:14px">No se han podido leer las visitas. Puedes verlas en Cloudflare → licitaempresa → Métricas → Web Analytics.</p>`;
  const asunto = `LicitaEmpresa: ${nuevas.length} ${nuevas.length === 1 ? 'alerta nueva' : 'alertas nuevas'} · resumen del ${fecha}`;
  const html = plantilla(asunto, `<p style="margin:0;font-size:22px;font-weight:800;line-height:1.25">Resumen del ${esc(fecha)}</p>
<p style="margin:6px 0 0;color:${C.muted}">Lo que ha pasado en LicitaEmpresa en las últimas 24 horas.</p>
${tit(`Alertas creadas (${nuevas.length})`)}${listaNuevas}
${tit('Alertas en total')}${tabla([fila('Confirmadas', n(totales.confirmadas)), fila('Pendientes de confirmar', n(totales.pendientes)),
    fila('Personas distintas', n(totales.personas)), fila('Confirmadas en las últimas 24 h', n(totales.confirmadas24))])}
${tit('Último envío de alertas')}${envio ? tabla([fila('Fecha', esc(envio.fecha)), fila('Emails enviados', n(envio.enviados || 0)),
    fila('Sin novedades', n(envio.sinNovedades || 0)), fila('Aplazados por límite', n(envio.aplazados || 0)), fila('Fallos', n(envio.fallos || 0))])
    : `<p style="margin:0;color:${C.muted}">Todavía no hay datos de envío.</p>`}
${tit('Visitas de ayer')}${vis}
${tit('Licitaciones')}${tabla([fila('En plazo ahora', n(licitaciones.abiertas)), fila('Nuevas en las últimas 24 h', n(licitaciones.nuevas24)),
    fila('Última actualización de datos', esc(licitaciones.actualizado))])}
<p style="margin:26px 0 0">${boton(`${sitio}/admin.html`, 'Abrir el panel de administración')}</p>`,
  'Recibes este resumen porque eres el administrador de LicitaEmpresa.', sitio);
  const texto = `${asunto}\n\nAlertas nuevas: ${nuevas.length}\n` + nuevas.map((a) => `- ${a.email} (${a.confirmada ? 'confirmada' : 'sin confirmar'}): ${describirFiltros(a.filtros)}`).join('\n')
    + `\n\nConfirmadas en total: ${totales.confirmadas} · Pendientes: ${totales.pendientes}\nLicitaciones en plazo: ${licitaciones.abiertas}\n\nPanel: ${sitio}/admin.html`;
  return { asunto, html, texto };
}

// ---------- envío con Brevo ----------

export async function enviarEmail(env, { para, asunto, html, texto, bajaUrl }) {
  if (env.MODO_PRUEBA === '1' || !env.BREVO_API_KEY) {
    console.log(`[MODO PRUEBA] Email a ${para}: ${asunto}`);
    return { ok: true, prueba: true };
  }
  const headers = bajaUrl ? { 'List-Unsubscribe': `<${bajaUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } : undefined;
  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: 'LicitaEmpresa', email: env.EMAIL_REMITENTE || 'alertas@licitaempresa.es' },
      replyTo: { email: 'contacto@licitaempresa.es' },
      to: [{ email: para }],
      subject: asunto,
      htmlContent: html,
      textContent: texto,
      ...(headers ? { headers } : {}),
    }),
  });
  if (!r.ok) return { ok: false, error: `Brevo ${r.status}: ${(await r.text()).slice(0, 300)}` };
  return { ok: true };
}
