# Investigación: software factory autónoma con agentes de IA

**Fecha:** 23 de noviembre de 2026
**Pregunta:** cómo crear hoy una software factory profesional que trabaje de forma autónoma con agentes de IA, con la mínima intervención humana, desde cero hasta producción.
**Propósito:** servir de base para el plan de implementación.

## Conclusión en una página

Una software factory autónoma no es un producto que se instala. Es un sistema repetible de agentes especializados, encadenados por eventos a lo largo del ciclo de desarrollo, apoyado en un arnés de documentos y reglas dentro del repositorio y en verificaciones automáticas. Las personas definen las especificaciones, la autoridad que recibe el sistema y los escalamientos.

Lo que la evidencia sostiene:

1. **La autonomía total no es el punto de partida.** Los tres proveedores que publican su arquitectura (Factory, Vercel, Ona) coinciden en que se adopta por etapas, proceso por proceso. El auto-merge es una decisión de diseño opcional.
2. **El cuello de botella es la verificación, no la generación de código.** Solo se puede dar a un agente la autonomía que se pueda verificar de forma barata y fiable.
3. **La mejor prueba de "mínima intervención" es una demo.** Ona construyó una app tipo Notion en 10 días con ~87% del trabajo fusionado sin intervención humana, pero con 8-10 horas diarias de trabajo humano al inicio. Es un dato del propio proveedor, sin auditar y sin usuarios reales.
4. **Los límites medidos son claros.** Los agentes resuelven solo ~20-25% de las tareas largas multi-archivo; los sistemas multi-agente abiertos fallan entre 41% y 86.7% según el framework; los tests y los benchmarks públicos son oráculos imperfectos.
5. **La seguridad se resuelve fuera del modelo.** La amenaza principal es la inyección indirecta de prompts y la defensa es el aislamiento a nivel de sistema operativo, no las instrucciones ni las aprobaciones manuales.
6. **Operar sin que nadie lea el código tiene un caso a favor y uno en contra.** Un equipo de tres ingenieros (StrongDM) lo hace con validación contra servicios simulados. Otro equipo pequeño (HumanLayer) lo intentó de julio a noviembre de 2025 y acabó reescribiendo desde cero.

Para el plan esto apunta a invertir primero en especificaciones detalladas, verificación independiente, instrumentación de cada etapa y sandboxing, y a ampliar la autonomía solo en los procesos que demuestren fiabilidad.

## Documentos

| Archivo | Contenido |
|---|---|
| [01-hallazgos-verificados.md](01-hallazgos-verificados.md) | Los 10 hallazgos que superaron la verificación adversarial, con evidencia, límites y fuentes |
| [02-arquitectura-de-referencia.md](02-arquitectura-de-referencia.md) | Etapas del pipeline, arnés del repositorio, coordinación entre agentes y espectro de autonomía |
| [03-verificacion-y-calidad.md](03-verificacion-y-calidad.md) | Por qué la verificación es la restricción principal y cómo se estructura |
| [04-seguridad-y-sandboxing.md](04-seguridad-y-sandboxing.md) | Amenazas, incidentes documentados y controles |
| [05-costos-y-modelo-operativo.md](05-costos-y-modelo-operativo.md) | Métricas de costo, datos publicados, palancas de ahorro y esfuerzo humano |
| [06-limites-y-riesgos.md](06-limites-y-riesgos.md) | Límites de capacidad, casos de fracaso, afirmaciones refutadas y discrepancias entre fuentes |
| [07-implicaciones-para-el-plan.md](07-implicaciones-para-el-plan.md) | Lo que se desprende para el plan de implementación y las preguntas abiertas |
| [08-fuentes.md](08-fuentes.md) | Las 24 fuentes con tipo, fecha y estado de verificación |
| [09-herramientas.md](09-herramientas.md) | Comparación de herramientas concretas por componente: agentes de código, orquestación, sandboxes, verificación, y entrega y operación |
| [10-claude-code-como-base.md](10-claude-code-como-base.md) | Qué cubre Claude Code de cada componente y qué habría que añadir |

## Cómo se hizo

La investigación se ejecutó con un flujo de 106 agentes en cinco fases:

1. **Alcance.** La pregunta se descompuso en cinco ángulos: arquitecturas de referencia, implementación práctica y herramientas, benchmarks y evidencia académica, limitaciones y salvaguardas, y adopción, costo y modelo operativo.
2. **Búsqueda.** Un agente por ángulo buscó en la web.
3. **Lectura.** Se leyeron 24 fuentes y se extrajeron 120 afirmaciones comprobables.
4. **Verificación.** Las 25 afirmaciones más importantes se sometieron a tres verificadores independientes cada una, con instrucción de intentar refutarlas. Hacían falta dos votos de tres para descartar una.
5. **Síntesis.** 24 afirmaciones se confirmaron y 1 se refutó. Las confirmadas se fusionaron en 10 hallazgos.

Después se hizo una **segunda pasada** sobre lo que había quedado sin verificar. Cinco verificadores releyeron 20 de las 24 fuentes, localizaron más de 25 fuentes originales de los datos citados de segunda mano e intentaron refutar 82 afirmaciones:

| Resultado | Afirmaciones |
|---|---|
| Confirmadas sin cambios | 34 |
| Confirmadas con corrección o matiz | 43 |
| Refutadas, total o parcialmente | 3 |
| No verificables contra la fuente original | 2 |

Ninguna conclusión central cambió. Sí cambió el peso de varias: los casos de autonomía total quedaron más débiles, el dato de costo por historia resultó ser un suelo con exclusiones importantes y varias cifras de seguridad estaban mal atribuidas. El detalle de lo descartado está en el [documento 06](06-limites-y-riesgos.md).

Por último, una **tercera ronda** comparó herramientas concretas (documentos 09 y 10). Seis investigadores leyeron la documentación y las páginas de precios de los proveedores entre el 23 y el 24 de noviembre de 2026. Esos datos los leyó un solo agente cada uno, no se verificaron de forma adversarial y nada se probó en la práctica.

## Cómo leer los niveles de evidencia

En todos los documentos cada afirmación lleva una de estas marcas:

| Marca | Significado |
|---|---|
| **[V]** | Verificada: superó la verificación adversarial de tres votos. Aparece en el documento 01 con su nivel de confianza. |
| **[C]** | Contrastada: en una segunda pasada, un verificador releyó la fuente con instrucción de refutarla y la confirmó. Las correcciones que encontró ya están aplicadas en el texto. Es un solo lector, no tres votos. |
| **[E]** | Extraída: un agente la leyó en la fuente, pero nadie la contrastó. Úsese como pista a confirmar, no como hecho. |
| **[R]** | Refutada: los verificadores la descartaron. No debe usarse. |
| **[I]** | Inferencia propia: conclusión de esta investigación, no afirmación de una fuente. |

Dos cosas distintas se miden por separado:

- **El voto** (por ejemplo 3-0) indica si la fuente dice realmente lo que se le atribuye.
- **La confianza** (alta, media, baja) indica cuánto pesa ese dato: baja si viene de una sola fuente, de un proveedor interesado o de una muestra pequeña, aunque el voto sea 3-0.

## Advertencias generales

- **Sesgo de proveedor.** Las definiciones, las arquitecturas y casi todas las cifras de autonomía vienen de empresas que venden las plataformas descritas. Ninguna está auditada.
- **No hay un caso real de cero a producción.** Ninguna fuente documenta una factory con mínima intervención operando un producto con usuarios reales, código legado o requisitos regulatorios.
- **Caducidad.** La capacidad de los agentes se duplica cada pocos meses. Las cifras de capacidad son de enero de 2026 o anteriores y deben revalidarse antes de fijar el plan.
- **Dos niveles de comprobación.** Solo los 10 hallazgos del documento 01 pasaron por tres verificadores. Lo marcado [C] lo revisó uno solo. Contrastar confirma que la fuente dice eso, no que sea cierto: los costos y los casos de empresa siguen siendo autodeclarados y sin réplica independiente.
- **Herramientas: datos de catálogo, no de uso.** Los documentos 09 y 10 recogen lo que los proveedores documentan. Precios y funciones cambian cada mes, y ninguna herramienta se probó.
- **Temas sin cubrir.** Casos reales de operación autónoma en producción, gobierno y cumplimiento normativo.
- **Lectura mediada.** Los verificadores leyeron las páginas con una herramienta que resume el contenido, no byte a byte. No pudieron leer vídeos ni algunos informes de pago.
