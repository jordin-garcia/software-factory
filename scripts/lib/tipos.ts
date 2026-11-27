export type TipoIssue = 'especificacion' | 'tarea';
export type RolAgente = 'planificador' | 'implementador' | 'revisor';
export type Rol = RolAgente | 'crear-tareas' | 'puerta' | 'verificador' | 'reconciliador';
export type Resultado = 'termino' | 'fallo' | 'bloqueada' | 'en-pausa';
export type Riesgo = 'bajo' | 'alto';
export type Permiso = 'admin' | 'write' | 'read' | 'none';
export interface Comentario { autor: string; cuerpo: string; fecha: string }
export interface ResumenEjecucion {
  proyecto: string; issue: number; tipo: TipoIssue; rol: Rol; modelo: string | null;
  inicio: string; fin: string; duracionSeg: number; resultado: Resultado; estadoResultante: string;
  turnos: number; costoEstimadoUsd: number | null; herramientas: Record<string, number>;
  permisosDenegados: string[]; urlEjecucion: string; datos?: Record<string, unknown>;
}
