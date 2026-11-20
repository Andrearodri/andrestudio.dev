// Roda um script Python com o executável certo em cada sistema:
// no Windows, "python3" costuma abrir o atalho da Microsoft Store em vez do Python.
import { spawnSync } from 'node:child_process';

export const PYTHON = process.platform === 'win32' ? 'python' : 'python3';

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('run-python.mjs')) {
  const r = spawnSync(PYTHON, process.argv.slice(2), { stdio: 'inherit' });
  process.exit(r.status ?? 1);
}
