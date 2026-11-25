# 03 · Verificación y calidad

La idea que más se repite en las fuentes es que generar código dejó de ser lo difícil. Lo difícil es saber si el código es correcto. Las marcas [V], [C], [E], [R] e [I] se explican en el [README](README.md).

## La verificación es la restricción principal

- **Principio de contrapresión.** A un bucle de agentes solo se le puede dar la autonomía que se pueda verificar de forma barata y fiable. La restricción real de una factory es verificar, no generar [C, Addy Osmani].
- **La puerta de revisión es la única etapa cara y la que no escala** [C, Addy Osmani].

**La telemetría apunta en la misma dirección** [C, contrastado con los informes originales de Faros AI]:

| Informe | Muestra | Resultados con mayor adopción de IA |
|---|---|---|
| 2026 | 22,000 desarrolladores, más de 4,000 equipos, dos años | Tareas completadas por desarrollador +33.7%. Tiempo mediano en revisión +441.5%. Incidentes por PR +242.7%. Bugs por desarrollador +54%. Tamaño de PR +51%. PR fusionados sin ninguna revisión +31.3%. Despliegues por semana -11.7% |
| 2025 | Más de 10,000 desarrolladores, 1,255 equipos | Los desarrolladores de equipos con alta adopción completan 21% más tareas y fusionan 98% más PR, mientras el tiempo de revisión sube 91% |

Es telemetría de un proveedor que compara, dentro de cada organización, los periodos de menor y mayor adopción. Es correlacional, no un estudio controlado.

## La verificación debe ser independiente del autor

- Un agente que evalúa su propio trabajo tiende a aprobarlo. La autocomprobación no sustituye a un revisor que no escribió el cambio, aunque sirve como sensor temprano [C, O'Reilly y Qodo].
- Añadir un paso que verifica el objetivo de alto nivel dio la mayor mejora medida en sistemas multi-agente: +15.6 puntos [V, hallazgo 8].
- Verificar solo al final y a bajo nivel (por ejemplo, que compile) es insuficiente. Hace falta verificación en varios niveles [E, estudio MAST].
- Un seguimiento de IBM Research y Berkeley citado por los verificadores encuentra que la verificación incorrecta es el mejor predictor de fallo en todos los niveles de modelo [E].

## Los tests no bastan como oráculo

- En una auditoría de problemas difíciles de un benchmark público, casi el 60% tenía tests o enunciados defectuosos [V, hallazgo 9]. Esa auditoría documenta soluciones correctas rechazadas, no incorrectas aceptadas.
- Confiar en tests generados por IA para verificar código generado por IA todavía no es suficiente [C, Birgitta Böckeler en martinfowler.com]. Que la corrección funcional sea la parte más débil del arnés es inferencia de esta investigación [I]: la autora solo afirma que falta mucho por resolver ahí y que la mantenibilidad es hoy la parte más fácil.
- Un build en verde es evidencia, pero no decide si el comportamiento pedido es el deseado [C, Vercel].
- Si los tests pasan, el agente "gana", y no hay penalización por deteriorar la mantenibilidad. Es un problema de cómo se entrenan hoy los modelos, no del arnés [C, Dex Horthy].

## Capas de verificación

Ordenadas de más barata a más cara:

| Capa | Qué comprueba | Fuente |
|---|---|---|
| Comprobaciones deterministas en el ciclo del agente | Lint, tipos, tests, análisis estructural, límites de tamaño de archivo | Böckeler [C], OpenAI [C] |
| Puerta de cobertura y tests escritos antes del código | Que el cambio venga con tests y que cubran lo nuevo | O'Reilly, fábrica de un autor [C] |
| Análisis estático antes y después de cada commit | Qué problemas introdujo exactamente el cambio | arXiv 2603.28592 [I a partir de C] |
| Agente revisor independiente con rúbrica | Juicio semántico, cumplimiento de la spec | O'Reilly [C], Qodo [C] |
| Agentes de seguridad y fiabilidad en cada push | Riesgos específicos; solo señalan lo que bloquea el merge | OpenAI [C] |
| Verificación contra servicios simulados | Comportamiento frente a clones de servicios de terceros | StrongDM [C] |
| Verificación post-merge | Smoke test tras cada fusión | Ona [V] |
| Criterio humano | Cambios de alto impacto, arquitectura, producto, diseño visual | Osmani [C], Qodo [C] |

## Cuándo automatizar por completo un paso

Un bucle puede ganarse la automatización total solo si su comprobación es barata, se ejecuta con mucha frecuencia y se apoya en algo difícil de falsear. El oráculo debe además responder de inmediato y no desviarse con el tiempo [C, Addy Osmani].

Una persona debe revisar cuando una respuesta equivocada sale cara y solo una persona puede detectarla [C, Osmani]:

- Bugs sutiles de producción que los tests no capturan.
- Cambios con gran radio de impacto.
- Decisiones que condicionan el trabajo de un año o más.

Qodo añade cuatro casos que necesitan a una persona: criterio de producto, riesgo nuevo sin comprobación barata, rutas sensibles como pagos o autenticación, y excepciones de política [C].

Qodo pronostica que la autonomía solo se ampliará en las clases de cambio con comprobaciones independientes baratas y radio de impacto pequeño. También predice que las factories que no puedan mostrar un rastro de auditoría de las decisiones de sus agentes perderán la confianza de los equipos de seguridad y cumplimiento, y que la intervención de un ingeniero a mitad de ejecución importará tanto como la aprobación final [C; son predicciones de un proveedor, no requisitos].

Las personas se desplazan hacia el "bucle exterior": producto, diseño, arquitectura y revisión de planes [E, Osmani]. Un buen arnés no busca eliminar a las personas sino concentrar su aportación donde más importa [C, Birgitta Böckeler].

## Deuda técnica generada por agentes

Estudio "Debt Behind the AI Boom" sobre 302,579 commits con autoría de IA en 6,299 repositorios de GitHub [C, arXiv 2603.28592, leído completo]:

- Entre 7.5% y 14.8% de los commits, según el asistente, introducen al menos un problema detectable por análisis estático. En conjunto, 9.1%.
- De 464,900 problemas a los que se pudo dar seguimiento, el 22.7% seguía presente en la última revisión del repositorio. Los archivos borrados o reescritos cuentan como resueltos, así que la persistencia puede estar subestimada.
- De 484,366 problemas introducidos, el 89.3% son de mantenibilidad, el 6.0% de corrección y el 4.7% de seguridad.

**Matices que cambian la lectura:**

- Los mismos commits también corrigieron cerca de 440,000 problemas de mantenibilidad: el saldo neto en esa categoría es una ligera reducción. En corrección y seguridad, en cambio, se introdujeron más de los que se arreglaron (en seguridad, alrededor de 1.5 veces).
- **No hay comparación con commits humanos.** El estudio no permite afirmar que el código de IA sea peor que el humano.
- Solo cubre Python, JavaScript y TypeScript, en repositorios con al menos 100 estrellas, y solo lo que detectan tres herramientas de análisis estático.

Los datos comparativos con código humano que circulan (CodeRabbit, GitGuardian) tienen un alcance más estrecho del que se suele citar. Están en el [documento 04](04-seguridad-y-sandboxing.md).

Respuesta práctica documentada [C, OpenAI]: el equipo dedicaba el 20% de la semana a limpiar residuos a mano y lo sustituyó por tareas recurrentes en segundo plano que abren PR de refactorización, la mayoría revisables en menos de un minuto.

## La especificación

- Según Ona, la mayoría de los bugs vinieron de specs poco detalladas [V, confianza baja, hallazgo 6].
- Un resumen de las retransmisiones de Ona cuenta que la spec inicial no opinaba sobre tests, que hubo regresiones significativas tras la primera semana y que, al añadir instrucciones de pruebas más explícitas, las regresiones bajaron a costa de más rondas de revisión [E; la fuente original es un vídeo que no se pudo leer]. Correcciones y matices:
  - Fueron instrucciones, no un umbral de cobertura impuesto.
  - El equipo no recomendó la aprobación manual: operó sin revisión humana obligatoria y reconoció que la mayoría de las organizaciones la configurarían.
  - Los textos escritos de Ona matizan el relato: su `AGENTS.md` ya incluía expectativas de pruebas desde el principio y su texto final no menciona regresiones.
- Un plan sólido permite usar modelos más baratos; un plan débil los encarece por los bucles repetidos [C, O'Reilly; es una observación anecdótica del autor, sin mediciones].
- La afirmación de que más del 60% de los fallos de un modelo de frontera en tareas largas son de interpretación de la especificación fue **refutada** [R]. No debe citarse.

## Lo que la factory no ve

- **Diseño visual y experiencia de usuario.** La factory detecta lo que falla, no lo que se ve mal. El resultado tiende a un aspecto genérico [V, confianza baja, hallazgo 6].
- **Si lo pedido es lo que conviene construir.** Decidir qué construir necesita contexto de producción: uso del producto, quejas de usuarios, señales operativas [E, PostHog].
- **Soluciones incorrectas que pasan los tests.** Ninguna fuente verificada mide este caso. Es una pregunta abierta (ver [documento 07](07-implicaciones-para-el-plan.md)).
