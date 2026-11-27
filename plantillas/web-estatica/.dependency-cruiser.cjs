// Reglas de arquitectura de docs/arquitectura.md. Las comprueba `npm run arquitectura`.
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'sin-ciclos',
      comment: 'Ningún módulo depende de sí mismo a través de otros.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'logica-sin-interfaz',
      comment: 'src/logica/ es código puro: no importa React, componentes ni la entrada.',
      severity: 'error',
      from: { path: '^src/logica/' },
      to: { path: ['^src/componentes/', '^src/App\\.tsx$', '^src/main\\.tsx$', '(^|/)node_modules/react(-dom)?/'] },
    },
    {
      name: 'componentes-sin-entrada',
      comment: 'Los componentes no importan el punto de entrada.',
      severity: 'error',
      from: { path: '^src/componentes/' },
      to: { path: '^src/main\\.tsx$' },
    },
    {
      name: 'tests-fuera-de-produccion',
      comment: 'El código de producción no importa tests.',
      severity: 'error',
      from: { pathNot: '\\.test\\.tsx?$' },
      to: { path: '\\.test\\.tsx?$' },
    },
    {
      name: 'importaciones-resolubles',
      comment: 'Toda importación apunta a un archivo o paquete que existe.',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
  },
};
