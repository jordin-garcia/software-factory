# 09 · Herramientas por componente

Comparación de herramientas concretas para cada pieza de la factory.

**Nivel de evidencia.** Cada dato lo leyó un solo agente en la documentación o en la página de precios del proveedor, entre el 23 y el 24 de noviembre de 2026. No pasó por verificación adversarial ni se probó nada en la práctica. Los precios y las funciones cambian cada mes: conviene abrir el enlace antes de decidir. "NC" significa que no se pudo confirmar. Las recomendaciones son de los agentes investigadores y de esta síntesis [I], no de las fuentes.

Lo que ofrece Claude Code en particular está en el [documento 10](10-claude-code-como-base.md).

## Lectura transversal

Lo que se repite al cruzar los cinco componentes [I]:

1. **Se puede empezar sin infraestructura nueva.** GitHub como entrada, estado y puerta de merge; un agente de código ejecutado desde Actions o en la nube del proveedor; y checks de código abierto. Las plataformas llave en mano añaden etapas explícitas y un panel, a cambio de costo y dependencia.
2. **El punto débil común es el merge.** Ningún agente de los leídos fusiona por sí mismo de forma documentada y segura. El auto-merge se construye con reglas de rama, un clasificador determinista del diff y checks obligatorios.
3. **La revisión por IA no basta como puerta.** Los mejores revisores rondan 0.6 de F1 en la comparación más independiente y caen mucho con diffs grandes. El peso debe recaer en checks deterministas, pruebas de mutación y diffs pequeños.
4. **El aislamiento fuerte exige Linux con KVM o un servicio gestionado.** Windows 10 no sirve como anfitrión de los sandboxes, y muchos VPS baratos no ofrecen virtualización anidada.
5. **Dos proveedores de modelos son mejor que uno.** Un revisor de otro proveedor es más independiente que un segundo agente del mismo, y reduce la dependencia.
6. **Las herramientas de agentes son también superficie de ataque.** En 2026 hubo paquetes y acciones de CI comprometidos entre las herramientas de esta misma lista. Hay que fijar versiones por hash o digest.
7. **Casi todo lo que afecta al costo cambia rápido.** Varios proveedores modificaron en 2026 cómo facturan la automatización. Conviene medir el costo propio desde el primer día en lugar de fiarse de los planes publicados.

### Tres puntos de partida

| | Mínima infraestructura | Propia sobre GitHub | Autoalojada y portable |
|---|---|---|---|
| Agente | Claude Code en la nube, o Copilot con flujos agénticos | Claude Code u otro CLI desde Actions | OpenHands o un CLI con modelo a elección |
| Orquestación | Tareas programadas y asignación desde issues | Etiquetas como estado y flujos de Actions | Receptor de webhooks, base de datos y Trigger.dev o Temporal |
| Sandbox | El del proveedor | Runner de Actions, con o sin sandbox gestionado | OpenShell o Docker Sandboxes en un servidor con KVM |
| Verificación | Checks abiertos más un revisor de IA gestionado | Igual, con un revisor de otro proveedor en CI | Igual, con revisor autoalojado |
| Entrega | Vercel con Neon | Vercel o Railway | Coolify o Kamal |
| Operación | Sentry con Seer | Rastreador que abre issues y dispara el agente | GlitchTip y un relé de webhooks |
| A favor | Arranque en días | Todo en el repositorio, auditable y barato | Control e independencia de proveedor |
| En contra | Piezas en vista previa; costo menos previsible | Estado frágil; sin panel | La que más trabajo exige |

Los investigadores coinciden en empezar por la columna central y moverse a la derecha solo cuando sus límites estorben.

<!-- SECCIONES -->

## Agentes de código

El "trabajador" de la factory: el agente que toma una tarea, la implementa y abre el PR. Lo que importa aquí es que pueda ejecutarse sin nadie delante, disparado por eventos o por horario.

### Comparación

| Agente | Modo desatendido | Autoalojable | Modelos | Sandbox | Precio |
|---|---|---|---|---|---|
| [Claude Code](https://code.claude.com/docs/en/headless) | Sí: CLI, SDK, GitHub Action, tareas programadas | Sí | Solo Claude | VM en la nube; local opcional | Suscripción o API |
| [OpenAI Codex](https://learn.chatgpt.com/docs/non-interactive-mode) | Sí: CLI, SDK, GitHub Action, tareas en la nube | CLI sí; nube no | Solo OpenAI; otros NC | Sí; de solo lectura por defecto en modo no interactivo | Suscripción o API |
| [GitHub Copilot y flujos agénticos](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent) | Sí: interfaz, horario, eventos | Solo los runners | Varios | Sí | Suscripción más créditos medidos |
| [Cursor](https://cursor.com/docs/cloud-agent) | Sí: API, automatizaciones, CLI | Solo las herramientas; el bucle del agente queda en Cursor | Varios, seleccionados | VM en la nube | Suscripción más uso |
| [Devin](https://docs.devin.ai/api-reference/overview) | Por API | No | Gestionados por el proveedor | VM por sesión | Suscripción más uso |
| [Factory Droids](https://docs.factory.com/cli/droid-exec/overview) | Sí: CLI con niveles de autonomía y automatizaciones | Sí, en plan empresa | Varios y clave propia, incluidos modelos locales | Sí | Suscripción o inferencia propia |
| [Google Jules](https://jules.google/docs/) | Por API | No | Solo Gemini | VM en la nube | Suscripción con topes de tareas |
| [Amp](https://ampcode.com/docs/markdown/pricing) | Sí: modo de ejecución, SDK, automatizaciones | CLI local | GPT y Claude | Sandbox en la nube | Créditos por uso |
| [OpenHands](https://docs.openhands.dev/openhands/usage/use-cases/software-factory.md) | Sí: SDK y API con automatizaciones | Sí, licencia MIT | Cualquiera | Docker | Gratis más el costo del modelo |
| [opencode](https://opencode.ai/docs/github/) y [Goose](https://goose-docs.ai/docs/tutorials/headless-goose) | Sí | Sí | Cualquiera | Ninguno documentado | Costo del modelo |
| [Kiro](https://kiro.dev/docs/cli/headless/) | Sí, solo en planes de pago | CLI local | Parcial | NC | Créditos |

### Notas por agente

- **Claude Code.** Es el que ya usa el equipo. Detalle en el [documento 10](10-claude-code-como-base.md). Dos puntos débiles para una factory: las tareas programadas pertenecen a una cuenta individual y hacen commits como esa persona, y la corrección automática no reacciona a conflictos de merge. Hubo cambios recientes en cómo se factura la automatización, con una separación anunciada en junio de 2026 y luego pausada, según su [página de soporte](https://support.claude.com/en/articles/15036540).
- **Codex.** CLI, SDK y servidor de aplicación son de código abierto; la nube no. Las sesiones con clave de API se recomiendan para CI, pero excluyen funciones de la nube como la revisión en GitHub. Sirve como revisor independiente de otro proveedor.
- **Copilot y flujos agénticos.** Los flujos agénticos compilan markdown a Actions y pueden usar Copilot, Claude Code o Codex como motor. Su modelo de seguridad es el más estricto de los leídos: el agente es de solo lectura, los secretos quedan en un proxy y solo se aplican las salidas declaradas. La facturación medida provocó quejas de usuarios que agotaron su cupo en horas.
- **Cursor.** Las automatizaciones y los agentes en la nube empiezan en planes superiores. Hay quejas por facturas impredecibles y una adquisición reportada con estado poco claro.
- **Devin.** La mayor dependencia del proveedor de todo el conjunto: el "cerebro" siempre queda en su nube. La crítica independiente más citada es de enero de 2025 y está desfasada.
- **Factory Droids.** Admite clave propia y despliegue aislado de red en plan empresa. No se encontró crítica independiente.
- **Google.** Gemini CLI dejó de servir a usuarios gratuitos y de consumo en junio de 2026; su sucesor es otro CLI. Jules se describe a sí mismo como experimental.
- **OpenHands.** Documenta una receta de software factory con automatizaciones de triaje, desarrollo, revisión y vigilancia, cada una con su propio token de GitHub y su contenedor. Acaba de dejar de mantener su CLI anterior.
- **Aider.** Sin versiones nuevas desde agosto de 2025, según una fuente secundaria.

### Opciones recomendadas

**Mínima infraestructura** (confianza media-alta en capacidad, media en previsibilidad de costo):

1. **Claude Code** con tareas programadas en la nube y la GitHub Action. Ya lo usa el equipo y trae disparadores, VM gestionada y corrección automática de PR. Las tareas programadas están en vista previa y son por persona.
2. **Copilot con flujos agénticos.** Sin infraestructura adicional, y puede ejecutar Claude Code o Codex como motor dentro de un modelo de salvaguardas más fuerte. Hay que presupuestar con cuidado por la medición de créditos.
3. **Codex** con el mismo patrón, útil como revisor independiente de otro proveedor de modelos.

**Máximo control e independencia de modelo** (confianza media; nada se probó en la práctica):

1. **OpenHands.** Licencia MIT, cualquier modelo, aislamiento en Docker y una receta documentada de issue a merge.
2. **Factory Droids.** Clave propia y niveles de autonomía, pero propietario.
3. **opencode o Goose** en runners propios. Hay que construir el sandbox y el ciclo de revisión.

### No confirmado

- Precios de los planes de Factory y precio por unidad de Devin.
- Si el CLI de Codex admite proveedores distintos de OpenAI.
- Sandbox de Kiro.
- Licencias de varios de los proyectos abiertos.
- Estado actual de la función de GitHub para agentes de terceros.

## Orquestación y plataformas

La capa que convierte eventos y horarios en tareas encoladas, lleva el estado, reintenta, encadena agentes especializados y da a las personas una interfaz de supervisión y aprobación.

### Plataformas llave en mano

| Plataforma | Qué trae | Alojamiento | Precio de entrada publicado | Estado | Dependencia |
|---|---|---|---|---|---|
| [Factory](https://docs.factory.com/cli/features/missions) | Misiones: plan con hitos, trabajadores y control de calidad | Proveedor; local solo en plan empresa | 20 a 200 USD por persona; equipos desde 60 USD más 40 por persona | Las misiones "siguen evolucionando" | Alta |
| [Ona](https://ona.com/docs/ona/automations/overview) | Automatizaciones con disparadores manuales, por horario, por PR y por webhook | Proveedor o nube propia en plan empresa | No publicado | No indicado | Media |
| [Kit de Vercel](https://vercel.com/docs/agent-resources/software-factory) | No es un producto: funciones, colas, sandbox, almacenamiento y una plantilla abierta con cuatro agentes | Vercel | Por uso | Plantilla publicada | Media |
| [Warp Factories](https://docs.warp.dev/factories/) | Factory como código: etapas y puntos de decisión humana; entrada desde GitHub, Linear, Jira, Slack, webhooks y horarios | Proveedor; propio en plan empresa | 0 USD más 3.50 por hora de agente; 250 USD al mes por equipo para usar otros agentes | Beta, según resultados de búsqueda | Media |
| [GitHub Copilot y flujos agénticos](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent) | De issue a PR; flujos descritos en markdown; agentes de terceros asignables a issues | GitHub | 10 a 39 USD por persona más créditos | Agente publicado; terceros y flujos agénticos en vista previa | Baja si ya se usa GitHub |
| [Devin](https://devin.ai/pricing) | Sesiones, bots y API | Proveedor; nube propia en plan empresa | 20 USD; equipos 80 USD | Publicado | Alta |
| [Cursor Automations](https://cursor.com/docs/cloud-agent/automations) | Agentes en la nube disparados por horario, eventos de GitHub, Slack, Linear, webhooks y alertas | Proveedor | Por uso | No indicado | Media |

Observaciones:

- **Factory** advierte en su documentación que las misiones no son de lanzar y olvidar: se atascan, tienen límites de reintento y exigen un repositorio muy preparado. Además requieren uso adicional prepagado y se pausan al alcanzar los límites.
- **Ona** exige el plan empresa para crear automatizaciones desde su panel y no publica precios.
- **Vercel** mantiene en su documentación las decisiones de release en manos humanas y avisa de que la reproducción duradera no hace idempotentes las escrituras a GitHub.
- **GitHub:** las sesiones del agente basadas en Actions se detienen a los 59 minutos y no se pueden ampliar.
- **Linear** permite delegar un issue asignándolo a un agente y automatizarlo con reglas de triaje; los agentes no ocupan asiento de pago.
- **Devin:** un estudio académico sobre PR de código abierto reporta una tasa de aceptación menor que la de otros agentes. Dato tomado de un resumen de búsqueda, sin leer el estudio.

### Código abierto y construcción propia

| Proyecto | Qué es | Madurez | Qué no resuelve |
|---|---|---|---|
| [OpenHands](https://openhands.dev/pricing) | Runtime de agente autoalojable con modelo propio | Muy activo; licencia MIT | No es un motor de pipeline |
| [Symphony, de OpenAI](https://github.com/openai/symphony) | Especificación y referencia experimental: vigila un tablero y lanza ejecuciones aisladas que devuelven prueba de trabajo | Se describe como vista previa de ingeniería | La entrada mostrada es Linear, no GitHub Issues |
| [Gas Town](https://github.com/gastownhall/gastown) | Coordinador, trabajadores, registro respaldado en git, cola de merge y panel web | Licencia MIT; última versión en junio de 2026 | Herramienta local; sin disparadores por webhook documentados |
| [Attractor, de StrongDM](https://github.com/strongdm/attractor) | Tres especificaciones en markdown, sin código | Sin actividad desde marzo de 2026 | Hay que implementarlo |
| [claude-squad](https://github.com/smtg-ai/claude-squad) | Gestor de terminal para agentes en paralelo | Activo; licencia AGPL | Sin disparadores |
| [Ralph](https://github.com/snarktank/ralph) | Bucle que repite un agente hasta completar los puntos de un documento de requisitos | Sin actividad desde febrero de 2026 | Sin cola, estado ni interfaz |
| Claude Code | GitHub Action y tareas programadas en la nube | Ver [documento 10](10-claude-code-como-base.md) | Estado entre etapas, cola, panel |

**A evitar:** vibe-kanban anuncia su cierre en su propio repositorio.

### Motores de flujo como columna vertebral

| Motor | Tareas de horas | Reintento y reanudación | Aprobación humana | Costo publicado | Autoalojable |
|---|---|---|---|---|---|
| [GitHub Actions](https://docs.github.com/en/actions/reference/limits) | 6 h por trabajo en runners alojados; 5 días en propios | Solo reejecutar trabajos enteros | Aprobaciones de entorno, hasta 30 días | 0.006 USD/min en Linux de 2 núcleos | Runners propios |
| [Temporal](https://temporal.io/pricing) | NC | Es su propósito central | NC | Nube desde 0 USD más 50 por millón de acciones | Sí, licencia MIT |
| [Inngest](https://www.inngest.com/pricing) | 30, 90 o 366 días según plan | Por paso | Esperas dentro de la ejecución | Gratis hasta 50,000 ejecuciones; Pro desde 99 USD | Sí; licencia sin aclarar |
| [Trigger.dev](https://trigger.dev/pricing) | Sin duración máxima | Con puntos de control; las esperas largas no se cobran | Esperas | 0, 10 o 50 USD más cómputo | Sí, licencia Apache-2.0 |
| [n8n](https://docs.n8n.io/hosting/community-edition-features/) | NC | Modo cola en la edición comunitaria | NC | Edición comunitaria gratis | Sí; sin control de versiones en git ni proyectos en la edición comunitaria |
| [Vercel Workflow](https://vercel.com/docs/workflows/pricing) | Sin límite de ejecución; cada paso sujeto al límite de funciones | Reproducción por eventos | Sí, sin cómputo mientras espera | 0.02 USD por cada 1,000 eventos más funciones | NC |
| [Cloudflare Workflows](https://developers.cloudflare.com/workflows/reference/limits/) | Tiempo de reloj ilimitado por paso; CPU limitada | Hasta 10,000 reintentos por paso | Espera de eventos | 500,000 pasos al mes incluidos | No documentado |
| Cola y servicio de webhooks propios | Lo que permita el sandbox | Hay que construirlo | Hay que construirlo | Solo infraestructura | Sí |

**Lectura de la tabla** [I]: el motor solo debe despachar y esperar. La ejecución larga del agente pertenece a un sandbox o a un runner. La propia factory de Vercel es, en esencia, una cola, una base de datos, un sandbox y una interfaz de monitoreo.

### Marcos de desarrollo guiado por especificaciones

Estructuran la entrada del trabajo. Todos son de código abierto y muy populares: [Spec Kit de GitHub](https://github.com/github/spec-kit), [OpenSpec](https://github.com/Fission-AI/OpenSpec), [BMAD Method](https://github.com/bmad-code-org/BMAD-METHOD) y [Superpowers](https://github.com/obra/superpowers).

**La evidencia de que mejoren los resultados es mixta y débil**, tomada de resúmenes de búsqueda sin leer los estudios completos:

- Un artículo académico sobre unos 88,000 PR fusionados no encontró que los artefactos de especificación redujeran los defectos.
- Una prueba de 50 tickets de una consultora encontró que los mejores flujos con especificación fusionaban el 90% frente al 60% sin ella, sobre todo en tickets que tocan varios archivos.

La popularidad no es prueba, y estos marcos cambian rápido: uno con decenas de miles de estrellas fue archivado en mayo de 2026.

### Tres arquitecturas posibles

| Arquitectura | Cómo es | A favor | En contra | Confianza |
|---|---|---|---|---|
| **1. Gestionada de mínimo esfuerzo** | GitHub Issues como entrada; agentes asignados desde el issue; flujos agénticos para triaje y tareas programadas; protección de ramas, checks obligatorios y merge humano | Sin proveedor nuevo; precio por asiento; la interfaz de GitHub hace de monitor | Tope de 59 minutos por sesión; piezas clave en vista previa; poco estado entre etapas | Media |
| **2. Propia sobre GitHub** | Etiquetas como máquina de estados; flujos de Actions que ejecutan un agente como trabajos separados de planificador, implementador y revisor; entornos como puertas de aprobación; cron para verificación post-merge e incidentes | Todo en el repositorio, auditable y barato | El estado por etiquetas es frágil; los reintentos son de trabajo entero; sin cola ni panel reales | Media-alta |
| **3. Autoalojada y portable** | Receptor de webhooks, base de datos y un motor duradero como Trigger.dev o Temporal; agentes en contenedores | Neutral respecto a agente y proveedor; reanudación y esperas de aprobación reales | La que más construcción y operación exige; hay que escribir la interfaz | Media |

El agente investigador recomienda empezar por la segunda y pasar a la tercera solo cuando sus límites estorben de verdad. En las tres, mantener el merge humano al principio: es lo que hacen todas las páginas de proveedor leídas que reportan resultados.

### No confirmado

- Precios y límites de Ona; detalles de las automatizaciones de Factory.
- Si Warp Factories está en beta o disponible de forma general.
- Si Copilot puede fusionar automáticamente; tarifas de exceso de créditos.
- Disparadores y límites de Codex en la nube.
- Detalles de aprobación humana y ejecuciones largas en Temporal y n8n.
- Kiro y el enfoque actual de Tessl.

## Sandboxes y aislamiento

Dónde se ejecutan los agentes. El criterio de comparación son los controles del equipo rojo de NVIDIA ([documento 04](04-seguridad-y-sandboxing.md)): control de egreso de red, sin escrituras fuera del espacio de trabajo, sin escrituras a la configuración del agente, y virtualización completa como recomendación.

### Comparación

| Opción | Aislamiento | Control de egreso | Secretos fuera de la vista del agente | Autoalojable | Precio |
|---|---|---|---|---|---|
| [Vercel Sandbox](https://vercel.com/docs/vercel-sandbox/concepts/firewall) | MicroVM Firecracker | Denegar todo o lista de permitidos | Sí | No | 0.128 USD por hora de CPU activa más memoria |
| [E2B](https://docs.e2b.dev/sandbox/internet-access) | MicroVM Firecracker | Listas de permitidos y denegados | Sí, en beta | Infra abierta; nube propia solo en plan empresa | ~0.17 USD/h para 2 vCPU y 4 GiB; plan Pro de 150 USD/mes |
| [Cloudflare Sandbox](https://developers.cloudflare.com/sandbox/) | MicroVM | Programable con Workers, denegación por defecto | Sí | No | 5 USD/mes más uso |
| [Docker Sandboxes](https://docs.docker.com/ai/sandboxes/architecture/) | MicroVM por sandbox | Denegado por defecto | Sí | Local gratis | Gratis en local |
| [NVIDIA OpenShell](https://docs.nvidia.com/openshell/security/best-practices) | Contenedor, o microVM con su controlador de VM | Denegado por defecto, reglas por binario | Sí | Sí, código abierto | Gratis |
| [Daytona](https://www.daytona.io/docs/en/isolation.md) | Contenedor de kernel compartido por defecto; VM opcional | Bloqueo total o listas | NC | Nube propia en plan empresa | ~0.05 USD por vCPU-hora más memoria |
| [Modal](https://modal.com/docs/guide/sandbox-networking) | gVisor; VM opcional | Bloqueo, CIDR o dominios | NC | No | ~0.24 USD/h |
| [Fly.io Sprites](https://fly.io/sprites) | VM | Lista de dominios opcional | Parcial | No | ~0.04 USD por CPU-hora más memoria |
| [Runloop](https://docs.runloop.ai/docs/network-policies) | VM | Lista de hosts; abierto por defecto | Solo credenciales del modelo | NC | ~0.32 USD/h; plan Pro de 250 USD/mes |
| [Northflank](https://northflank.com/pricing) | MicroVM | NC | NC | Nube propia sin plan empresa | ~0.07 USD/h |
| [AWS Bedrock AgentCore](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-sessions.html) | MicroVM por sesión, 8 h máximo | NC | Rol de IAM | Solo AWS | ~0.09 USD por vCPU-hora más memoria |
| [Runners de GitHub Actions](https://docs.github.com/en/actions/reference/runners/github-hosted-runners) | VM nueva por trabajo | Ninguno | Variables de entorno | Runners propios | 0.006 USD/min en Linux de 2 núcleos |
| Docker simple o contenedor de desarrollo | Kernel compartido | Cortafuegos hecho a mano | No | Sí | Gratis |
| Sandbox de Claude Code y de Codex CLI | A nivel de sistema operativo | Proxy de dominios | No | Local | Gratis |
| Kata, Firecracker, gVisor | VM, VM y kernel en espacio de usuario | Hay que construirlo | Hay que construirlo | Sí | Gratis |

Las cifras por hora para 2 vCPU y 4 GiB son cálculos del agente a partir de las tarifas publicadas.

### Qué cumple cada una

- **Egreso denegado por defecto sin configurar nada:** solo Docker Sandboxes, OpenShell y los sandboxes de Claude Code. El resto lo permite con configuración.
- **Sin control de egreso integrado:** GitHub Actions, Codespaces, Docker simple y los bloques de construcción en bruto.
- **Escrituras fuera del espacio de trabajo:** los sandboxes basados en VM lo cumplen por construcción, porque el anfitrión es inalcanzable. Docker Sandboxes y los contenedores de desarrollo montan el repositorio del anfitrión.
- **Escrituras a la configuración del agente:** es el control peor cubierto. Solo el sandbox de Claude Code documenta rutas de configuración protegidas. Ningún sandbox de VM alojado lo hace por defecto, y Docker indica expresamente que los archivos ocultos y los hooks de git son escribibles. Hay que añadirlo por capas: sandbox del agente dentro de la VM, configuración de solo lectura y revisión de esos archivos en cada diff [I].
- **Virtualización completa:** Vercel, E2B, Cloudflare, Docker Sandboxes, Sprites, Runloop, Northflank, AgentCore, GitHub Actions y OpenShell con su controlador de VM. No por defecto: Daytona, Modal, Docker simple, gVisor y los sandboxes de Claude Code y Codex.
- **Secretos fuera de la vista del agente:** Vercel, E2B (beta), Cloudflare, Docker Sandboxes y OpenShell.

### Fallos conocidos

Ningún filtro de egreso debe considerarse hermético:

- Un equipo rojo reportó en septiembre de 2026 formas de saltarse el filtrado por dominio en varios proveedores, mediante DNS falsificado e IP compartidas de CDN. Algunos lo corrigieron; Vercel y Modal lo trataron como limitación conocida. Fuente secundaria.
- Docker Sandboxes tuvo una vulnerabilidad de exfiltración por DNS que saltaba la lista de permitidos, ya corregida.
- El sandbox de Claude Code tuvo dos fallos corregidos en 2026: un salto de la lista de permitidos y un defecto de montaje.
- En julio de 2026 se publicaron escapes de los sandboxes de Codex, Cursor, Gemini CLI y Antigravity, logrados al escribir archivos que herramientas de confianza ejecutaban después fuera del sandbox.

Consecuencia [I]: combinar el filtro con listas de destinos estrechas y credenciales de corta duración limitadas al repositorio.

### Opciones recomendadas

**Gestionado, con mínima operación** (confianza media):

1. **Vercel Sandbox.** El conjunto documentado más completo: microVM, denegación total o lista de permitidos, intermediación de credenciales, instantáneas y sesiones de 24 horas en el plan Pro. Solo como servicio.
2. **E2B.** Aislamiento comparable y una salida de código abierto. La inyección de credenciales sigue en beta y las sesiones de 24 horas exigen el plan de 150 USD al mes.
3. **Cloudflare Sandbox**, si se acepta escribir código de Workers. El egreso más programable, con un máximo de 4 vCPU y 12 GiB por instancia.

**Autoalojado** (confianza media-baja, por la inmadurez de las herramientas):

1. **OpenShell con controlador de microVM.** La única opción abierta que cubre los tres controles y la sustitución de secretos. Está en versión 0.1.x.
2. **Docker Sandboxes en Ubuntu 24.04 sobre hardware físico.** Gratis y con denegación por defecto. No se confirmó que sirva para una flota desatendida.
3. **Kata Containers con un proxy de egreso propio.** Es la que más trabajo exige.

**Dos restricciones prácticas:**

- **Todas las opciones autoalojadas con VM necesitan KVM.** Eso significa hardware físico o un VPS con virtualización anidada, que muchos planes baratos no ofrecen. Hay que comprobarlo con el proveedor antes de contratar. Sin KVM, la alternativa es gVisor con un proxy, que no cumple la recomendación de virtualización.
- **Windows 10 no sirve como anfitrión.** Docker Sandboxes solo lista Windows 11, el sandbox de Claude Code exige WSL2 y OpenShell en WSL2 es experimental. Los equipos de desarrollo deben tratarse como clientes de un sandbox remoto.

### No confirmado

- Precio, aislamiento y plan gratuito actuales de Ona.
- Licencias de código abierto de Daytona y E2B.
- Control de egreso o de secretos en Northflank, Blaxel y AgentCore.
- Tiempos de arranque en frío de la mayoría.
- Un supuesto escape de VM en Vercel Sandbox en octubre de 2026: la única fuente es secundaria y cita un identificador inverosímil.
- No se evaluaron Incus, Deno Sandbox ni los entornos en la nube de Claude y Codex.

## Verificación y calidad

Las herramientas que deciden si un cambio puede fusionarse. El [documento 03](03-verificacion-y-calidad.md) explica por qué esta capa es la restricción principal.

### Pila propuesta, de lo más barato a lo más caro

| # | Cuándo | Capa | Opción principal | Alternativa |
|---|---|---|---|---|
| 1 | Ciclo del agente | Tipos y lint | tsc con ruff o pyright | Biome o reglas propias de ESLint |
| 2 | Ciclo del agente | Reglas de arquitectura | dependency-cruiser | ArchUnitTS |
| 3 | Ciclo del agente | Secretos antes del commit | Betterleaks | gitleaks |
| 4 | Ciclo del agente | Tests unitarios y de propiedades con simulaciones | fast-check o Hypothesis con MSW | Schemathesis con WireMock |
| 5 | En el PR | Análisis estático y dependencias | Semgrep CE con OSV-Scanner | CodeQL con Socket |
| 6 | En el PR | Cobertura del diff y mutación en archivos cambiados | diff-cover con Stryker incremental | mutmut |
| 7 | En el PR | Extremo a extremo, accesibilidad y visual | Playwright con axe y capturas | Argos o Chromatic |
| 8 | En el PR | Revisión por IA de un proveedor distinto al del agente autor | CodeRabbit o la revisión de Claude | PR-Agent autoalojado o la GitHub Action de Claude |
| 9 | En el PR | Política y merge | Reglas de rama, check clasificador por ruta y auto-merge | Claude Approvals o Mergify |
| 10 | Nocturno | Mutación completa, escenarios reservados y evaluación de la factory con issues pasados | Harbor | Inspect o promptfoo |

Casi todo lo de las capas 1 a 7 es de código abierto y gratuito.

### Qué tan bien detectan bugs los revisores de IA

Es el dato más importante de esta sección: **la revisión por IA es un filtro ruidoso, no un oráculo de merge.**

- La comparación más cercana a independiente, [Code Review Bench](https://github.com/withmartian/code-review-benchmark), da puntuaciones máximas en torno a 0.6 de F1 y las posiciones cambian de mes a mes.
- **Los benchmarks de proveedor se contradicen.** Una herramienta obtiene 82% en su propio benchmark y 45% cuando un competidor lo repite.
- **Los resultados académicos son más bajos:**
  - El F1 del mejor modelo cae de 0.85 con bugs sintéticos a 0.07 con PR reales, y de 0.66 en diffs de menos de 10 líneas a 0.04 en diffs de más de 150 ([arXiv 2606.15689](https://arxiv.org/abs/2606.15689)).
  - Las sugerencias de IA se adoptan bastante menos que las humanas, y más de la mitad de las no adoptadas son incorrectas o se resolvieron de otra forma ([arXiv 2603.15911](https://arxiv.org/abs/2603.15911)).
  - Los PR revisados solo por agentes se fusionan el 45.2% de las veces frente al 68.4% de los revisados solo por personas ([arXiv 2604.03196](https://arxiv.org/abs/2604.03196)).
- No se encontró ninguna comparación independiente de tasas de falsos positivos.

Consecuencia directa [I]: **mantener pequeños los diffs de los agentes**. La capacidad de detección se desploma con el tamaño.

### Revisores de IA

Todos son consultivos salvo que se conecten a un check obligatorio.

| Herramienta | Cómo se ejecuta | Precio publicado | Puede bloquear | Autoalojable |
|---|---|---|---|---|
| [CodeRabbit](https://docs.coderabbit.ai/management/plans.md) | App de GitHub, IDE y CLI | 24 a 72 USD por desarrollador al mes; gratis en repos públicos | Sí, con checks propios en lenguaje natural desde el plan de equipo | Solo plan empresa |
| [Revisión de Claude](https://code.claude.com/docs/en/code-review.md) | App gestionada; planes de equipo y empresa | Por tokens | Su check nunca falla por sí mismo | No |
| [GitHub Action de Claude](https://code.claude.com/docs/en/github-actions) | En runners propios con clave de API | Tokens y minutos de Actions | Según se configure | Sí |
| [Copilot](https://docs.github.com/en/copilot/concepts/agents/code-review) | Automática mediante reglas de rama | ~0.25, 1.50 o 10 USD por revisión según nivel | Las aprobaciones no cuentan salvo que se habilite | No |
| [Cursor Bugbot](https://cursor.com/docs/bugbot) | App de GitHub | Por uso | Solo con la opción de fallar si hay hallazgos sin resolver | No |
| [Codex](https://learn.chatgpt.com/docs/third-party/github) | Por mención o automática | NC | NC | No |
| [Greptile](https://www.greptile.com/pricing) | App | Créditos de 1 USD; 1 a 10 por revisión | NC | Solo plan empresa |
| [Graphite](https://graphite.com/pricing) | App; incluye cola de merge | 20 a 40 USD | NC | No |
| [PR-Agent](https://github.com/The-PR-Agent/pr-agent) | Action, CLI o Docker con cualquier modelo | Gratis, licencia MIT | Según se configure | Sí |

**Dos trampas de seguridad:**

- **El revisor de Copilot lee sus instrucciones de la rama del PR.** Un agente autor puede editar las reglas de su propio revisor. Los revisores de Claude y de Cursor las leen de la rama base.
- PR-Agent fue donado por su creador y se describe como proyecto heredado mantenido por la comunidad.

Movimientos recientes: Graphite fue adquirida por Cursor, y varias herramientas pequeñas cambiaron de producto o de dueño.

### Tests escritos por IA: cómo vigilarlos

La cobertura no sirve como oráculo:

- Una batería generada por un modelo con 100% de cobertura de líneas y ramas obtuvo solo 4% de puntuación de mutación ([arXiv 2506.02954](https://arxiv.org/abs/2506.02954)).
- En Meta, los ingenieros aceptaron el 73% de los tests guiados por mutación; casi la mitad se habría descartado con un criterio de cobertura de líneas ([arXiv 2501.12862](https://arxiv.org/abs/2501.12862)).
- En un estudio de más de 14,000 tests generados, el 15.6% de los fallos venía de aserciones erróneas, y las entradas nulas, negativas y vacías se cubrían entre el 24% y el 39% de las veces ([arXiv 2610.32548](https://arxiv.org/abs/2610.32548)).

**Herramientas:** las pruebas de mutación (Stryker, mutmut, PIT) miden si los tests detectan cambios en el código; el modo incremental de Stryker las hace viables en cada PR. Las pruebas basadas en propiedades (fast-check, Hypothesis) atacan los casos límite que los tests de ejemplo omiten.

### Puertas deterministas

- **Tipos y lint.** El oráculo más barato.
- **Análisis estático.** La edición comunitaria de Semgrep solo analiza dentro de una función o archivo y, según su propio repositorio, deja pasar hallazgos reales. CodeQL cuesta 30 USD por colaborador activo al mes en repos privados.
- **Dependencias.** OSV-Scanner y Trivy son gratuitos. Dependabot y Renovate permiten un periodo de espera antes de adoptar versiones nuevas.
- **Fijar las acciones de CI por hash.** En marzo de 2026 las etiquetas de la acción de Trivy fueron sobrescritas con malware.
- **Secretos.** gitleaks solo recibe parches de seguridad; Betterleaks es su sucesor, del mismo autor.

### Verificación de comportamiento y visual

- **Playwright** incluye agentes de prueba (planificador, generador y reparador), CLI y servidor MCP. **Riesgo** [I]: un reparador puede "arreglar" un test sobre una regresión real, así que las especificaciones de aceptación deben quedar fuera del alcance de escritura del agente autor.
- **Regresión visual.** Las capturas de Playwright son gratuitas; Argos y Chromatic tienen planes gratuitos de unas 5,000 capturas. Es la respuesta disponible a que la factory no vea lo que se ve mal.
- **Agentes de navegador guiados por modelo:** no deterministas; sirven para explorar, no como puerta.
- **Simulación de servicios:** MSW, WireMock, Mockoon y Prism son de código abierto. LocalStack pasó a exigir token y su plan gratuito es para uso no comercial.
- **Gemelos digitales al estilo de StrongDM:** no se encontró ningún equivalente comercial; su método de construcción no es público.

### Política y merge automático

- **Reglas de rama de GitHub:** checks obligatorios, revisión de propietarios de código, revisores obligatorios por ruta y resultados obligatorios de análisis.
- **Auto-merge:** fusiona cuando pasan las revisiones y los checks obligatorios.
- **Cola de merge de GitHub:** solo en repositorios públicos de organización o privados del plan empresa en la nube.
- **[Mergify](https://docs.mergify.com/configuration/conditions/):** gratis hasta 5 colaboradores activos, con condiciones por archivos, autor, etiqueta, líneas modificadas y checks.
- **Claude Approvals:** reglas por ruta en el repositorio. No puede leer los resultados de CI.

**Cómo expresar "auto-merge solo para la clase de cambio X"** [I]:

1. Un trabajo determinista de CI clasifica el diff por rutas y tamaño y emite un check obligatorio o una etiqueta.
2. El auto-merge se habilita solo para las clases permitidas.
3. Las rutas sensibles exigen revisión humana, incluidos los propios archivos de política, de flujos de CI y de instrucciones del revisor.

### Evaluar la propia factory

- **Arneses de evaluación:** Harbor, Inspect y promptfoo son de código abierto. Braintrust y LangSmith tienen planes gratuitos.
- **Reproducir tareas pasadas** para comparar modelos y configuraciones es lo que hace el banco de pruebas de Warp.
- **Defectos escapados.** No se encontró ningún estudio que cuantifique tasas de reversión de PR escritos por agentes. Sugerencia del investigador: etiquetar los PR de agentes y medir reversiones o correcciones urgentes en los días siguientes, por clase de cambio.

### No confirmado

- Cifras en vivo del benchmark de revisores, tomadas de resúmenes y de publicaciones de proveedores.
- Precio por ejecución de Bugbot y de la revisión de Codex.
- Si CodeQL es gratuito en repositorios públicos y si la cola de merge existe en el plan de equipo.
- Varias licencias que la API de GitHub no identificó.

## Entrega, operación y control de costos

Lo que ocurre después del merge: desplegar, revertir, detectar errores y devolverlos a la cola como trabajo nuevo, además de vigilar el gasto y las credenciales de los agentes.

### Pila mínima propuesta

| Categoría | Variante gestionada | Variante autoalojada en un VPS |
|---|---|---|
| Despliegue y base de datos | Vercel con Neon; alternativa Railway | Coolify con Postgres; alternativa Kamal |
| Entrega progresiva | Releases graduales de Vercel con su API de reversión; alternativa LaunchDarkly | Reversión por comprobación de salud de Dokploy; alternativa Unleash |
| Migraciones | pgroll con Squawk | Igual |
| Errores | Sentry con Seer; alternativa PostHog | GlitchTip; alternativa SigNoz |
| Disponibilidad | Checkly; alternativa Better Stack | Los mismos planes gratuitos |
| Observabilidad de los agentes | Telemetría de Claude Code hacia Grafana Cloud; alternativa Langfuse | Langfuse autoalojado; alternativa Phoenix |
| Gasto | Límites por espacio de trabajo del proveedor del modelo; alternativa Cloudflare AI Gateway | LiteLLM fijado por digest; alternativa Agent Router |
| Secretos | OIDC, una GitHub App e Infisical; alternativa Doppler | Infisical autoalojado; alternativa OpenBao |
| Control de MCP | Docker MCP Gateway; alternativa lista de servidores oficiales permitidos | Docker MCP Gateway; alternativa agentgateway |

### Despliegue y entornos de vista previa

| Plataforma | Vista previa por PR | Reversión | Control por agente o CI | Precio |
|---|---|---|---|---|
| [Vercel](https://vercel.com/docs/instant-rollback) | Sí | Instantánea | API, CLI y servidor MCP oficial | Gratis; Pro 20 USD por desarrollador más uso |
| [Netlify](https://www.netlify.com/pricing/) | Sí | Instantánea, publicando un despliegue anterior | Servidor MCP oficial | Gratis, 9 o 20 USD, medido por créditos |
| [Cloudflare Workers](https://developers.cloudflare.com/workers/configuration/previews/) | Sí; las URL de versión usan recursos de producción | Manual, por versiones | CLI y servidor MCP | Gratis; 5 USD al mes |
| [Railway](https://docs.railway.com/environments) | Entornos nativos por PR con limpieza automática | Restaura imagen y variables | Servidor MCP | Por uso; 5 o 20 USD |
| [Render](https://render.com/docs/preview-environments) | Sí, con almacenes de datos vacíos; plan superior | Panel y API | Servidor MCP oficial sin borrados | NC |
| [Fly.io](https://docs.fly.io/blueprints/review-apps-guide) | Hay que montarlo | NC | Servidor MCP experimental | Pago por uso |
| [Coolify](https://coolify.io/docs/applications/ci-cd/github/preview-deploy), autoalojado | Sí, con una GitHub App y DNS comodín | Por API | API | Gratis |
| [Kamal](https://kamal-deploy.org/docs/commands/rollback/), autoalojado | No | Por comando | CLI | Gratis, licencia MIT |

**Advertencias para un pipeline desatendido:**

- **Vercel:** tras una reversión, la asignación automática a producción queda desactivada hasta que se promueve algo. El pipeline debe promover de forma explícita.
- **Netlify:** cada despliegue a producción consume créditos, y el plan gratuito se agota rápido con despliegues frecuentes de agentes.
- **Render:** revertir por API no desactiva el autodespliegue.
- **Coolify:** el código de las vistas previas se ejecuta en el propio servidor. Nunca hay que darles credenciales de producción.
- **Dokploy:** su repositorio incluye una licencia propietaria además de la abierta.

**Ramas de base de datos:** [Neon](https://neon.com/docs/guides/vercel-overview) crea una rama por despliegue de vista previa y tiene plan gratuito; [Supabase](https://supabase.com/docs/guides/deployment/branching) crea ramas por PR sin datos por defecto.

### Entrega progresiva y reversión automática

- **Releases graduales de Vercel y despliegues graduales de Cloudflare:** reparten el tráfico por porcentajes, pero **abortar es manual o por API**. El pipeline tiene que vigilar las métricas y decidir.
- **Reversión automática por métricas:** la ofrecen [LaunchDarkly](https://launchdarkly.com/pricing/) y [GrowthBook](https://www.growthbook.io/pricing), esta última solo en plan de pago. Argo Rollouts y Flagger también, pero exigen Kubernetes, que es demasiado para un equipo pequeño.
- **Flags de código abierto:** Unleash y GrowthBook se pueden autoalojar gratis con límites. OpenFeature es una API neutral que evita atarse a un proveedor.
- **Migraciones de base de datos:** [pgroll](https://github.com/xataio/pgroll) aplica el patrón de expandir y contraer con reversión instantánea en Postgres. [Squawk](https://squawkhq.com/) revisa las migraciones en el PR.

### Del error en producción al PR de corrección

Cuatro formas documentadas de cerrar el ciclo:

| Variante | Cómo funciona | Requisitos y límites |
|---|---|---|
| **A. Nativa de Sentry** | [Seer](https://docs.sentry.io/product/ai-in-sentry/seer/autofix/) analiza automáticamente los issues que cumplen un umbral, propone la causa raíz y abre un PR o lo delega a un agente de código | Complemento de pago. Crear un issue de GitHub desde una alerta exige el plan Business. Su facturación cambia a créditos en diciembre de 2026 |
| **B. Rastreador, issue y GitHub Action** | Honeybadger o Rollbar crean el issue con la traza; un flujo que escucha issues nuevos ejecuta el agente en modo automático y abre el PR | La más barata. Hay que permitir expresamente al bot del rastreador |
| **C. Relé de webhooks propio** | Una alerta llama a un relé pequeño que dispara un flujo del repositorio; el agente obtiene las trazas por MCP | Autoalojable; hay que construir el relé |
| **D. Datadog** | Sus automatizaciones convierten señales de errores en PR en borrador; nunca fusiona solo | Facturado en créditos |

**Riesgo de seguridad en las cuatro** [I]: el texto de un error está influido por quien usa la aplicación, así que es una vía de inyección de prompts. El agente que atiende incidentes debe tener una lista de herramientas restringida.

**Rastreadores de errores:** [Sentry](https://docs.sentry.io/organization/integrations/source-code-mgmt/github/) tiene plan gratuito para un usuario y servidor MCP oficial. [PostHog](https://posthog.com/docs/error-tracking/alerts) da 100,000 excepciones gratis al mes con alertas por webhook. [GlitchTip](https://glitchtip.com/documentation/install) es la opción autoalojable ligera.

### Observabilidad de los agentes

- **Claude Code** exporta por OpenTelemetry el costo y los tokens por sesión, las peticiones con su costo y los resultados de herramientas ([documentación](https://code.claude.com/docs/en/monitoring-usage)). Su [API de analítica](https://platform.claude.com/docs/en/build-with-claude/claude-code-analytics-api) da costo diario por actor y modelo, pero **excluye el uso con planes de suscripción**.
- **Codex** exporta telemetría equivalente, desactivada por defecto.
- **Plataformas de trazas:** [Langfuse](https://github.com/langfuse/langfuse) es de código abierto en su núcleo, autoalojable y con plan gratuito en la nube. [Phoenix](https://github.com/Arize-ai/phoenix) es autoalojable con una licencia de código disponible. LangSmith y Braintrust tienen planes gratuitos, pero no se autoalojan fuera del plan empresa.

### Control de gasto

**Primero lo que ya ofrece el proveedor del modelo:**

- Anthropic: espacios de trabajo con sus propios límites de gasto y de tasa, y una API de uso y costo agrupable por espacio, clave o modelo ([documentación](https://platform.claude.com/docs/en/build-with-claude/workspaces)).
- OpenAI: límites duros de gasto por organización o proyecto. Su aplicación no es instantánea.

**Caché de prompts** ([documentación](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)): en Anthropic las escrituras cuestan 1.25 veces la entrada con vida de 5 minutos o 2 veces con vida de 1 hora, y las lecturas una décima parte o menos. Coincide con el caso del [documento 05](05-costos-y-modelo-operativo.md), donde las lecturas de caché eran casi todos los tokens.

**Pasarelas de modelos:**

- [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/features/dynamic-routing/): gratuita, con caché, límites y enrutamiento dinámico por metadatos de la petición, lo que encaja con enrutar por clase de tarea.
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway/pricing): sin recargo, con presupuestos por equipo, proyecto o clave. Los presupuestos no cuentan el gasto con clave propia.
- [OpenRouter](https://openrouter.ai/docs/guides/overview/auth/provisioning-api-keys): comisión de 5.5% al comprar créditos; claves con límite creadas por API.
- [LiteLLM](https://docs.litellm.ai/docs/proxy/users): proxy abierto con presupuestos por clave, usuario y equipo.
  - **Aviso de cadena de suministro:** una versión del paquete y varias etiquetas de su imagen de Docker fueron comprometidas con malware en octubre de 2026. Si se usa, hay que fijar la imagen por digest.

### Secretos, identidades y control de herramientas

- **Identidad del agente en GitHub:** una GitHub App en lugar de un token personal. Sus tokens duran una hora y se pueden limitar a repositorios y permisos concretos.
- **Credenciales de nube de corta duración** mediante OIDC en GitHub Actions, sin secretos almacenados. La GitHub Action de Claude admite federación de identidad, sin clave de API guardada.
- **Gestores de secretos:** [Infisical](https://infisical.com/pricing) tiene núcleo de código abierto, es autoalojable y ofrece un intermediario para que los agentes nunca tengan las claves. Doppler solo se autoaloja en plan empresa. OpenBao es la alternativa abierta de la Linux Foundation.
- **Control de MCP:** [Docker MCP Gateway](https://docs.docker.com/ai/mcp-catalog-and-toolkit/mcp-gateway/) ejecuta cada servidor MCP en un contenedor aislado, con perfiles y trazas de llamadas.

### No confirmado

- Precios de Render y de Seer; si la delegación de Seer a un agente puede ser totalmente automática.
- Reversión automática por tasa de errores en los flags de PostHog.
- Licencias de varios proyectos abiertos.
- Varios datos sobre adquisiciones y cierres de producto vienen solo de resúmenes de búsqueda.

## Avisos sobre el proceso de investigación

Dos páginas de documentación de proveedores contenían texto dirigido a lectores automáticos, pidiéndoles consultar un punto de búsqueda o enviar un informe de comentarios. Los investigadores lo ignoraron y lo reportaron. No afectó a los resultados.
