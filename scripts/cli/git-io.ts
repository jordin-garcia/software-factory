// Git con autenticación por cabecera HTTP, pasada por variables de entorno.
// El token nunca va en la URL ni en los argumentos, así que no aparece en los mensajes de git.
import { spawnSync } from 'node:child_process';

export function entornoGit(token: string): NodeJS.ProcessEnv {
  const credencial = Buffer.from(`x-access-token:${token}`).toString('base64');
  return {
    ...process.env,
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
    GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${credencial}`,
    GIT_TERMINAL_PROMPT: '0',
    GIT_AUTHOR_NAME: 'github-actions[bot]',
    GIT_AUTHOR_EMAIL: '41898282+github-actions[bot]@users.noreply.github.com',
    GIT_COMMITTER_NAME: 'github-actions[bot]',
    GIT_COMMITTER_EMAIL: '41898282+github-actions[bot]@users.noreply.github.com',
  };
}

export function git(args: string[], cwd: string, env: NodeJS.ProcessEnv): string {
  const r = spawnSync('git', args, { cwd, env, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${args[0]} falló (código ${r.status}): ${r.stderr.trim()}`);
  return r.stdout.trim();
}
