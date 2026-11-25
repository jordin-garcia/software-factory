# 06 · Límites y riesgos

Este documento reúne lo que la evidencia dice en contra de la idea de una factory totalmente autónoma, las afirmaciones descartadas y las contradicciones entre fuentes. Las marcas [V], [C], [E], [R] e [I] se explican en el [README](README.md).

## Límites de capacidad de los agentes

- **Tareas largas multi-archivo.** Los mejores agentes resuelven ~20-25% de las tareas de evolución que tocan muchos archivos, frente a ~65-73% de las de un solo issue. Darles más contexto mejora poco [V, hallazgo 7].
- **Horizonte temporal.** El horizonte al 50% de éxito rondaba las 5 horas en enero de 2026, con un intervalo de confianza muy ancho. Es una medida al 50%, no de fiabilidad de producción [V, hallazgo 7].
- **Medición limitada.** Solo 5 de las 31 tareas largas de la batería de METR tienen tiempos humanos de referencia, y la batería se acerca a la saturación con los modelos más recientes [E].
- **Los autores de SWE-EVO concluyen** que hacen falta avances tanto en modelos como en arquitecturas de agentes [E].

La capacidad crece deprisa: se duplica cada 3 a 4 meses según la medición reciente de METR [V]. Estos límites son una foto de principios de 2026 y hay que volver a medirlos.

## Límites de los sistemas multi-agente

- Fallan entre 41% y 86.7% según el framework, con ganancias a menudo mínimas frente a un solo agente [V, hallazgo 8].
- Las mejoras de diseño tienen techo: +9.4 y +15.6 puntos en los mejores casos [V].
- Los autores conjeturan que mejores modelos base no bastarán para eliminar todos los modos de fallo. Es conjetura, no resultado [V].
- La coordinación plana entre muchos agentes colapsó en el experimento de Cursor: 20 agentes rindieron como 1 a 3 [C].

## El caso de fracaso de una factory sin revisión humana

Es el contrapeso más directo al caso de StrongDM, y está contrastado con el ensayo de su protagonista [C].

Dex Horthy, de HumanLayer, cuenta que en julio de 2025 su equipo pasó a operar "a oscuras": solo leían specs y tickets, y agentes en segundo plano hacían todo el trabajo pequeño y mediano. Lo que ocurrió después:

- Los agentes toparon con bugs que no podían resolver en un código que nadie había leído en meses. El sitio se cayó.
- Tras la tercera vez, en noviembre, decidieron que era más fácil reescribir desde cero.
- Su cofundador pasó dos semanas trazando a mano todos los patrones del código.

**Su conclusión:** la factory a oscuras no funciona. Atribuye la causa al entrenamiento de los modelos y no al arnés: se les recompensa por pasar los tests y no se les penaliza por deteriorar la mantenibilidad, y ninguna cantidad de ingeniería de arnés lo arregla.

**Su remedio:** concentrar el esfuerzo humano en la planificación (producto, arquitectura, diseño del programa, cortes verticales), revisar en incrementos de 100 a 200 líneas, leer el código y aspirar a ir dos o tres veces más rápido de forma segura. No propone abandonar los agentes.

Correcciones a la primera versión de este informe: los "cuatro meses" son una inferencia de quien lo cita (de julio a noviembre), fueron incidentes repetidos que acabaron en una reescritura y no un único episodio de depuración, y Horthy no habla de inviabilidad "a escala" sino de un problema de entrenamiento.

## Riesgos de calidad

- Cerca del 9% de los commits con autoría de IA introduce al menos un problema detectable, y alrededor de una cuarta parte de esos problemas persiste. El estudio no los compara con commits humanos [C].
- Con mayor adopción de IA suben el tiempo de revisión, los incidentes por PR y los PR fusionados sin revisión [C, telemetría de un proveedor].
- La factory no percibe defectos visuales ni de experiencia de usuario [V, confianza baja].
- Las bases de código legado son las más difíciles de equipar con un arnés [C].

Detalle en el [documento 03](03-verificacion-y-calidad.md).

## Riesgos de seguridad

- Inyección indirecta de prompts como amenaza principal [V].
- Un agente borró una base de datos de producción durante una congelación; los datos se recuperaron [C].
- Cadena de suministro de skills y plugins: cerca de una de cada cuatro skills analizadas tenía alguna vulnerabilidad [C].

Detalle en el [documento 04](04-seguridad-y-sandboxing.md).

## Vacíos de la evidencia

1. **No hay un caso real de cero a producción con mínima intervención.** Ona es una demo de 10 días sin usuarios. Vercel es mantenimiento con merge humano. El experimento de OpenAI mantiene a personas dirigiendo y revisando después del merge.
2. **Los casos de autonomía alta son equipos muy pequeños.** StrongDM son tres ingenieros. La viabilidad a escala empresarial no está demostrada.
3. **La lista de grandes empresas con factories en producción no se sostiene.** Es una afirmación de Factory sin métricas; lo poco que se pudo corroborar son alianzas, inversiones y pilotos (ver [documento 05](05-costos-y-modelo-operativo.md)).
4. **Faltan datos de calidad.** Las cifras publicadas miden volumen (PR, líneas, tests), no defectos escapados ni retrabajo.
5. **Falsos positivos sin medir.** Ninguna fuente cuantifica los cambios incorrectos que pasan los tests.
6. **Temas sin cobertura:** comparación de herramientas concretas, despliegue y operación en producción (entrega continua, reversión, observabilidad), gobierno y cumplimiento normativo, y dimensionamiento del equipo humano.

## Afirmaciones refutadas [R]

No deben usarse.

| Afirmación | Por qué se descartó |
|---|---|
| Más del 60% de los fallos de GPT-5 en tareas largas (SWE-EVO) son de interpretación de la especificación | Voto 0-3 en la verificación adversarial. La tesis de que la spec es el cuello de botella queda apoyada solo por el relato de Ona |
| OpenAI probó miles de skills y las consolidó en 5 a 10 | "Miles" fue el contraste que planteó el moderador de la charla. El equipo trabaja con unas 5 a 10 skills; nunca dijo haber tenido miles |
| La tasa de interrupción de los usuarios expertos subió de 5% a 9% con el tiempo | Es una comparación entre usuarios nuevos (5%) y experimentados (9%), no una evolución. El aumento de duración de los turnos ocurrió en unos tres meses, no en seis |
| Cisco encontró vulnerabilidades en el 26% de 31,000 skills | El dato es de un estudio académico sobre dos mercados; Cisco solo lo citó |
| El código de IA tiene 2.74 veces más vulnerabilidades de seguridad | Esa cifra es solo de XSS. El conjunto de hallazgos de seguridad fue de unas 1.57 veces, en un estudio de un proveedor |
| Los ingenieros de Spotify no escriben código desde diciembre de 2025 | Lo dijo un directivo sobre los mejores desarrolladores de la empresa, sin cifra de cuántos. Los 650 PR al mes son de un agente dedicado sobre todo a migraciones y mantenimiento, según una página de proveedor |
| Uber multiplicó por 7 su uso agéntico | El 7 es el crecimiento de usuarios activos semanales entre todos los empleados. Las peticiones agénticas crecieron 9.4 veces |

## Discrepancias entre fuentes

| Tema | Estado tras la segunda verificación |
|---|---|
| Demo de Ona: 87% u 88% sin intervención | Ambas cifras son correctas. La primera es del texto final ("trabajo fusionado"); la segunda, de las retransmisiones y de un recuento posterior ("PR completados de forma autónoma") |
| Demo de Ona: líneas de código | Sin resolver. Aparecen 50,000, 63,000, más de 67,000 y 77,424 según la fuente y el momento |
| Demo de Ona: 16 automatizaciones o 14 más 2-3 | Compatibles. El texto de la primera semana decía 14 |
| Demo de Ona: 10 días o dos semanas | Lo mismo: diez retransmisiones en días laborables a lo largo de dos semanas de abril de 2026 |
| Demo de Ona: 54 PR en un día | Dudosa; los acumulados publicados implican unos 37 |
| Demo de Ona: tasa de aprobación en CI | El resumen dice 98% de media; los textos de Ona dicen 100% |
| OpenAI: cinco o nueve meses | Resuelto. Cinco meses es la duración a la que corresponden las cifras del artículo. Nueve meses es la experiencia personal del autor en una charla posterior |
| OpenAI: tamaño del monorepo | 750 paquetes según la charla y unos 500 según un pódcast |
| Skills: pocas (OpenAI) o muchas (Uber) | Resuelto. Un equipo pequeño frente a una organización grande; la supuesta consolidación desde miles fue refutada |
| Aislamiento: recomendación de NVIDIA frente a su runtime | Contradicción parcial. Su runtime ofrece controladores de kernel compartido y también uno de microVM |
| Factory Missions: serial o paralelo | Sin resolver. Un texto dice que lo serial con paralelización dirigida funciona mejor; otro posterior las describe como pistas paralelas |
| Autonomía total: viable (StrongDM) o fracaso (HumanLayer) | Sin resolver. Dos equipos pequeños con resultados opuestos, ambos contados por sus protagonistas |

## Sesgos a tener presentes

- **Proveedor.** Factory, Vercel, Ona, Qodo, Docker, Sonar, Warp, Tessl, NVIDIA, CodeRabbit, GitGuardian y Faros venden productos relacionados con lo que afirman.
- **Parte interesada.** OpenAI audita un benchmark en el que compite. Dos de los clientes que Factory nombra tienen relación financiera con ella.
- **Supervivencia.** Se publican los experimentos que salieron bien. El único fracaso documentado lo publicó su protagonista para defender un método alternativo que él mismo promueve.
- **Cadena de citas.** Varias cifras llamativas se deforman al pasar de fuente en fuente. Las de la tabla de refutadas son el ejemplo.
- **Lectura mediada.** Los verificadores leyeron las páginas con una herramienta que resume el contenido, no byte a byte. No pudieron leer vídeos ni algunos documentos de pago.
