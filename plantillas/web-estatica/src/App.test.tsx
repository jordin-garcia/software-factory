import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { App } from './App';

afterEach(cleanup);

test('muestra el nombre del proyecto como título principal', () => {
  render(<App />);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('__NOMBRE__');
});
