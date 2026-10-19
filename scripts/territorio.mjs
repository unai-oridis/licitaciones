// Provincias (código INE = dos primeras cifras del código postal) agrupadas por comunidad,
// y equivalencia con los códigos NUTS que usa la Plataforma de Contratación.

export const COMUNIDADES = [
  ['Andalucía', ['04', '11', '14', '18', '21', '23', '29', '41']],
  ['Aragón', ['22', '44', '50']],
  ['Asturias', ['33']],
  ['Illes Balears', ['07']],
  ['Canarias', ['35', '38']],
  ['Cantabria', ['39']],
  ['Castilla y León', ['05', '09', '24', '34', '37', '40', '42', '47', '49']],
  ['Castilla-La Mancha', ['02', '13', '16', '19', '45']],
  ['Cataluña', ['08', '17', '25', '43']],
  ['Comunitat Valenciana', ['03', '12', '46']],
  ['Extremadura', ['06', '10']],
  ['Galicia', ['15', '27', '32', '36']],
  ['La Rioja', ['26']],
  ['Madrid', ['28']],
  ['Murcia', ['30']],
  ['Navarra', ['31']],
  ['País Vasco', ['01', '20', '48']],
  ['Ceuta', ['51']],
  ['Melilla', ['52']],
];

export const PROVINCIAS = {
  '01': 'Araba/Álava', '02': 'Albacete', '03': 'Alicante', '04': 'Almería', '05': 'Ávila',
  '06': 'Badajoz', '07': 'Illes Balears', '08': 'Barcelona', '09': 'Burgos', '10': 'Cáceres',
  '11': 'Cádiz', '12': 'Castellón', '13': 'Ciudad Real', '14': 'Córdoba', '15': 'A Coruña',
  '16': 'Cuenca', '17': 'Girona', '18': 'Granada', '19': 'Guadalajara', '20': 'Gipuzkoa',
  '21': 'Huelva', '22': 'Huesca', '23': 'Jaén', '24': 'León', '25': 'Lleida',
  '26': 'La Rioja', '27': 'Lugo', '28': 'Madrid', '29': 'Málaga', '30': 'Murcia',
  '31': 'Navarra', '32': 'Ourense', '33': 'Asturias', '34': 'Palencia', '35': 'Las Palmas',
  '36': 'Pontevedra', '37': 'Salamanca', '38': 'Santa Cruz de Tenerife', '39': 'Cantabria', '40': 'Segovia',
  '41': 'Sevilla', '42': 'Soria', '43': 'Tarragona', '44': 'Teruel', '45': 'Toledo',
  '46': 'Valencia', '47': 'Valladolid', '48': 'Bizkaia', '49': 'Zamora', '50': 'Zaragoza',
  '51': 'Ceuta', '52': 'Melilla',
  '00': 'Ámbito estatal o varias provincias',
  '99': 'Sin especificar',
};

// NUTS 3 (versiones 2016 y 2021) -> provincia INE
export const NUTS3 = {
  ES111: '15', ES112: '27', ES113: '32', ES114: '36', ES120: '33', ES130: '39',
  ES211: '01', ES212: '20', ES213: '48', ES220: '31', ES230: '26',
  ES241: '22', ES242: '44', ES243: '50', ES300: '28',
  ES411: '05', ES412: '09', ES413: '24', ES414: '34', ES415: '37', ES416: '40', ES417: '42', ES418: '47', ES419: '49',
  ES421: '02', ES422: '13', ES423: '16', ES424: '19', ES425: '45',
  ES431: '06', ES432: '10',
  ES511: '08', ES512: '17', ES513: '25', ES514: '43',
  ES521: '03', ES522: '12', ES523: '46',
  ES530: '07', ES531: '07', ES532: '07', ES533: '07',
  ES611: '04', ES612: '11', ES613: '14', ES614: '18', ES615: '21', ES616: '23', ES617: '29', ES618: '41',
  ES620: '30', ES630: '51', ES640: '52',
  ES701: '35', ES702: '38', ES703: '38', ES704: '35', ES705: '35', ES706: '38', ES707: '38', ES708: '35', ES709: '38',
};

// NUTS 2 de comunidades uniprovinciales -> provincia
export const NUTS2_UNIPROVINCIAL = {
  ES12: '33', ES13: '39', ES22: '31', ES23: '26', ES30: '28', ES53: '07', ES62: '30', ES63: '51', ES64: '52',
};

export function provinciaDesdeNuts(codigo) {
  if (!codigo) return null;
  const c = String(codigo).trim().toUpperCase();
  if (NUTS3[c]) return NUTS3[c];
  if (NUTS2_UNIPROVINCIAL[c]) return NUTS2_UNIPROVINCIAL[c];
  if (c.startsWith('ES')) return '00'; // comunidad entera o toda España
  return null;
}

// ¿La provincia `prov` está dentro del código NUTS de comunidad/región `nuts`? (p. ej. ES51 → Cataluña)
export function provinciaEnNuts(prov, nuts) {
  const c = String(nuts || '').trim().toUpperCase();
  if (!prov || c.length < 3) return false; // "ES" (toda España) no sirve para precisar
  return Object.entries(NUTS3).some(([n3, p]) => p === prov && n3.startsWith(c));
}

export function provinciaDesdeCP(cp) {
  const m = String(cp || '').trim().match(/^(\d{2})\d{3}$/);
  if (!m) return null;
  return PROVINCIAS[m[1]] && m[1] !== '00' && m[1] !== '99' ? m[1] : null;
}
