# 08 · Fuentes

Estado de cada fuente tras las dos rondas de verificación:

- **Verificada [V]:** al menos una afirmación superó la verificación adversarial de tres votos y sostiene un hallazgo del [documento 01](01-hallazgos-verificados.md).
- **Contrastada [C]:** en la segunda pasada un verificador releyó la fuente e intentó refutar sus afirmaciones. La columna de resultado resume lo que encontró.
- **Solo extraída [E]:** se leyó una vez y nadie la contrastó.

Las fechas y autores son los que reportaron los verificadores.

## Las 24 fuentes de la primera ronda

### Con afirmaciones verificadas [V]

| Fuente | Autor y fecha | Tipo | Hallazgos | Segunda pasada |
|---|---|---|---|---|
| [Factory · Factory 2.0: from coding agents to software factories](https://factory.ai/news/software-factory) | Matan Grinberg y Eno Reyes, 2026-06-15 | Proveedor | 1, 2, 3, 4 | Lista de clientes exacta pero sin corroborar |
| [Vercel · What is an AI software factory](https://vercel.com/i/what-is-an-ai-software-factory) | Ben Sabic, 2026-09-14 | Proveedor | 1, 2, 3 | Confirmada; el dato de 25-35% está en otro texto |
| [Ona · Software factory: what we learned](https://ona.com/stories/software-factory-what-we-learned) | Malguitou y Bichard, 2026-04-30 | Proveedor | 3, 5, 6 | Cifras confirmadas |
| [METR · Time Horizon 1.1](https://metr.org/blog/2026-1-29-time-horizon-1-1) | 2026-01-29 | Investigación independiente | 7 | No revisada de nuevo |
| [arXiv 2512.18470 · SWE-EVO](https://arxiv.org/abs/2512.18470v1) | 2025-12-20, v6 en 2026-05-22 | Preprint | 7, y una afirmación refutada | No revisada de nuevo |
| [arXiv 2503.13657 · MAST](https://arxiv.org/pdf/2503.13657) | 2025-03-17, v3 en 2025-10-26 | Revisada por pares | 8 | No revisada de nuevo |
| [OpenAI · Why we no longer evaluate SWE-bench Verified](https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/) | 2026-02-23 | Parte interesada | 9 | No revisada de nuevo |
| [NVIDIA · Practical security guidance for sandboxing agentic workflows](https://developer.nvidia.com/blog/practical-security-guidance-for-sandboxing-agentic-workflows-and-managing-execution-risk) | Rich Harang, 2026-01-30 | Proveedor | 10 | Confirmada con matices |

### Contrastadas en la segunda pasada [C]

| Fuente | Autor y fecha | Tipo | Resultado |
|---|---|---|---|
| [O'Reilly Radar · Inside a Software Factory](https://www.oreilly.com/radar/?p=19568) | Paul Iusztin, 2026-09-04 | Practicante | Confirmada. Es un marco personal, no un estándar |
| [O'Reilly Radar · What a User Story Actually Costs in a Dark Code Factory](https://www.oreilly.com/radar/?p=19556) | François-Xavier Martin, 2026-09-02 | Practicante | Cifras confirmadas; faltaban advertencias importantes |
| [Addy Osmani · Software Factories, Light and Dark](https://addyosmani.com/blog/software-factories/) | Addy Osmani, 2026-07-20 | Blog | Sus argumentos, confirmados; lo que cita de terceros, corregido |
| [martinfowler.com · Harness engineering for coding agent users](https://www.martinfowler.com/articles/harness-engineering.html) | Birgitta Böckeler, 2026-04-02 | Blog | Confirmada; una inferencia propia estaba atribuida a la autora |
| [Qodo · What is a dark software factory](https://www.qodo.ai/?p=23014) | Sin autor ni fecha; glosario, hacia 2026-11 | Proveedor | Confirmada; los datos de Faros coinciden con el original |
| [Tessl · Dark factory](https://tessl.io/patterns/agentic-development-workflow/dark-factory/) | Revisada 2026-06-25 | Proveedor | Corregida en varios puntos; el caso de Spotify estaba exagerado |
| [PostHog · Can software factories actually work?](https://posthog.com/newsletter/software-factories) | Jina Yoon, 2026-08-11 | Blog | Parcial: dos de sus cifras no tienen fuente rastreable |
| [Uber · Efficient software factory](https://uber.com/us/en/blog/efficient-software-factory) | Uday Kiran Medisetty, 2026-08-27 | Autodeclarada | Confirmada; el "7 veces" mide usuarios, no uso agéntico |
| [Sonar · The Economics of Agentic Development](https://www.sonarsource.com/resources/library/economics-of-agentic-development/) | Manish Kapur, 2026-11-04 | Proveedor | Confirmada; su ejemplo es ilustrativo |
| [Warp · Reduce AI coding agent costs](https://www.warp.dev/articles/reduce-ai-coding-agent-costs) | Sin autor, 2026-09-14 | Proveedor | Confirmada con una corrección menor |
| [arXiv 2603.10387 · Don't Let the Claw Grip Your Hand](https://arxiv.org/abs/2603.10387) | Shan, Xin, Zhang y Xu, 2026-03-11 | Preprint | Cifras confirmadas; estudio con límites metodológicos serios |
| [arXiv 2603.28592 · Debt Behind the AI Boom](https://arxiv.org/abs/2603.28592) | Liu y otros, 2026-03-30, v3 en 2026-10-13 | Preprint | Confirmada; sin comparación con código humano |
| [Docker · Coding agent horror stories](https://www.docker.com/blog/coding-agent-horror-stories-the-security-crisis-threatening-developer-infrastructure/) | Ajeet Singh Raina, 2026-05-18 | Proveedor | La más débil: varias cifras mal atribuidas o exageradas |
| [yage.ai · Harness engineering survey](https://yage.ai/share/harness-engineering-survey-en-20260312.html) | 2026-03-12 | Secundaria | Corregida: los datos de Anthropic estaban mal interpretados |
| [ZenML · Harness engineering: humans steer, agents execute](https://zenml.io/llmops-database/harness-engineering-building-software-where-humans-steer-and-agents-execute) | Resumen de una charla | Secundaria | Poco fiable: fecha y nombre erróneos y una afirmación refutada |

### Solo extraída [E]

| Fuente | Tipo | Motivo |
|---|---|---|
| [ZenML · Autonomous software factory for a Notion-like app](https://www.zenml.io/llmops-database/building-an-autonomous-software-factory-for-notion-like-application-development) | Secundaria | Resume un vídeo de Ona que no se pudo leer; varias de sus cifras no aparecen en los textos de Ona |

## Fuentes originales localizadas en la segunda pasada

Se usaron para contrastar datos que la primera ronda había tomado de segunda mano.

| Fuente | Qué aclara |
|---|---|
| [OpenAI · Harness engineering](https://openai.com/index/harness-engineering/) (Ryan Lopopolo, 2026-02-11) | Cifras reales del experimento: cinco meses, ~1 millón de líneas, ~1,500 PR, tres ingenieros |
| [Charla "Harness Engineering" en AI Engineer](https://ai.engineer/talks/am_oeAoUhew-harness-engineering) y [pódcast Latent Space](https://latent.space/p/harness-eng) | Origen de las cifras de skills, tokens y tamaño del monorepo |
| [Cursor · Scaling agents](https://cursor.com/blog/scaling-agents) y [Self-driving codebases](https://cursor.com/blog/self-driving-codebases) (Wilson Lin, 2026-01 y 2026-02) | Experimento de coordinación multi-agente |
| [Anthropic · Measuring agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) (2026-02-18) | Duración de turnos y tasas de interrupción |
| [Vercel · Building a software factory for AI SDK](https://vercel.com/blog/building-a-software-factory-for-ai-sdk) (2026-08-12) | Origen del 25-35% de PR fusionados |
| [Factory · Introducing Missions](https://factory.com/news/missions) (2026-02-26) y [How Missions Work](https://factory.com/news/missions-architecture) (2026-04-10) | Duración y forma de ejecución de las misiones |
| [Dan Shapiro · The Five Levels](https://www.danshapiro.com/blog/2026/01/the-five-levels-from-spicy-autocomplete-to-the-software-factory/) (2026-01-23) | Origen de la escala y del término "dark factory" |
| [StrongDM · Software Factory](https://factory.strongdm.ai/) y [técnica del gemelo digital](https://factory.strongdm.ai/techniques/dtu) | Reglas y método de validación de StrongDM |
| [Stanford CodeX · Built by agents, tested by agents, trusted by whom?](http://law.stanford.edu/2026/02/08/built-by-agents-tested-by-agents-trusted-by-whom/) (2026-02-08) | Tamaño del equipo de StrongDM y objeciones |
| [HumanLayer · Why Software Factories Fail](https://raw.githubusercontent.com/humanlayer/advanced-context-engineering-for-coding-agents/main/wsff.md) | Relato de primera mano del fracaso sin revisión humana |
| [HumanLayer · 12-Factor Agents, factor 10](https://github.com/humanlayer/12-factor-agents/blob/main/content/factor-10-small-focused-agents.md) | Origen de la guía de 3 a 10 pasos |
| [TechCrunch sobre Spotify](https://techcrunch.com/2026/02/12/spotify-says-its-best-developers-havent-written-a-line-of-code-since-december-thanks-to-ai/) (2026-02-12) | Alcance real de la declaración de Spotify |
| [PostHog · 10k PRs a month](https://posthog.com/blog/10k-prs-a-month) (2026-07-28) | Origen del 70% y del 40% |
| [Faros AI · Acceleration Whiplash](https://www.faros.ai/blog/ai-acceleration-whiplash-takeaways) (2026-04-12) y [Productivity Paradox 2025](https://www.faros.ai/blog/ai-productivity-paradox-report-2025) | Telemetría de revisión e incidentes |
| [arXiv 2604.22750 · How Do AI Agents Spend Your Money?](https://arxiv.org/abs/2604.22750) | Consumo y variabilidad de tokens; solo se leyó el resumen |
| [Sonar · A cleaner codebase results in less token usage](https://www.sonarsource.com/blog/a-cleaner-codebase-results-in-less-token-usage/) (2026-05-14) | Diseño de la prueba de Sonar |
| [Warp · Factory Benchmarks](https://www.warp.dev/blog/warp-factory-benchmarks) (2026-09-03) | Origen del 63% |
| [arXiv 2601.10338 · Agent Skills in the Wild](https://arxiv.org/abs/2601.10338) (2026-01-15) | Origen real del 26% de skills vulnerables |
| [GitGuardian · State of Secrets Sprawl 2026](https://blog.gitguardian.com/the-state-of-secrets-sprawl-2026/) | Alcance real de la tasa de fuga de secretos |
| [Wipro · nota de prensa sobre Factory](https://www.wipro.com/newsroom/press-releases/2026/wipro-and-factory-partner-to-accelerate-agent-native-software-development-for-enterprises-globally/) y [VentureBeat sobre EY](https://venturebeat.com/orchestration/ey-hit-4x-coding-productivity-by-connecting-ai-agents-to-engineering) | Lo único corroborable de la lista de clientes de Factory |

## Lo que no se pudo leer

- Los vídeos: las retransmisiones de Ona y la charla de Dex Horthy.
- Informes de pago o no procesables: el informe completo de Faros, el de CodeRabbit y el PDF de GitGuardian.
- El cuerpo del estudio sobre consumo de tokens (solo el resumen).
- La transcripción de la presentación de resultados de Spotify.
- Varias páginas que devolvieron error, entre ellas casos de cliente de Factory y un caso de estudio de Warp.

## Estadísticas del proceso

| Concepto | Primera ronda | Segunda pasada |
|---|---|---|
| Agentes | 106 | 5 |
| Fuentes leídas | 24 | 20 de las 24, más de 25 originales |
| Afirmaciones revisadas | 25 de 120, con tres votos cada una | 82, con un verificador cada una |
| Confirmadas sin cambios | 24 | 34 |
| Confirmadas con corrección o matiz | — | 43 |
| Refutadas, total o parcialmente | 1 | 3 |
| No verificables contra la fuente original | 0 | 2 |

Las 82 afirmaciones de la segunda pasada agrupan las extraídas en la primera ronda que no se habían verificado, más algunos datos que los verificadores de la primera ronda habían tomado de resultados de búsqueda.
