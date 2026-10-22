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
<p>Para contratos pequeños: <strong>menos de 40.000 € en obras</strong> y <strong>menos de 15.000 € en servicios y suministros</strong>. La Administración puede adjudicarlos directamente, normalmente pidiendo presupuestos. No se publican como licitación abierta, por eso no aparecen en el buscador. Para acceder a ellos, conviene darse a conocer en los ayuntamientos y organismos de tu zona: lo explicamos en la guía de <a href="/guias/contratos-menores/">contratos menores</a>.</p>

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
<p>El <strong>DEUC</strong> (Documento Europeo Único de Contratación) es un formulario (te explicamos <a href="/guias/como-rellenar-el-deuc/">cómo rellenarlo</a>) en el que declaras que cumples los requisitos: capacidad para contratar, solvencia, estar al corriente con Hacienda y la Seguridad Social y no estar en ninguna prohibición para contratar. En muchos contratos se sustituye por una declaración responsable más sencilla, cuyo modelo viene en el pliego.</p>

<h2>Solvencia económica y financiera</h2>
<p>Demuestra que tu empresa tiene capacidad económica suficiente. Lo más habitual es:</p>
<ul>
  <li>Un <strong>volumen anual de negocio</strong> mínimo en alguno de los últimos tres años. En general, no pueden pedirte más de una vez y media el valor anual medio del contrato.</li>
  <li>O un <strong>seguro de responsabilidad civil</strong> por un importe mínimo.</li>
</ul>

<h2>Solvencia técnica o profesional</h2>
<p>Demuestra que sabes hacer el trabajo. Lo más habitual es una <strong>relación de trabajos parecidos</strong> realizados en los últimos años (tres en servicios y suministros, cinco en obras), con certificados de los clientes. También pueden pedir títulos del equipo, medios materiales o certificados de calidad (ISO). Las empresas de nueva creación pueden acreditarla por otros medios en los contratos de menor importe.</p>

<h2>Clasificación empresarial</h2>
<p>Es una «acreditación» oficial que sustituye a la solvencia, por grupos de actividad y categorías de importe. Es <strong>obligatoria en contratos de obras de valor estimado igual o superior a 500.000 €</strong>. En servicios no es obligatoria, pero si la tienes puede servir para acreditar la solvencia. Se solicita a la Junta Consultiva de Contratación Pública del Estado o al órgano autonómico. Más detalles en la guía de <a href="/guias/clasificacion-empresarial/">clasificación empresarial</a>.</p>

<h2>ROLECE y registros autonómicos</h2>
<p>El <strong>ROLECE</strong> (Registro Oficial de Licitadores y Empresas Clasificadas del Sector Público) guarda los datos de tu empresa (escrituras, poderes, solvencia…) para que no tengas que presentarlos en cada licitación. En el procedimiento abierto simplificado se exige, en general, estar inscrito en él o en el registro autonómico equivalente, así que darse de alta con tiempo es muy recomendable. Te explicamos <a href="/guias/como-inscribirse-en-el-rolece/">cómo inscribirte en el ROLECE</a>.</p>

<h2>Si no llegas sola: UTE y medios externos</h2>
<ul>
  <li><strong>UTE</strong> (unión temporal de empresas): te presentas junto a otra empresa y se suma la solvencia de las dos. Solo hace falta formalizarla en escritura si ganáis.</li>
  <li><strong>Integración de solvencia con medios externos</strong>: puedes basarte en la solvencia de otra empresa que se comprometa a poner sus medios a tu disposición.</li>
</ul>

<h2>Garantías</h2>
<ul>
  <li><strong>Garantía provisional</strong>: es excepcional y, si se pide, no puede superar el 3 % del presupuesto.</li>
  <li><strong>Garantía definitiva</strong>: la deposita la empresa que gana, normalmente el <strong>5 % del precio de adjudicación</strong> (sin IVA). Puede ser en efectivo, aval bancario o seguro de caución. En el procedimiento abreviado no se exige. Más en la guía de <a href="/guias/garantia-provisional-y-definitiva/">garantías</a>.</li>
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
<p>Si tu precio es mucho más bajo que el de las demás, la oferta puede considerarse <strong>anormalmente baja</strong>. Te pedirán que justifiques cómo puedes cumplir con ese precio y, si no lo convences, te excluirán. Calcula bien tus costes (personal según convenio, materiales, desplazamientos) y no bajes por debajo de lo que puedas justificar. Te lo explicamos en <a href="/guias/baja-temeraria-ofertas-anormalmente-bajas/">baja temeraria</a>.</p>

<h2>6. Estudia a tu competencia</h2>
<p>Las adjudicaciones son públicas: quién gana, por cuánto y cuántas empresas se presentaron. En LicitaEmpresa puedes ver <a href="/empresas/">lo que gana cada empresa</a>, sus clientes y sus importes, y <strong>seguir a tus competidores</strong> para recibir un email cada vez que ganen un contrato. Es la mejor forma de saber qué precios funcionan en tu sector.</p>

<h2>7. Haz una memoria técnica concreta</h2>
<p>Evita los textos genéricos copiados de otras ofertas. Explica cómo harás <strong>este</strong> trabajo: equipo, calendario, medios, control de calidad y cómo resolverás los problemas habituales. Respeta el límite de páginas y el formato que pida el pliego. Tienes más consejos en <a href="/guias/como-hacer-una-memoria-tecnica/">cómo hacer una memoria técnica</a>.</p>

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
<p>En los contratos de mayor importe cabe el <strong>recurso especial en materia de contratación</strong>, que se presenta ante el tribunal administrativo de recursos contractuales en un plazo de <strong>15 días hábiles</strong>. Si recurren tu adjudicación, la formalización puede quedar en suspenso hasta que se resuelva. Si eres tú quien no ha ganado y crees que hubo un error, este es el momento de actuar: te lo explicamos en <a href="/guias/como-recurrir-una-adjudicacion/">cómo recurrir una adjudicación</a>.</p>

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
  {
    slug: 'licitaciones-para-autonomos',
    titulo: 'Licitaciones públicas para autónomos: cómo empezar',
    corto: 'Licitaciones para autónomos',
    descripcion: 'Sí, un autónomo puede presentarse a licitaciones públicas. Qué necesitas, a qué contratos presentarte primero y cómo empezar paso a paso.',
    html: `
<p>Muchos autónomos creen que los concursos públicos son solo para grandes empresas, y no es así. Cualquier persona física con capacidad para contratar y la actividad dada de alta puede presentarse, y una parte importante de los contratos son de importes pequeños, pensados precisamente para pymes y profesionales.</p>

<h2>¿Puede un autónomo presentarse a una licitación?</h2>
<p>Sí. La ley no exige ser una sociedad. Necesitas lo mismo que cualquier empresa: no estar en ninguna prohibición para contratar, estar al corriente con Hacienda y la Seguridad Social, tener dada de alta la actividad correspondiente y acreditar la <a href="/guias/documentacion-para-licitar/">solvencia</a> que pida el pliego.</p>

<h2>Lo que necesitas antes de empezar</h2>
<ul>
  <li><strong>Certificado digital de persona física</strong>, para darte de alta en la plataforma de contratación y firmar las ofertas.</li>
  <li><strong>Alta en el IAE y en el RETA</strong> en la actividad del contrato.</li>
  <li><strong>Certificados de estar al corriente</strong> con la Agencia Tributaria y la Seguridad Social. Solo te los pedirán si ganas, pero conviene saber dónde descargarlos.</li>
  <li><strong>Un seguro de responsabilidad civil</strong>, que en muchos contratos sirve para acreditar la solvencia económica.</li>
  <li><strong>Una lista de trabajos parecidos</strong> que hayas hecho, con el cliente, el importe y las fechas, para la solvencia técnica.</li>
</ul>

<h2>Por dónde empezar: los contratos pequeños</h2>
<ul>
  <li><strong><a href="/guias/contratos-menores/">Contratos menores</a></strong>: hasta 15.000 € en servicios y suministros y hasta 40.000 € en obras. La Administración los adjudica directamente, así que lo importante es que te conozcan los ayuntamientos y organismos de tu zona.</li>
  <li><strong>Procedimiento abierto simplificado abreviado</strong>: hasta 60.000 € en servicios y suministros y hasta 80.000 € en obras. Poca documentación, sin garantía definitiva y casi siempre valoración automática. Es la mejor forma de conseguir tus primeras adjudicaciones.</li>
  <li><strong>Contratos divididos en lotes</strong>: puedes presentarte solo al lote que encaje con tu tamaño.</li>
</ul>
<p>En el <a href="/">buscador</a> puedes filtrar por presupuesto máximo para ver solo los contratos de tu tamaño y crear una alerta para recibirlos cada mañana.</p>

<h2>Si no llegas a la solvencia</h2>
<p>Si un contrato te queda grande, puedes presentarte en <a href="/guias/que-es-una-ute/">UTE</a> con otro autónomo o con una empresa, sumando la solvencia de los dos, o apoyarte en los medios de otra empresa que se comprometa a ponerlos a tu disposición. Las empresas de nueva creación también pueden acreditar la solvencia técnica por otros medios en los contratos de menor importe.</p>

<h2>Errores habituales al empezar</h2>
<ul>
  <li>Calcular el precio sin contar todos los costes: desplazamientos, materiales, seguros o el tiempo de gestión.</li>
  <li>Presentar la oferta a última hora y que falle el certificado digital.</li>
  <li>No leer los criterios de adjudicación y entregar una memoria genérica.</li>
  <li>Olvidar que las facturas a la Administración son electrónicas.</li>
</ul>

<h2>Cobro</h2>
<p>La Administración debe pagar en un plazo de 30 días desde que aprueba la factura. Las facturas se presentan de forma electrónica, normalmente por FACe o por la plataforma autonómica equivalente. Para un autónomo, un cliente público que paga puntualmente puede ser una base de ingresos muy estable.</p>`,
  },
  {
    slug: 'contratos-menores',
    titulo: 'Contratos menores: qué son, importes y cómo conseguirlos',
    corto: 'Contratos menores',
    descripcion: 'Qué es un contrato menor, sus importes máximos (15.000 y 40.000 €), cómo los adjudica la Administración y qué puede hacer tu empresa para conseguirlos.',
    html: `
<p>Los contratos menores son las compras pequeñas de la Administración: reparaciones, pequeños suministros, servicios puntuales, cursos o charlas. Son muy numerosos y, para muchas pymes y autónomos, la puerta de entrada al cliente público.</p>
<p class="nota">Los importes son los vigentes en 2026 según la Ley 9/2017 de Contratos del Sector Público. Consulta siempre las instrucciones de cada organismo, porque muchos tienen normas internas más exigentes.</p>

<h2>Importes máximos</h2>
<ul>
  <li><strong>Obras</strong>: valor estimado inferior a <strong>40.000 €</strong> (sin IVA).</li>
  <li><strong>Servicios y suministros</strong>: valor estimado inferior a <strong>15.000 €</strong> (sin IVA).</li>
</ul>
<p>Duran como máximo un año y no se pueden prorrogar. La ley prohíbe <strong>fraccionar</strong> un contrato mayor en varios menores para saltarse los procedimientos.</p>

<h2>Cómo se adjudican</h2>
<p>No hay licitación abierta: el órgano de contratación justifica la necesidad del contrato y lo adjudica directamente a una empresa con capacidad para hacerlo, contra la factura. En la práctica, muchas administraciones piden <strong>varios presupuestos</strong> antes de decidir, aunque la ley no siempre lo exige, y algunas publican invitaciones abiertas en su perfil de contratante.</p>
<p>Después se publican, al menos cada trimestre, en el perfil de contratante: objeto, importe y empresa adjudicataria. Por eso es posible saber qué compra cada organismo y a quién.</p>

<h2>Por qué no aparecen en el buscador</h2>
<p>LicitaEmpresa recoge las licitaciones que se publican para que cualquier empresa pueda presentar oferta. Los contratos menores no se licitan de esa manera: cuando se publican, ya están adjudicados. Por eso no los incluimos.</p>

<h2>Cómo conseguir contratos menores</h2>
<ol>
  <li><strong>Date a conocer.</strong> Preséntate a los responsables de compras de los ayuntamientos, mancomunidades, hospitales, colegios y organismos de tu zona. Explica qué haces y deja tus datos y tarifas.</li>
  <li><strong>Revisa los perfiles de contratante.</strong> Los contratos menores ya adjudicados te dicen qué compra cada organismo, con qué frecuencia y a qué precio.</li>
  <li><strong>Responde rápido a las peticiones de presupuesto</strong>, con precios claros y la documentación al día.</li>
  <li><strong>Cumple y factura bien.</strong> Un trabajo bien hecho en un contrato menor es la mejor referencia para el siguiente, y para la solvencia técnica en contratos mayores.</li>
</ol>

<h2>El siguiente paso</h2>
<p>Cuando tengas experiencia, salta a los procedimientos abreviados (hasta 60.000 € en servicios y 80.000 € en obras), que sí se licitan abiertamente. Puedes ver todos los que están en plazo en el <a href="/">buscador</a> filtrando por presupuesto máximo. Te lo explicamos en <a href="/guias/tipos-de-procedimientos-de-contratacion/">tipos de procedimientos</a>.</p>`,
  },
  {
    slug: 'como-inscribirse-en-el-rolece',
    titulo: 'Cómo inscribirse en el ROLECE (registro de licitadores)',
    corto: 'Inscribirse en el ROLECE',
    descripcion: 'Qué es el ROLECE, para qué sirve, cuándo es obligatorio para licitar y cómo pedir la inscripción de tu empresa o como autónomo.',
    html: `
<p>El <strong>ROLECE</strong> (Registro Oficial de Licitadores y Empresas Clasificadas del Sector Público) es un registro del Ministerio de Hacienda donde las empresas guardan sus datos para no tener que presentar la misma documentación en cada licitación. Inscribirse es gratuito y, en muchos procedimientos, imprescindible.</p>

<h2>Para qué sirve</h2>
<p>Una vez inscrita, tu empresa queda acreditada en el registro con sus datos de constitución, representantes y poderes, actividad, clasificación (si la tiene) y, si los aportas, datos de solvencia. Los órganos de contratación los consultan directamente, así que no tienes que entregar escrituras y poderes cada vez que ganes un contrato.</p>

<h2>¿Es obligatorio?</h2>
<p>En el <strong>procedimiento abierto simplificado</strong>, la ley exige en general que los licitadores estén inscritos en el ROLECE o en el registro autonómico equivalente en la fecha final de presentación de ofertas. En el resto de procedimientos no es obligatorio, pero simplifica mucho la documentación. Revisa siempre lo que dice el pliego.</p>

<h2>Registros autonómicos</h2>
<p>Varias comunidades autónomas tienen su propio registro de licitadores, que sirve para sus licitaciones y las de sus entidades locales. En general, la inscripción en el ROLECE sirve ante todas las administraciones, mientras que la autonómica sirve en el ámbito de esa comunidad. Si trabajas sobre todo en una comunidad, consulta qué registro piden sus pliegos.</p>

<h2>Cómo inscribirse paso a paso</h2>
<ol>
  <li><strong>Consigue un certificado digital</strong> de representante de la empresa (o de persona física, si eres autónomo).</li>
  <li><strong>Prepara la documentación</strong> en PDF: escritura de constitución y estatutos inscritos en el Registro Mercantil, poderes de los representantes, NIF y alta en el IAE. Si eres autónomo, tu DNI y el alta en la actividad.</li>
  <li><strong>Entra en la sede electrónica del Ministerio de Hacienda</strong> y busca el procedimiento de inscripción en el ROLECE.</li>
  <li><strong>Rellena la solicitud</strong>, adjunta los documentos y fírmala con el certificado.</li>
  <li><strong>Espera la resolución.</strong> El registro revisa la documentación y puede pedirte que corrijas algo. Pide la inscripción con tiempo: no la dejes para la semana de una licitación.</li>
</ol>

<h2>Después de inscribirte</h2>
<ul>
  <li><strong>Mantén los datos al día.</strong> Si cambias de administrador, de domicilio o de poderes, comunícalo al registro.</li>
  <li><strong>Usa el certificado del registro</strong> en tus ofertas cuando el pliego lo permita, junto con la declaración de que los datos siguen vigentes.</li>
  <li><strong>Busca licitaciones</strong> en las que te pidan estar inscrito: en el <a href="/">buscador</a> verás el procedimiento de cada una en su ficha.</li>
</ul>`,
  },
  {
    slug: 'que-es-una-ute',
    titulo: 'Qué es una UTE y cómo presentarse a una licitación con otra empresa',
    corto: 'Qué es una UTE',
    descripcion: 'Cómo funciona una unión temporal de empresas (UTE) en la contratación pública: ventajas, compromiso, solvencia, responsabilidad y pasos para constituirla.',
    html: `
<p>Una <strong>UTE</strong> (unión temporal de empresas) es una alianza entre dos o más empresas o autónomos para presentarse juntos a una licitación y ejecutar el contrato si lo ganan. Es la herramienta habitual para optar a contratos que una empresa sola no podría asumir.</p>

<h2>Para qué sirve</h2>
<ul>
  <li><strong>Sumar solvencia</strong>: se tiene en cuenta la solvencia y la experiencia de todas las empresas de la UTE.</li>
  <li><strong>Complementar capacidades</strong>: por ejemplo, una constructora y una empresa de instalaciones, o una consultora y una empresa de software.</li>
  <li><strong>Llegar a nuevos territorios</strong> junto a una empresa que ya trabaja allí.</li>
</ul>

<h2>Cómo se presenta la oferta</h2>
<p>No hace falta crear la UTE antes de licitar. Basta con presentar un <strong>compromiso de constituirla</strong> si resultáis adjudicatarios, firmado por todas las empresas, que indique:</p>
<ul>
  <li>El nombre de las empresas que la forman.</li>
  <li>El porcentaje de participación de cada una.</li>
  <li>La persona que representará a la UTE ante la Administración.</li>
</ul>
<p>Cada empresa debe presentar su propia declaración (por ejemplo, su <a href="/guias/como-rellenar-el-deuc/">DEUC</a>) y acreditar su capacidad. La oferta es única: solo una, a nombre de la futura UTE.</p>

<h2>Si ganáis</h2>
<ol>
  <li>Constituís la UTE en <strong>escritura pública</strong> antes de formalizar el contrato.</li>
  <li>Obtenéis el <strong>NIF de la UTE</strong> en la Agencia Tributaria y cumplís sus obligaciones fiscales (facturación, impuestos, inscripción en el registro de UTE).</li>
  <li>La UTE dura lo que dure el contrato, incluida su liquidación y el plazo de garantía.</li>
</ol>

<h2>Responsabilidad</h2>
<p>Las empresas de la UTE responden <strong>solidariamente</strong> ante la Administración: si una falla, las demás tienen que cumplir. Por eso es importante firmar un buen acuerdo interno que reparta trabajos, costes, cobros y qué pasa si alguna empresa incumple.</p>

<h2>Consejos</h2>
<ul>
  <li>Elige socios de confianza y con solvencia real.</li>
  <li>Deja por escrito quién hace qué antes de presentar la oferta.</li>
  <li>Una empresa no puede presentar oferta individual y, a la vez, formar parte de una UTE en la misma licitación (o lote): os excluirían.</li>
</ul>
<p>Para encontrar socios, mira <a href="/empresas/">qué empresas ganan contratos</a> en tu sector y tu zona.</p>`,
  },
  {
    slug: 'como-rellenar-el-deuc',
    titulo: 'Cómo rellenar el DEUC (Documento Europeo Único de Contratación)',
    corto: 'Cómo rellenar el DEUC',
    descripcion: 'Qué es el DEUC, cuándo se pide, qué incluye cada parte y cómo rellenarlo sin errores para presentar tu oferta a una licitación pública.',
    html: `
<p>El <strong>DEUC</strong> (Documento Europeo Único de Contratación) es una declaración responsable con formato común en toda la Unión Europea. Con él declaras que tu empresa cumple los requisitos para contratar, en lugar de entregar todos los certificados con la oferta. Solo la empresa que gana tendrá que demostrarlo después.</p>

<h2>Cuándo se pide</h2>
<p>Es obligatorio en los contratos sujetos a regulación armonizada y se usa también en muchos otros. En contratos más pequeños, el pliego suele sustituirlo por una declaración responsable más sencilla, con su propio modelo. Usa siempre el formato que indique el pliego.</p>

<h2>Cómo se rellena</h2>
<p>Lo más cómodo es usar la herramienta de DEUC electrónico de la Plataforma de Contratación del Sector Público, a la que se puede importar el archivo que facilita el órgano de contratación. Así el formulario ya viene con los datos de la licitación y solo tienes que completar los tuyos. Después lo descargas, lo firmas y lo incluyes en el sobre administrativo.</p>

<h2>Las partes del DEUC</h2>
<ul>
  <li><strong>Parte I. Información del procedimiento</strong>: datos de la licitación. Normalmente viene rellena.</li>
  <li><strong>Parte II. Información sobre el operador económico</strong>: datos de tu empresa, si es pyme, si está inscrita en el ROLECE u otro registro, quién la representa, si te presentas en <a href="/guias/que-es-una-ute/">UTE</a>, si te apoyas en la solvencia de otras empresas y si vas a subcontratar.</li>
  <li><strong>Parte III. Motivos de exclusión</strong>: declaras que no tienes condenas por determinados delitos, que estás al corriente de tus obligaciones tributarias y con la Seguridad Social y que no estás en ninguna otra prohibición para contratar.</li>
  <li><strong>Parte IV. Criterios de selección</strong>: tu solvencia. Muchas veces el pliego permite contestar solo a una pregunta global: que cumples todos los criterios de selección exigidos.</li>
  <li><strong>Parte V. Reducción del número de candidatos</strong>: solo en procedimientos con selección previa, como el restringido.</li>
  <li><strong>Parte VI. Declaraciones finales</strong>: la firma.</li>
</ul>

<h2>Errores frecuentes</h2>
<ul>
  <li><strong>No firmarlo</strong> o firmarlo con un certificado que no es del representante.</li>
  <li><strong>En UTE, presentar un solo DEUC</strong>: cada empresa debe presentar el suyo.</li>
  <li><strong>Apoyarte en otra empresa sin incluir su DEUC.</strong></li>
  <li><strong>Declarar algo que no puedes demostrar.</strong> Si ganas, te pedirán los certificados, y una declaración falsa puede suponer la exclusión y una prohibición para contratar.</li>
  <li><strong>Usar un DEUC de otra licitación</strong> sin revisar lo que pide la nueva.</li>
</ul>
<p>Más información en la <a href="/guias/documentacion-para-licitar/">guía de documentación para licitar</a>.</p>`,
  },
  {
    slug: 'como-hacer-una-memoria-tecnica',
    titulo: 'Cómo hacer una memoria técnica para una licitación',
    corto: 'Cómo hacer una memoria técnica',
    descripcion: 'Consejos prácticos para redactar la memoria técnica de una licitación pública: estructura, qué valoran los técnicos, extensión y errores que restan puntos.',
    html: `
<p>En muchas licitaciones, una parte de los puntos depende de un <strong>juicio de valor</strong>: los técnicos leen tu propuesta y la puntúan. Ese documento es la memoria técnica, y a menudo decide quién gana cuando los precios están igualados.</p>

<h2>1. Empieza por los criterios de adjudicación</h2>
<p>El pliego dice exactamente qué se valora y cuántos puntos da cada aspecto: metodología, organización del servicio, plan de trabajo, medios, control de calidad, mejoras, aspectos sociales o medioambientales… Haz una lista y reparte tu esfuerzo según los puntos: no dediques diez páginas a algo que vale un punto.</p>

<h2>2. Usa la misma estructura que el pliego</h2>
<p>Organiza la memoria con los <strong>mismos apartados, en el mismo orden y con los mismos títulos</strong> que los criterios. El técnico que la evalúa tiene una tabla de puntuación: ponle fácil encontrar lo que busca.</p>

<h2>3. Respeta el formato</h2>
<p>Si el pliego limita el número de páginas, el tipo o el tamaño de letra, cúmplelo al pie de la letra. Muchas veces el contenido que sobrepasa el límite no se lee o se penaliza.</p>

<h2>4. Sé concreto y habla de este contrato</h2>
<ul>
  <li>Explica cómo harás <strong>este</strong> trabajo, en <strong>este</strong> lugar, para <strong>este</strong> organismo.</li>
  <li>Da datos: personas, horarios, frecuencias, plazos, vehículos, herramientas, indicadores.</li>
  <li>Incluye un calendario o un cronograma si el contrato tiene fases.</li>
  <li>Anticipa los problemas habituales del servicio y cómo los resolverás.</li>
  <li>Evita los textos genéricos copiados de otras ofertas: se notan y puntúan poco.</li>
</ul>

<h2>5. No mezcles información de sobres distintos</h2>
<p>Si el precio o cualquier criterio que se valora con fórmulas aparece en la memoria (que va en el sobre de juicio de valor), pueden <strong>excluir tu oferta</strong>, porque se rompe el secreto de la valoración. Revisa que la memoria no incluya importes, descuentos ni compromisos que se puntúan de forma automática.</p>

<h2>6. Cuida la presentación</h2>
<ul>
  <li>Índice, apartados numerados y páginas numeradas.</li>
  <li>Tablas y esquemas cuando ayuden a entender, no como relleno.</li>
  <li>Lenguaje claro, sin frases vacías.</li>
  <li>Revisa la ortografía y que el nombre del organismo y del contrato sean los correctos.</li>
</ul>

<h2>7. Aprende de cada valoración</h2>
<p>Tras la adjudicación, pide el informe de valoración para ver cuántos puntos sacaste en cada apartado y por qué. Es la mejor forma de mejorar tu siguiente memoria. Y revisa <a href="/empresas/">quién ganó</a> y por cuánto.</p>
<p>Más consejos en <a href="/guias/como-ganar-licitaciones-publicas/">cómo ganar licitaciones públicas</a>.</p>`,
  },
  {
    slug: 'baja-temeraria-ofertas-anormalmente-bajas',
    titulo: 'Baja temeraria: qué es una oferta anormalmente baja y cómo justificarla',
    corto: 'Baja temeraria',
    descripcion: 'Cuándo una oferta se considera anormalmente baja (baja temeraria), qué porcentajes se usan, cómo justificarla y qué pasa si no se acepta la justificación.',
    html: `
<p>Bajar el precio ayuda a ganar puntos, pero si bajas demasiado tu oferta puede considerarse <strong>anormalmente baja</strong>, lo que se conoce como «baja temeraria». En ese caso tendrás que justificar que puedes cumplir el contrato con ese precio o te excluirán.</p>

<h2>Cuándo una oferta es anormalmente baja</h2>
<p>Cada pliego fija sus propios parámetros. Cuando el único criterio es el precio y el pliego no dice otra cosa, se suelen aplicar los del artículo 85 del Reglamento general de la Ley de Contratos de las Administraciones Públicas:</p>
<ul>
  <li><strong>Un solo licitador</strong>: si su oferta es más de 25 puntos porcentuales inferior al presupuesto base de licitación.</li>
  <li><strong>Dos licitadores</strong>: si una oferta es más de 20 puntos porcentuales inferior a la otra.</li>
  <li><strong>Tres licitadores</strong>: si una oferta es más de 10 puntos porcentuales inferior a la media de las ofertas (y en todo caso si es más de 25 puntos inferior).</li>
  <li><strong>Cuatro o más</strong>: si una oferta es más de 10 puntos porcentuales inferior a la media, calculada sin las ofertas que la superan en más de 10 puntos.</li>
</ul>
<p>Cuando hay varios criterios de adjudicación, el pliego debe indicar cómo se detectan las ofertas anormales. Léelo antes de decidir tu precio.</p>

<h2>Qué pasa si tu oferta está en baja</h2>
<ol>
  <li>La mesa de contratación te pide que <strong>justifiques</strong> tu oferta en un plazo corto, normalmente de pocos días.</li>
  <li>Presentas un informe que explique por qué puedes cumplir con ese precio.</li>
  <li>Los técnicos lo analizan y deciden si la aceptan o la rechazan.</li>
</ol>
<p>Si no respondes a tiempo o la justificación no convence, tu oferta queda <strong>excluida</strong>.</p>

<h2>Cómo justificarla bien</h2>
<ul>
  <li><strong>Desglosa los costes</strong>: personal (con el convenio colectivo aplicable), materiales, maquinaria, desplazamientos, seguros, gastos generales y beneficio.</li>
  <li><strong>Explica de dónde sale el ahorro</strong>: medios propios ya amortizados, cercanía, procesos más eficientes, precios de proveedores (aporta presupuestos).</li>
  <li><strong>Demuestra que cumples</strong> la normativa laboral, social y medioambiental. Una oferta que no cubre los salarios del convenio se rechaza siempre.</li>
  <li><strong>Sé concreto y aporta documentos</strong>, no solo afirmaciones.</li>
</ul>

<h2>Garantía complementaria</h2>
<p>Si te adjudican el contrato tras justificar una baja, el pliego puede exigir una <strong>garantía complementaria</strong> además de la definitiva (hasta un 5 % adicional). Tenlo en cuenta en tus números.</p>

<h2>Cómo evitar sustos</h2>
<p>Antes de ofertar, revisa a cuánto se han adjudicado contratos parecidos. En LicitaEmpresa puedes ver las adjudicaciones de cada sector y <a href="/empresas/">lo que gana cada empresa</a>, con su importe y el número de ofertas.</p>`,
  },
  {
    slug: 'garantia-provisional-y-definitiva',
    titulo: 'Garantía provisional y definitiva: aval, seguro de caución y devolución',
    corto: 'Garantías en la contratación',
    descripcion: 'Qué son la garantía provisional, la definitiva y la complementaria en las licitaciones públicas, cuánto suponen, cómo se constituyen y cuándo se devuelven.',
    html: `
<p>Las garantías aseguran a la Administración que la empresa mantendrá su oferta y cumplirá el contrato. Conocerlas te ayuda a calcular cuánto dinero tendrás inmovilizado si ganas.</p>

<h2>Garantía provisional</h2>
<p>Se deposita con la oferta para asegurar que no la retirarás. Hoy es <strong>excepcional</strong>: solo se pide si el órgano de contratación lo justifica, y no puede superar el <strong>3 % del presupuesto base</strong> del contrato (sin IVA). Se devuelve a todas las empresas tras la adjudicación; a la que gana, cuando constituye la definitiva.</p>

<h2>Garantía definitiva</h2>
<p>La deposita la empresa que gana antes de formalizar el contrato. En general es el <strong>5 % del precio de adjudicación</strong>, sin IVA. Responde de las penalidades, de los daños que cause la empresa y de la correcta ejecución del contrato.</p>
<p>No se exige en el procedimiento abierto simplificado abreviado y, en algunos casos, el pliego puede eximirla o permitir que se retenga del precio.</p>

<h2>Garantía complementaria</h2>
<p>El pliego puede pedir una garantía adicional de hasta otro 5 % en casos especiales, por ejemplo cuando la oferta ganadora se consideró anormalmente baja y se aceptó su justificación. Lo explicamos en la guía sobre <a href="/guias/baja-temeraria-ofertas-anormalmente-bajas/">baja temeraria</a>.</p>

<h2>Cómo se constituyen</h2>
<ul>
  <li><strong>En efectivo o en valores</strong>, depositados en la Caja General de Depósitos o en la caja que indique el pliego. Es lo más sencillo, pero inmoviliza dinero.</li>
  <li><strong>Aval bancario</strong>, emitido por un banco o una sociedad de garantía recíproca. El banco cobra una comisión y consume parte de tu riesgo bancario.</li>
  <li><strong>Seguro de caución</strong>, contratado con una aseguradora autorizada. Suele ser más barato y no consume tu línea de crédito con el banco.</li>
</ul>
<p>El documento debe cumplir el modelo oficial y, en el caso de avales y seguros, estar bastanteado (verificado) en los términos que pida el pliego.</p>

<h2>Plazos</h2>
<p>Tras la propuesta de adjudicación, tendrás normalmente <strong>10 días hábiles</strong> para presentar la garantía definitiva junto con el resto de la documentación. Si no lo haces, se entiende que retiras la oferta. Ten preparado el contacto con tu banco o tu aseguradora antes de licitar.</p>

<h2>Devolución</h2>
<p>La garantía definitiva se devuelve cuando termina el contrato y pasa el <strong>plazo de garantía</strong> sin incidencias. No siempre se devuelve de oficio: solicítala por escrito y, si es un aval o un seguro, pide que te devuelvan el documento original para cancelarlo y dejar de pagar comisiones.</p>`,
  },
  {
    slug: 'clasificacion-empresarial',
    titulo: 'Clasificación empresarial: qué es, grupos, categorías y cómo obtenerla',
    corto: 'Clasificación empresarial',
    descripcion: 'Qué es la clasificación de empresas contratistas, cuándo es obligatoria, cómo se leen los grupos, subgrupos y categorías, y cómo solicitarla.',
    html: `
<p>La <strong>clasificación empresarial</strong> es una acreditación oficial que demuestra que tu empresa tiene la solvencia para ejecutar contratos de un tipo y de un importe determinados. Sustituye a la acreditación de la solvencia en cada licitación y, en las obras de cierto importe, es obligatoria.</p>

<h2>Cuándo es obligatoria</h2>
<ul>
  <li><strong>Obras</strong>: en contratos de valor estimado igual o superior a <strong>500.000 €</strong>.</li>
  <li><strong>Servicios</strong>: no es obligatoria, pero el pliego puede admitirla como forma de acreditar la solvencia.</li>
  <li><strong>Suministros</strong>: no se exige.</li>
</ul>

<h2>Cómo se lee: grupo, subgrupo y categoría</h2>
<p>Una clasificación como «C-2-3» indica el <strong>grupo</strong> (el tipo de trabajo), el <strong>subgrupo</strong> (la especialidad) y la <strong>categoría</strong> (el importe máximo que puedes asumir).</p>
<p><strong>Grupos de obras</strong>, de la A a la K: por ejemplo, A movimiento de tierras, C edificaciones, E hidráulicas, G viales y pistas, I instalaciones eléctricas, J instalaciones mecánicas o K especiales.</p>
<p><strong>Grupos de servicios</strong>, de la L a la V: por ejemplo, servicios administrativos, de mantenimiento, de limpieza, de transporte o informáticos.</p>

<h2>Categorías</h2>
<p>Según el Real Decreto 773/2015, la categoría depende del valor estimado del contrato (o de su anualidad media si dura más de un año):</p>
<ul>
  <li><strong>Obras</strong>: categoría 1 hasta 150.000 €; 2 hasta 360.000 €; 3 hasta 840.000 €; 4 hasta 2.400.000 €; 5 hasta 5.000.000 €; 6 más de 5.000.000 €.</li>
  <li><strong>Servicios</strong>: categoría 1 menos de 150.000 €; 2 menos de 300.000 €; 3 menos de 600.000 €; 4 menos de 1.200.000 €; 5 desde 1.200.000 €.</li>
</ul>

<h2>Cómo se obtiene</h2>
<ol>
  <li><strong>Reúne la documentación</strong>: cuentas anuales de los últimos ejercicios, relación de obras o servicios realizados con sus certificados de buena ejecución, plantilla y personal técnico, maquinaria y medios.</li>
  <li><strong>Solicítala</strong> a la Junta Consultiva de Contratación Pública del Estado, a través de la sede electrónica del Ministerio de Hacienda, o al órgano autonómico competente.</li>
  <li><strong>Espera la resolución</strong>, que asigna los grupos, subgrupos y categorías que te correspondan según tu experiencia y tu solvencia.</li>
</ol>
<p>La clasificación se inscribe en el <a href="/guias/como-inscribirse-en-el-rolece/">ROLECE</a> o en el registro autonómico.</p>

<h2>Mantenerla</h2>
<p>La clasificación no caduca mientras sigas cumpliendo los requisitos, pero hay que justificarlo periódicamente: cada año, el mantenimiento de la solvencia económica, y cada tres años, el de la solvencia técnica, mediante declaraciones responsables y la documentación correspondiente. Si no lo haces, la clasificación se suspende.</p>
<p>¿Buscas obras de tu categoría? En el <a href="/">buscador</a> puedes filtrar por presupuesto y por tipo de contrato.</p>`,
  },
  {
    slug: 'como-recurrir-una-adjudicacion',
    titulo: 'Cómo recurrir una adjudicación: el recurso especial en materia de contratación',
    corto: 'Recurrir una adjudicación',
    descripcion: 'Qué hacer si no estás de acuerdo con una adjudicación o con tu exclusión: recurso especial en materia de contratación, plazos, contratos recurribles y alternativas.',
    html: `
<p>Si crees que te han excluido injustamente, que se ha valorado mal tu oferta o que el pliego es ilegal, puedes recurrir. En los contratos de mayor importe existe un recurso rápido y gratuito: el <strong>recurso especial en materia de contratación</strong>.</p>
<p class="nota">Esta guía es informativa. Si vas a recurrir un contrato importante, conviene que te asesore un abogado especializado.</p>

<h2>Qué contratos admiten recurso especial</h2>
<ul>
  <li><strong>Obras y concesiones</strong> de valor estimado superior a <strong>3.000.000 €</strong>.</li>
  <li><strong>Servicios y suministros</strong> de valor estimado superior a <strong>100.000 €</strong>.</li>
  <li>Otros supuestos que recoge la ley, como determinados acuerdos marco y sistemas dinámicos de adquisición.</li>
</ul>

<h2>Qué se puede recurrir</h2>
<ul>
  <li>Los <strong>anuncios y pliegos</strong>, si contienen condiciones discriminatorias o ilegales.</li>
  <li>Los actos que deciden la <strong>exclusión</strong> de tu oferta o te impiden continuar.</li>
  <li>La <strong>adjudicación</strong>.</li>
  <li>Otros actos que señala la ley, como determinadas modificaciones del contrato.</li>
</ul>

<h2>Plazo</h2>
<p>El plazo general es de <strong>15 días hábiles</strong>, que se cuentan desde la publicación o la notificación del acto que recurres (por ejemplo, desde que se te notifica la adjudicación). Es un plazo corto: si tienes dudas, pide acceso al expediente cuanto antes.</p>

<h2>Ante quién</h2>
<p>Ante el <strong>Tribunal Administrativo Central de Recursos Contractuales</strong>, si el contrato es de la Administración del Estado, o ante el tribunal o el órgano equivalente de cada comunidad autónoma. Algunos ayuntamientos y diputaciones tienen el suyo.</p>

<h2>Cómo se presenta</h2>
<ol>
  <li><strong>Revisa el expediente</strong>: informes de valoración, ofertas y actas. Puedes pedir acceso a ellos.</li>
  <li><strong>Redacta el escrito</strong>: qué acto recurres, por qué es contrario a la ley o al pliego y qué pides.</li>
  <li><strong>Preséntalo electrónicamente</strong> en el registro del tribunal o del órgano de contratación.</li>
</ol>
<p>El recurso contra la adjudicación <strong>suspende automáticamente</strong> la formalización del contrato hasta que se resuelve. El tribunal resuelve en pocas semanas. El recurso es gratuito, pero si el tribunal aprecia mala fe o temeridad puede imponer una multa.</p>

<h2>Si el contrato no admite recurso especial</h2>
<p>En los contratos de menor importe, los actos se pueden impugnar con los recursos administrativos ordinarios (alzada o reposición, según el órgano) y, después, ante la jurisdicción contencioso-administrativa. Los plazos son distintos: revisa el pie de recursos de la notificación.</p>

<h2>Antes de recurrir</h2>
<p>Compara tu oferta con la ganadora: en LicitaEmpresa puedes ver <a href="/empresas/">quién gana cada contrato</a> y por cuánto. Y si te excluyeron por algo formal, aprende para la próxima: tienes consejos en <a href="/guias/como-ganar-licitaciones-publicas/">cómo ganar licitaciones públicas</a>.</p>`,
  },
  {
    slug: 'alternativas-gratis-para-buscar-licitaciones',
    titulo: 'Webs para buscar licitaciones: comparativa de precios y alternativas gratis',
    corto: 'Comparativa de webs de licitaciones',
    descripcion: 'Comparativa de las webs para buscar licitaciones públicas en España: precio, plan gratuito y qué ofrece cada una, incluidas las alternativas gratis.',
    html: `
<p>Hay muchas webs para encontrar licitaciones públicas en España y la mayoría son de pago. Antes de suscribirte a una, conviene saber qué ofrece cada una y qué se puede conseguir gratis.</p>
<p class="nota">Precios publicados por cada servicio o recogidos en comparativas públicas, consultados el 22 de octubre de 2026. Pueden cambiar: compruébalos en la web de cada uno antes de contratar. LicitaEmpresa aparece en esta tabla, así que tenlo en cuenta al leerla.</p>

<h2>Comparativa de precios</h2>
<table>
<thead><tr><th>Servicio</th><th>Precio</th><th>Plan gratuito</th></tr></thead>
<tbody>
<tr><td><strong>LicitaEmpresa</strong></td><td>Gratis</td><td>Todo: buscador, adjudicaciones, fichas, empresas, organismos y alertas por email, sin registro</td></tr>
<tr><td>Plataforma de Contratación del Sector Público</td><td>Gratis (oficial)</td><td>Todo, con usuario de empresa</td></tr>
<tr><td>TED (Unión Europea)</td><td>Gratis (oficial)</td><td>Todo; solo contratos de mayor importe</td></tr>
<tr><td>Alicitar</td><td>Gratis</td><td>Buscador y alertas con tu email</td></tr>
<tr><td>Plicando</td><td>Gratis; guía de requisitos de una licitación, 9 € + IVA</td><td>Panel y avisos por oficio</td></tr>
<tr><td>Licitify</td><td>Desde 3,75 €/mes (anual)</td><td>Limitado a pocos códigos CPV</td></tr>
<tr><td>Licitaciones365</td><td>Desde 9 €/mes</td><td>Prueba de 14 días</td></tr>
<tr><td>Licitamos</td><td>Desde 9 €/mes</td><td>Prueba de 7 días</td></tr>
<tr><td>Euroalert</td><td>20 €/mes o 192 €/año + IVA</td><td>No consta</td></tr>
<tr><td>iaLicitaciones</td><td>23–29 €/mes</td><td>1 alerta</td></tr>
<tr><td>LicitIn</td><td>Desde 25 €/mes</td><td>3 alertas</td></tr>
<tr><td>Infoconcurso</td><td>26 €/mes, 72 €/trimestre o 240 €/año</td><td>Prueba de 20 días</td></tr>
<tr><td>Tendios</td><td>31–37 €/mes</td><td>Con límites</td></tr>
<tr><td>El Vínculo</td><td>39 €/mes o 330 €/año</td><td>3 búsquedas con alerta</td></tr>
<tr><td>Plicas Radar</td><td>Desde 49 €/mes</td><td>Prueba de 14 días</td></tr>
<tr><td>Gobierto Contratación</td><td>Desde 300 €/año + IVA</td><td>Prueba de 14 días</td></tr>
<tr><td>Infonalia</td><td>302 €/año + IVA</td><td>No consta</td></tr>
<tr><td>Licitaciones.es</td><td>A medida</td><td>Prueba gratuita</td></tr>
</tbody>
</table>

<h2>Qué suelen ofrecer los servicios de pago</h2>
<ul>
  <li><strong>Alertas por email</strong> por sector y provincia. Es lo que más se usa, y hoy se puede tener gratis.</li>
  <li><strong>Análisis de mercado y competencia</strong>: quién gana, a qué precios, qué organismos compran más.</li>
  <li><strong>Inteligencia artificial</strong> para buscar con lenguaje natural o resumir pliegos.</li>
  <li><strong>Gestión del proceso</strong>: equipos, CRM, informes y, en algunos casos, asesoría o ayuda para preparar ofertas.</li>
</ul>
<p>Si eres una gran empresa con un departamento de licitaciones, las herramientas de gestión pueden compensar. Si eres una pyme o un autónomo, normalmente basta con un buen buscador y alertas.</p>

<h2>Qué tienes gratis en LicitaEmpresa</h2>
<ul>
  <li>Todas las licitaciones de la Plataforma de Contratación y de las plataformas autonómicas que agrega, en plazo y de los últimos 6 meses.</li>
  <li><a href="/">Buscador</a> por sector, provincia, importe y plazo.</li>
  <li>Alertas diarias por email, sin registro ni contraseña.</li>
  <li><a href="/empresas/">Qué gana cada empresa</a> y alertas para seguir a tus competidores.</li>
  <li><a href="/organismos/">Qué licita cada organismo</a> y a quién adjudica.</li>
  <li>Licitaciones <a href="/hoy/">publicadas hoy</a>, <a href="/licitaciones/oficio/">por oficio</a> y <a href="/licitaciones/">por provincia</a>.</li>
  <li><a href="/guias/">Guías</a> para aprender a licitar paso a paso.</li>
</ul>
<p>Lo que no ofrecemos: preparar ofertas, asesoría jurídica ni contratos menores, que no se publican como licitación abierta.</p>`,
  },
];
