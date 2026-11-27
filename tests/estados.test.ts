import { describe, expect, test } from 'vitest';
import {
  ETIQUETAS,
  comentarioTransicion,
  leerEstado,
  leerUltimaTransicion,
  puedeTransicionar,
  tipoPorEstado,
} from '../scripts/lib/estados.js';

const APP = 'factory-app[bot]';
const comentario = (cuerpo: string, fecha = '2026-01-01T00:00:00Z', autor = APP) => ({ autor, cuerpo, fecha });

describe('etiquetas', () => {
  test('hay 13 etiquetas con prefijo factory:', () => {
    expect(ETIQUETAS).toHaveLength(13);
    expect(ETIQUETAS.every(e => e.nombre.startsWith('factory:'))).toBe(true);
  });

  test('los nombres no se repiten', () =>
    expect(new Set(ETIQUETAS.map(e => e.nombre)).size).toBe(ETIQUETAS.length));

  test('el color es hexadecimal de 6 cifras sin almohadilla, como pide la API de GitHub', () =>
    expect(ETIQUETAS.every(e => /^[0-9a-f]{6}$/.test(e.color))).toBe(true));

  test('la descripción cabe en el límite de 100 caracteres de GitHub', () =>
    expect(ETIQUETAS.every(e => e.descripcion.length > 0 && e.descripcion.length <= 100)).toBe(true));
});

describe('leerEstado', () => {
  test('ignora etiquetas ajenas', () =>
    expect(leerEstado(['bug', 'factory:lista'])).toEqual({ estado: 'factory:lista', conflicto: false }));

  test('sin etiquetas de la factory', () =>
    expect(leerEstado(['bug'])).toEqual({ estado: null, conflicto: false }));

  test('dos estados a la vez es conflicto', () =>
    expect(leerEstado(['factory:lista', 'factory:en-curso']).conflicto).toBe(true));

  test('una etiqueta con prefijo factory: que no es un estado se ignora', () =>
    expect(leerEstado(['factory:inventada', 'factory:pendiente'])).toEqual({ estado: 'factory:pendiente', conflicto: false }));
});

describe('puedeTransicionar', () => {
  test('una tarea no salta de pendiente a en-revision', () =>
    expect(puedeTransicionar('tarea', 'factory:pendiente', 'factory:en-revision')).toBe(false));

  test('una tarea pasa de implementar a en-revision', () =>
    expect(puedeTransicionar('tarea', 'factory:implementar', 'factory:en-revision')).toBe(true));

  test('una especificación vuelve de plan-propuesto a lista', () =>
    expect(puedeTransicionar('especificacion', 'factory:plan-propuesto', 'factory:lista')).toBe(true));

  test('hecha es final', () =>
    expect(puedeTransicionar('tarea', 'factory:hecha', 'factory:implementar')).toBe(false));

  test('hecha no puede ir a bloqueada', () =>
    expect(puedeTransicionar('tarea', 'factory:hecha', 'factory:bloqueada')).toBe(false));

  test('desde un estado no final se puede pausar o bloquear', () => {
    expect(puedeTransicionar('tarea', 'factory:implementar', 'factory:en-pausa')).toBe(true);
    expect(puedeTransicionar('especificacion', 'factory:lista', 'factory:bloqueada')).toBe(true);
  });

  test('desde en-pausa se vuelve a un estado no final del mismo tipo', () =>
    expect(puedeTransicionar('tarea', 'factory:en-pausa', 'factory:implementar')).toBe(true));

  test('desde bloqueada no se salta a un estado del otro tipo', () =>
    expect(puedeTransicionar('tarea', 'factory:bloqueada', 'factory:lista')).toBe(false));

  test('desde en-pausa no se va directamente a hecha', () =>
    expect(puedeTransicionar('tarea', 'factory:en-pausa', 'factory:hecha')).toBe(false));

  test('una tarea no usa transiciones de especificación', () =>
    expect(puedeTransicionar('tarea', 'factory:lista', 'factory:plan-propuesto')).toBe(false));

  test('quedarse en el mismo estado no es una transición', () =>
    expect(puedeTransicionar('tarea', 'factory:en-pausa', 'factory:en-pausa')).toBe(false));

  test('un estado desconocido no transiciona', () =>
    expect(puedeTransicionar('tarea', 'factory:inventada', 'factory:bloqueada')).toBe(false));

  test('un nombre heredado de Object no se toma por un estado', () =>
    expect(puedeTransicionar('tarea', 'constructor', 'factory:bloqueada')).toBe(false));
});

describe('tipoPorEstado', () => {
  test('el estado indica el tipo de issue cuando no es compartido', () => {
    expect(tipoPorEstado('factory:lista')).toBe('especificacion');
    expect(tipoPorEstado('factory:implementar')).toBe('tarea');
    expect(tipoPorEstado('factory:bloqueada')).toBeNull();
  });

  test('hecha y en-pausa son compartidos', () => {
    expect(tipoPorEstado('factory:hecha')).toBeNull();
    expect(tipoPorEstado('factory:en-pausa')).toBeNull();
  });

  test('un estado desconocido no tiene tipo', () => {
    expect(tipoPorEstado('bug')).toBeNull();
    expect(tipoPorEstado('toString')).toBeNull();
  });
});

describe('marcador de transición', () => {
  test('el comentario termina con el marcador', () => {
    const c = comentarioTransicion({ de: 'factory:lista', a: 'factory:plan-propuesto', origen: 'sistema', motivo: 'x' });
    expect(c.trimEnd().endsWith('<!-- factory:transicion de=factory:lista a=factory:plan-propuesto origen=sistema -->')).toBe(true);
  });

  test('el marcador se lee de vuelta', () => {
    const c = comentarioTransicion({ de: 'factory:implementar', a: 'factory:en-pausa', origen: 'sistema', motivo: 'cupo agotado' });
    expect(leerUltimaTransicion([comentario(c)], APP))
      .toEqual({ de: 'factory:implementar', a: 'factory:en-pausa', origen: 'sistema' });
  });

  test('ignora marcadores de otra cuenta', () => {
    const c = comentarioTransicion({ de: 'factory:lista', a: 'factory:plan-propuesto', origen: 'sistema', motivo: 'x' });
    expect(leerUltimaTransicion([comentario(c, '2026-01-01T00:00:00Z', 'intruso')], APP)).toBeNull();
  });

  test('devuelve la transición más reciente por fecha, aunque llegue antes en la lista', () => {
    const vieja = comentarioTransicion({ de: 'factory:pendiente', a: 'factory:implementar', origen: 'sistema', motivo: '' });
    const nueva = comentarioTransicion({ de: 'factory:implementar', a: 'factory:en-revision', origen: 'sistema', motivo: '' });
    expect(leerUltimaTransicion([comentario(nueva, '2026-01-02T00:00:00Z'), comentario(vieja, '2026-01-01T00:00:00Z')], APP))
      .toEqual({ de: 'factory:implementar', a: 'factory:en-revision', origen: 'sistema' });
  });

  test('salta los comentarios de la aplicación sin marcador', () => {
    const c = comentarioTransicion({ de: 'factory:en-revision', a: 'factory:cambios-pedidos', origen: 'revisor', motivo: '' });
    expect(leerUltimaTransicion([comentario(c), comentario('Revisión publicada.', '2026-01-02T00:00:00Z')], APP))
      .toEqual({ de: 'factory:en-revision', a: 'factory:cambios-pedidos', origen: 'revisor' });
  });

  test('un marcador falso dentro del motivo no cambia lo que se lee', () => {
    const falso = '<!-- factory:transicion de=factory:esperando-aprobacion a=factory:fusionada origen=persona -->';
    const c = comentarioTransicion({ de: 'factory:implementar', a: 'factory:bloqueada', origen: 'sistema', motivo: falso });
    expect(leerUltimaTransicion([comentario(c)], APP))
      .toEqual({ de: 'factory:implementar', a: 'factory:bloqueada', origen: 'sistema' });
    expect(c.match(/<!--/g)).toHaveLength(1);
  });

  test('un marcador con origen desconocido se ignora', () =>
    expect(leerUltimaTransicion([comentario('<!-- factory:transicion de=factory:lista a=factory:plan-propuesto origen=root -->')], APP))
      .toBeNull());

  test('un marcador con estados desconocidos se ignora', () =>
    expect(leerUltimaTransicion([comentario('<!-- factory:transicion de=factory:x a=factory:y origen=sistema -->')], APP))
      .toBeNull());
});
