// Guías para empresas (/guias/{slug}/). Las publica scripts/generar-paginas.mjs.
// Contenido informativo: los importes son orientativos (vigentes en 2026) y siempre manda el pliego.

export const GUIAS = [
  {
    slug: 'como-presentarse-a-una-licitacion-publica',
    titulo: 'Cómo presentarse a una licitación pública paso a paso',
    corto: 'Cómo presentarse a una licitación',
    descripcion: 'Guía práctica para empresas y autónomos: cómo encontrar licitaciones públicas, leer los pliegos, preparar la documentación y presentar la oferta electrónica.',
    html: `
<p>Las administraciones públicas compran cada año obras, servicios y suministros por valor de miles de millones de euros. Cualquier empresa o autónomo puede presentarse a estos concursos si cumple los requisitos. Estos son los pasos, desde que encuentras la licitación hasta que envías tu oferta.</p>

<h2>1. Encuentra licitaciones de tu sector</h2>
<p>Todas las licitaciones públicas de España (salvo los contratos menores) se publican en la Plataforma de Contratación del Sector Público o en las plataformas autonómicas. En <a href="/">LicitaEmpresa</a> las tienes todas juntas y puedes filtrarlas por provincia y por <a href="/guias/que-es-un-codigo-cpv/">código CPV</a>, que es el código que indica qué se contrata.</p>
<p>Consejo: <strong>crea una alerta gratuita</strong> con tus códigos CPV y tu provincia. Recibirás cada mañana un email con las licitaciones nuevas y no se te pasará ningún plazo.</p>

<h2>2. Comprueba el plazo y el importe</h2>
<p>Cada licitación indica la <strong>fecha y hora límite</strong> para presentar ofertas. Pasado ese momento, la plataforma no deja enviar nada, así que no apures hasta el último minuto. Fíjate también en el <strong>presupuesto base de licitación</strong> (lo máximo que pagará la Administración) y en si el contrato está dividido en <strong>lotes</strong>: puedes presentarte solo al lote que te interese.</p>

<h2>3. Lee los pliegos</h2>
<p>Los pliegos son los documentos que fijan las reglas del concurso. Hay dos:</p>
<ul>
  <li><strong>Pliego de cláusulas administrativas particulares (PCAP)</strong>: requisitos para participar, solvencia que se exige, criterios de adjudicación, garantías, penalidades y forma de presentar la oferta.</li>
  <li><strong>Pliego de prescripciones técnicas (PPT)</strong>: qué hay que hacer exactamente (el servicio, la obra o el producto) y con qué calidad.</li>
</ul>
<p>Lee con especial atención los <strong>criterios de adjudicación</strong>: te dicen cuántos puntos vale el precio y cuántos otros aspectos (calidad, plazo, mejoras, experiencia del equipo…). Si tienes dudas, casi todas las licitaciones permiten hacer preguntas al órgano de contratación antes de una fecha.</p>

<h2>4. Comprueba que cumples la solvencia</h2>
<p>La Administración exige que demuestres que puedes hacer el trabajo:</p>
<ul>
  <li><strong>Solvencia económica</strong>: normalmente, una facturación anual mínima o un seguro de responsabilidad civil.</li>
  <li><strong>Solvencia técnica</strong>: normalmente, trabajos parecidos realizados en los últimos años, medios materiales y personales o certificados de calidad.</li>
</ul>
<p>En obras de valor estimado igual o superior a 500.000 € suele exigirse además la <strong>clasificación empresarial</strong>. Si no llegas sola a la solvencia, puedes presentarte en <strong>UTE</strong> (unión temporal) con otra empresa o apoyarte en sus medios. Lo tienes explicado en la <a href="/guias/documentacion-para-licitar/">guía de documentación</a>.</p>

<h2>5. Prepara la documentación</h2>
<p>La oferta se divide en <strong>sobres</strong> (archivos electrónicos):</p>
<ul>
  <li><strong>Sobre de documentación administrativa</strong>: casi siempre basta con el <strong>DEUC</strong> o una declaración responsable de que cumples los requisitos. Los certificados solo se los pedirán a la empresa que gane.</li>
  <li><strong>Sobre de criterios que dependen de un juicio de valor</strong> (si los hay): la memoria técnica o el proyecto que valorarán los técnicos.</li>
  <li><strong>Sobre de criterios automáticos</strong>: el precio y otros aspectos que se puntúan con fórmulas.</li>
</ul>
<p>No mezcles la información: si pones el precio en el sobre técnico, pueden excluirte.</p>

<h2>6. Presenta la oferta de forma electrónica</h2>
<p>La licitación es electrónica. Necesitas un <strong>certificado digital</strong> de representante de la empresa (o de persona física si eres autónomo) y darte de alta en la plataforma donde se publica el concurso. En la Plataforma de Contratación del Sector Público se usa su herramienta de preparación y presentación de ofertas. Haz una prueba con tiempo: la instalación y la firma de los sobres pueden dar problemas el último día.</p>

<h2>7. Sigue el resultado</h2>
<p>Después del plazo, la mesa de contratación abre los sobres, valora las ofertas y propone una adjudicataria. Si ganas, te pedirán la documentación y la garantía definitiva en un plazo corto. Te lo contamos en <a href="/guias/que-pasa-despues-de-la-adjudicacion/">qué pasa después de la adjudicación</a>. Si no ganas, revisa quién lo hizo y por cuánto: en LicitaEmpresa puedes ver todas las adjudicaciones y <a href="/empresas/">lo que gana cada empresa</a>.</p>`,
  },
  {
    slug: 'que-es-un-codigo-cpv',
    titulo: 'Qué es un código CPV y cómo encontrar el de tu empresa',
    corto: 'Qué es un código CPV',
    descripcion: 'Qué son los códigos CPV del Vocabulario Común de Contratos Públicos, cómo se leen y cómo usarlos para encontrar las licitaciones de tu sector.',
    html: `
<p>El <strong>CPV</strong> (Common Procurement Vocabulary, o Vocabulario Común de Contratos Públicos) es una lista de códigos que se usa en toda la Unión Europea para describir qué se contrata en cada licitación. Cada licitación lleva uno o varios códigos CPV, y conocer los de tu actividad es la forma más rápida de encontrar los concursos que te interesan.</p>

<h2>Cómo se lee un código CPV</h2>
<p>Un código CPV tiene 8 cifras (más una de control, que no hace falta). Cuantas más cifras coinciden, más concreto es:</p>
<ul>
  <li>Las <strong>2 primeras cifras</strong> son la división. Por ejemplo, <strong>45</strong> = obras de construcción y <strong>90</strong> = servicios de residuos, limpieza y medio ambiente.</li>
  <li>Las <strong>3 primeras</strong> son el grupo, las <strong>4 primeras</strong> la clase y las <strong>5 primeras</strong> la categoría.</li>
  <li>Ejemplo: <strong>55</strong> hostelería → <strong>553</strong> servicios de restaurante → <strong>5552</strong> servicios de catering.</li>
</ul>

<h2>Cómo encontrar tus códigos</h2>
<ol>
  <li><strong>Mira licitaciones que ya conoces.</strong> Busca en el <a href="/">buscador</a> un contrato parecido a lo que haces y fíjate en sus códigos CPV.</li>
  <li><strong>Empieza por la división.</strong> En <a href="/licitaciones/">licitaciones por sector</a> tienes los grandes sectores con su código.</li>
  <li><strong>No te quedes corto.</strong> Muchas administraciones eligen códigos distintos para lo mismo. Por ejemplo, un contrato de limpieza puede llevar el 909 (servicios de limpieza) o el 90 (más general). Usa los primeros dígitos para abarcar todas las variantes.</li>
</ol>

<h2>Cómo usarlos en LicitaEmpresa</h2>
<p>En el buscador puedes escribir un código CPV completo o solo sus primeras cifras: con «909» verás todas las licitaciones cuyo código empieza por 909. También puedes escribir el nombre del sector («limpieza», «catering»…). Combina varios códigos y tus provincias, y <strong>crea una alerta</strong> para recibir cada mañana las licitaciones nuevas que encajen.</p>

<h2>Sectores más habituales</h2>
<ul>
  <li><a href="/licitaciones/sector/obras-de-construccion/">45 · Obras de construcción</a></li>
  <li><a href="/licitaciones/sector/servicios-de-limpieza/">909 · Servicios de limpieza</a></li>
  <li><a href="/licitaciones/sector/hosteleria-y-restauracion/">55 · Hostelería y restauración</a></li>
  <li><a href="/licitaciones/sector/servicios-informaticos/">72 · Servicios informáticos</a></li>
  <li><a href="/licitaciones/sector/arquitectura-ingenieria-e-inspeccion/">71 · Arquitectura, ingeniería e inspección</a></li>
  <li><a href="/licitaciones/sector/reparacion-y-mantenimiento/">50 · Reparación y mantenimiento</a></li>
  <li><a href="/licitaciones/sector/transporte/">60 · Transporte</a></li>
</ul>`,
  },
  {
    slug: 'tipos-de-procedimientos-de-contratacion',
    titulo: 'Tipos de procedimientos de contratación pública e importes',
    corto: 'Tipos de procedimientos',
    descripcion: 'Contrato menor, procedimiento abierto, simplificado y abreviado, restringido y negociado: diferencias, importes orientativos y plazos para presentar ofertas.',
    html: `
<p>La Ley 9/2017 de Contratos del Sector Público establece varios procedimientos para adjudicar los contratos. Cuál se usa depende sobre todo del <strong>valor estimado</strong> del contrato (sin IVA). Saberlo te ayuda a calcular cuánto tiempo tendrás para preparar la oferta y qué documentación te pedirán.</p>
<p class="nota">Los importes son orientativos, vigentes en 2026, y se actualizan periódicamente. Lo que vale en cada caso es lo que diga el pliego de la licitación.</p>

<h2>Contrato menor</h2>
<p>Para contratos pequeños: <strong>menos de 40.000 € en obras</strong> y <strong>menos de 15.000 € en servicios y suministros</strong>. La Administración puede adjudicarlos directamente, normalmente pidiendo presupuestos. No se publican como licitación abierta, por eso no aparecen en el buscador. Para acceder a ellos, conviene darse a conocer en los ayuntamientos y organismos de tu zona.</p>

<h2>Procedimiento abierto simplificado abreviado («supersimplificado»)</h2>
<p>Para contratos de hasta <strong>80.000 € en obras</strong> y <strong>60.000 € en servicios y suministros</strong>. Es el más rápido: el plazo para presentar ofertas puede ser de solo <strong>10 días hábiles</strong> (menos aún en compras corrientes), no se exige garantía definitiva y la oferta suele valorarse solo con criterios automáticos. Es la mejor puerta de entrada para pymes y autónomos.</p>

<h2>Procedimiento abierto simplificado</h2>
<p>Para contratos de hasta <strong>2.000.000 € en obras</strong> y, en servicios y suministros, por debajo del umbral de regulación armonizada (orientativamente, <strong>140.000 €</strong>). El plazo mínimo para presentar ofertas es de <strong>15 días naturales</strong> (20 en obras), toda la oferta se presenta de una vez y, en general, se pide estar inscrito en el <strong>ROLECE</strong> (el registro oficial de licitadores) o en el registro autonómico equivalente.</p>

<h2>Procedimiento abierto</h2>
<p>El procedimiento general: puede presentarse cualquier empresa interesada. En contratos no armonizados, el plazo mínimo es de <strong>15 días</strong> en servicios y suministros y de <strong>26 días</strong> en obras. En contratos sujetos a regulación armonizada (los de mayor importe), los plazos son más largos y la licitación se publica también en el Diario Oficial de la Unión Europea.</p>

<h2>Contratos sujetos a regulación armonizada</h2>
<p>Son los de mayor importe y siguen las normas europeas. Desde el 1 de enero de 2026, orientativamente: <strong>5.404.000 € en obras</strong> y <strong>140.000 € en servicios y suministros</strong> de la Administración General del Estado (<strong>216.000 €</strong> en el resto de administraciones). En estos contratos, y en otros de importe elevado, cabe el <strong>recurso especial en materia de contratación</strong>.</p>

<h2>Restringido, negociado y otros</h2>
<ul>
  <li><strong>Restringido</strong>: primero se seleccionan las empresas que cumplen ciertos requisitos de solvencia y solo ellas pueden presentar oferta. Se usa en contratos complejos.</li>
  <li><strong>Negociado</strong> (con o sin publicidad): solo en los casos que permite la ley, por ejemplo por urgencia o cuando solo hay una empresa capaz.</li>
  <li><strong>Diálogo competitivo</strong> y <strong>asociación para la innovación</strong>: para contratos en los que la Administración no sabe de antemano cuál es la mejor solución.</li>
  <li><strong>Acuerdos marco</strong> y <strong>sistemas dinámicos de adquisición</strong>: se selecciona a varias empresas, y después la Administración les va encargando contratos concretos.</li>
</ul>
<p>En LicitaEmpresa puedes ver el procedimiento de cada licitación en su ficha y filtrar en el <a href="/">buscador</a>.</p>`,
  },
  {
    slug: 'documentacion-para-licitar',
    titulo: 'Documentación para licitar: DEUC, solvencia, clasificación y ROLECE',
    corto: 'Documentación para licitar',
    descripcion: 'Qué documentación necesita una empresa para presentarse a una licitación pública: DEUC, solvencia económica y técnica, clasificación empresarial, ROLECE, certificado digital y garantías.',
    html: `
<p>La documentación es lo que más asusta la primera vez, pero hoy es mucho más sencilla que hace unos años. Para presentar la oferta casi siempre basta con una declaración, y los certificados solo los tiene que aportar la empresa que gana. Esto es lo que necesitas tener preparado.</p>

<h2>Certificado digital</h2>
<p>Toda la licitación es electrónica. Necesitas un <strong>certificado digital de representante de persona jurídica</strong> (si eres una sociedad) o de persona física (si eres autónomo). Se usa para darte de alta en la plataforma y firmar los sobres de la oferta.</p>

<h2>DEUC o declaración responsable</h2>
<p>El <strong>DEUC</strong> (Documento Europeo Único de Contratación) es un formulario en el que declaras que cumples los requisitos: capacidad para contratar, solvencia, estar al corriente con Hacienda y la Seguridad Social y no estar en ninguna prohibición para contratar. En muchos contratos se sustituye por una declaración responsable más sencilla, cuyo modelo viene en el pliego.</p>

<h2>Solvencia económica y financiera</h2>
<p>Demuestra que tu empresa tiene capacidad económica suficiente. Lo más habitual es:</p>
<ul>
  <li>Un <strong>volumen anual de negocio</strong> mínimo en alguno de los últimos tres años. En general, no pueden pedirte más de una vez y media el valor anual medio del contrato.</li>
  <li>O un <strong>seguro de responsabilidad civil</strong> por un importe mínimo.</li>
</ul>

<h2>Solvencia técnica o profesional</h2>
<p>Demuestra que sabes hacer el trabajo. Lo más habitual es una <strong>relación de trabajos parecidos</strong> realizados en los últimos años (tres en servicios y suministros, cinco en obras), con certificados de los clientes. También pueden pedir títulos del equipo, medios materiales o certificados de calidad (ISO). Las empresas de nueva creación pueden acreditarla por otros medios en los contratos de menor importe.</p>

<h2>Clasificación empresarial</h2>
<p>Es una «acreditación» oficial que sustituye a la solvencia, por grupos de actividad y categorías de importe. Es <strong>obligatoria en contratos de obras de valor estimado igual o superior a 500.000 €</strong>. En servicios no es obligatoria, pero si la tienes puede servir para acreditar la solvencia. Se solicita a la Junta Consultiva de Contratación Pública del Estado o al órgano autonómico.</p>

<h2>ROLECE y registros autonómicos</h2>
<p>El <strong>ROLECE</strong> (Registro Oficial de Licitadores y Empresas Clasificadas del Sector Público) guarda los datos de tu empresa (escrituras, poderes, solvencia…) para que no tengas que presentarlos en cada licitación. En el procedimiento abierto simplificado se exige, en general, estar inscrito en él o en el registro autonómico equivalente, así que darse de alta con tiempo es muy recomendable.</p>

<h2>Si no llegas sola: UTE y medios externos</h2>
<ul>
  <li><strong>UTE</strong> (unión temporal de empresas): te presentas junto a otra empresa y se suma la solvencia de las dos. Solo hace falta formalizarla en escritura si ganáis.</li>
  <li><strong>Integración de solvencia con medios externos</strong>: puedes basarte en la solvencia de otra empresa que se comprometa a poner sus medios a tu disposición.</li>
</ul>

<h2>Garantías</h2>
<ul>
  <li><strong>Garantía provisional</strong>: es excepcional y, si se pide, no puede superar el 3 % del presupuesto.</li>
  <li><strong>Garantía definitiva</strong>: la deposita la empresa que gana, normalmente el <strong>5 % del precio de adjudicación</strong> (sin IVA). Puede ser en efectivo, aval bancario o seguro de caución. En el procedimiento abreviado no se exige.</li>
</ul>
<p>¿Ya lo tienes todo? Busca las <a href="/">licitaciones de tu sector</a> y crea una alerta para recibirlas cada mañana.</p>`,
  },
  {
    slug: 'como-ganar-licitaciones-publicas',
    titulo: 'Cómo ganar licitaciones públicas: 10 consejos prácticos',
    corto: 'Cómo ganar licitaciones',
    descripcion: 'Consejos para aumentar las posibilidades de ganar concursos públicos: elegir bien, entender los criterios de adjudicación, calcular el precio, evitar la baja temeraria y estudiar a la competencia.',
    html: `
<p>Ganar licitaciones no es cuestión de suerte: las empresas que más adjudicaciones consiguen se presentan a muchas, eligen bien y aprenden de cada resultado. Estos son los consejos más útiles.</p>

<h2>1. Elige bien a qué te presentas</h2>
<p>Es mejor presentar pocas ofertas buenas que muchas a medias. Céntrate en tu sector y tu zona, y en contratos cuyo importe y solvencia encajen con tu empresa. Las alertas por email te ayudan a ver todas las oportunidades sin dedicarle horas cada día.</p>

<h2>2. Empieza por los contratos pequeños</h2>
<p>Los procedimientos abreviados (hasta 60.000 € en servicios y 80.000 € en obras) piden menos documentación y suelen valorarse solo por precio y criterios automáticos. Son ideales para conseguir experiencia y referencias, que después te servirán como solvencia técnica en contratos mayores.</p>

<h2>3. Lee los criterios de adjudicación antes que nada</h2>
<p>El pliego dice exactamente cómo se puntúa: cuántos puntos da el precio, cuántos la memoria técnica, las mejoras, el plazo o las cláusulas sociales y medioambientales. Escribe tu oferta pensando en cada criterio, con el mismo orden y los mismos títulos, para que el evaluador encuentre fácilmente lo que busca.</p>

<h2>4. Entiende la fórmula del precio</h2>
<p>No todas las fórmulas premian igual la bajada de precio. En algunas, bajar mucho apenas da puntos extra; en otras, cada euro cuenta. Haz números con la fórmula del pliego antes de decidir tu precio.</p>

<h2>5. Cuidado con la baja temeraria</h2>
<p>Si tu precio es mucho más bajo que el de las demás, la oferta puede considerarse <strong>anormalmente baja</strong>. Te pedirán que justifiques cómo puedes cumplir con ese precio y, si no lo convences, te excluirán. Calcula bien tus costes (personal según convenio, materiales, desplazamientos) y no bajes por debajo de lo que puedas justificar.</p>

<h2>6. Estudia a tu competencia</h2>
<p>Las adjudicaciones son públicas: quién gana, por cuánto y cuántas empresas se presentaron. En LicitaEmpresa puedes ver <a href="/empresas/">lo que gana cada empresa</a>, sus clientes y sus importes, y <strong>seguir a tus competidores</strong> para recibir un email cada vez que ganen un contrato. Es la mejor forma de saber qué precios funcionan en tu sector.</p>

<h2>7. Haz una memoria técnica concreta</h2>
<p>Evita los textos genéricos copiados de otras ofertas. Explica cómo harás <strong>este</strong> trabajo: equipo, calendario, medios, control de calidad y cómo resolverás los problemas habituales. Respeta el límite de páginas y el formato que pida el pliego.</p>

<h2>8. Revisa la documentación dos veces</h2>
<p>Muchas ofertas se excluyen por errores formales: firmar mal un sobre, poner el precio donde no toca, olvidar un anexo o presentarla a última hora y que falle la plataforma. Prepara una lista de comprobación y presenta con al menos un día de margen.</p>

<h2>9. Valora presentarte en UTE o por lotes</h2>
<p>Si un contrato es grande para ti, puedes unirte a otra empresa en UTE o presentarte solo al lote que mejor encaje. Muchas administraciones dividen los contratos en lotes precisamente para que participen las pymes.</p>

<h2>10. Aprende de cada resultado</h2>
<p>Cuando se publique la adjudicación, mira las puntuaciones: puedes pedir acceso al informe de valoración. Saber en qué perdiste puntos es la mejor forma de mejorar la siguiente oferta.</p>`,
  },
  {
    slug: 'que-pasa-despues-de-la-adjudicacion',
    titulo: 'Qué pasa después de la adjudicación de un contrato público',
    corto: 'Después de la adjudicación',
    descripcion: 'Qué hacer cuando tu empresa gana una licitación: requerimiento de documentación, garantía definitiva, formalización del contrato, recursos, ejecución y cobro.',
    html: `
<p>Has ganado una licitación: enhorabuena. Pero el contrato todavía no es tuyo hasta que se formaliza. Estos son los pasos que vienen y los plazos que no debes dejar pasar.</p>

<h2>1. Propuesta de adjudicación y requerimiento</h2>
<p>La mesa de contratación ordena las ofertas por puntuación y propone a la mejor. El órgano de contratación te enviará un <strong>requerimiento</strong> para que, normalmente en <strong>10 días hábiles</strong>, presentes:</p>
<ul>
  <li>La documentación que acredita lo que declaraste en el DEUC: escrituras, poderes, solvencia y certificados de estar al corriente con Hacienda y la Seguridad Social (si no figuran ya en el ROLECE).</li>
  <li>La <strong>garantía definitiva</strong>, normalmente el 5 % del precio de adjudicación sin IVA, salvo que el pliego diga otra cosa.</li>
  <li>Cualquier otro documento que pida el pliego (seguros, adscripción de medios, etc.).</li>
</ul>
<p>Si no lo presentas a tiempo, se entiende que retiras la oferta y el contrato pasa a la siguiente empresa. Además, pueden penalizarte.</p>

<h2>2. Adjudicación</h2>
<p>Con la documentación correcta, el órgano de contratación <strong>adjudica</strong> el contrato y lo publica en la plataforma. A partir de ese momento, las demás empresas pueden revisar el expediente y, en su caso, recurrir.</p>

<h2>3. Recursos</h2>
<p>En los contratos de mayor importe cabe el <strong>recurso especial en materia de contratación</strong>, que se presenta ante el tribunal administrativo de recursos contractuales en un plazo de <strong>15 días hábiles</strong>. Si recurren tu adjudicación, la formalización puede quedar en suspenso hasta que se resuelva. Si eres tú quien no ha ganado y crees que hubo un error, este es el momento de actuar.</p>

<h2>4. Formalización del contrato</h2>
<p>El contrato se firma en documento administrativo. En los contratos que admiten recurso especial, la firma no puede hacerse hasta que pasa el plazo para recurrir. No empieces a trabajar antes de formalizar, salvo que la Administración lo ordene por escrito en los casos que permite la ley. En LicitaEmpresa verás el contrato como <strong>Formalizado</strong> cuando se publique.</p>

<h2>5. Ejecución</h2>
<p>Cumple lo que ofreciste: los pliegos y tu oferta forman parte del contrato. Si no cumples, pueden imponerte <strong>penalidades</strong> o incluso resolver el contrato. Guarda pruebas de todo lo que hagas y comunica por escrito cualquier incidencia.</p>

<h2>6. Facturación y cobro</h2>
<p>Las facturas a la Administración son <strong>electrónicas</strong>: normalmente se envían a través de FACe o de la plataforma autonómica equivalente, indicando los códigos del órgano que vienen en el pliego. La ley fija que la Administración debe pagar en un plazo de <strong>30 días</strong> desde que aprueba la factura o la certificación. Si se retrasa, puedes reclamar intereses de demora.</p>

<h2>7. Devolución de la garantía</h2>
<p>Al terminar el contrato y pasar el plazo de garantía sin incidencias, solicita la <strong>devolución de la garantía definitiva</strong>. No siempre se devuelve de oficio, así que no te olvides.</p>
<p>Y a por el siguiente: <a href="/">busca nuevas licitaciones</a> de tu sector y recibe las nuevas cada mañana con una alerta gratuita.</p>`,
  },
];
