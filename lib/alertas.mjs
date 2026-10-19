// Lógica compartida de las alertas: la usan las funciones de Cloudflare (alta, confirmación, baja)
// y el script de envío diario (scripts/enviar-alertas.mjs).

import { PROVINCIAS } from '../scripts/territorio.mjs';

export const MAX_ALERTAS_POR_EMAIL = 5;
export const MAX_POR_ALERTA_EN_EMAIL = 25;
export const TIPOS = {
  '1': 'Suministros', '2': 'Servicios', '3': 'Obras', '21': 'Gestión de servicios públicos', '22': 'Concesión de servicios',
  '31': 'Concesión de obras públicas', '32': 'Concesión de obras', '40': 'Colaboración público-privada',
  '7': 'Administrativo especial', '8': 'Privado', '50': 'Patrimonial', '999': 'Otros',
};
export const TEXTO_CONSENTIMIENTO = 'He leído la política de privacidad y acepto recibir un email diario con las licitaciones nuevas que coincidan con esta alerta. Puedo darme de baja en cualquier momento.';
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
  };
}

export const tieneAlgunFiltro = (f) => f.cpv.length > 0 || f.prov.length > 0 || f.q.length > 0;

// ¿La licitación encaja con los filtros? (misma lógica que el buscador)
export function coincide(x, f) {
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
  if (f.q) h.set('q', f.q);
  if (f.tipo) h.set('tipo', f.tipo);
  if (f.min !== '') h.set('min', f.min);
  if (f.max !== '') h.set('max', f.max);
  if (f.estatal) h.set('estatal', '1');
  h.set('orden', 'recientes');
  return `${sitio}/#${h.toString().replace(/%2C/g, ',')}`;
}

export function token() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

// ---------- plantillas de email ----------

function plantilla(titulo, cuerpoHtml, pieHtml) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(titulo)}</title></head>
<body style="margin:0;background:#F3F5F8;font-family:Arial,Helvetica,sans-serif;color:#102A43">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F3F5F8"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#FFFFFF;border:1px solid #DCE3EA;border-radius:10px">
<tr><td style="background:#0F2B46;color:#FFFFFF;padding:18px 24px;border-radius:10px 10px 0 0;font-size:20px;font-weight:bold">LicitaEmpresa</td></tr>
<tr><td style="padding:24px;font-size:15px;line-height:1.5">${cuerpoHtml}</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #DCE3EA;font-size:12px;line-height:1.5;color:#52667A">${pieHtml}<br><br>${esc(EMPRESA)}</td></tr>
</table></td></tr></table></body></html>`;
}

export function emailConfirmacion({ sitio, id, filtros, tipos = TIPOS }) {
  const confirmar = `${sitio}/api/confirmar?t=${id}`;
  const desc = describirFiltros(filtros, tipos);
  const html = plantilla('Confirma tu alerta', `
<p style="margin:0 0 16px;font-size:18px;font-weight:bold">Confirma tu alerta de licitaciones</p>
<p style="margin:0 0 12px">Has pedido recibir cada mañana las licitaciones nuevas que coincidan con:</p>
<p style="margin:0 0 20px;padding:12px 14px;background:#F3F5F8;border-radius:8px"><strong>${esc(desc)}</strong></p>
<p style="margin:0 0 24px"><a href="${confirmar}" style="display:inline-block;background:#0A6E8A;color:#FFFFFF;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px">Confirmar alerta</a></p>
<p style="margin:0;color:#52667A;font-size:13px">Si no has sido tú, ignora este email: no recibirás nada más.</p>`,
  `Has recibido este email porque alguien introdujo esta dirección en ${esc(sitio.replace(/^https?:\/\//, ''))}.`);
  const texto = `Confirma tu alerta de licitaciones\n\nFiltros: ${desc}\n\nConfirma aquí: ${confirmar}\n\nSi no has sido tú, ignora este email.\n\n${EMPRESA}`;
  return { asunto: 'Confirma tu alerta de licitaciones', html, texto };
}

function fechaCorta(f) {
  if (!f) return '';
  const [a, m, d] = f.slice(0, 10).split('-');
  return `${Number(d)}/${Number(m)}/${a}`;
}

// secciones: [{ alerta: {id, filtros}, items: [...] }]
export function emailDiario({ sitio, secciones, provincias = PROVINCIAS, tipos = TIPOS }) {
  const total = secciones.reduce((n, s) => n + s.items.length, 0);
  const bloques = secciones.map(({ alerta, items }) => {
    const desc = describirFiltros(alerta.filtros, tipos);
    const lista = items.slice(0, MAX_POR_ALERTA_EN_EMAIL).map((x) => `
<tr><td style="padding:12px 0;border-top:1px solid #DCE3EA">
<a href="${esc(x.u)}" style="color:#102A43;font-weight:bold;text-decoration:none;font-size:15px">${esc(x.t)}</a><br>
<span style="color:#52667A;font-size:13px">${esc(x.o)} · ${esc(provincias[x.p] || '')}${x.i ? ' · ' + euros(x.i) + ' sin IVA' : ''}${x.f ? ' · Cierra el ' + fechaCorta(x.f) : ''}</span>
</td></tr>`).join('');
    const mas = items.length > MAX_POR_ALERTA_EN_EMAIL
      ? `<p style="margin:8px 0 0"><a href="${urlBusqueda(sitio, alerta.filtros)}" style="color:#0A6E8A">Ver las ${items.length} en LicitaEmpresa</a></p>` : '';
    return `<p style="margin:24px 0 4px;font-size:16px;font-weight:bold">${items.length} ${items.length === 1 ? 'nueva' : 'nuevas'}: ${esc(desc)}</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${lista}</table>${mas}
<p style="margin:8px 0 0;font-size:12px"><a href="${sitio}/api/baja?t=${alerta.id}" style="color:#52667A">Dar de baja esta alerta</a></p>`;
  }).join('');
  const asunto = `${total} ${total === 1 ? 'licitación nueva' : 'licitaciones nuevas'} para tus alertas`;
  const html = plantilla(asunto, `<p style="margin:0;font-size:18px;font-weight:bold">${esc(asunto)}</p>${bloques}
<p style="margin:24px 0 0;color:#52667A;font-size:13px">Comprueba siempre plazos y pliegos en el anuncio oficial antes de presentar una oferta.</p>`,
  `Recibes este email porque creaste y confirmaste una alerta en LicitaEmpresa. Puedes darte de baja de cada alerta con el enlace que aparece debajo de ella, o de todas aquí: <a href="${sitio}/api/baja?t=${secciones[0].alerta.id}&todas=1" style="color:#52667A">darme de baja de todas</a>.`);
  const texto = `${asunto}\n\n` + secciones.map(({ alerta, items }) =>
    `${describirFiltros(alerta.filtros, tipos)}\n` + items.slice(0, MAX_POR_ALERTA_EN_EMAIL).map((x) => `- ${x.t}\n  ${x.o}${x.f ? ', cierra el ' + fechaCorta(x.f) : ''}\n  ${x.u}`).join('\n')
    + `\nBaja de esta alerta: ${sitio}/api/baja?t=${alerta.id}`).join('\n\n') + `\n\n${EMPRESA}`;
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
