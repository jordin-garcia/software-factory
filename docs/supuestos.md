# Resultado de los supuestos (Tarea 3)

- Fecha: experimentos el 2026-11-25 (UTC, de 05:50 a 06:30); investigación documental el 2026-11-24.
- Dónde: repositorio público desechable [`jordin-garcia/factory-sandbox`](https://github.com/jordin-garcia/factory-sandbox), runner `ubuntu-24.04` (Ubuntu 24.04.5 LTS), aplicación de la factory y los secretos de `docs/identidades.md`.
- **`VERSION_CLAUDE_CODE` = `2.1.332`**, instalada con `npm install -g @anthropic-ai/claude-code@2.1.332`. Ese día en npm: `latest` = `next` = 2.1.332 y `stable` = 2.1.326.
- Ningún flujo imprimió secretos ni la salida del agente. Las salidas se guardaron como artefactos de un día, que se descargaron y se borraron.

## Resumen

| Supuesto | Experimento | Resultado | Evidencia | Consecuencia |
|---|---|---|---|---|
| 1. El token de suscripción sirve en Actions y los términos lo permiten | `claude -p … --permission-mode dontAsk` con `CLAUDE_CODE_OAUTH_TOKEN`, tarea "añade `multiplicar` y su test" | **PARCIAL**: lo técnico, confirmado (código 0, 7 turnos, `apiKeySource: "none"`). Los términos, zona gris | [run 45558556134 intento 2](https://github.com/jordin-garcia/factory-sandbox/actions/runs/45558556134/attempts/2); [authentication](https://code.claude.com/docs/en/authentication); [legal-and-compliance](https://code.claude.com/docs/en/legal-and-compliance) | No se detiene la construcción por lo técnico. Los términos los decide la persona operadora |
| 2. El cupo de Pro alcanza para una tarea pequeña | Leer `rate_limit_event` de 8 ejecuciones; probar `/usage` en `-p` | **CONFIRMADO**: la tarea pequeña costó menos del 1 % de la ventana de 5 h. La estimación tiene fiabilidad baja | El mismo run; [run 45560194061](https://github.com/jordin-garcia/factory-sandbox/actions/runs/45560194061); [error-reference](https://code.claude.com/docs/en/error-reference) | Sigue adelante. El riesgo real es la ventana semanal, que ya estaba en el 22 % |
| 3. Copilot del plan de estudiante revisa PR | `gh pr edit 2 --add-reviewer @copilot`, dos veces | **FALLA**: código 0 y HTTP 200, pero no queda petición registrada y no llega ninguna revisión en 13 min | [PR #2](https://github.com/jordin-garcia/factory-sandbox/pull/2); [code review](https://docs.github.com/en/copilot/concepts/agents/code-review) (Student no figura) | Salida de la spec: solo revisor Claude; el revisor externo queda como hueco consultivo |
| 4. Los PR abiertos con la aplicación lanzan `ci` sin aprobación | Abrir un PR con el token de la aplicación; control con `GITHUB_TOKEN` | **CONFIRMADO**: `ci` en `success` sin aprobación; con `GITHUB_TOKEN`, `action_required` | [run 45556636619](https://github.com/jordin-garcia/factory-sandbox/actions/runs/45556636619), [PR #1](https://github.com/jordin-garcia/factory-sandbox/pull/1), [ci 45556662497](https://github.com/jordin-garcia/factory-sandbox/actions/runs/45556662497), [control 45556773978](https://github.com/jordin-garcia/factory-sandbox/actions/runs/45556773978) | Se mantiene el diseño. Todo commit a la rama de un PR va con el token de la aplicación |
| 5. El sandbox de Claude Code funciona en el runner | `sandbox.enabled`, `failIfUnavailable: true`, `allowedDomains: ["api.github.com"]`; `curl` a `example.com` y a `api.github.com` | **PARCIAL**: sin ajuste, Claude Code se niega a arrancar (AppArmor). Con `sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0`, bloquea `example.com` y deja pasar `api.github.com` | [run 45560194061](https://github.com/jordin-garcia/factory-sandbox/actions/runs/45560194061), [run 45559060203](https://github.com/jordin-garcia/factory-sandbox/actions/runs/45559060203); [sandboxing](https://code.claude.com/docs/en/sandboxing) | No aplica la salida de fallo. Los trabajos de agente necesitan un paso de preparación |
| 6. Un flujo crea repos, protege ramas y escribe secretos y variables | `FACTORY_ADMIN_TOKEN` desde un flujo: `POST user/repos`, protección, secreto, variable, `allow_auto_merge` | **CONFIRMADO**. Tras proteger `main`, escribir en `main` da HTTP 409 | [run 45559055197](https://github.com/jordin-garcia/factory-sandbox/actions/runs/45559055197) | No hace falta el script local. Hay que escribir todos los archivos iniciales antes de proteger |
| 7. Copilot no lee sus instrucciones de la rama del PR | `copilot-instructions.md` con marca distinta en `main` y en la rama del PR | **NO CONFIRMADO**: sin revisión no hay marca que ver. La documentación dice que las lee de la rama del PR | [PR #2](https://github.com/jordin-garcia/factory-sandbox/pull/2); [code review](https://docs.github.com/en/copilot/concepts/agents/code-review) | Se aplica la salida de fallo; ya la cubre la regla de `.github/**` |
| 8. Un check obligatorio se restringe a una fuente | Proteger `main` con `checks: [{context: "factory/aprobacion", app_id: <app>}]`; publicar el check desde varias fuentes | **CONFIRMADO**: solo vale el de la aplicación. `GITHUB_TOKEN` y el dueño reciben `was not set by the expected GitHub app` | [falso, run 45556826149](https://github.com/jordin-garcia/factory-sandbox/actions/runs/45556826149); [bueno, run 45557035348](https://github.com/jordin-garcia/factory-sandbox/actions/runs/45557035348) | Se mantiene la puerta. Ojo: `gh pr checks` muestra `pass` también para el check falso |
| 9. Hay fusión automática en un repo público personal | `enablePullRequestAutoMerge` con el token de la aplicación sobre un PR bloqueado | **CONFIRMADO**: se fusiona unos 5 s después del check de la aplicación | [run 45556985875](https://github.com/jordin-garcia/factory-sandbox/actions/runs/45556985875), [PR #1](https://github.com/jordin-garcia/factory-sandbox/pull/1) | Se mantiene el diseño. No hace falta un flujo de fusión propio |
| 10. La protección se aplica a administradores | `enforce_admins: true`; el dueño prueba `gh pr merge`, `--admin`, REST y `git push` | **CONFIRMADO**: todo rechazado. Sin la opción, `--admin` sí fusiona | [PR #3](https://github.com/jordin-garcia/factory-sandbox/pull/3) | Se mantiene el diseño. Salida de emergencia: quitar `enforce_admins` por API |
| Step 4. Forma real de la salida | `stream-json` con y sin `--verbose`; `--json-schema` con `json` y con `stream-json` | **CONFIRMADO**: ver la sección siguiente | [run 45558556134 intento 2](https://github.com/jordin-garcia/factory-sandbox/actions/runs/45558556134/attempts/2); [headless](https://code.claude.com/docs/en/headless) | Fixtures `stream-ok.jsonl` y `salida-esquema.json`, reales |
| Step 5. Cómo se ve el cupo agotado | No se provocó, para no gastar cupo | **NO CONFIRMADO**. Forma real de un error de API: `is_error: true`, `terminal_reason: "api_error"`, código 1 | [run 45558556134 intento 1](https://github.com/jordin-garcia/factory-sandbox/actions/runs/45558556134/attempts/1) (fallo de login); [error-reference](https://code.claude.com/docs/en/error-reference) | `tests/fixtures/stream-limite.jsonl` es **SINTÉTICO** (ver abajo) |
| Step 6. `opus`, `sonnet` y `haiku` en Pro, modo desatendido | `--max-turns 1 --model <alias>` "Responde solo OK" | **CONFIRMADO**: `claude-opus-5-5`, `claude-sonnet-5-5` y `claude-haiku-5-5`, todos con código 0 | [run 45558556134 intento 2](https://github.com/jordin-garcia/factory-sandbox/actions/runs/45558556134/attempts/2) | Sin `--model`, el modelo depende de la cuenta: hay que pasarlo siempre |
| Step 13. Un flujo reutilizable de otro repo de la cuenta, con secretos | El sandbox llama a un flujo de `software-factory`: secretos explícitos, `inherit` y sin secretos | **CONFIRMADO**: funcionan el modo explícito y `inherit`. Sin secretos, el flujo llamado no recibe ninguno | [run 45556632031](https://github.com/jordin-garcia/factory-sandbox/actions/runs/45556632031) | Se mantiene el diseño. Cada producto debe tener sus propios secretos |
| Step 14. Qué credencial escribe en Projects de la cuenta | GraphQL con el token de la aplicación y con `FACTORY_TABLERO_TOKEN` | **CONFIRMADO**: la aplicación recibe `FORBIDDEN`; el PAT classic con solo `project` puede hacerlo todo | [run 45559049463](https://github.com/jordin-garcia/factory-sandbox/actions/runs/45559049463) | El tablero usa `FACTORY_TABLERO_TOKEN`, no el token de administración |

Recuento: 10 CONFIRMADO, 1 FALLA, 2 PARCIAL, 2 NO CONFIRMADO.

## Forma real de la salida de Claude Code (2.1.332, `claude -p`)

**Invocación.**
- **`--verbose` es obligatorio** con `--output-format stream-json`. Sin él, la CLI termina con código 1, deja stdout vacío y escribe en stderr `Error: When using --print, --output-format=stream-json requires --verbose`. No gasta cupo.
- **Hay que pasar siempre `--model`.** Sin él, esta cuenta resolvió a `claude-sonnet-5-5`, y sin login a `claude-opus-5-5`.
- **Hay que lanzar con `< /dev/null`.** Si no, `-p` espera 3 s a stdin y avisa por stderr.
- La salida es NDJSON: un objeto por línea. Si falla el arranque, el error va a stderr y en stdout solo queda el `result`.

**Eventos, en orden.**

| Evento | Qué trae |
|---|---|
| `system/init` (primera línea) | `model` (id resuelto), `apiKeySource` (`"none"` con el token de suscripción), `claude_code_version`, `permissionMode`, `sandbox_enabled`, rutas del runner (`cwd`, `memory_paths`, `messaging_socket_path`). **`tools` lista todas las herramientas aunque se pase `--allowedTools`.** `--allowedTools` solo aprueba de antemano y `dontAsk` deniega el resto |
| `assistant` | `message.model`, `message.content[]` con bloques `text`, `thinking` o `tool_use` (`{id, name, input}`), y `message.usage`. **Un turno puede llegar en varias líneas**, una por bloque |
| `user` | `message.content[]` con bloques `tool_result` (`tool_use_id`, `content`, `is_error`) |
| `system/permission_denied` | `tool_name`, `tool_use_id`, `decision_reason_type: "mode"`, `message`. Lo sigue un `tool_result` con `is_error: true` |
| `rate_limit_event` | Uno por ejecución, tras la primera respuesta de la API. `rate_limit_info.{status, resetsAt, rateLimitType, overageStatus, overageDisabledReason, isUsingOverage, unifiedWindows.{five_hour,seven_day}.{utilization, resetsAt, status}}`. `resetsAt` es un epoch en segundos; `utilization` va de 0 a 1 en centésimas |
| `result` (última línea; buscarla por `type`) | Turnos en `num_turns`; coste estimado en `total_cost_usd` y por modelo en `modelUsage.<modelo>.costUSD`; `permission_denials[] = {tool_name, tool_use_id, tool_input}`; `structured_output`; `is_error`, `subtype`, `terminal_reason`, `api_error_status`, `result` (texto) y `stop_reason` |

**Herramientas usadas.** Se cuentan los bloques `tool_use` de los mensajes `assistant`, agrupados por `name`. En `stream-ok.jsonl`: Read ×2, Edit ×3, Bash ×1 (denegada).

**`is_error` frente a `subtype`.** `subtype` no basta para saber si hubo éxito:

| Caso | `result` | Código de salida |
|---|---|---|
| Éxito | `subtype: "success"`, `is_error: false`, `terminal_reason: "completed"` | 0 |
| Error de API (login, previsiblemente también el límite) | `subtype: "success"`, `is_error: true`, `terminal_reason: "api_error"`, `num_turns: 1`, `total_cost_usd: 0`. Lo precede un `assistant` con `message.model: "<synthetic>"`, `error: "<categoría>"` e `is_api_error_message: true` | 1 |
| Fallo de arranque (p. ej. sandbox no disponible) | `subtype: "error_during_execution"`, `errors[]`, `startup_failure_reason: "sandbox_required_unavailable"`, `num_turns: 0` | 1 |

**`--json-schema`.**
- Con `--output-format json` sale un único objeto `result` con `structured_output`; el campo `result` lleva lo mismo serializado. Ejemplo en `tests/fixtures/salida-esquema.json`.
- Con `stream-json`, el modelo llama a la herramienta sintética `StructuredOutput` y el `result` final también lleva `structured_output`.
- Con `--max-turns 3` llegó a `num_turns: 4` y terminó bien: hay que dar margen de turnos a los roles con esquema.

**Sandbox.**
- Una violación de red **no** aparece en `permission_denials`. Llega como `tool_result` con `is_error: true` y un bloque `<sandbox_violations>…</sandbox_violations>` en el texto.
- Con `failIfUnavailable: true` y sin el ajuste del kernel, Claude Code no arranca y no gasta cupo.

**Cupo.** `/usage` en `-p` no muestra el uso del plan, y la CLI no tiene subcomando de uso. La única vía no interactiva para leer el cupo es `rate_limit_event`.

**Fixtures.**
- `stream-ok.jsonl`: real (sonnet, run 45558556134, intento 2). Única sustitución: la firma cifrada del bloque `thinking`, ahora `FIRMA_SANITIZADA`. Rutas del runner, `session_id` e ids sin cambios. No había correos, tokens ni ids de cuenta.
- `salida-esquema.json`: real (haiku, mismo run), sin cambios.
- `stream-limite.jsonl`: **SINTÉTICO**, porque el límite no se llegó a provocar. Cada línea lleva `"_sintetico": true`. Se construyó así:
  - `init` y `result` son copias reales: el `init` de `stream-ok` y el `result` del error de login (intento 1).
  - El `assistant` sintético copia también la forma real, con `error: "rate_limit"` en vez de `"authentication_failed"`.
  - Lo supuesto: `rate_limit_event` con `status: "rejected"` (en `rate_limit_info` y en `five_hour`) y `utilization: 1`; `api_error_status: 429`; y el texto `You've hit your 5-hour limit · resets 6:40am (UTC)`.
  - El texto documentado es otro: `You've hit your session limit · resets 3:45pm`, con variantes semanal, Opus y Sonnet. El patrón de la Tarea 9 tiene que reconocer los dos.

## Cambios al plan

Las salidas de la tabla "Qué pasa si un supuesto falla" de la spec que aplican son las de los supuestos 3 y 7. Los supuestos 1, 2, 4, 5, 6, 8, 9 y 10 no activan ninguna salida de fallo, pero sí piden ajustes.

| Origen | Tarea | Cambio |
|---|---|---|
| S3 FALLA (salida: solo revisor Claude; hueco consultivo) | 6 | En `.factory/config.json`, `revisorExterno` pasa a `"ninguno"` si la persona operadora lo confirma. `.github/copilot-instructions.md` puede quedarse: es inofensivo |
| S3 | 15 | Se implementan `revisor-externo/tipos.ts` e `indice.ts`, y `obtenerRevisorExterno('ninguno')` devuelve `null`. `copilot.ts` se aplaza; si se mantiene, debe comprobar después de pedir la revisión que existe (`requested_reviewers` o evento `review_requested`), porque `gh` termina con 0 aunque no pase nada. Con `ninguno`, `revisar-externo` no se ejecuta y la revisión dice "sin revisor externo" |
| S3 | 20 | `docs/operacion.md` explica que el hueco está vacío y cómo conectar otro revisor |
| S7 (salida: instrucciones de Copilot como archivo sensible) | 5 | Ya cubierto: `.github/**` está en `RUTAS_SIEMPRE_SENSIBLES` y en `RUTAS_PROHIBIDAS_AL_AGENTE`. Opcional: un test explícito con `.github/copilot-instructions.md` y `.github/instructions/x.instructions.md` |
| S5 PARCIAL | 12 | Los trabajos de agente (`implementar-agente`, y luego los de las tareas 13 y 15) ejecutan `sudo apt-get install -y bubblewrap socat` y `sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0` antes de `claude`. `ejecutar-rol.ts` activa el sandbox con `enabled: true`, `failIfUnavailable: true`, `allowUnsandboxedCommands: false`, `autoAllowBashIfSandboxed: false` y `network.allowedDomains` |
| S5 | 9 | `clasificarSalida`: `startup_failure_reason: "sandbox_required_unavailable"` es `fallo` (de infraestructura), no `en-pausa`. Si se quieren contar las violaciones del sandbox, salen de `<sandbox_violations>` en los `tool_result`, no de `permission_denials` |
| Step 4 y Step 5 | 9 | Los tests se ajustan a los fixtures, como ya dice la tarea. `extraerResultado` busca el `result` por `type` y lee `num_turns`, `total_cost_usd`, `permission_denials[].tool_name`, `is_error`, `result` y `structured_output`. `contarHerramientas` cuenta bloques `tool_use`, no líneas. `clasificarSalida` usa `is_error` y `terminal_reason`, nunca `subtype`. El límite se reconoce por el texto (`hit your .*limit` cubre "5-hour" y "session") o por un `rate_limit_event` con `status: "rejected"`. **El patrón no se aplica a las líneas crudas del stream**: `rate_limit` aparece en todas las ejecuciones (`"type":"rate_limit_event"`) y daría falsos `en-pausa`. `error: "authentication_failed"` es `fallo` y hay que avisar a la persona operadora |
| Step 4 y Step 6 | 12 | `VERSION_CLAUDE_CODE = '2.1.332'`. `construirArgsClaude` incluye siempre `--verbose` y `--model`; `ejecutar-rol.ts` lanza `claude` con stdin cerrado (`< /dev/null`). Los roles con `--json-schema` necesitan margen en `--max-turns`. `--allowedTools` no oculta herramientas: la protección real es `dontAsk`; `--tools` o `--disallowedTools` no se probaron. Los modelos de `.factory/config.json` (`opus`, `sonnet`, `opus`) están disponibles |
| S2 (cupo) | 9 y 19 | Propuesta: guardar `unifiedWindows.five_hour.utilization` y `seven_day.utilization` del `rate_limit_event` en `datos` del resumen, y sacarlo en las métricas, para medir el coste real por rol. Decide la persona operadora |
| S2 | 11 o 12 | Propuesta, solo si la persona operadora la acepta: no lanzar un rol cuando la última utilización conocida supera un umbral |
| S4 | 12 | Ya está en el plan, pero es obligatorio: `publicar-pr.ts` crea ramas, commits y PR con el token de la aplicación, nunca con `GITHUB_TOKEN`; si no, `ci` queda en `action_required` |
| S6 | 7 | `crear-proyecto.ts` debe incluir `.factory/aprobadoras.txt` con el usuario en el commit inicial, antes de proteger `main`. En el orden actual del Step 6 se escribe después y daría 409. La protección se aplica al final. `proteccionRama` usa `checks[].app_id`, no `contexts`; la API la acepta aunque la aplicación no haya publicado aún ningún check. Opcional: atar los checks de `ci` al id de GitHub Actions (15368) |
| S8 (`gh pr checks` engaña) | 16 | `scripts/cli/puerta.ts` no puede fiarse del estado agregado (`gh pr checks`, `statusCheckRollup`). Lee los check runs del último commit por API y acepta cada check obligatorio solo de su fuente: `app.id` de la aplicación para `factory/*` y GitHub Actions para los de `ci`. `factory/aprobacion` se publica como check run |
| S8 | 17 | `post-merge.ts` lee el estado de `ci` y `desplegar` de los runs del flujo, no del resumen agregado de checks |
| `create-github-app-token` v3.4.0 marca `app-id` como obsoleto | 6, 7 y 12 | Se usa `client-id`: hay una variable nueva, `FACTORY_APP_CLIENT_ID` (no secreta). La crea la persona operadora y se documenta en `docs/identidades.md`. `factory.yml` (Tarea 6) la pasa al despachador, `crear-proyecto.ts` (Tarea 7) la copia a cada producto y `despachador.yml` (Tarea 12) la usa en todos los trabajos de publicación |
| Step 13 | 6 y 7 | Se mantiene pasar los secretos por nombre. El flujo llamado no ve los secretos de la factory, así que cada producto necesita los suyos (ya los copia la Tarea 7). Recomendación: fijar el despachador por SHA en vez de `@main`; decide la persona operadora |
| Step 14 (ruling de la Tarea 2) | 8 | `tablero.ts` y `tablero.yml` usan `FACTORY_TABLERO_TOKEN`, no `FACTORY_ADMIN_TOKEN`. No se verifica con una relectura inmediata: la lectura llega con retraso, unos minutos. Los proyectos creados por API son privados. La línea "Decisiones de este plan" sobre el tablero queda superada |
| S10 | 20 | `docs/operacion.md` documenta la salida de emergencia (desactivar `enforce_admins` por API y fusionar con `--admin`) y que esa credencial nunca llega a un agente |

No cambian: tareas 4, 10, 13 (salvo el paso de sandbox en su trabajo de agente), 14 y 18. Opcional en la 18: reanudar con `resetsAt` en vez de esperar a la siguiente reconciliación.

## Decisiones para la persona operadora

1. **Términos de uso (supuesto 1): zona gris.** La [página legal de Claude Code](https://code.claude.com/docs/en/legal-and-compliance) dice que el login con suscripción está "designed to support ordinary use of Claude Code and other native Anthropic applications".
   - Lectura permisiva: la documentación oficial ofrece `claude setup-token` para CI y scripts, y una acción oficial de GitHub que lo usa con Pro. Es el binario sin modificar, con la suscripción propia y para uso propio, no un producto para terceros.
   - Lectura restrictiva: los límites anunciados suponen un uso ordinario e individual. Los [términos de consumidor](https://www.anthropic.com/legal/consumer-terms) prohíben el acceso automatizado salvo con clave de API o permiso explícito, y no nombran `setup-token`. Una factory 24/7 podría no ser "uso ordinario".
   - Opciones: seguir con un ritmo moderado (`FACTORY_HORARIO`); preguntar a soporte de Anthropic; o pasar a clave de API con tope mensual, lo que cambia la restricción global "No se usa clave de API".
2. **Cupo.** Antes de los experimentos, el uso interactivo ya había consumido el 13 % de la ventana de 5 h y el 22 % de la semanal. Todo el lote movió menos de un punto. Hay una sola muestra con resolución del 1 %, así que la estimación de 2 a 10 tareas reales por ventana de 5 h es de **fiabilidad baja**. El límite probable es el semanal, compartido con el uso interactivo. Esta cuenta no tiene pago por exceso (`overageStatus: "rejected"`, `out_of_credits`). Hay que decidir si se acepta medir con las primeras tareas reales y si se quiere un umbral de parada.
3. **Copilot.** La petición se acepta y se ignora. Para confirmarlo, mira en github.com → Settings → Copilot si aparece "Code review". No se hicieron más peticiones para no gastar créditos.
4. **Hueco del revisor externo.** Se puede dejarlo vacío en la versión 1 (`revisorExterno: "ninguno"`; es la salida de la spec) o conectar otro modelo. Otro proveedor necesita su propia clave, y una segunda pasada de Claude con otro modelo gasta el mismo cupo. Recomendación: dejarlo vacío.
5. **Credenciales pendientes.**
   - Crear la variable `FACTORY_APP_CLIENT_ID`.
   - Confirmar en la configuración de `FACTORY_ADMIN_TOKEN` su fecha de caducidad. La API no devolvió la cabecera de caducidad, lo que sugiere que no caduca; es una inferencia.
6. **Sandbox.** Se probó el `sysctl` global. El perfil AppArmor para `/usr/bin/bwrap`, que la documentación recomienda, no se probó. En un runner efímero, el `sysctl` parece aceptable.
7. **Versión fijada.** `2.1.332` es `latest`; `stable` era `2.1.326`. Hay que decidir si se fija la versión probada o la estable.

## Respuestas de la persona operadora (2026-11-26)

Donde esta sección y "Cambios al plan" se contradicen, vale esta sección.

| # | Decisión | Respuesta | Tareas que cambian |
|---|---|---|---|
| 1 | Términos de uso | Se sigue con el token de suscripción, **sin restricción de horario**, para medir hasta dónde alcanza. `FACTORY_HORARIO` se queda en `00-24`. La persona operadora asume el riesgo de la zona gris | Ninguna |
| 2 | Cupo | **Propuesta A aceptada**: se guarda la utilización del cupo en cada resumen y se muestra en las métricas. **Propuesta B rechazada**: no hay umbral de parada | 9 y 19 (ver abajo) |
| 3 | Copilot | En la configuración de Copilot de la cuenta no aparece "Code review". Se podría confirmar con la API (ver abajo). Ya no bloquea nada, por la respuesta 4 | Ninguna |
| 4 | Revisor externo | **Vacío por ahora**: `revisorExterno: "ninguno"`. Se valoró una segunda pasada de Claude con otro modelo y se descartó | 6, 15 y 20 (ver abajo) |
| 5 | Credenciales | Client ID de la aplicación recibido; se guarda como variable `FACTORY_APP_CLIENT_ID`. `FACTORY_ADMIN_TOKEN` **no caduca**, por decisión de la persona operadora | 6, 7 y 12 (ya previsto); `docs/identidades.md` |
| 6 | Sandbox | **Perfil de AppArmor para `/usr/bin/bwrap`**, no el `sysctl` global | 12 (ver abajo) |
| 7 | Versión de Claude Code | **Versión fija, con actualización semanal**: se parte de `2.1.332`. Un flujo semanal prueba la última versión y, si pasa, abre un PR para subirla. No se instala `latest` sin fijar | 12 (ver abajo) |
| 8 | Despachador | **Fijado por SHA**, no `@main` | 6, 7 y 20 (ver abajo) |
| 9 | Restos de experimentos | Se borran siempre en cuanto dejan de hacer falta. La lista se confirma antes de borrar, porque no se puede deshacer. Regla añadida a `AGENTS.md` | Ninguna |

**Cambios en las tareas.**

- **Tarea 6.** En el `.factory/config.json` de la plantilla, `"revisorExterno": "ninguno"`; `modelos` no cambia. En `factory.yml`, el `uses:` apunta a `despachador.yml@__SHA_FACTORY__`, y ese mismo SHA se pasa como entrada `version_factory`. `tests/flujos.test.ts` ya no admite excepciones: todo `uses:` es un hash de 40 caracteres o una ruta local. `.github/copilot-instructions.md` sale de la lista de archivos.
- **Tarea 7.** `crear-proyecto.ts` sustituye `__SHA_FACTORY__` por el commit de la factory que ejecuta el flujo (`GITHUB_SHA` de `nuevo-proyecto.yml`). Paso nuevo: `scripts/cli/actualizar-despachador.ts` y el flujo `actualizar-despachador.yml` (solo `workflow_dispatch`, entrada `sha`, usa `FACTORY_ADMIN_TOKEN`, porque la aplicación no tiene Workflows). Para cada proyecto de `proyectos.json`, abre un PR que cambia el SHA de `factory.yml`. Ese PR toca `.github/**`, así que es de riesgo alto y lo aprueba una persona. La lógica de sustitución va en `scripts/lib/proyecto.ts` con su test. Además, tras la Tarea 6:
  - `renderizarPlantilla` ya existe en `scripts/lib/plantilla.ts`, con sus tests. `proyecto.ts` la importa, no la repite, y `crear-proyecto.ts` reutiliza la copia de `scripts/cli/copiar-plantilla.ts`.
  - Hace falta `validarDescripcion`, porque la descripción se sustituye tal cual dentro de `package.json`, `AGENTS.md` y `README.md`. Rechaza comillas, barras invertidas, `<`, `>`, `{`, `}`, acentos graves y saltos de línea, y más de 200 caracteres.
  - `ClienteGitHub` rellena `ArchivoCambiado.rutaAnterior` con el `previous_filename` de la API de archivos del PR (Tarea 5).
- **Tarea 9.** `extraerResultado`, o una función nueva `extraerCupo`, lee el `rate_limit_event`: `rate_limit_info.unifiedWindows.five_hour.utilization` y `seven_day.utilization`, valores de 0 a 1, más sus `resetsAt`. `construirResumen` los guarda en `datos.cupo = { cincoHoras, sieteDias, reiniciaCincoHoras, reiniciaSieteDias }`, o `null` si no hay evento. Ojo: el evento llega **al principio** de la ejecución, así que mide el cupo de antes de ese rol, no lo que gastó. Test nuevo con `stream-ok.jsonl`: `cincoHoras` es `0.13` y `sieteDias` es `0.22`.
- **Tarea 12.** Paso previo al Step 6, en una rama temporal de la factory (`experimento/apparmor`), que ya tiene `CLAUDE_CODE_OAUTH_TOKEN`; la rama y sus runs se borran al terminar. Consiste en probar el perfil de AppArmor para `bwrap` que recomienda la documentación de [sandboxing](https://code.claude.com/docs/en/sandboxing), sin el `sysctl`, y comprobar otra vez que `example.com` falla y `api.github.com` pasa. Si funciona, los trabajos de agente instalan ese perfil (`apparmor_parser -r`) en lugar del `sysctl`. Si no funciona, se para y se consulta. El despachador clona la factory en `.factory-src` en el SHA de `inputs.version_factory`, no en `main`. Si no, fijar el flujo no fija los scripts.
- **Tarea 12, actualización semanal de Claude Code.** Archivos: `scripts/lib/version.ts`, con `decidirActualizacion(actual, ultima)` y su test (compara versiones semánticas y solo propone subir); `scripts/cli/probar-version.ts`; y el flujo `.github/workflows/actualizar-claude-code.yml`, con `schedule` semanal y `workflow_dispatch`. El flujo tiene dos trabajos:
  1. `probar`: `contents: read` y sin token de escritura. Lee `latest` con `npm view @anthropic-ai/claude-code dist-tags.latest`. Si no es más nueva que `VERSION_CLAUDE_CODE`, termina. Si lo es, instala esa versión, ejecuta `npm test` y lanza una prueba mínima con el sandbox: `claude -p "Responde solo OK" --max-turns 1 --model haiku --output-format stream-json --verbose < /dev/null`. Comprueba con `leerStream`, `extraerResultado`, `clasificarSalida` y la lectura del cupo que el resultado es `termino` y que hay `rate_limit_event`. No imprime la salida.
  2. `proponer`: usa el token de la aplicación. Si `probar` pasó, abre o actualiza el PR `factory/claude-code-<versión>`, que solo cambia `VERSION_CLAUDE_CODE`; lo fusiona una persona. Si falló, abre un issue con el paso que falló, nunca con la salida.

  Los productos reciben la versión nueva cuando se actualiza el SHA del despachador (Tarea 7).
- **Tarea 15.** Se implementan `revisor-externo/tipos.ts` e `indice.ts`, y `obtenerRevisorExterno('ninguno')` devuelve `null`. `copilot.ts` se aplaza. Con `ninguno`, `revisar-externo` no se ejecuta y la revisión dice "sin revisor externo". El hueco queda listo para conectar después Copilot, otro proveedor o una segunda pasada de Claude.
- **Tarea 19.** `Metricas` añade `cupo: { ultimoCincoHoras: number | null; ultimoSieteDias: number | null; ejecucionesPorRol: Record<string, number> }`, sacado de `datos.cupo` de la última entrada y del recuento por rol. Una estimación del gasto por rol, a partir de la diferencia entre ejecuciones seguidas de la misma ventana, solo se añade si los datos lo permiten, porque el uso interactivo la contamina.
- **Tarea 20.** `docs/operacion.md` explica cómo actualizar el SHA del despachador en todos los productos, cómo aceptar el PR semanal de Claude Code y cómo conectar un revisor externo al hueco vacío.

**Cómo confirmar Copilot (decisión 3).** Desde octubre de 2026 hay un endpoint propio: `POST /repos/{owner}/{repo}/pulls/{pull_number}/copilot-code-review` ([REST](https://docs.github.com/en/rest/pulls/copilot-code-review), [changelog](https://github.blog/changelog/2026-10-02-copilot-code-review-api-support-and-new-default-effort-level/)). A diferencia de `gh pr edit --add-reviewer`, no termina en silencio: devuelve 201 si la revisión arranca, o 422 con un `failure_reason` si la cuenta o el repo no pueden usarla, por ejemplo "no quota remaining". La documentación pública no aclara si el plan Student la incluye: la [tabla de planes](https://docs.github.com/en/copilot/get-started/plans) lista el plan Student, pero la [configuración](https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/configure-code-review) solo nombra Pro, Pro+ y Max. Que no aparezca "Code review" en tu configuración apunta a que no la tienes. Para confirmarlo hace falta un PR abierto. Si devuelve 201, la revisión gasta créditos de IA: entre unos 0,25 y 1,50 USD según el nivel de esfuerzo.

## Restos de los experimentos

Estado tras la limpieza del 2026-11-26:

| Resto | Estado |
|---|---|
| Repo `jordin-garcia/factory-desechable-45559055197`: público, con protección, `PRUEBA_SECRETO`, `PRUEBA_VARIABLE` y la rama `prueba-flujo` | Borrado por la persona operadora |
| Proyecto `users/jordin-garcia/projects/3` "factory-prueba-tablero" | Borrado |
| Issue #4 de `factory-sandbox`, creado por la aplicación | Borrado |
| Secretos (`CLAUDE_CODE_OAUTH_TOKEN`, `FACTORY_ADMIN_TOKEN`, `FACTORY_TABLERO_TOKEN`, `FACTORY_APP_PRIVATE_KEY`) y variables (`FACTORY_APP_ID`, `FACTORY_APP_LOGIN`) de `factory-sandbox` | Borrados. Los experimentos que quedan se hacen en ramas temporales de la factory |
| Runs 45556593829 y 45556596244 de `ci` de `software-factory` (rama `experimento/reutilizable`, ya borrada) | Borrados |
| Repo [`jordin-garcia/factory-sandbox`](https://github.com/jordin-garcia/factory-sandbox): flujos de experimento en `main`, ramas `experimento/paso7-app`, `paso9-admins` y `paso11-copilot`, PR #1 a #3 y los logs de sus runs | Se conserva sin secretos: sus runs y PR son la evidencia enlazada en este documento. Borrarlo rompería esos enlaces |

Ya estaban limpios: los artefactos, las ramas `experimento/b2-*`, la rama `experimento/reutilizable` de la factory, la protección y `allow_auto_merge` del sandbox.
