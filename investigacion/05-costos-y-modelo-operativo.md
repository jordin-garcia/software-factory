# 05 · Costos y modelo operativo

Las marcas [V], [C], [E], [R] e [I] se explican en el [README](README.md).

**Cómo leer este documento.** Ninguna de estas cifras pasó por la verificación de tres votos. La mayoría se contrastó después en una segunda pasada [C]: un verificador releyó la fuente, buscó el origen de los datos citados de segunda mano y aplicó las correcciones. Contrastar confirma que la fuente dice eso, no que sea cierto. Todo sigue siendo autodeclarado por empresas o por un único practicante, sin réplica independiente. Sirve para orientar órdenes de magnitud, no para presupuestar con precisión.

## Qué métrica usar

No conviene medir por precio de tokens ni por nivel de modelo. Dos fuentes proponen medir por trabajo entregado [C]:

- **Costo por cambio aceptado** (Sonar): tokens de todos los intentos, más cómputo de CI, más tiempo de revisión, más tiempo de retrabajo, más costo de los defectos que escapan, dividido entre los cambios aceptados. Un cambio aceptado es el que pasa las puertas de calidad, se fusiona y sigue en producción sin revertirse ni reescribirse.
- **Costo por PR fusionado** (Warp): gasto total del agente en una ejecución dividido entre el trabajo que realmente se entregó. Se acompaña de la tasa de intervención humana y de la tasa de defectos o reversiones.

En un ejemplo de Sonar, los tokens son el 6.8% y el 8.4% del costo por cambio aceptado en los dos flujos comparados. El flujo mejor verificado cuesta 56.01 USD frente a 106.20 USD, y el ahorro viene de revisión, retrabajo y defectos. Todos los datos de entrada del ejemplo son supuestos; es ilustrativo, no una medición [C].

El costo de la factory depende del total de tokens consumidos por su precio, no del nivel del modelo [C, O'Reilly]. Es una observación anecdótica: el autor cuenta que vio a un modelo más barato con razonamiento alto costar más que uno superior en la misma tarea, sin dar mediciones.

## Datos publicados

### Fábrica de un solo autor (François-Xavier Martin, O'Reilly, septiembre de 2026)

Es el dato de costo más concreto que apareció [C].

| Dato | Valor |
|---|---|
| Primera versión, sin registro de costo | 861,601 líneas, 696 historias de usuario y 779 PR fusionados en 105 días |
| Segunda versión, medida (25 de junio a 18 de julio de 2026, un repositorio) | 77 historias, 595.7 millones de tokens, 837.53 USD a precio de lista |
| Costo por historia entregada | 10.88 USD de media; mediana de 9.56 USD por construcción; rango de 3.02 a 43.24 USD |
| Tokens por historia | 7.7 millones, que el autor llama tasa sin optimizar |
| Construcciones limpias al primer intento | 34 de 76 |
| Tokens en intentos fallidos | 5.0%; cerca de 13% contando retrabajo, reintentos y sesiones caídas |
| Lecturas de caché | 95.4% de los tokens y 45.9% del costo |
| Escrituras de caché | 3.3% de los tokens y 31.2% del costo |
| Salida del modelo | 0.9% de los tokens y 21.3% del costo |
| Desfase del registro de costos | 694.65 USD registrados frente a 837.53 USD en los logs |

**Advertencias que cambian la lectura de los 10.88 USD:**

- **Es un equivalente a precio de lista.** La factura real fue una suscripción plana de 200 USD al mes.
- **Es un suelo.** Solo 317 de los 374 intentos de etapa tienen costo completo y los no medidos no se estimaron. Excluyendo seis historias sin datos de uso, sale a 11.80 USD por historia.
- **No incluye escribir las especificaciones.** Las épicas e historias se redactaron en sesiones interactivas con el modelo: unos 190 millones de tokens, del orden de 160 USD adicionales.
- **No incluye tiempo humano.**
- **El enrutamiento de modelos estaba desactivado.**

Lecciones del autor: el costo lo domina la relectura de contexto, así que optimizar es gestionar la caché y enrutar modelos, no acortar prompts. Y el registro de costos necesita auditoría: el suyo dejaba fuera una sexta parte del consumo real.

**Corrección a la primera versión de este informe.** El artículo no dice que una persona audite la factory ni describe revisión humana de PR. Dice que el autor detectó un fallo de medición, lo registró como incidencia y la propia factory auditó y corrigió su contador.

### OpenAI (experimento con Codex)

Las cifras vienen de dos fuentes distintas del mismo autor y no deben mezclarse [C]:

| Fuente | Qué dice |
|---|---|
| Artículo de OpenAI, febrero de 2026 | Primer commit a finales de agosto de 2025. Cinco meses después: del orden de un millón de líneas, ninguna escrita a mano, unos 1,500 PR fusionados y una media de 3.5 PR por ingeniero al día, lograda con tres ingenieros. El equipo creció después a siete. Ejecuciones individuales de más de seis horas con regularidad |
| Charla posterior del mismo autor | De 3 a 5 PR al día. Más de mil millones de tokens de salida al día a título personal. La equivalencia de más de 1,000 USD diarios es del moderador, no del ponente; un pódcast la estima en 2,000 a 3,000 USD |

Los "nueve meses" que aparecen en un resumen son la experiencia personal del ponente en la charla posterior, no la duración del experimento medido.

### Uber (agosto de 2026)

- Más del 70% de los PR se atribuyen a agentes locales o en la nube. El artículo no explica cómo se atribuye un PR a un agente [C].
- Entre febrero y mediados de agosto de 2026 los usuarios activos semanales, contando a todos los empleados, crecieron 7 veces y las peticiones agénticas semanales 9.4 veces [C]. La cifra de 7 veces no mide uso agéntico, como decía la primera versión de este informe.
- El costo por cada 1,000 peticiones bajó casi 34% desde su máximo y el costo por sesión 52% desde su máximo de junio. Se midieron con un mismo modelo y desde máximos distintos; los datos por sesión empiezan a finales de mayo [C].
- El gasto total en IA se estabilizó desde abril. No se publica el gasto absoluto ni cifras de defectos o reversiones [C].

### Otros casos

- **StrongDM** [C]: su director técnico escribe que, si no se han gastado al menos 1,000 USD en tokens por ingeniero humano en el día, la factory tiene margen de mejora. Es una regla provocadora de un equipo de tres personas, no una métrica formal.
- **Spotify** [C, corregido]: un directivo dijo en una presentación de resultados que los mejores desarrolladores de la empresa no habían escrito una línea de código desde diciembre de 2025, sin precisar cuántos son. Los más de 650 PR mensuales fusionados corresponden a un agente en segundo plano dedicado sobre todo a migraciones y mantenimiento, según una página de proveedor sin fecha. No describe a todos los ingenieros ni el trabajo diario de funcionalidad.

## Qué encarece una factory

- **Relectura de contexto.** La mayor parte de los tokens son lecturas de caché [C, O'Reilly].
- **Precarga de definiciones de herramientas.** En Uber, entre 50,000 y 70,000 tokens de sobrecarga en el prompt inicial, con una pasarela central delante de más de 1,000 servidores MCP [C].
- **Variabilidad.** Las tareas agénticas consumen unas 1,000 veces más tokens que el razonamiento y el chat sobre código, y el consumo de una misma tarea puede variar hasta 30 veces entre ejecuciones. Los tokens de entrada dominan el costo [C, arXiv 2604.22750; solo se leyó el resumen].
- **Bucles por planes débiles.** Un mal plan multiplica los reintentos [C, O'Reilly; anecdótico].
- **Tiempo de reloj.** Algunas plataformas cobran por el tiempo que una sesión está aprovisionada, así que los agentes ociosos cuestan [E, Warp].
- **Código en mal estado.** En pruebas de Sonar (unas 540 ejecuciones, 6 pares de repositorios, 27 tareas, un agente y un modelo), los agentes en bases de código más sanas usaron 7.2% menos tokens de entrada y 8.5% menos de salida. Por tarea, el resultado fue desde 40% menos hasta un costo ligeramente mayor. Sonar definió la salud del código con su propio producto [C].

## Palancas de ahorro

**Warp, en orden** [C]:

1. Enrutar las clases de tarea baratas a modelos más baratos. Según Warp, aquí está el dinero; las otras tres son salvaguardas.
2. Recortar el contexto que carga cada agente.
3. Limitar reintentos y cómputo ocioso.
4. Adelantar la verificación.

Warp declara una reducción de 63% en ciertos tipos de tarea sin pérdida de calidad, sobre sus propias cargas. No dice qué tipos de tarea ni cómo midió la calidad, y aclara que no es una referencia de la industria.

**Uber** [C]:

- Subagentes con un modelo más barato por defecto y cambio manual cuando hace falta.
- Esfuerzo de razonamiento medio por defecto.
- Compactación automática a los 400,000 tokens incluso en modelos de contexto mayor.
- Vida de la caché de prompts ampliada de 5 minutos a 1 hora, solo en sesiones interactivas. Las escrituras de caché de una hora cuestan más.
- Skills que ejecutan código en lugar de llamadas directas a herramientas: más de 50% menos tokens. El dato sale de una prueba pequeña, con cinco consultas SQL idénticas por ambas vías.
- Gobierno del gasto: aprobación de un responsable para subir de nivel y alertas al 50%, 80% y 100% del gasto esperado.

**Cómo validar un cambio de configuración** [C, Warp]. Se conserva si baja el costo por PR fusionado, la tasa de intervención se mantiene y la tasa de defectos no se mueve. Se valida reproduciendo tareas reales pasadas desde su estado inicial exacto, cada una más de una vez. Como primer paso sugiere comparar el modelo por defecto con un candidato más barato en diez tareas reales de la clase de mayor volumen.

## Esfuerzo humano

La intervención humana se reduce y cambia de lugar; no desaparece.

- **Ona** [V, confianza baja]: 8-10 horas diarias en los días 1 a 3, dedicadas a construir la factory más que el producto; 2-3 horas diarias en la segunda semana.
- **OpenAI** [C]: las personas pueden revisar los PR, pero no es obligatorio. La mayor parte de la revisión humana ocurre después del merge y hay una prueba de humo aprobada por una persona antes de cada release.
- **PostHog** [C, corregido]: en cuatro meses pasó de un 20% a un 70% de los PR de su monorepo abiertos por agentes, lo que no equivale a escritos por completo por agentes. La cifra de que las personas revisan al menos el 80% de ellos no tiene fuente rastreable; los textos enlazados hablan de un bot que aprueba entre uno de cada cinco y uno de cada tres PR.
- **Datos de uso de Anthropic** [C, corregido]: la duración de los turnos más largos de su agente de código (percentil 99.9) pasó de menos de 25 a más de 45 minutos en unos tres meses, entre octubre de 2025 y enero de 2026. Los usuarios nuevos interrumpen en el 5% de los turnos y los experimentados en torno al 9%. Es una comparación entre grupos, no una evolución en el tiempo, como decía la primera versión de este informe. El turno mediano dura unos 45 segundos.

En qué trabajan las personas: especificaciones, arquitectura y diseño, construcción y mejora del arnés, escalamientos y vigilancia de la propia factory [I].

## La mayor parte del trabajo real no empieza de cero

En PostHog, los arreglos son el tipo más frecuente de PR fusionado, en torno al 40% de forma estable entre 2025 y 2026 [C]. La cifra de que el 63% de las líneas cambiadas están en archivos que ya existían no tiene fuente rastreable [E]. Una factory útil más allá del arranque necesita agentes alimentados con contexto de producción, no solo una línea de construcción separada de la decisión de qué construir.

## Adopción declarada

- Factory afirma que hay software factories en producción en grandes empresas y nombra a NVIDIA, EY, Adobe, Palo Alto Networks, Adyen, Blackstone, Wipro y Comarch. La lista es exacta, pero el texto no trae métricas ni citas de clientes y casi nada se pudo corroborar [C]:
  - **Wipro** anunció en enero de 2026 una alianza y una inversión en Factory, con el despliegue redactado en futuro. Es socio e inversor, no una referencia independiente.
  - **EY**, según declaraciones de un directivo a la prensa, evaluó varias herramientas, sus desarrolladores prefirieron la de Factory y la empresa limitó su uso a la espera de aprobación de cumplimiento. Las mejoras de hasta 4 o 5 veces que menciona corresponden a su enfoque global y, según él mismo, no pueden atribuirse solo a los agentes de código.
  - De NVIDIA, Adobe, Palo Alto Networks, Adyen y Blackstone no se encontró ninguna declaración propia. NVIDIA figura como inversor de Factory en resultados de búsqueda sin confirmar.
  - Ningún cliente encontrado se describe a sí mismo como operador de una "software factory en producción".
- Muy pocas empresas han documentado públicamente operar sin que nadie lea el código. StrongDM es el ejemplo nombrado; Ramp, Cursor y Uber se sitúan hacia la mitad del espectro, según la estimación de la autora del boletín de PostHog [C]. Esas empresas describen agentes en segundo plano sin llamarlos software factory.
