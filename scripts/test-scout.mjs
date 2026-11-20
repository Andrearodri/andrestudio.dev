import test from 'node:test';
import assert from 'node:assert/strict';
import { ranquear } from '../ferramentas/scout/app.mjs';
import { NICHOS } from '../ferramentas/scout/dados.mjs';

test('Scout ordena pela nota e mantém a nota entre 0 e 100', () => {
  for (const nicho of Object.values(NICHOS)) {
    const r = ranquear(nicho.anuncios);
    assert.equal(r.length, nicho.anuncios.length);
    for (let i = 1; i < r.length; i += 1) assert.ok(r[i - 1].nota >= r[i].nota);
    for (const a of r) assert.ok(a.nota >= 0 && a.nota <= 100);
  }
});

test('Scout: mais dias, variações e anúncios ativos pesam a favor', () => {
  const base = { formato: 'vídeo', gancho: '', esqueleto: [], angulo: '' };
  const r = ranquear([
    { ...base, id: 'forte', anunciante: 'X', dias: 300, variacoes: 10, ativosPagina: 8, novos14: 3 },
    { ...base, id: 'fraco', anunciante: 'Y', dias: 5, variacoes: 1, ativosPagina: 1, novos14: 0 }
  ]);
  assert.equal(r[0].id, 'forte');
  assert.equal(r[0].top, 50);
});

test('Scout: todos os anunciantes da demonstração são marcados como fictícios', () => {
  for (const nicho of Object.values(NICHOS)) {
    for (const a of nicho.anuncios) assert.match(a.anunciante, /\(fictício\)$/);
  }
});
