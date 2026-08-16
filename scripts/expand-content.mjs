/**
 * Amplía glossary.json y laws.json con términos y normas adicionales.
 * Idempotente: no duplica ids existentes.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const glossaryPath = path.join(root, 'src', 'data', 'glossary.json')
const metaPath = path.join(root, 'src', 'data', 'glossary-meta.json')
const lawsPath = path.join(root, 'src', 'data', 'laws.json')
const examplesPath = path.join(root, 'src', 'data', 'examples-sj.json')

const NEW_TERMS = [
  {
    id: 'regalias-mineras',
    term: 'Regalías mineras',
    category: 'Económico',
    plain:
      'Pago que el productor minero hace al Estado (nación o provincia) por extraer un recurso no renovable. Suele calcularse sobre el valor del mineral o del concentrado.',
    detail:
      'En Argentina el régimen de regalías se articula con la Ley de Inversiones Mineras y con leyes provinciales. En San Juan hay una ley provincial específica de regalías.',
    related: ['canon-minero', 'ley-de-inversiones-mineras', 'produccion'],
  },
  {
    id: 'estabilidad-fiscal',
    term: 'Estabilidad fiscal',
    category: 'Económico',
    plain:
      'Beneficio que congela, por un plazo, la carga tributaria aplicable a un proyecto minero aprobado, para dar previsibilidad a la inversión.',
    detail:
      'En el marco de la Ley 24.196 de Inversiones Mineras, la estabilidad fiscal es uno de los incentivos centrales. No elimina todos los tributos: fija reglas frente a cambios posteriores.',
    related: ['regalias-mineras', 'rigi', 'ley-de-inversiones-mineras'],
  },
  {
    id: 'rigi',
    term: 'RIGI',
    category: 'Económico',
    plain:
      'Régimen de Incentivo para Grandes Inversiones: marco nacional de beneficios fiscales, aduaneros y cambiarios para proyectos de gran escala que cumplan requisitos de inversión.',
    detail:
      'Sigla de uso frecuente en noticias y contratos. Conviene contrastar siempre el texto legal vigente y las condiciones de adhesión provincial.',
    related: ['estabilidad-fiscal', 'joint-venture', 'feasibility-study'],
  },
  {
    id: 'acuerdo-federal-minero',
    term: 'Acuerdo Federal Minero',
    category: 'Jurídico',
    plain:
      'Compromiso entre Nación y provincias para ordenar políticas mineras comunes (incentivos, ambiente, información), respetando el dominio provincial del recurso.',
    detail:
      'Complementa el Código de Minería y las leyes de inversiones. No reemplaza la autoridad minera provincial ni el Código.',
    related: ['codigo-de-mineria', 'dominio-originario', 'autoridad-minera'],
  },
  {
    id: 'ley-de-glaciares',
    term: 'Ley de glaciares',
    category: 'Ambiental',
    plain:
      'Norma nacional (Ley 26.639) que protege glaciares y ambiente periglacial, limitando actividades que puedan afectarlos, incluida la minería en ciertas zonas.',
    detail:
      'En Cordillera (San Juan, etc.) es un eje de evaluación ambiental y de conflictos territoriales. Se cruza con inventarios de glaciares y con la IIA del proyecto.',
    related: ['iia', 'area-protegida', 'monitoreo-ambiental'],
  },
  {
    id: 'consulta-previa',
    term: 'Consulta previa',
    category: 'Social',
    plain:
      'Proceso de información y diálogo con comunidades —en especial pueblos indígenas— antes de autorizar proyectos que puedan afectar sus derechos o territorios.',
    detail:
      'Se asocia al Convenio 169 de la OIT y a estándares de participación. No es un trámite genérico de “audiencia”: tiene requisitos propios de buena fe y oportunidad.',
    related: ['audiencia-publica', 'licencia-social', 'comunidades'],
  },
  {
    id: 'audiencia-publica',
    term: 'Audiencia pública',
    category: 'Ambiental',
    plain:
      'Instancia formal donde la autoridad y el proyecto reciben opiniones de vecinos, organismos y público sobre un Informe de Impacto Ambiental u otra decisión.',
    detail:
      'En minería suele vincularse a la evaluación ambiental provincial. Las observaciones deben constar y ser consideradas, aunque no siempre vinculan el resultado.',
    related: ['iia', 'dia', 'consulta-previa'],
  },
  {
    id: 'pasivo-ambiental',
    term: 'Pasivo ambiental',
    category: 'Ambiental',
    plain:
      'Daño, contaminación o riesgo dejado por una actividad (a veces abandonada) que todavía hay que remediar: suelos, aguas, diques, instalaciones.',
    detail:
      'En minería histórica aparece en labores viejas, botaderos y relaves. El plan de cierre busca evitar nuevos pasivos; la remediación ataca los ya existentes.',
    related: ['plan-de-cierre', 'remediacion', 'garantia-ambiental'],
  },
  {
    id: 'garantia-ambiental',
    term: 'Garantía ambiental',
    category: 'Ambiental',
    plain:
      'Respaldo financiero (seguro, fianza, fondo) que el titular debe constituir para cubrir cierre, remediación o contingencias ambientales.',
    detail:
      'Complementa el plan de cierre. Su monto y forma los fija la autoridad según riesgo y etapa del proyecto.',
    related: ['plan-de-cierre', 'pasivo-ambiental', 'fondo-de-cierre'],
  },
  {
    id: 'drenaje-acido-de-roca',
    term: 'Drenaje ácido de roca (DAR / ARD)',
    category: 'Ambiental',
    plain:
      'Agua ácida que se genera cuando minerales sulfurados se oxidan al contacto con aire y agua, pudiendo movilizar metales al ambiente.',
    detail:
      'También llamado ARD (Acid Rock Drainage). Se controla con caracterización geoquímica, aislamiento de materiales, coberturas y tratamiento de aguas.',
    related: ['sulfuros', 'botadero', 'monitoreo-ambiental', 'neutralizacion'],
  },
  {
    id: 'neutralizacion',
    term: 'Neutralización',
    category: 'Ambiental',
    plain:
      'Tratamiento que sube el pH de un efluente ácido (por ejemplo con cal) para precipitar metales y cumplir límites de vuelco o reúso.',
    detail:
      'Es una etapa típica de plantas de tratamiento de aguas de mina o de drenaje ácido. Genera lodos que también deben gestionarse.',
    related: ['drenaje-acido-de-roca', 'efluente', 'ph'],
  },
  {
    id: 'monitoreo-ambiental',
    term: 'Monitoreo ambiental',
    category: 'Ambiental',
    plain:
      'Medición periódica de agua, aire, ruido, suelos, flora/fauna u otros indicadores para verificar que el proyecto cumple su IIA y la normativa.',
    detail:
      'Incluye estaciones, piezómetros, laboratorios y reportes a la autoridad. La línea de base define el “antes” del proyecto.',
    related: ['linea-de-base', 'iia', 'piezometro'],
  },
  {
    id: 'linea-de-base',
    term: 'Línea de base',
    category: 'Ambiental',
    plain:
      'Diagnóstico del ambiente y del medio social antes de que el proyecto opere, para comparar después los cambios reales.',
    detail:
      'Es insumo clave del IIA. Sin una buena línea de base es difícil demostrar impactos o mejoras.',
    related: ['iia', 'monitoreo-ambiental', 'esmia'],
  },
  {
    id: 'esmia',
    term: 'EsIA / ESMIA',
    category: 'Ambiental',
    plain:
      'Estudio (o Evaluación) de Impacto Ambiental: documento técnico que describe el proyecto, identifica impactos y propone medidas de prevención y mitigación.',
    detail:
      'En la práctica argentina minera se habla también de IIA (Informe de Impacto Ambiental). La sigla varía según jurisdicción y uso coloquial.',
    related: ['iia', 'dia', 'linea-de-base'],
  },
  {
    id: 'cianuro',
    term: 'Cianuro',
    category: 'Metalúrgico',
    plain:
      'Reactivo usado en lixiviación de oro y plata. Es tóxico: su manejo exige controles estrictos de proceso, transporte, destruccción y efluentes.',
    detail:
      'Se habla de cianuro libre, WAD y total. Plantas modernas incluyen circuitos de detoxificación (destrucción) antes de disponer soluciones.',
    related: ['lixiviacion', 'lixiviacion-en-pilas', 'detoxificacion-de-cianuro'],
  },
  {
    id: 'detoxificacion-de-cianuro',
    term: 'Detoxificación de cianuro',
    category: 'Metalúrgico',
    plain:
      'Proceso químico que destruye o reduce el cianuro residual en soluciones de proceso hasta niveles permitidos para vuelco o recirculación.',
    detail:
      'Métodos comunes incluyen SO₂/aire (INCO) y otros oxidantes. Forma parte del control ambiental de plantas de oro.',
    related: ['cianuro', 'efluente', 'monitoreo-ambiental'],
  },
  {
    id: 'pad-de-lixiviacion',
    term: 'Pad de lixiviación',
    category: 'Operativo',
    plain:
      'Plataforma impermeabilizada donde se apila mineral y se riega con solución (por ejemplo cianurada) para disolver metales preciosos.',
    detail:
      'Equivalente práctico a “pila de lixiviación”. Incluye geomembrana, sistema de recolección de soluciones y controles de estabilidad.',
    related: ['lixiviacion-en-pilas', 'pila-de-lixiviacion', 'geomembrana', 'cianuro'],
  },
  {
    id: 'geomembrana',
    term: 'Geomembrana',
    category: 'Operativo',
    plain:
      'Lámina impermeable (suele ser HDPE) que aísla pilas, diques o pad para evitar que soluciones o lixiviados lleguen al suelo y al agua subterránea.',
    detail:
      'Su instalación, soldadura y control de fugas son críticos en seguridad ambiental de relaves y lixiviación.',
    related: ['pad-de-lixiviacion', 'dique-de-colas', 'hdpe'],
  },
  {
    id: 'hdpe',
    term: 'HDPE',
    category: 'Operativo',
    plain:
      'Polietileno de alta densidad: material plástico habitual de geomembranas y cañerías en minería por su resistencia química.',
    detail:
      'Sigla del inglés High Density Polyethylene. Se especifica espesor, resina y ensayos de soldadura.',
    related: ['geomembrana', 'pad-de-lixiviacion'],
  },
  {
    id: 'piezometro',
    term: 'Piezómetro',
    category: 'Geotécnico',
    plain:
      'Instrumento que mide el nivel o la presión del agua en el suelo o en un dique, para controlar estabilidad y filtraciones.',
    detail:
      'Se usa en botaderos, pilas, diques de colas y taludes. Lecturas altas pueden indicar riesgo geotécnico o fugas.',
    related: ['monitoreo-ambiental', 'dique-de-colas', 'estabilidad-fisica'],
  },
  {
    id: 'dique-de-colas',
    term: 'Dique de colas (relaves)',
    category: 'Operativo',
    plain:
      'Obra que contiene los residuos finos (colas/relaves) de la planta. Debe ser estable, impermeabilizado según diseño y monitoreado de por vida útil y cierre.',
    detail:
      'También llamado “tailings dam”. Fallas de diques son eventos de alto impacto; por eso hay estándares estrictos de diseño y gobernanza.',
    related: ['colas-o-relaves', 'geomembrana', 'plan-de-cierre', 'piezometro'],
  },
  {
    id: 'planta-concentradora',
    term: 'Planta concentradora',
    category: 'Metalúrgico',
    plain:
      'Instalación que trituta, muele y concentra el mineral (por flotación u otros métodos) para obtener un producto vendible más rico en metal.',
    detail:
      'Genera concentrado y colas. Su balance metalúrgico define recuperaciones y costos.',
    related: ['concentrado', 'flotacion', 'molienda', 'colas-o-relaves'],
  },
  {
    id: 'flotacion',
    term: 'Flotación',
    category: 'Metalúrgico',
    plain:
      'Proceso en el que, con reactivos y aire, las partículas de mineral valuoso se adhieren a burbujas y se separan de la ganga.',
    detail:
      'Es el método dominante para sulfuros de cobre, plomo, zinc, etc. Produce concentrados y colas.',
    related: ['planta-concentradora', 'concentrado', 'sulfuros'],
  },
  {
    id: 'molienda',
    term: 'Molienda',
    category: 'Metalúrgico',
    plain:
      'Etapa que reduce el tamaño del mineral (después del chancado) hasta liberar los minerales de interés para concentración o lixiviación.',
    detail:
      'Usa molinos SAG, de bolas u otros. El tamaño de producto (P80) condiciona recuperación y consumo energético.',
    related: ['chancado', 'planta-concentradora', 'lixiviacion'],
  },
  {
    id: 'chancado',
    term: 'Chancado (trituración)',
    category: 'Operativo',
    plain:
      'Primera reducción mecánica del mineral extraído (ROM) a fragmentos manejables para molienda o apilado en pilas.',
    detail:
      'Incluye chancadoras primarias, secundarias y terciarias. En español minero “chancar” es de uso corriente en Chile y Argentina.',
    related: ['molienda', 'rom', 'ley-de-cabeza'],
  },
  {
    id: 'sulfuros',
    term: 'Sulfuros',
    category: 'Geológico',
    plain:
      'Minerales que contienen azufre (pirita, calcopirita, etc.). Son menas frecuentes de metales y también fuente potencial de drenaje ácido al oxidarse.',
    detail:
      'En exploración se mapean vetas y diseminaciones sulfuradas. En operación condicionan metalurgia y geoquímica ambiental.',
    related: ['oxidos', 'drenaje-acido-de-roca', 'flotacion'],
  },
  {
    id: 'oxidos',
    term: 'Óxidos (mineral oxidado)',
    category: 'Geológico',
    plain:
      'Zona o mineral donde los sulfuros primarios se alteraron cerca de superficie, a menudo más aptos para lixiviación que para flotación.',
    detail:
      'En yacimientos epitermales y pórfidos la “capa de óxidos” puede tratarse distinto a la zona sulfurada profunda.',
    related: ['sulfuros', 'lixiviacion', 'gossan'],
  },
  {
    id: 'gossan',
    term: 'Gossan',
    category: 'Geológico',
    plain:
      'Capa superficial oxidada y ferruginosa que “delata” un cuerpo sulfurado debajo; guía clásica de exploración.',
    detail:
      'También llamado “sombrero de hierro”. Su muestreo ayuda a priorizar targets, pero no garantiza ley económica.',
    related: ['oxidos', 'afloramiento', 'sulfuros'],
  },
  {
    id: 'epitermal',
    term: 'Yacimiento epitermal',
    category: 'Geológico',
    plain:
      'Depósito hidrotermal formado a relativamente baja temperatura y poca profundidad, típico de oro-plata en vetas o diseminaciones.',
    detail:
      'Muy relevante en Cordillera argentina (incl. San Juan). Se asocia a alteración hidrotermal y a estructuras regionales.',
    related: ['alteracion-hidrotermal', 'veta', 'porfido'],
  },
  {
    id: 'skarn',
    term: 'Skarn',
    category: 'Geológico',
    plain:
      'Yacimiento formado por metasomatismo en contactos entre magma e calizas/rocas carbonatadas; puede alojar Fe, Cu, Au, W, Zn, etc.',
    detail:
      'Se reconoce por minerales de calc-silicatos. En Argentina hay distritos skarn con interés histórico y actual.',
    related: ['hidrotermal', 'sulfuros', 'porfido'],
  },
  {
    id: 'stockwork',
    term: 'Stockwork',
    category: 'Geológico',
    plain:
      'Red densa de vetillas entrecruzadas que mineralizan un volumen de roca, típica de sistemas tipo pórfido.',
    detail:
      'En mapeo y testigos se describe densidad, orientación y mineralogía de las vetillas.',
    related: ['porfido', 'veta', 'alteracion-hidrotermal'],
  },
  {
    id: 'iocg',
    term: 'IOCG',
    category: 'Geológico',
    plain:
      'Sigla de Iron Oxide Copper-Gold: familia de depósitos con óxidos de hierro, cobre y a menudo oro, distintos de los pórfidos clásicos.',
    detail:
      'Modelo exploratorio usado en varias provincias argentinas. Requiere reconocer ensambles de magnetita/hematita y alteración asociada.',
    related: ['oxidos', 'sulfuros', 'porfido'],
  },
  {
    id: 'servidumbre-minera',
    term: 'Servidumbre minera',
    category: 'Jurídico',
    plain:
      'Derecho real que permite al titular minero usar predios ajenos (caminos, ductos, instalaciones) necesarios para explorar o explotar, con indemnización.',
    detail:
      'Se regula en el Código de Minería y normas complementarias. No confunde con la concesión misma sobre el yacimiento.',
    related: ['concesion', 'titular', 'ocupacion-superficial'],
  },
  {
    id: 'demasias',
    term: 'Demasías',
    category: 'Jurídico',
    plain:
      'Franja o superficie sobrante entre pertenencias o límites mineros que puede pedirse en mensura según reglas del Código.',
    detail:
      'Tema típico de catastro y mensura. Evita “huecos” y conflictos de linderos entre concesiones.',
    related: ['pertenencia', 'mensura', 'catastro-minero'],
  },
  {
    id: 'denuncio',
    term: 'Denuncio',
    category: 'Jurídico',
    plain:
      'Acto formal ante la autoridad minera para iniciar o proteger un derecho (descubrimiento, pedimento, etc.), dejando constancia en expediente.',
    detail:
      'El lenguaje del Código usa “denuncio” en varios trámites. No es una denuncia penal: es un acto administrativo minero.',
    related: ['descubrimiento', 'cateo', 'expediente'],
  },
  {
    id: 'joint-venture',
    term: 'Joint venture (JV)',
    category: 'Comercial',
    plain:
      'Acuerdo entre dos o más empresas para explorar o desarrollar un proyecto compartiendo costos, riesgos y eventuales beneficios.',
    detail:
      'Suele incluir earn-in (ganar participación invirtiendo), comités de gestión y reglas de salida. Muy usado en exploración argentina.',
    related: ['earn-in', 'royalty', 'sociedad-minera'],
  },
  {
    id: 'earn-in',
    term: 'Earn-in',
    category: 'Comercial',
    plain:
      'Mecanismo por el cual un socio gana un porcentaje del proyecto a medida que invierte (perfora, estudia, financia etapas).',
    detail:
      'Típico en JV de exploración. El calendario de gastos y la dilución del socio original se pactan en el acuerdo.',
    related: ['joint-venture', 'exploracion', 'pea'],
  },
  {
    id: 'royalty',
    term: 'Royalty (NSR)',
    category: 'Comercial',
    plain:
      'Participación económica sobre la producción o las ventas netas del mineral, sin que el beneficiario opere la mina. El NSR se calcula sobre ingresos netos de fundición.',
    detail:
      'Distinto de la regalía estatal. Es un instrumento privado frecuente en compras de proyectos y financiamiento.',
    related: ['regalias-mineras', 'nsr', 'streaming'],
  },
  {
    id: 'nsr',
    term: 'NSR',
    category: 'Comercial',
    plain:
      'Net Smelter Return: ingreso neto del productor después de costos de fundición/refino, base habitual para calcular royalties privados.',
    detail:
      'Fórmula contractual: hay que leer qué deducciones admite. No es lo mismo que “precio de metal × ley”.',
    related: ['royalty', 'tc-rc', 'concentrado'],
  },
  {
    id: 'streaming',
    term: 'Streaming',
    category: 'Comercial',
    plain:
      'Financiamiento en el que un fondo paga por adelantado el derecho a comprar una parte de la producción futura (oro, plata, cobre) a precio preferencial.',
    detail:
      'Alternativa a deuda o equity. Impacta el flujo del proyecto y debe modelarse en la factibilidad económica.',
    related: ['royalty', 'offtake', 'feasibility-study'],
  },
  {
    id: 'offtake',
    term: 'Offtake (contrato de compraventa)',
    category: 'Comercial',
    plain:
      'Contrato a largo plazo para vender concentrado, cátodos u otro producto a un comprador (fundición, trader), a menudo clave para financiar la mina.',
    detail:
      'Define volúmenes, calidades, fórmulas de pago (TC/RC), destinos y penas. Se negocia en paralelo al FS bancable.',
    related: ['tc-rc', 'concentrado', 'streaming'],
  },
  {
    id: 'pea',
    term: 'PEA',
    category: 'Económico',
    plain:
      'Preliminary Economic Assessment: estudio económico preliminar que ordena si un proyecto merece avanzar a prefactibilidad, con márgenes de error altos.',
    detail:
      'En español a veces “evaluación económica preliminar”. No es un FS: no sostiene por sí solo una decisión de construcción.',
    related: ['pfs', 'feasibility-study', 'recurso-mineral'],
  },
  {
    id: 'feasibility-study',
    term: 'Feasibility study (FS)',
    category: 'Económico',
    plain:
      'Estudio de factibilidad: ingeniería y economía detalladas para decidir construir (o no) la mina, con precisión suficiente para financiamiento.',
    detail:
      'Suele seguir a PFS. Incluye reservas, metalurgia, CAPEX/OPEX, ambiente y riesgos. Estándares NI 43-101 / CRIRSCO marcan qué se puede declarar.',
    related: ['pfs', 'pea', 'reserva-mineral', 'ni-43-101'],
  },
  {
    id: 'ni-43-101',
    term: 'NI 43-101',
    category: 'Comercial',
    plain:
      'Norma canadiense de divulgación de proyectos mineros: cómo informar recursos, reservas y estudios económicos al mercado.',
    detail:
      'Muy usada por juniors listadas. Se alinea con CRIRSCO. Exige Personas Competentes y reglas anti-promesa engañosa.',
    related: ['jorc', 'recurso-mineral', 'reserva-mineral', 'feasibility-study'],
  },
  {
    id: 'jorc',
    term: 'Código JORC',
    category: 'Comercial',
    plain:
      'Estándar australiano (CRIRSCO) para reportar recursos y reservas minerales de forma comparable y auditada.',
    detail:
      'Junto a NI 43-101 y otros códigos hermanos, ordena el lenguaje “inferido / indicado / medido” y “probable / probada”.',
    related: ['ni-43-101', 'recurso-mineral', 'reserva-mineral'],
  },
  {
    id: 'ley-de-corte',
    term: 'Ley de corte (cut-off)',
    category: 'Económico',
    plain:
      'Ley mínima a partir de la cual el mineral se considera económico de extraer o procesar en un escenario de precios y costos dado.',
    detail:
      'Cambia con el precio del metal, la recuperación y los costos. Define contornos de pit y tonelajes reportados.',
    related: ['ley-de-cabeza', 'reserva-mineral', 'strip-ratio'],
  },
  {
    id: 'ley-de-cabeza',
    term: 'Ley de cabeza',
    category: 'Operativo',
    plain:
      'Concentración de metal en el mineral que entra a planta (o a la pila) en un período: el “alimento” del proceso.',
    detail:
      'Se controla con muestreo y ore control. Diferencias con la ley de reserva impactan recuperación y economía.',
    related: ['rom', 'ore-control', 'ley-de-corte'],
  },
  {
    id: 'rom',
    term: 'ROM',
    category: 'Operativo',
    plain:
      'Run of Mine: mineral tal como sale de la mina, antes de chancado fino o clasificación especial.',
    detail:
      'Se reporta en toneladas y ley. El stockpile ROM amortigua variaciones diarias de producción.',
    related: ['ley-de-cabeza', 'chancado', 'stockpile'],
  },
  {
    id: 'strip-ratio',
    term: 'Strip ratio (relación de despeje)',
    category: 'Operativo',
    plain:
      'Cantidad de estéril que hay que mover por cada unidad de mineral útil en una mina a cielo abierto.',
    detail:
      'Un strip ratio alto encarece la operación. Se expresa en t/t o m³/t según el reporte.',
    related: ['rajo', 'botadero', 'ley-de-corte'],
  },
  {
    id: 'rajo',
    term: 'Rajo (open pit)',
    category: 'Operativo',
    plain:
      'Mina a cielo abierto: excavación en bancos desde superficie para extraer el yacimiento.',
    detail:
      'Término muy usado en Chile y Argentina. Implica diseño de taludes, rampas, strip ratio y botaderos.',
    related: ['strip-ratio', 'botadero', 'voladura'],
  },
  {
    id: 'mineria-subterranea',
    term: 'Minería subterránea',
    category: 'Operativo',
    plain:
      'Extracción del mineral mediante labores bajo tierra (rampas, piques, galerías, caserones), sin abrir un gran rajo superficial.',
    detail:
      'Métodos: room and pillar, cut and fill, longhole, block caving, etc. Prioriza sostenimiento, ventilación y control de terreno.',
    related: ['galeria', 'caseron', 'pique', 'relleno'],
  },
  {
    id: 'caseron',
    term: 'Caserón (stope)',
    category: 'Operativo',
    plain:
      'Cavidad subterránea donde se extrae el mineral; unidad básica de producción en muchos métodos de laboreo.',
    detail:
      'El diseño del caserón depende de la geometría del cuerpo, la calidad de roca y el relleno posterior.',
    related: ['mineria-subterranea', 'relleno', 'galeria'],
  },
  {
    id: 'pique',
    term: 'Pique',
    category: 'Operativo',
    plain:
      'Pozo vertical o inclinado que conecta niveles de la mina para personal, mineral, ventilación o servicios.',
    detail:
      'Infraestructura crítica en minas profundas. Requiere sostenimiento y sistemas de izaje.',
    related: ['mineria-subterranea', 'galeria', 'chimenea'],
  },
  {
    id: 'chimenea',
    term: 'Chimenea',
    category: 'Operativo',
    plain:
      'Labor vertical o subvertical usada para ventilación, paso de mineral o acceso entre niveles.',
    detail:
      'Se distingue del pique principal por función y sección. Seguridad: riesgos de caída y de gases.',
    related: ['pique', 'galeria', 'mineria-subterranea'],
  },
  {
    id: 'relleno',
    term: 'Relleno (backfill)',
    category: 'Operativo',
    plain:
      'Material que se vuelve a colocar en caserones vacíos para sostener el terreno y permitir seguir explotando zonas vecinas.',
    detail:
      'Puede ser hidráulico, en pasta (paste fill) o rocoso. Mejora estabilidad y reduce subsidencia.',
    related: ['caseron', 'mineria-subterranea', 'colas-o-relaves'],
  },
  {
    id: 'ore-control',
    term: 'Ore control (control de ley)',
    category: 'Operativo',
    plain:
      'Práctica diaria de muestreo y delimitación de mineral vs. estéril para guiar la extracción y alimentar bien la planta.',
    detail:
      'Reduce dilución y pérdidas. Usa sondajes cortos, canales, sensores y modelos de corto plazo.',
    related: ['ley-de-cabeza', 'dilucion', 'rom'],
  },
  {
    id: 'dilucion',
    term: 'Dilución',
    category: 'Operativo',
    plain:
      'Mezcla no deseada de estéril con el mineral extraído, que baja la ley enviada a planta y empeora la economía.',
    detail:
      'Se controla con buen diseño de voladura, ore control y selectividad. Distinta de la “pérdida” de mineral que queda sin extraer.',
    related: ['ore-control', 'ley-de-cabeza', 'ley-de-corte'],
  },
  {
    id: 'rqd',
    term: 'RQD',
    category: 'Geotécnico',
    plain:
      'Rock Quality Designation: índice de calidad de macizo rocoso a partir de testigos de sondaje (porcentaje de trozos >10 cm).',
    detail:
      'Se usa en clasificación geomecánica y diseño de sostenimiento/taludes. Complementa RMR/Q y ensayos de laboratorio.',
    related: ['sondaje-diamantina', 'estabilidad-fisica', 'ucs'],
  },
  {
    id: 'ucs',
    term: 'UCS',
    category: 'Geotécnico',
    plain:
      'Uniaxial Compressive Strength: resistencia a la compresión simple de la roca, ensayada en laboratorio.',
    detail:
      'Parámetro básico de diseño geotécnico y de fragmentación. Se reporta en MPa.',
    related: ['rqd', 'voladura', 'estabilidad-fisica'],
  },
  {
    id: 'anfo',
    term: 'ANFO',
    category: 'Operativo',
    plain:
      'Explosivo de uso minero a base de nitrato de amonio y combustible; barato y común en voladuras de cielo abierto.',
    detail:
      'Requiere iniciación adecuada y control de humedad. Forma parte del factor de carga y de la fragmentación.',
    related: ['voladura', 'factor-de-carga', 'emulsion'],
  },
  {
    id: 'emulsion',
    term: 'Emulsión (explosivo)',
    category: 'Operativo',
    plain:
      'Explosivo en emulsión, resistente al agua, usado en barrenos húmedos o donde el ANFO no es adecuado.',
    detail:
      'Se combina con retardos y diseños de malla para controlar vibración y fragmentación.',
    related: ['anfo', 'voladura', 'vibraciones'],
  },
  {
    id: 'factor-de-carga',
    term: 'Factor de carga',
    category: 'Operativo',
    plain:
      'Cantidad de explosivo usada por unidad de roca (kg/t o kg/m³). Influye en fragmentación, costo y vibraciones.',
    detail:
      'Se ajusta con la malla de perforación y el tipo de explosivo. Exceso = daño y costo; defecto = bolones.',
    related: ['voladura', 'anfo', 'malla-de-perforacion'],
  },
  {
    id: 'malla-de-perforacion',
    term: 'Malla de perforación',
    category: 'Operativo',
    plain:
      'Disposición (burden y spacing) de los barrenos de voladura en un banco o frente.',
    detail:
      'Diseño geotécnico y de fragmentación. Se documenta en planos de voladura.',
    related: ['voladura', 'factor-de-carga', 'vibraciones'],
  },
  {
    id: 'vibraciones',
    term: 'Vibraciones (voladura)',
    category: 'Ambiental',
    plain:
      'Ondas sísmicas generadas por la voladura que pueden afectar estructuras cercanas; se limitan por normativa y monitoreo.',
    detail:
      'Se miden con sismógrafos (PPV). El diseño de retardos y cargas por retardo las reduce.',
    related: ['voladura', 'ruido', 'monitoreo-ambiental'],
  },
  {
    id: 'ruido',
    term: 'Ruido',
    category: 'Ambiental',
    plain:
      'Impacto sonoro de equipos, voladuras y planta. Se regula con límites en decibeles y medidas de mitigación hacia comunidades.',
    detail:
      'Forma parte de la IIA y del monitoreo. Incluye ruido continuo y eventos (voladura).',
    related: ['vibraciones', 'audiencia-publica', 'monitoreo-ambiental'],
  },
  {
    id: 'ph',
    term: 'pH',
    category: 'Ambiental',
    plain:
      'Medida de acidez o alcalinidad del agua. En minería controla solubilidad de metales y el cumplimiento de vuelcos.',
    detail:
      'Escala 0–14. Aguas de drenaje ácido tienen pH bajo; la neutralización busca subirlo.',
    related: ['drenaje-acido-de-roca', 'neutralizacion', 'monitoreo-ambiental'],
  },
  {
    id: 'tc-rc',
    term: 'TC / RC',
    category: 'Comercial',
    plain:
      'Treatment Charge / Refining Charge: cargos que cobra la fundición/refinería por procesar concentrado; se restan en el cálculo del NSR.',
    detail:
      'Se negocian en el mercado de concentrados y en contratos offtake. Varían con oferta/demanda de fundición.',
    related: ['nsr', 'offtake', 'concentrado'],
  },
  {
    id: 'dore',
    term: 'Barra doré',
    category: 'Metalúrgico',
    plain:
      'Lingote impure de oro-plata producido en planta antes del refino fino; producto típico de operaciones auríferas.',
    detail:
      'Se ensaya y se vende a refinerías. No es oro 999.9: contiene otros metales.',
    related: ['cianuro', 'lixiviacion', 'lingote'],
  },
  {
    id: 'catodo-de-cobre',
    term: 'Cátodo de cobre',
    category: 'Metalúrgico',
    plain:
      'Plancha de cobre de alta pureza obtenida por electro-obtención o electro-refinación; producto comercial estándar LME.',
    detail:
      'En proyectos SX-EW se produce cátodo a partir de soluciones de lixiviación. Calidad “Grade A” es la referencia de mercado.',
    related: ['lixiviacion', 'concentrado', 'offtake'],
  },
  {
    id: 'cadena-de-custodia',
    term: 'Cadena de custodia',
    category: 'Exploración',
    plain:
      'Registro que documenta quién tuvo cada muestra desde la toma hasta el laboratorio, para asegurar integridad y trazabilidad.',
    detail:
      'Parte del QA/QC. Evita mezclas, pérdidas y cuestionamientos en auditorías o reportes públicos.',
    related: ['qa-qc', 'sondaje-diamantina', 'muestreo'],
  },
  {
    id: 'qa-qc',
    term: 'QA/QC',
    category: 'Exploración',
    plain:
      'Aseguramiento y control de calidad del muestreo y de los ensayos: blancos, duplicados, estándares para validar los datos de leyes.',
    detail:
      'Sin QA/QC robusto, un recurso mineral no es creíble ante NI 43-101 / JORC ni ante inversores.',
    related: ['cadena-de-custodia', 'recurso-mineral', 'ni-43-101'],
  },
  {
    id: 'sociedad-minera',
    term: 'Sociedad minera',
    category: 'Jurídico',
    plain:
      'Persona jurídica (SA, SRL, etc.) titular de derechos mineros o vehiculo del proyecto; concentra permisos, contratos y responsabilidades.',
    detail:
      'En catastro el titular puede ser persona física o sociedad. Los cambios de control societario a veces deben informarse a la autoridad.',
    related: ['titular', 'joint-venture', 'concesion'],
  },
  {
    id: 'licencia-social',
    term: 'Licencia social',
    category: 'Social',
    plain:
      'Aceptación informal pero decisiva de comunidades y actores locales para que un proyecto opere con menor conflicto.',
    detail:
      'No es un permiso administrativo. Se construye con información, empleo local, manejo ambiental creíble y cumplimiento de acuerdos.',
    related: ['consulta-previa', 'audiencia-publica', 'comunidades'],
  },
  {
    id: 'ocupacion-superficial',
    term: 'Ocupación superficial',
    category: 'Jurídico',
    plain:
      'Uso del terreno de superficie (caminos, planta, campamento) necesario para la mina, distinto del derecho sobre el mineral del subsuelo.',
    detail:
      'Puede requerir acuerdos con propietarios, expropiación o servidumbres. En Cordillera hay solapes con pastoreo y áreas protegidas.',
    related: ['servidumbre-minera', 'concesion', 'area-protegida'],
  },
  {
    id: 'stockpile',
    term: 'Stockpile',
    category: 'Operativo',
    plain:
      'Acopio temporal de mineral (o de baja ley) que se guarda para procesar después según capacidad de planta o precios.',
    detail:
      'Gestiona dilución de campañas y permite blend. Debe controlarse oxidación y drenajes.',
    related: ['rom', 'acopio', 'ley-de-cabeza'],
  },
  {
    id: 'revegetacion',
    term: 'Revegetación',
    category: 'Ambiental',
    plain:
      'Siembra o plantación de especies para recuperar cobertura vegetal en áreas disturbadas al cierre o en rehabilitación progresiva.',
    detail:
      'Usa suelo vegetal guardado (topsoil), especies nativas y riego inicial. Indicador visible del plan de cierre.',
    related: ['plan-de-cierre', 'remediacion', 'capa-vegetal'],
  },
  {
    id: 'capa-vegetal',
    term: 'Capa vegetal (topsoil)',
    category: 'Ambiental',
    plain:
      'Horizonte superior del suelo rico en materia orgánica que se retira y guarda antes de minar para reusar en la revegetación.',
    detail:
      'Perderlo complica el cierre. Se acopia por separado del estéril.',
    related: ['revegetacion', 'plan-de-cierre', 'botadero'],
  },
  {
    id: 'efluente',
    term: 'Efluente',
    category: 'Ambiental',
    plain:
      'Agua o solución que sale de un proceso o instalación y se vuelca, recircula o trata; debe cumplir límites legales.',
    detail:
      'Incluye aguas de mina, de planta y de diques. El monitoreo de pH, metales y cianuro es rutinario.',
    related: ['monitoreo-ambiental', 'neutralizacion', 'cianuro'],
  },
  {
    id: 'comunidades',
    term: 'Comunidades',
    category: 'Social',
    plain:
      'Poblaciones locales (urbanas, rurales o indígenas) en el área de influencia del proyecto, con derechos a información y participación.',
    detail:
      'La relación con comunidades es eje de licencia social, fondos provinciales y evaluación de impactos sociales.',
    related: ['licencia-social', 'consulta-previa', 'fondo-comunidades'],
  },
  {
    id: 'ley-de-inversiones-mineras',
    term: 'Ley de Inversiones Mineras',
    category: 'Jurídico',
    plain:
      'Ley nacional 24.196 que establece beneficios e incentivos (entre ellos estabilidad fiscal) para promover la inversión minera.',
    detail:
      'Se articula con el Código de Minería y con adhesiones/regímenes provinciales. Consultar texto actualizado y decretos reglamentarios.',
    related: ['estabilidad-fiscal', 'regalias-mineras', 'acuerdo-federal-minero'],
  },
  {
    id: 'dominio-originario',
    term: 'Dominio originario',
    category: 'Jurídico',
    plain:
      'Principio constitucional: las provincias son dueñas originarias de los recursos naturales de su territorio, incluida la minería.',
    detail:
      'Art. 124 de la Constitución Nacional. Explica por qué la autoridad minera y gran parte de la regulación operativa es provincial.',
    related: ['autoridad-minera', 'codigo-de-mineria', 'acuerdo-federal-minero'],
  },
  {
    id: 'hidrotermal',
    term: 'Hidrotermal',
    category: 'Geológico',
    plain:
      'Proceso geológico de fluidos calientes que circulan por la corteza y depositan minerales; origen de muchos yacimientos metálicos.',
    detail:
      'Da lugar a alteración hidrotermal, vetas, stockworks y sistemas epitermales o porfíricos.',
    related: ['alteracion-hidrotermal', 'epitermal', 'veta'],
  },
  {
    id: 'muestreo',
    term: 'Muestreo',
    category: 'Exploración',
    plain:
      'Toma sistemática de porciones de roca, suelo o mineral para ensayar leyes y caracterizar el yacimiento o el proceso.',
    detail:
      'Incluye canales, chips, testigos y muestreo de planta. La representatividad y el QA/QC definen la calidad del dato.',
    related: ['qa-qc', 'cadena-de-custodia', 'sondaje-diamantina'],
  },
  {
    id: 'lingote',
    term: 'Lingote',
    category: 'Metalúrgico',
    plain:
      'Bloque metálico solidificado (oro, plata, cobre, etc.) listo para refino, custodia o venta.',
    detail:
      'La barra doré es un tipo de lingote impure de Au-Ag de planta.',
    related: ['dore', 'catodo-de-cobre'],
  },
]

const NEW_LAWS = [
  {
    id: 'ley-24196-inversiones',
    title: 'Ley 24.196 — Inversiones Mineras',
    scope: 'Nacional',
    ref: 'Ley 24.196',
    summary:
      'Régimen de promoción de la inversión minera: beneficios fiscales y estabilidad tributaria por plazos definidos para proyectos que se acogen al régimen.',
    topics: ['inversiones', 'estabilidad fiscal', 'regalías', 'incentivos'],
  },
  {
    id: 'ley-24224-reordenamiento',
    title: 'Ley 24.224 — Reordenamiento Minero',
    scope: 'Nacional',
    ref: 'Ley 24.224',
    summary:
      'Actualiza aspectos del régimen minero nacional y articula políticas de ordenamiento del sector con las provincias.',
    topics: ['código de minería', 'política minera', 'nación-provincias'],
  },
  {
    id: 'ley-24498-actualizacion',
    title: 'Ley 24.498 — Actualización minera',
    scope: 'Nacional',
    ref: 'Ley 24.498',
    summary:
      'Modificaciones al marco minero nacional vinculadas a modernización de procedimientos y al régimen de inversiones.',
    topics: ['actualización', 'procedimiento', 'inversiones'],
  },
  {
    id: 'ley-24585-ambiente-minero',
    title: 'Ley 24.585 — Protección ambiental de la actividad minera',
    scope: 'Nacional',
    ref: 'Ley 24.585',
    summary:
      'Marco ambiental específico para minería: introduce obligaciones de evaluación de impacto y protección del ambiente en la actividad minera.',
    topics: ['ambiente', 'IIA', 'protección ambiental', 'minería'],
  },
  {
    id: 'ley-25675-lga',
    title: 'Ley 25.675 — Ley General del Ambiente',
    scope: 'Nacional',
    ref: 'Ley 25.675',
    summary:
      'Presupuesto mínimo de protección ambiental: principios (prevención, precaución, sustentabilidad), participación y responsabilidad ambiental.',
    topics: ['ambiente', 'presupuestos mínimos', 'participación', 'daño ambiental'],
  },
  {
    id: 'ley-26639-glaciares',
    title: 'Ley 26.639 — Régimen de presupuestos mínimos de glaciares',
    scope: 'Nacional',
    ref: 'Ley 26.639',
    summary:
      'Protege glaciares y ambiente periglacial; restringe actividades que puedan afectarlos, con impacto directo en proyectos de alta montaña.',
    topics: ['glaciares', 'ambiente', 'cordillera', 'restricciones'],
  },
  {
    id: 'ley-24051-residuos',
    title: 'Ley 24.051 — Residuos peligrosos',
    scope: 'Nacional',
    ref: 'Ley 24.051',
    summary:
      'Regula generación, manipulación, transporte y disposición de residuos peligrosos; aplicable a ciertos insumos y desechos de la industria minera.',
    topics: ['residuos peligrosos', 'ambiente', 'transporte'],
  },
  {
    id: 'cn-art-124',
    title: 'Constitución Nacional — Art. 124 (dominio originario)',
    scope: 'Nacional',
    ref: 'CN art. 124',
    summary:
      'Reconoce a las provincias el dominio originario de los recursos naturales de su territorio, base del régimen minero federal argentino.',
    topics: ['dominio', 'provincias', 'recursos naturales', 'federalismo'],
  },
  {
    id: 'codigo-mineria-nacional',
    title: 'Código de Minería (texto ordenado) — Ley 1.919 y mods.',
    scope: 'Nacional',
    ref: 'Ley 1.919',
    summary:
      'Cuerpo legal de fondo: descubrimiento, cateo, concesión, mensura, canon, obligaciones y extinción de derechos mineros.',
    topics: ['cateo', 'concesión', 'mensura', 'canon', 'pertenencias'],
  },
  {
    id: 'decreto-nacional-ambiente-minero',
    title: 'Reglamentación nacional de protección ambiental minera',
    scope: 'Nacional',
    ref: 'Dto. reglamentario Ley 24.585',
    summary:
      'Normas reglamentarias que detallan procedimientos e instrumentos de la Ley 24.585 a nivel nacional, complementadas por cada provincia.',
    topics: ['IIA', 'reglamentación', 'ambiente'],
  },
  {
    id: 'convenio-169-oit',
    title: 'Convenio 169 OIT — Pueblos indígenas y tribales',
    scope: 'Nacional',
    ref: 'Ley 24.071',
    summary:
      'Estándar internacional de consulta y derechos de pueblos indígenas, aplicable cuando proyectos mineros afectan sus territorios o derechos.',
    topics: ['consulta previa', 'pueblos indígenas', 'derechos humanos'],
  },
  {
    id: 'rigi-nacional',
    title: 'RIGI — Régimen de Incentivo para Grandes Inversiones',
    scope: 'Nacional',
    ref: 'Ley 27.742 (título RIGI) / normas complementarias',
    summary:
      'Régimen de incentivos para grandes proyectos de inversión (incluidos mineros que califiquen), con beneficios fiscales, aduaneros y cambiarios sujetos a requisitos.',
    topics: ['RIGI', 'inversiones', 'grandes proyectos', 'incentivos'],
  },
  {
    id: 'tratado-minero-arg-chile',
    title: 'Tratado de integración y complementación minera Argentina–Chile',
    scope: 'Nacional',
    ref: 'Ley 26.182 / Tratado',
    summary:
      'Facilita proyectos binacionales en frontera (protocolos, facilitación fronteriza) como el marco asociado a emprendimientos tipo Pascua-Lama.',
    topics: ['binacional', 'frontera', 'Pascua-Lama', 'integración'],
  },
  {
    id: 'sj-policia-minera',
    title: 'Policía minera — facultades de fiscalización (San Juan)',
    scope: 'Provincial',
    ref: 'Código de Procedimientos / normas SJ',
    summary:
      'Facultades de inspección, control de seguridad y cumplimiento de obligaciones de titulares ante la Autoridad Minera de San Juan.',
    topics: ['policía minera', 'fiscalización', 'seguridad', 'autoridad minera'],
  },
  {
    id: 'sj-catastro-minero',
    title: 'Catastro minero provincial (San Juan)',
    scope: 'Provincial',
    ref: 'Normativa de catastro / procedimientos',
    summary:
      'Registro gráfico y jurídico de pedimentos, cateos, minas y canteras; base del visualizador y del mapa de proyectos metalíferos.',
    topics: ['catastro', 'mensura', 'expediente', 'mapa'],
  },
  {
    id: 'sj-canteras',
    title: 'Régimen de canteras — San Juan',
    scope: 'Provincial',
    summary:
      'Normas provinciales aplicables a sustancias de tercera categoría / canteras: permisos, obligaciones y control distinto al de minas metalíferas.',
    topics: ['canteras', 'áridos', 'tercera categoría'],
  },
  {
    id: 'sj-agua-minera',
    title: 'Uso de agua en actividad minera — San Juan',
    scope: 'Provincial',
    summary:
      'Permisos y controles de aprovechamiento hídrico para procesos mineros, articulados con la autoridad de agua y la evaluación ambiental.',
    topics: ['agua', 'permisos', 'efluentes', 'ambiente'],
  },
  {
    id: 'sj-areas-protegidas',
    title: 'Áreas protegidas y minería — San Juan',
    scope: 'Provincial',
    summary:
      'Restricciones y condicionamientos por reservas (p. ej. San Guillermo) y otras figuras de protección que limitan o condicionan la actividad minera.',
    topics: ['áreas protegidas', 'San Guillermo', 'ambiente', 'restricciones'],
  },
  {
    id: 'sj-seguridad-higiene',
    title: 'Seguridad e higiene minera — San Juan',
    scope: 'Provincial',
    summary:
      'Obligaciones de seguridad laboral e higiene en labores mineras, fiscalizadas junto a policía minera y organismos de trabajo.',
    topics: ['seguridad', 'higiene', 'laboral', 'fiscalización'],
  },
  {
    id: 'sj-cierre-minas',
    title: 'Cierre de minas y garantías — San Juan',
    scope: 'Provincial',
    summary:
      'Exigencias provinciales de plan de cierre, remediación y garantías financieras asociadas a la aprobación ambiental y a la operación.',
    topics: ['cierre', 'garantías', 'remediación', 'IIA'],
  },
  {
    id: 'acuerdo-federal-minero-norma',
    title: 'Acuerdo Federal Minero',
    scope: 'Nacional',
    summary:
      'Instrumento de coordinación Nación–provincias sobre política minera, información y lineamientos comunes, respetando el dominio provincial.',
    topics: ['federalismo', 'política minera', 'coordinación'],
  },
]

const NEW_EXAMPLES = {
  'regalias-mineras':
    'San Juan aplica un régimen provincial de regalías sobre la producción; el cálculo concreto se verifica en la ley provincial y en las liquidaciones ante la autoridad.',
  'ley-de-glaciares':
    'En proyectos de alta cordillera sanjuanina (p. ej. Iglesia / Calingasta) la Ley 26.639 y los inventarios de glaciares son puntos habituales de la evaluación ambiental.',
  'pad-de-lixiviacion':
    'Operaciones auríferas de la provincia han usado lixiviación en pilas; el pad y su geomembrana son foco de control ambiental y geotécnico.',
  'dique-de-colas':
    'Los diques de colas de proyectos metalíferos en San Juan se fiscalizan en la IIA y con monitoreo (piezómetros, calidad de agua) durante operación y cierre.',
  'rajo':
    'Varios yacimientos sanjuaninos se explotan o evalúan a cielo abierto (rajo), con botaderos y diseños de talud condicionados por la geomecánica andina.',
  'monitoreo-ambiental':
    'Los informes de cumplimiento ambiental de proyectos en San Juan reportan campañas de agua, aire y otros parámetros a la autoridad provincial.',
  'ipeem':
    'El IPEEM administra áreas y contratos de exploración/explotación en representación de intereses provinciales.',
  'catastro-minero':
    'El visualizador y el mapa de proyectos metalíferos de San Juan reflejan el estado del catastro minero provincial.',
}

function main() {
  const glossary = JSON.parse(fs.readFileSync(glossaryPath, 'utf8'))
  const byId = new Map(glossary.map((t) => [t.id, t]))
  let addedTerms = 0
  for (const t of NEW_TERMS) {
    if (byId.has(t.id)) continue
    // filtrar related a ids que existirán
    byId.set(t.id, { ...t, related: t.related || [] })
    addedTerms++
  }
  // segunda pasada: limpiar related inexistentes
  for (const t of byId.values()) {
    t.related = (t.related || []).filter((id) => byId.has(id))
  }
  const nextGlossary = [...byId.values()].sort((a, b) =>
    a.term.localeCompare(b.term, 'es'),
  )
  fs.writeFileSync(glossaryPath, JSON.stringify(nextGlossary, null, 2) + '\n')

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
  meta.termCount = nextGlossary.length
  meta.version = '1.1'
  meta.subtitle =
    'Enfoque jurídico, geológico, técnico, ambiental y económico — con referencias a San Juan'
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n')

  const laws = JSON.parse(fs.readFileSync(lawsPath, 'utf8'))
  const lawById = new Map(laws.norms.map((n) => [n.id, n]))
  // Renombrar solape: codigo-mineria ya existe; el nuevo codigo-mineria-nacional puede coexistir o merge
  let addedLaws = 0
  for (const n of NEW_LAWS) {
    if (lawById.has(n.id)) continue
    // Evitar duplicar el código si ya está
    if (n.id === 'codigo-mineria-nacional' && lawById.has('codigo-mineria')) {
      continue
    }
    lawById.set(n.id, n)
    addedLaws++
  }
  laws.norms = [...lawById.values()]
  laws.updatedNote =
    'Listado referencial ampliado (nacional + San Juan). Consultá siempre el texto oficial vigente.'
  fs.writeFileSync(lawsPath, JSON.stringify(laws, null, 2) + '\n')

  const examples = JSON.parse(fs.readFileSync(examplesPath, 'utf8'))
  let addedEx = 0
  for (const [k, v] of Object.entries(NEW_EXAMPLES)) {
    if (examples[k]) continue
    examples[k] = v
    addedEx++
  }
  fs.writeFileSync(examplesPath, JSON.stringify(examples, null, 2) + '\n')

  console.log(
    JSON.stringify(
      {
        termsTotal: nextGlossary.length,
        termsAdded: addedTerms,
        lawsTotal: laws.norms.length,
        lawsAdded: addedLaws,
        examplesAdded: addedEx,
      },
      null,
      2,
    ),
  )
}

main()
