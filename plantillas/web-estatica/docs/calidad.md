# Calidad

Cada PR pasa estos checks obligatorios. Están en `.github/workflows/ci.yml` y no se pueden saltar.

| Check | Qué comprueba | En local |
|---|---|---|
| `tipos` | El compilador de TypeScript no da errores | `npm run tipos` |
| `lint` | ESLint y las reglas de arquitectura | `npm run lint` y `npm run arquitectura` |
| `tests` | Los tests unitarios pasan y cubren al menos el 80 % de las líneas cambiadas en el PR | `npm run cobertura` |
| `e2e` | Las pruebas de extremo a extremo pasan contra la compilación | `npm run e2e` |
| `estatico` | Semgrep no encuentra patrones inseguros y OSV-Scanner no encuentra dependencias con vulnerabilidades conocidas | — |
| `secretos` | Gitleaks no encuentra credenciales en el historial | — |

Además, la factory añade dos checks propios: `factory/clasificador` (riesgo y tamaño del diff) y `factory/aprobacion` (la puerta de aprobación).

## Qué es un buen test

- Prueba un comportamiento, no la implementación.
- Falla si se rompe ese comportamiento. Si no puedes imaginar el cambio que lo haría fallar, no prueba nada.
- No depende del orden ni de la hora.
