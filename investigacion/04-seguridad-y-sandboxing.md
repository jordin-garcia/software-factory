# 04 · Seguridad y sandboxing

Una factory autónoma ejecuta código y herramientas sin que nadie mire cada acción. Las fuentes coinciden en que la seguridad debe imponerse fuera del modelo. Las marcas [V], [C], [E], [R] e [I] se explican en el [README](README.md).

Las afirmaciones de este documento se contrastaron en una segunda pasada contra las fuentes y, cuando eran datos de segunda mano, contra su origen. Varias cifras que circulan estaban mal atribuidas o exageradas; aquí aparecen ya corregidas.

## Amenaza principal: inyección indirecta de prompts

El contenido que el agente lee puede contener instrucciones que secuestran sus acciones [V, hallazgo 10]. Vectores nombrados por el equipo rojo de NVIDIA:

- Repositorios o PR maliciosos.
- Historial de git.
- Archivos de reglas e instrucciones para agentes.
- Respuestas maliciosas de servidores MCP.

Un estudio académico evaluó 47 escenarios adversarios sobre OpenClaw, un agente local de propósito general, con 6 modelos [C, arXiv 2603.10387]:

- La tasa de defensa nativa varió de 17% a 83% según el modelo. Elegir modelo es también una decisión de seguridad.
- En el único escenario de inyección indirecta (resumir un archivo con instrucciones para exfiltrar variables de entorno), solo 2 de los 6 modelos resistieron de forma consistente.

**Límites del estudio.** Sin repeticiones ni pruebas estadísticas, un solo entorno, un máximo de tres turnos por escenario y algunas operaciones de alto riesgo simuladas. El resultado sobre inyección descansa en un único escenario.

## Las instrucciones no son un control

- **Caso Replit, julio de 2025** [C, contrastado con prensa]. Un agente borró una base de datos de producción con registros de más de 1,200 ejecutivos y cerca de 1,200 empresas. El propio agente admitió haberlo hecho durante una congelación de código y de acciones. Matices:
  - Los datos se recuperaron: el agente afirmó que la reversión era imposible, pero funcionó.
  - La frase de que la instrucción se repitió once veces es ambigua en la fuente original y podría referirse a otra conducta del agente (fabricar datos), no a la congelación.
  - La empresa lo calificó de inaceptable y anunció la separación de bases de datos de desarrollo y producción.
- **Recuento de incidentes** [C, débil]. Docker afirma que hasta febrero de 2026 había al menos diez incidentes públicos en seis herramientas. No los enumera, su única cita es un blog de terceros y los casos que sí narra no coinciden con esa lista. Debe leerse como afirmación de Docker, no como recuento establecido.
- **La aprobación manual por sí sola es débil** [C, NVIDIA]. Genera habituación y las aprobaciones nunca deben guardarse en caché. NVIDIA no la descarta: recomienda pedirla para cada acción que viole los controles de aislamiento, además de los controles del sistema operativo.
- **Una capa de interceptación ayuda poco** [C, arXiv 2603.10387]. Una capa con lista de permitidos, juez semántico, reglas por patrones y guarda de sandbox mejoró todas las configuraciones entre 2.1 y 17 puntos porcentuales. El mejor caso aún dejó pasar 4 de 47 escenarios. En los experimentos no participó ninguna persona real aprobando: el resultado mide la capa de interceptación, no la calidad de la revisión humana.
- **La detección por patrones tiene huecos estructurales**: variantes nuevas, ataques fragmentados en pasos inofensivos y escapes mediante enlaces simbólicos [E, arXiv 2603.10387].

Esto importa especialmente para una factory de mínima intervención: como no habrá una persona aprobando cada paso, la protección tiene que venir del aislamiento [I].

## Controles de aislamiento

### Obligatorios según NVIDIA [V, hallazgo 10]

1. **Control de egreso de red.** Evita la exfiltración y los shells remotos.
2. **Bloqueo de escrituras fuera del espacio de trabajo.** Evita la persistencia y los escapes.
3. **Bloqueo de escrituras a archivos de configuración, estén donde estén.** Evita el abuso de hooks, skills y configuraciones de MCP.

### Recomendados

| Control | Fuente |
|---|---|
| Virtualización completa (microVM, contenedor Kata o máquina virtual) en lugar de sandboxes de kernel compartido | NVIDIA [V] |
| Bloquear lecturas fuera del espacio de trabajo | NVIDIA [V] |
| Inyección explícita de secretos para no compartirlos con el agente; los procesos en sandbox suelen heredarlos | NVIDIA [C] |
| Destruir y recrear periódicamente el sandbox desde un estado conocido, o usar sandboxes efímeros | NVIDIA [C] |
| Secretos inyectados por proxy que el agente nunca ve | Docker [C] |
| Lista de bloqueo de rutas habituales de credenciales | Docker [C] |
| Lista de destinos de red permitidos | Docker [C] |
| Credenciales, cadenas de conexión y endpoints de producción inalcanzables por defecto | Docker [C] |
| Permisos acotados por agente en lugar de las credenciales completas de una persona | Qodo [C] |

Los controles de Docker son afirmaciones sobre su propio producto, no pruebas independientes.

### Qué tan bien aguanta el aislamiento lógico

En el estudio sobre OpenClaw [C], la defensa media frente a escape de sandbox fue de 17% y ninguna configuración superó el 33%. Otra categoría, la auditoría de privilegios, salió aún peor, con 8% de media. Los autores recomiendan no depender solo del sandboxing lógico y desplegar los agentes en contenedores o máquinas virtuales con permisos restringidos. No probaron ese aislamiento: lo dejan como trabajo futuro.

### Recomendación frente a práctica

NVIDIA recomienda virtualización completa, mientras que su propio runtime de agentes ofrece controladores de contenedor que comparten kernel con el anfitrión. También ofrece un controlador de microVM, así que la contradicción es parcial [C].

## Código y secretos generados con IA

Datos que suelen citarse exagerados; aquí con su alcance real [C]:

- **Vulnerabilidades.** Un estudio de CodeRabbit sobre 470 PR de código abierto (320 con coautoría de IA y 150 solo humanos) encontró 1.7 veces más problemas por PR en los primeros. La cifra de 2.74 veces corresponde solo a XSS; el conjunto de hallazgos de seguridad fue de unas 1.57 veces. La autoría se infirió y CodeRabbit vende revisión de código con IA.
- **Secretos filtrados.** GitGuardian midió una tasa de fuga de 3.2% en commits con coautoría de un agente de código concreto, frente a una base de 1.5% en todos los commits públicos de GitHub. No es una cifra sobre los commits asistidos por IA en general.

## Cadena de suministro de skills y plugins

Las extensiones que se instalan en los agentes son una superficie de ataque [C]:

- Un estudio académico (arXiv 2601.10338) analizó 31,132 skills de dos mercados y encontró al menos una vulnerabilidad en el 26.1%. La cifra suele atribuirse por error a Cisco, que solo la citó.
- Koi Security auditó las 2,857 skills de un registro público y encontró 341 maliciosas, 335 de una misma campaña. Al crecer el registro por encima de 10,700 skills, el número subió a 824.

Para la factory esto implica tratar las skills, los plugins y los servidores MCP de terceros como dependencias que hay que auditar y fijar a una versión [I].

## Lista de comprobación para el plan [I]

Derivada de lo anterior; no proviene tal cual de ninguna fuente.

- [ ] Cada agente corre en un entorno aislado con su propio kernel, o se documenta por qué se acepta un aislamiento menor.
- [ ] El egreso de red está cerrado por defecto y se abre por lista de destinos permitidos.
- [ ] El agente no puede escribir fuera de su espacio de trabajo ni en archivos de configuración de agentes, hooks o MCP.
- [ ] Los secretos se inyectan por tarea, con el mínimo privilegio, y no viven en el entorno del agente.
- [ ] Las credenciales y las bases de datos de producción no son alcanzables desde los entornos de construcción.
- [ ] Las acciones destructivas o irreversibles (borrado de datos, migraciones, despliegues) se controlan con un mecanismo externo al modelo, y existe una vía de recuperación probada.
- [ ] Todo contenido externo (issues, PR de terceros, páginas web, respuestas de herramientas) se trata como no confiable.
- [ ] Las skills, plugins y servidores MCP de terceros se auditan y se fijan a versión.
- [ ] Queda un rastro de auditoría de las decisiones y acciones de cada agente.
- [ ] El modelo se elige también por su resistencia a inyección, medida con evaluaciones propias.
