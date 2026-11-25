# 07 · Implicaciones para el plan de implementación

**Todo este documento es inferencia propia [I].** Traduce los hallazgos a consecuencias para el plan. No es el plan y ninguna fuente propone esta estructura tal cual. Cada punto remite a la evidencia que lo sostiene para que pueda revisarse. Las marcas se explican en el [README](README.md).

## Qué cambió tras la segunda verificación

La segunda pasada no tumbó ninguna conclusión central, pero sí movió el peso de varias:

- **La "dark factory" pierde apoyo.** El caso de Spotify estaba exagerado, la lista de grandes empresas de Factory no se pudo corroborar y el fracaso de HumanLayer quedó confirmado por su protagonista. Quedan un caso positivo (StrongDM, tres ingenieros) y uno negativo.
- **El costo en tokens es bajo y el dato es frágil.** Los ~11 USD por historia son un suelo a precio de lista, sin especificaciones ni tiempo humano, de un solo autor.
- **La carga de revisión está mejor documentada.** Los datos de Faros se confirmaron en su origen.
- **Varias cifras de seguridad eran más débiles de lo citado**, pero las recomendaciones de aislamiento se sostienen.

## Principios que se desprenden de la evidencia

| # | Principio | Evidencia |
|---|---|---|
| 1 | La autonomía se gana por clase de cambio, no se declara para todo el sistema | Hallazgo 2 [V]; Qodo y Osmani [C] |
| 2 | Primero la verificación, después la generación. La autonomía concedida no debe superar la capacidad de verificar | Osmani [C]; hallazgos 8 y 9 [V] |
| 3 | Quien verifica no es quien escribe | Hallazgo 8 [V]; O'Reilly y Qodo [C] |
| 4 | Agentes estrechos, con disparador, traspaso y condición de terminación explícitos | Hallazgos 3 y 8 [V]; 12-Factor Agents [C] |
| 5 | La especificación y la planificación merecen la mayor parte del tiempo humano | Hallazgo 6 [V, confianza baja]; Horthy [C] |
| 6 | Alguien sigue leyendo el código, al menos en incrementos pequeños, hasta que haya evidencia propia de que no hace falta | Horthy [C]; estudio de deuda técnica [C] |
| 7 | La seguridad se impone con aislamiento, no con instrucciones ni aprobaciones | Hallazgo 10 [V]; caso Replit [C] |
| 8 | Instrumentar todo desde el primer día, incluido el costo, y auditar el propio medidor | Hallazgo 4 [V, confianza baja]; O'Reilly [C] |
| 9 | Las reglas importantes se convierten en comprobaciones mecánicas | OpenAI y Böckeler [C] |
| 10 | Elegir modelo y agente con evaluaciones propias, no con puntajes públicos | Hallazgo 9 [V] más inferencia |
| 11 | Tareas reanudables con identificador estable y criterio de aceptación explícito | Vercel [C] |
| 12 | Diseñar el repositorio desde el inicio para que sea fácil de equipar con un arnés | Böckeler [C] |

## Curva de madurez sugerida

Propuesta para ordenar el plan. Cada nivel se abandona solo cuando sus métricas lo justifican.

| Nivel | Qué hace la factory | Qué hace la persona | Condición para subir |
|---|---|---|---|
| 0 · Cimientos | Nada autónomo todavía. Se montan el repositorio, el arnés, la integración continua, los sandboxes y la instrumentación | Todo | Un agente puede completar una tarea pequeña de principio a fin dentro del sandbox y pasar los checks |
| 1 · Automatizaciones estrechas | Tareas acotadas y de bajo riesgo: clasificar issues, corregir CI, limpieza, actualizar documentación | Revisa y fusiona cada PR | Tasa de aceptación alta y estable en esas tareas |
| 2 · Factory con merge humano | Pipeline completo de la spec al PR: planificar, implementar, verificar, revisar | Escribe specs, aprueba planes y fusiona | El revisor independiente y los checks detectan lo que las personas detectan |
| 3 · Auto-merge por clase de cambio | Fusión automática donde la verificación es barata y el radio de impacto es pequeño. Verificación post-merge y reversión automática | Specs, cambios de alto impacto, escalamientos, lectura periódica del código | Defectos escapados y reversiones por debajo del umbral acordado en cada clase |
| 4 · Operación en bucle cerrado | Los incidentes y las señales de producción generan trabajo que la factory resuelve y despliega | Intención de producto, arquitectura, auditoría de la factory | Sin evidencia pública suficiente de que este nivel sea sostenible; el único intento documentado en detalle acabó en reescritura |

Fundamento: el espectro de Factory [V], el arranque de Vercel con clasificación de issues [V], el criterio de Osmani y Qodo para automatizar por completo [C] y el fracaso de HumanLayer sin revisión humana [C].

## Componentes que el plan debe decidir

1. **Entrada de trabajo.** Dónde vive el estado (gestor de issues), formato de la especificación y quién la aprueba.
2. **Orquestación.** Disparadores por evento y por horario, cola de trabajo, identificadores estables por tarea, reintentos y reanudación.
3. **Entorno de ejecución.** Tipo de aislamiento, política de red, inyección de secretos y ciclo de vida de los sandboxes.
4. **Arnés del repositorio.** Archivo de entrada corto que funciona como mapa hacia una base de conocimiento versionada; documentos de arquitectura, convenciones, calidad y diseño; linters y tests estructurales propios; pocas skills centrales.
5. **Catálogo de agentes.** Roles, disparador, entradas, salidas, condición de terminación y permisos de cada uno. Como referencia, los nombrados por Ona: constructor de funcionalidad, revisor de PR, verificador post-merge, respondedor de incidentes, mejorador de producto y auditor de automatizaciones.
6. **Verificación.** Capas deterministas, revisor independiente, puertas de cobertura, análisis estático antes y después, verificación post-merge y criterio de aceptación explícito por flujo.
7. **Entrega.** Despliegue, entornos de prueba, reversión y política de auto-merge por clase de cambio.
8. **Observación.** Monitoreo, conversión de incidentes en issues, correlación de incidentes con el PR causante e interfaz para que las personas supervisen.
9. **Modelos.** Enrutamiento por tipo de tarea, evaluaciones propias y revisión periódica.
10. **Gobierno.** Rastro de auditoría, presupuesto, alertas de gasto y reglas de escalamiento.
11. **Mantenimiento.** Tareas de limpieza programadas y mejora continua del arnés cuando un problema se repite.

## Métricas a instrumentar desde el inicio

| Métrica | Para qué | Fuente de la idea |
|---|---|---|
| Costo por cambio aceptado o por PR fusionado | Unidad económica real | Sonar, Warp [C] |
| Tasa de intervención humana por clase de cambio | Decidir dónde ampliar autonomía | Warp [C], Ona [V] |
| Porcentaje de tareas limpias al primer intento | Calidad de specs y planes | O'Reilly [C] |
| Defectos escapados y reversiones tras el merge | Fiabilidad de la verificación | Sonar, Warp [C] |
| Problemas de análisis estático introducidos y corregidos por commit | Deuda técnica neta | arXiv 2603.28592 [C] |
| Tiempo de issue a cierre y de PR a merge | Caudal | Ona [V] |
| Tiempo humano en revisión y PR fusionados sin revisión | Detectar el cuello de botella | Faros [C] |
| Tokens por tarea, proporción de caché y retrabajo | Control de costo | O'Reilly, Uber [C] |

El propio registro de costos debe auditarse: en el caso publicado dejaba fuera una sexta parte del consumo real [C].

## Órdenes de magnitud para presupuestar

Contrastados con sus fuentes [C], pero autodeclarados y sin réplica. Solo orientan.

- **Tokens por historia entregada:** del orden de 11 USD a precio de lista en una fábrica de un solo autor, como suelo. Sin contar la redacción de especificaciones, el tiempo humano ni el enrutamiento de modelos, que estaba desactivado.
- **Operación intensiva sin escribir código:** entre 1,000 y 3,000 USD diarios en tokens por ingeniero en los casos más agresivos, según estimaciones de terceros sobre un caso y una regla provocadora de otro.
- **Peso de los tokens:** en el ejemplo ilustrativo de Sonar son menos del 10% del costo por cambio aceptado; el resto es revisión, retrabajo y defectos.
- **Tiempo humano al arrancar:** jornadas completas durante los primeros días para construir la factory, que bajan a unas pocas horas diarias una vez estable [V, confianza baja].

## Preguntas abiertas

Quedaron sin respuesta y conviene resolverlas antes o durante el plan.

1. **Costo total.** Cuánto cuesta operar la factory por PR fusionado o por funcionalidad, sumando tokens, sandboxes, colas y horas humanas, y cómo se compara con un equipo tradicional.
2. **Pila tecnológica.** El [documento 09](09-herramientas.md) compara las opciones y propone tres puntos de partida, pero la elección depende de decisiones aún abiertas y ninguna herramienta se probó.
3. **Criterios de auto-merge y despliegue autónomo.** Qué umbrales medibles permiten concederlos por tipo de cambio y cómo se sostienen con usuarios reales, código legado y regresiones.
4. **Verificación de falsos positivos y de lo visual.** Cómo detectar cambios incorrectos que pasan los tests y defectos de diseño o experiencia de usuario.
5. **Mantenibilidad a largo plazo.** Cómo evitar el deterioro que hundió el único intento documentado de operar sin leer el código.

## Decisiones que dependen de ustedes

La investigación no puede resolverlas y condicionan el plan:

- Qué tipo de software producirá la factory y para quién (productos propios, proyectos de clientes, mantenimiento).
- Si parte de cero o debe trabajar sobre código existente.
- Presupuesto mensual y tolerancia al gasto variable.
- Dónde debe ejecutarse (nube, infraestructura propia) y con qué restricciones de datos.
- Cuántas personas la operarán y con qué dedicación.
- Qué nivel de riesgo se acepta en producción y qué cambios nunca deben fusionarse sin una persona.

## Qué aporta la comparación de herramientas

Detalle en los documentos [09](09-herramientas.md) y [10](10-claude-code-como-base.md). Consecuencias para el plan:

- **El nivel 0 y el nivel 1 de la curva de madurez se pueden montar con lo que el equipo ya tiene**: GitHub, Claude Code y checks de código abierto. No hace falta contratar una plataforma para empezar.
- **Los agentes desatendidos no deben correr en las máquinas Windows del equipo.** El sandbox no funciona en Windows nativo. Hay que elegir entre la nube del proveedor, runners de Actions, un sandbox gestionado o un servidor Linux con KVM.
- **El auto-merge del nivel 3 hay que construirlo.** Requiere un clasificador determinista del diff, reglas de rama y checks obligatorios; ninguna herramienta lo da hecho con garantías.
- **Los diffs deben ser pequeños por diseño.** Es la condición para que la revisión, humana o por IA, detecte algo.
- **Suscripción o clave de API es una decisión de presupuesto pendiente.** Los términos orientan la automatización compartida hacia la clave de API, y el único dato de costo por historia disponible se pagó con suscripción plana.
- **Conviene un segundo proveedor de modelos para la revisión.**
- **La pila tecnológica del producto condiciona varias elecciones** (despliegue, ramas de base de datos, pruebas de mutación), y todavía no está decidida.

## Investigación adicional recomendada

- Probar en un piloto las dos o tres herramientas candidatas por componente. La comparación del documento 09 es de catálogo, no de uso.
- Buscar casos documentados de despliegue y operación autónoma en producción.
- Revalidar las cifras de capacidad con mediciones posteriores a enero de 2026.
- Medir en un piloto propio los costos y las tasas de intervención, que es la única forma de sustituir los datos autodeclarados.
