# Convenciones

- **Idioma.** Identificadores, textos de la interfaz, mensajes y documentación en español.
- **Nombres.** Componentes en `PascalCase` (`ListaDeTareas.tsx`); funciones y variables en `camelCase`; constantes de módulo en `MAYUSCULAS`.
- **Archivos.** Un componente por archivo, con el mismo nombre que el componente. Funciones de lógica agrupadas por tema en `src/logica/`.
- **Exportaciones.** Exportaciones con nombre, no `export default`.
- **Tipos.** Sin `any`. Los datos de fuera (URL, almacenamiento, respuestas) se validan antes de usarse.
- **Estado.** El estado vive en el componente más cercano que lo necesita. Sin bibliotecas de estado global salvo que una tarea lo pida.
- **Estilos.** CSS propio junto al componente. Sin fuentes ni recursos de otros dominios.
- **Dependencias.** Solo las que pide la tarea. Cambiar `package.json` hace que el PR sea de riesgo alto.
