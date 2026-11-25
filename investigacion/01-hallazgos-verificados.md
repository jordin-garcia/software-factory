# 01 · Hallazgos verificados

Estos diez hallazgos son el núcleo fiable de la investigación. Cada uno fusiona una o varias afirmaciones que superaron la verificación adversarial de tres votos. El nivel de confianza indica cuánto pesa el dato, no si la fuente lo dice.

| # | Hallazgo | Confianza | Voto |
|---|---|---|---|
| 1 | Qué es una software factory de IA | Alta | 3-0 |
| 2 | La autonomía total no es el punto de partida | Alta | 3-0 |
| 3 | Patrón de arquitectura observado en producción | Media | 3-0 y 2-1 |
| 4 | Tres requisitos de diseño según Factory | Baja | 3-0 |
| 5 | Mejor evidencia de operación casi autónoma (Ona) | Baja | 3-0 |
| 6 | La especificación como cuello de botella | Baja | 3-0 |
| 7 | La capacidad crece rápido pero no alcanza para trabajo largo sin supervisión | Media | 3-0 |
| 8 | Más agentes no garantizan fiabilidad | Media | 3-0 |
| 9 | Tests y benchmarks públicos son oráculos imperfectos | Media | 3-0 |
| 10 | Seguridad: inyección indirecta y aislamiento a nivel de SO | Media | 3-0 |

---

## 1. Qué es una software factory de IA

**Confianza alta.** Una software factory de IA es un sistema repetible, interconectado y de extremo a extremo en el que los agentes ejecutan trabajo definido y pasan sus resultados por checks y revisión. No es un conjunto de agentes de código sueltos. Las personas deciden qué trabajo importa y cuánta autoridad recibe el sistema.

- Factory (junio de 2026) exige que el sistema sea interconectado, nativo para agentes, de extremo a extremo y que mejore observándose a sí mismo.
- Vercel (septiembre de 2026) lo describe como un sistema de desarrollo repetible con cuatro responsabilidades: agente de código, checks de CI, capa de coordinación (entrega tareas, retiene resultados, enruta fallos) y mantenedor. Aclara que son responsabilidades, no herramientas separadas.

**Límites.** No existe una definición estándar de la industria; estas dos son de proveedores. Sirven para fijar vocabulario, no como prueba de eficacia.

Fuentes: [factory.ai](https://factory.ai/news/software-factory), [vercel.com](https://vercel.com/i/what-is-an-ai-software-factory)

## 2. La autonomía total no es el punto de partida

**Confianza alta.** La autonomía se adopta gradualmente, proceso por proceso. El auto-merge es una decisión de diseño opcional con consecuencias para la verificación y la autoridad. El objetivo de mínima intervención humana debe planificarse como una curva de madurez.

- Factory afirma que ninguna organización empieza con una factory totalmente autónoma. Describe un espectro: agentes y skills para tareas medibles, automatizaciones recurrentes con memoria, equipos remotos persistentes y misiones multi-agente. El nivel se elige según la guía humana que requiere cada proceso y la sensibilidad de la información.
- Vercel afirma que la autonomía total es una decisión de diseño y que la fusión automática es opcional. No la excluye.

**Límites.** Los verificadores encontraron relatos coincidentes de otras empresas, pero tomados de resultados de búsqueda y no leídos a fondo.

Fuentes: [factory.ai](https://factory.ai/news/software-factory), [vercel.com](https://vercel.com/i/what-is-an-ai-software-factory)

## 3. Patrón de arquitectura observado en producción

**Confianza media.** Disparadores por evento o por horario (webhooks de GitHub, cron) alimentan una cola de trabajo. Agentes estrechos y especializados se ejecutan en sandboxes aislados y se pasan el trabajo entre sí. Un arnés de archivos en el repositorio les da contexto. Una interfaz de monitoreo permite a las personas revisar y conservar la autoridad de merge.

- **Ona:** 16 automatizaciones, cada una con una responsabilidad estrecha, un disparador claro y un traspaso definido. Nombradas: PR Reviewer (arregla CI y fusiona), Post-Merge Verifier (smoke test tras cada merge), Incident Responder (convierte errores de Sentry en issues de GitHub), Feature Builder, Product Improver y Automation Auditor. Arnés: `AGENTS.md`, `architecture.md`, `design.md`, `conventions.md`, `quality.md`, spec de producto y Storybook como referencia visual.
- **Vercel** (equipo del AI SDK, agosto de 2026): webhooks, cola, agentes en sandbox, interfaz de monitoreo. Empezó con clasificación de issues y un CLI local antes de pasar a infraestructura gestionada. Nada se fusiona sin aprobación humana.
- **Factory Missions:** ejecuciones multi-agente de horas o días. Factory dice que la ejecución serial con paralelización dirigida le funcionó mejor que la paralelización amplia, y lo deja como pregunta abierta. La mediana rondaba las dos horas en febrero de 2026, con una cola larga: el 14% de las misiones superaba las 24 horas. Su texto de junio de 2026 las describe, en cambio, como trabajo descompuesto en pistas paralelas [C].

**Límites.** El artículo de Ona solo nombra 7 u 8 de las 16 automatizaciones. El caso de Vercel es mantenimiento de un repositorio de código abierto existente, no un proyecto desde cero: entre 25% y 35% de los PR que fusiona cada semana los escriben agentes, cifra medida a las cuatro semanas de operación y publicada en otro texto de Vercel [C]. Todo es autodeclarado.

Fuentes: [ona.com](https://ona.com/stories/software-factory-what-we-learned), [vercel.com](https://vercel.com/i/what-is-an-ai-software-factory), [Vercel · Building a software factory for AI SDK](https://vercel.com/blog/building-a-software-factory-for-ai-sdk), [factory.ai](https://factory.ai/news/software-factory), [Factory · Introducing Missions](https://factory.com/news/missions)

## 4. Tres requisitos de diseño según Factory

**Confianza baja.** Factory prescribe:

1. **Independencia de modelo:** elegir o enrutar el modelo por tarea según costo, rendimiento y velocidad.
2. **Inteligencia soberana:** despliegue controlado por el dueño, de la nube al entorno aislado de red.
3. **Aprendizaje continuo:** instrumentar cada etapa del ciclo de desarrollo para que unas alimenten a otras. Ejemplos: un hallazgo de seguridad informa la revisión de código, un despliegue dispara una actualización de documentación, un incidente se correlaciona con el PR que lo causó.

**Límites.** Es una sola fuente y un texto de lanzamiento de producto. Los tres requisitos coinciden con funciones que Factory vende. Úsese como lista de criterios a evaluar, no como consenso.

Fuente: [factory.ai](https://factory.ai/news/software-factory)

## 5. Mejor evidencia de operación casi autónoma (Ona)

**Confianza baja.** En 10 días una factory construyó "Memo", una app tipo Notion, sin código de producción escrito por personas. Fusionó 375 PR, más de 67,000 líneas y 1,067 tests. Cerca del 87% del trabajo fusionado ocurrió sin intervención humana, con medianas de 38 minutos de issue abierto a cerrado y 4.9 minutos de PR abierto a merge.

**Límites que deben acompañar siempre a la cifra:**

- Una sola fuente, sin auditoría, y Ona vende la plataforma usada.
- Las personas escribieron las specs, configuraron las automatizaciones y atendieron los escalamientos: 8-10 horas diarias en los días 1 a 3 y 2-3 horas diarias en la segunda semana.
- Es una demo desde cero, sin usuarios reales ni código legado.
- Los 4.9 minutos reflejan la decisión de omitir la revisión humana obligatoria. Un resumen de terceros de sus retransmisiones habla de regresiones significativas tras la primera semana; el texto final de Ona no las menciona.
- El recuento de líneas varía según la fuente y el momento: entre 50,000 y 77,000.
- No se publican tamaños de muestra ni tasas de retrabajo.
- PR, líneas y tests miden volumen, no calidad.

Sirve como prueba de viabilidad del patrón, no como referencia generalizable.

Fuente: [ona.com](https://ona.com/stories/software-factory-what-we-learned)

## 6. La especificación como cuello de botella

**Confianza baja.** Según Ona, la mayoría de los bugs se debieron a specs poco detalladas y no a límites del agente. Una spec detallada, de varias horas de trabajo, produjo la app base funcional. Una spec de cinco líneas produjo una función con defectos y varias rondas de corrección. El gusto visual y de experiencia de usuario no lo produce la factory por sí sola: detecta lo que falla, no lo que se ve mal.

**Límites.** Es un juicio cualitativo de los autores, sin conteo ni clasificación de bugs, y al proveedor le conviene atribuir los fallos a las specs. La comparación no es homogénea (una app completa frente a una función). La cifra de 54 PR en un día es dudosa: los acumulados publicados implican unos 37. La afirmación paralela basada en un benchmark académico fue refutada (ver documento 06), así que este hallazgo descansa solo en Ona.

Fuente: [ona.com](https://ona.com/stories/software-factory-what-we-learned)

## 7. La capacidad crece rápido pero no alcanza para trabajo largo sin supervisión

**Confianza media.**

- **METR:** el horizonte temporal al 50% de éxito se duplica cada ~131 días desde 2023 y cada ~89 días si se mide desde 2024. La tendencia larga es de ~196 días. En enero de 2026 el horizonte era de ~320 minutos (5.3 horas) para Claude Opus 4.5, con intervalo de confianza del 95% de 170 a 729 minutos, y de 214 minutos para GPT-5.
- **SWE-EVO** (tareas de evolución que tocan en promedio 21 archivos): los mejores agentes resuelven ~20-25%, frente a ~65-73% en tareas de un solo issue. Darles más contexto mejora poco: de 14.58% a 18.75% en una configuración.

**Límites.** El horizonte de METR se mide al 50% de éxito sobre su propia batería, no como fiabilidad de producción, y sus cifras ya no describen la frontera actual. SWE-EVO tiene 48 tareas en 7 repositorios Python, de modo que cada tarea vale unos dos puntos porcentuales. Que los agentes "no sean fiables sin supervisión" en este tipo de trabajo es una inferencia razonable, no una cita.

Fuentes: [metr.org](https://metr.org/blog/2026-1-29-time-horizon-1-1), [arXiv 2512.18470](https://arxiv.org/abs/2512.18470v1)

## 8. Más agentes no garantizan fiabilidad

**Confianza media.** Los sistemas multi-agente de código abierto fallan entre 41% y 86.7% según el framework, con ganancias a menudo mínimas frente a un solo agente. Muchos fallos vienen del diseño del sistema y de la coordinación, no solo del modelo.

- El estudio MAST (UC Berkeley, NeurIPS 2025) anotó más de 1,600 trazas de 7 frameworks y clasificó 14 modos de fallo en 3 categorías: especificación y diseño del sistema, desalineación entre agentes y verificación de tareas.
- Modos más frecuentes: repetición de pasos (15.7%), desajuste entre razonamiento y acción (13.2%), desconocer las condiciones de terminación (12.4%) y desobedecer la especificación (11.8%).
- Las intervenciones de diseño ayudan con techo: +9.4 puntos al mejorar la definición de roles y +15.6 al añadir un paso que verifica el objetivo de alto nivel.

**Implicación de diseño:** roles estrechos, condiciones de terminación explícitas y un verificador independiente del objetivo.

**Límites.** El rango 41-86.7% compara frameworks sobre benchmarks distintos, no es una tasa agregada. Usa modelos de 2024-2025 y frameworks académicos, no arneses comerciales actuales. Las mejoras se midieron sobre 32 tareas. Es una sola fuente, aunque revisada por pares.

Fuente: [arXiv 2503.13657](https://arxiv.org/pdf/2503.13657)

## 9. Tests y benchmarks públicos son oráculos imperfectos

**Confianza media.** En una auditoría de OpenAI, el 59.4% de 138 problemas difíciles de SWE-bench Verified tenía defectos materiales en los tests o en el enunciado: 35.5% con tests demasiado estrechos, 18.8% demasiado amplios y 5.1% otros. OpenAI afirma que las mejoras en ese benchmark reflejan cada vez más la exposición durante el entrenamiento.

**Implicación:** la factory necesita control de calidad sobre sus propios tests y specs, y evaluaciones propias sobre sus repositorios para elegir modelo y agente.

**Límites.**

- El 59.4% aplica al subconjunto difícil que un modelo no resolvía de forma consistente, no a los 500 problemas.
- La auditoría documenta soluciones correctas rechazadas, no soluciones incorrectas aceptadas. De esta fuente no se desprende que pasar los tests no pruebe corrección.
- La recomendación de no elegir modelo por puntajes públicos es inferencia de esta investigación [I].
- OpenAI es parte interesada.

Fuente: [openai.com](https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/)

## 10. Seguridad: inyección indirecta y aislamiento a nivel de sistema operativo

**Confianza media.** La amenaza principal para agentes que ejecutan herramientas es la inyección indirecta de prompts: el contenido que el agente lee puede secuestrar sus acciones. El equipo rojo de IA de NVIDIA define tres controles obligatorios a nivel de sistema operativo:

1. Control de egreso de red.
2. Bloqueo de escrituras fuera del espacio de trabajo.
3. Bloqueo de escrituras a archivos de configuración, estén donde estén.

Además recomienda virtualización completa (microVM, contenedor Kata o máquina virtual) en lugar de sandboxes que comparten el kernel con el anfitrión, y sostiene que los controles a nivel de aplicación no bastan.

- Vectores nombrados: repositorios o PR maliciosos, historial de git, archivos de reglas e instrucciones para agentes y respuestas maliciosas de servidores MCP.
- Otros controles recomendados: bloquear lecturas fuera del espacio de trabajo, no usar aprobaciones del tipo "permitir una vez, ejecutar muchas", inyección explícita de secretos y gestión del ciclo de vida del sandbox.

**Límites.** La virtualización figura como recomendada, no como obligatoria. Es una sola fuente y es la opinión de un equipo rojo, no una norma. La extensión a páginas web es extrapolación de esta investigación [I].

Fuente: [developer.nvidia.com](https://developer.nvidia.com/blog/practical-security-guidance-for-sandboxing-agentic-workflows-and-managing-execution-risk)
