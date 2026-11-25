# 10 · Claude Code como base de la factory

Qué ofrecen Claude Code, el Agent SDK y la API de Claude para construir la factory, y qué habría que cubrir con otras herramientas.

**Nivel de evidencia.** Todo proviene de la documentación oficial, leída por un solo agente el 24 de noviembre de 2026. No pasó por verificación adversarial ni se probó en la práctica. Las funciones en vista previa cambian con frecuencia: conviene abrir el enlace de cada punto antes de depender de él. Lo que no se encontró en la documentación está listado al final.

## Resumen

Claude Code cubre de fábrica buena parte de los componentes: ejecución desatendida, disparadores, entornos en la nube, subagentes y flujos multi-agente, arnés, revisión de código y telemetría. Quedan fuera cuatro cosas que importan para una factory de mínima intervención:

1. **Fusionar.** La documentación no describe ninguna acción de merge hecha por Claude. El merge queda en manos de las reglas de rama de GitHub.
2. **Un revisor independiente que no sea Claude.**
3. **Un registro de costos entre ejecuciones y presupuestos por issue.**
4. **Sandbox local en Windows nativo.** Hace falta WSL2 o un runner Linux.

## Mapa por componente

| Componente de la factory | Qué aporta Claude Code |
|---|---|
| Entrada de trabajo | GitHub Action (mención en comentarios o modo automático); tareas programadas con disparadores por horario, API y eventos de GitHub |
| Orquestación | Flujos multi-agente (workflows), subagentes con worktree aislado, Agent SDK para código propio, Managed Agents si se quiere alojamiento gestionado |
| Sandbox | Sesiones en la nube, entornos autoalojados, sandbox local en macOS, Linux y WSL2, contenedores de desarrollo |
| Arnés | `CLAUDE.md`, skills, plugins, hooks, listas de servidores MCP permitidos, configuración gestionada |
| Verificación | Revisión en la nube con salida JSON, revisión automática de PR, veredictos con esquema JSON, checks de CI obligatorios, Claude Approvals |
| Entrega | Ramas creadas por las sesiones en la nube y las tareas programadas, corrección automática de CI, PR Steward, reglas de rama de GitHub para el merge |
| Monitoreo | OpenTelemetry, salida JSON del modo desatendido, API de analítica |
| Control de costo | Límite de turnos y de presupuesto por ejecución, presupuestos de Managed Agents, topes horarios de las tareas programadas, elección de modelo y esfuerzo, tope de gasto de la revisión de código, límites por espacio de trabajo |

## 1. Ejecución desatendida

**Modo sin interfaz** ([documentación](https://code.claude.com/docs/en/headless.md), [referencia del CLI](https://code.claude.com/docs/en/cli-reference.md)):

- Se invoca con `claude -p` y devuelve un código de salida distinto de cero si falla.
- Formatos de salida: texto, JSON o JSON en flujo. Se puede exigir una salida validada contra un esquema JSON.
- La salida JSON incluye el identificador de sesión, una estimación del costo y las denegaciones de permisos.
- Límites: número máximo de turnos y tope de presupuesto en dólares por ejecución.
- Las sesiones se pueden continuar o reanudar por identificador.
- Existe un modo mínimo recomendado para scripts que omite hooks, plugins y `CLAUDE.md`, y que exige clave de API.
- **Advertencia:** fuera de ese modo mínimo, la ejecución desatendida carga los hooks del proyecto y sus servidores MCP incluso en una carpeta en la que nunca se confió.

**Permisos para ejecuciones sin supervisión** ([documentación](https://code.claude.com/docs/en/permission-modes.md)):

- El patrón documentado para CI es un modo que no pregunta, combinado con una lista explícita de herramientas permitidas.
- Hay un modo automático que usa un clasificador. La documentación advierte que no garantiza seguridad.
- El modo que omite todos los permisos está documentado solo para contenedores o máquinas virtuales aisladas y sin acceso a internet. No protege contra inyección de prompts.

**GitHub Action** ([documentación](https://code.claude.com/docs/en/github-actions.md)):

- Modo interactivo: responde a menciones en comentarios, revisiones o issues nuevos.
- Modo automático: se ejecuta con un prompt fijo ante cualquier evento, incluido un horario.
- Rechaza a usuarios sin permiso de escritura y a bots salvo que se permitan expresamente.
- La aplicación de GitHub necesita permisos amplios: contenido, issues, PR, actions y workflows.
- No se encontró una función dedicada de issue a PR; se logra con una mención en el issue o con un prompt en modo automático.

## 2. Ejecución en la nube

**Sesiones en la nube** ([documentación](https://code.claude.com/docs/en/claude-code-on-the-web.md), [entornos](https://code.claude.com/docs/en/cloud-environments.md)):

- Disponibles en los planes de pago. Consumen del plan, sin cargo aparte por la máquina virtual.
- Acceso de red configurable: ninguno, limitado (por defecto, con gestores de paquetes) o completo.
- Las credenciales de git quedan fuera de la máquina virtual y las añade un proxy.
- Las variables de entorno son visibles para cualquiera que use el entorno. Los secretos de red se adjuntan fuera del sandbox a las peticiones que coinciden.
- No disponibles para organizaciones con ciertos requisitos de cumplimiento ni a través de otros proveedores de nube.
- **Aviso para Windows:** desde Windows nativo se suben tal cual los archivos sensibles sin confirmar en git.

**Tareas programadas** ([documentación](https://code.claude.com/docs/en/routines.md)), en vista previa de investigación:

- Disparadores: horario, API y eventos de GitHub.
- El disparador por API es una petición HTTP a un punto de entrada propio de cada tarea, con un token que se muestra una sola vez. El texto que se envía se trata como no confiable.
- Límites: 100 ejecuciones programadas por hora por cuenta y 30 por hora por tarea.
- Se ejecutan con la cuenta individual y crean ramas con un prefijo propio.
- El disparador por API es solo para usuarios de claude.ai, no para la API de plataforma.

**Corrección automática de PR** ([documentación](https://code.claude.com/docs/en/claude-code-on-the-web.md#auto-fix-pull-requests)): vigila los fallos de CI y los comentarios de revisión. Necesita la aplicación de GitHub.

## 3. Agent SDK y Managed Agents

**Agent SDK** ([documentación](https://code.claude.com/docs/en/agent-sdk/overview.md)):

- Paquetes para Python y TypeScript que ejecutan Claude Code dentro de un proceso propio.
- Incluye herramientas de archivos, shell, búsqueda y web, además de hooks, subagentes, MCP, permisos, sesiones, skills y plugins.
- Los productos construidos sobre el SDK deben autenticarse con clave de API ([términos](https://code.claude.com/docs/en/legal-and-compliance.md)).
- No se encontró una guía de alojamiento y escalado.

**Managed Agents** ([documentación](https://platform.claude.com/docs/en/managed-agents/overview.md), [presupuestos](https://platform.claude.com/docs/en/managed-agents/budgets.md)), en beta:

- Agentes alojados por Anthropic con sandbox gestionado, o con sandbox propio.
- Precio: tokens a precio de lista, más 0.08 USD por hora de sesión y 10 USD por cada 1,000 búsquedas web.
- Presupuestos por sesión como tope duro: la sesión se pausa al alcanzarlo.

## 4. Varios agentes

- **Subagentes** ([documentación](https://code.claude.com/docs/en/sub-agents.md)). Se definen en archivos Markdown con herramientas permitidas, modelo, modo de permisos, aislamiento en worktree, ejecución en segundo plano, turnos máximos y esfuerzo. Concurrencia por defecto de 20 y hasta 3 niveles de anidamiento. Heredan el modo de permisos del padre cuando este es permisivo.
- **Flujos** ([documentación](https://code.claude.com/docs/en/workflows.md)). Scripts en JavaScript que encadenan y paralelizan agentes: hasta 16 concurrentes y 1,000 por ejecución. Reanudables dentro de la sesión.
- **Equipos de agentes** ([costos](https://code.claude.com/docs/en/costs.md)). Experimentales; en modo plan consumen unas 7 veces más tokens.
- **Worktrees y modo plan.** El modo plan es de solo lectura hasta que se aprueba.

## 5. Arnés

- **Instrucciones y memoria:** `CLAUDE.md`, `AGENTS.md`, memoria automática y reglas por carpeta ([documentación](https://code.claude.com/docs/en/memory.md)). El contenido de esta página no se verificó a fondo.
- **Skills, plugins y mercados de plugins** ([documentación](https://code.claude.com/docs/en/plugins/overview.md)).
- **Hooks** ([documentación](https://code.claude.com/docs/en/hooks.md)). Hay eventos antes y después de cada herramienta, al pedir permiso, al terminar el agente o un subagente y al iniciar o cerrar sesión. Un hook puede bloquear una acción.
  - **No son una barrera dura.** La documentación indica usar reglas de permisos para los límites estrictos.
  - Un hook que agota su tiempo no bloquea salvo que se configure así.
  - Las sesiones en la nube no leen la configuración local del usuario.
- **MCP:** listas de servidores permitidos y denegados en la configuración gestionada ([documentación](https://code.claude.com/docs/en/managed-mcp.md)).

## 6. Seguridad

**Sandbox integrado** ([documentación](https://code.claude.com/docs/en/sandboxing.md)):

| Aspecto | Comportamiento documentado |
|---|---|
| Estado por defecto | Desactivado |
| Plataformas | macOS, Linux y WSL2. **No funciona en Windows nativo ni en WSL1** |
| Qué envuelve | Los comandos de shell. No las herramientas de archivos, ni MCP, ni los hooks |
| Escrituras | Limitadas al directorio de trabajo, temporales y carpetas añadidas |
| Lecturas | Casi toda la máquina por defecto, incluidas las claves SSH, salvo que se denieguen |
| Red | Proxy con lista de dominios permitidos que empieza vacía |
| Docker | Incompatibilidad conocida |

Comparado con los tres controles obligatorios de NVIDIA ([documento 04](04-seguridad-y-sandboxing.md)): cubre el egreso de red y las escrituras fuera del espacio de trabajo en los comandos de shell, pero es aislamiento a nivel de sistema operativo con kernel compartido, no virtualización, y no restringe las lecturas por defecto [I].

**Otros controles:**

- Reglas de permisos de permitir, preguntar y denegar. Las de denegar aplican en todos los modos ([documentación](https://code.claude.com/docs/en/permissions.md)).
- Configuración gestionada para organizaciones, que puede impedir el modo sin permisos ([documentación](https://code.claude.com/docs/en/managed-settings.md)).
- Contenedor de desarrollo de referencia con cortafuegos. La documentación advierte que, aun en contenedor, el modo sin permisos puede exfiltrar las credenciales de Claude, y recomienda no montar secretos del anfitrión ([documentación](https://code.claude.com/docs/en/devcontainer.md)).

## 7. Revisión y verificación

- **Revisión local** con varios niveles de esfuerzo.
- **Revisión multi-agente en la nube** ([documentación](https://code.claude.com/docs/en/ultrareview.md)), en vista previa. Verifica de forma independiente cada hallazgo. Tiene modo no interactivo con salida JSON y códigos de salida, lo que permite usarla como puerta en un pipeline. Tres ejecuciones gratuitas por cuenta y después entre 5 y 25 USD por revisión.
- **Revisión automática de PR en GitHub** ([costos](https://code.claude.com/docs/en/code-review-costs.md)). Se factura por tokens. Frecuencia configurable por repositorio y tope de gasto mensual; al agotarse, las revisiones se omiten.
- **Claude Approvals** ([documentación](https://code.claude.com/docs/en/approvals.md)), beta pública para planes de equipo y empresa. Una política en el repositorio define cuándo Claude comenta o aprueba. Solo bloquea el merge si se configura como check obligatorio en GitHub. **Riesgo documentado:** una regla que permita a Claude aprobar sin una puerta de revisión de código puede aprobar código sin revisar.
- **PR Steward** ([documentación](https://code.claude.com/docs/en/pr-steward-security.md)). Atiende el PR en una sesión en la nube. Está diseñado para no aprobar ni fusionar: el servicio rechaza aprobar PR, cambiar protecciones de rama, borrar ramas y publicar etiquetas.

## 8. Costo y observabilidad

- **OpenTelemetry** ([documentación](https://code.claude.com/docs/en/monitoring-usage.md)). Exporta métricas de sesiones, costo, tokens, líneas de código, commits y PR, y eventos de prompts, decisiones de herramientas y peticiones. El texto de los prompts se oculta por defecto.
- **Informes de costo:** comandos de uso, informes de gasto por equipo, espacios de trabajo con límites y una API de analítica ([documentación](https://code.claude.com/docs/en/costs.md)).
- **Modelos más baratos para subagentes:** configurable por subagente o de forma global.
- **Límites de la API** ([documentación](https://platform.claude.com/docs/en/api/rate-limits.md)). Hay topes de gasto mensual por nivel de cuenta y límites por minuto por modelo. Las lecturas de caché no cuentan para el límite de tokens de entrada.

### Suscripción o clave de API para automatizar

Es la decisión de costo más importante y la documentación no da un umbral claro ([autenticación](https://code.claude.com/docs/en/authentication.md), [términos](https://code.claude.com/docs/en/legal-and-compliance.md)):

- Existe un token de larga duración pensado para pipelines de CI y scripts, disponible en los planes de suscripción. La GitHub Action lo acepta.
- Los términos dicen que los límites anunciados de los planes suponen un uso individual ordinario, y que los productos construidos sobre el SDK deben usar claves de API.
- Lectura del agente que revisó la documentación: la automatización personal puede usar el token de suscripción; los pipelines compartidos o de organización deberían usar una clave de API. No hay un umbral numérico documentado para el uso en paralelo.

Esto condiciona el presupuesto. El caso de costo por historia del [documento 05](05-costos-y-modelo-operativo.md) se pagó con una suscripción plana; con clave de API el mismo trabajo se factura a precio de lista.

## 9. Windows

- Claude Code funciona en Windows 10 nativo ([instalación](https://code.claude.com/docs/en/setup.md)).
- **El sandbox no.** Para un pipeline desatendido y aislado hace falta WSL2 o un runner Linux.
- Las sesiones en la nube iniciadas desde Windows nativo suben los archivos sensibles sin confirmar en git.

Consecuencia para el plan [I]: las máquinas Windows sirven para desarrollar y supervisar, pero los agentes desatendidos deberían ejecutarse en Linux, ya sea en la nube, en un runner o en un servidor propio.

## Qué habría que cubrir con otras herramientas

| Necesidad | Por qué |
|---|---|
| Cola de issues, prioridad y concurrencia por issue | Se apoya en GitHub y en los controles de concurrencia de Actions |
| Registro de costos entre ejecuciones y presupuestos por issue | Solo hay topes por sesión; hay que agregar la telemetría |
| Merge automático | No hay acción de merge documentada; usar la cola de merge de GitHub o un bot |
| Revisor independiente de otro proveedor | No hay ninguno documentado |
| Gestión de secretos | Las variables de entorno son visibles; hace falta un gestor de secretos |
| Entrada de trabajo desde fuera de GitHub | El disparador por API es solo para usuarios de claude.ai; hace falta un relé propio |
| Panel central | Construirlo sobre OpenTelemetry o la API de analítica |

## No encontrado en la documentación

- Guía de alojamiento y escalado del Agent SDK.
- Semántica exacta del tope de presupuesto por ejecución en el peor caso.
- Si los hooks se ejecutan en los modos permisivos.
- Umbral de uso en paralelo con suscripción.
- No se leyeron las páginas de revisión de seguridad, worktrees, configuración de modelos ni seguimiento de costos.
