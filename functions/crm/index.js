import { handleBoard, reply } from '../../server/crm-board.mjs';

async function authenticated(request, kv) {
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Basic ') || header.length > 256) return false;
  let login;
  try {
    login = atob(header.slice(6));
  } catch {
    return false;
  }
  if (!login.startsWith('andre:')) return false;
  const verifier = await kv.get('auth:crm-password-sha256');
  if (!verifier || !/^[a-f0-9]{64}$/.test(verifier)) return false;
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(login.slice(6))));
  let difference = 0;
  for (let i = 0; i < digest.length; i++) {
    difference |= digest[i] ^ Number.parseInt(verifier.slice(i * 2, i * 2 + 2), 16);
  }
  return difference === 0;
}

export async function onRequest({ request, env }) {
  if (env.AUDITOR_CRM_ENABLED !== '1' || !env.LEADS_KV) return reply('Página indisponível.', 404);
  try {
    if (!await authenticated(request, env.LEADS_KV)) {
      return reply('Entre para acessar o quadro.', 401, { 'WWW-Authenticate': 'Basic realm="Lead Flow Studio", charset="UTF-8"' });
    }
    return await handleBoard(request, env.LEADS_KV);
  } catch {
    return reply('O quadro está temporariamente indisponível. Tente novamente.', 503);
  }
}
