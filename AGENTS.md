# AGENTS.md

## Qué es este repositorio

La factory es un conjunto de herramientas en TypeScript y flujos de GitHub Actions que ejecutan agentes de Claude Code para planificar, implementar y revisar tareas de otros proyectos. Este repositorio contiene esas herramientas y flujos, no los proyectos que construye.

- Spec: [docs/superpowers/specs/2026-11-24-software-factory-design.md](docs/superpowers/specs/2026-11-24-software-factory-design.md)
- Plan: [docs/superpowers/plans/2026-11-24-software-factory.md](docs/superpowers/plans/2026-11-24-software-factory.md)
- Investigación: [investigacion/README.md](investigacion/README.md)

## Comandos

- `npm test`: ejecuta los tests (vitest).
- `npm run tipos`: comprueba los tipos (`tsc --noEmit`).
- `npm run flujos`: valida los flujos de GitHub Actions (`actionlint`, debe estar en el PATH).

## Dónde va cada cosa

- La lógica de decisión va en funciones puras en `scripts/lib/`, cada una con su archivo de test en `tests/`.
- La entrada y salida (leer variables, llamar a la API, escribir archivos) va en `scripts/cli/`.
- Los flujos YAML en `.github/workflows/` solo conectan: no contienen lógica.

## Reglas que no se rompen

- Ningún paso imprime secretos, variables de entorno ni la salida completa de un agente.
- Los trabajos de agente solo tienen `contents: read`.
- Ningún rol se ejecuta con los permisos desactivados.
- Las acciones de terceros se fijan por hash de commit, con la versión en un comentario.
- Los marcadores ocultos solo se leen si los escribió la aplicación de la factory.
- El token de administración no sale de este repositorio.

## Cómo se trabaja

- Test antes que código.
- Un commit por tarea del plan.
- Identificadores, mensajes y documentación en español.
- Los restos de experimentos (repos, ramas, proyectos, issues y secretos copiados) se borran en cuanto dejan de hacer falta. Antes se confirma la lista con la persona operadora.

## Qué no se hace sin preguntar

- Publicar o borrar repositorios.
- Crear o rotar credenciales.
- Cambiar la protección de ramas.
