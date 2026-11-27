# Arquitectura

Las reglas de este documento las impone `.dependency-cruiser.cjs` y se comprueban con `npm run arquitectura`.

## Capas

| Carpeta | Contiene | Puede importar |
|---|---|---|
| `src/logica/` | Funciones puras: cálculos, validaciones, transformaciones de datos | Solo otros módulos de `src/logica/` |
| `src/componentes/` | Componentes de React | `src/logica/` y otros componentes |
| `src/App.tsx` | La composición de la página | Componentes y `src/logica/` |
| `src/main.tsx` | El punto de entrada: monta `App` en `#raiz` | `App` |

Las carpetas se crean cuando hacen falta.

## Reglas

- **Sin ciclos.** Ningún módulo depende de sí mismo a través de otros.
- **La lógica no conoce la interfaz.** `src/logica/` no importa React, componentes ni el punto de entrada. Así se prueba sin navegador.
- **Nadie importa el punto de entrada.**
- **El código de producción no importa tests.**
- **Toda importación se resuelve.**

## Tests

- Los tests unitarios van junto al archivo que prueban: `x.ts` y `x.test.ts`.
- Las pruebas de extremo a extremo van en `e2e/` y corren contra la compilación local (`npm run e2e`).
