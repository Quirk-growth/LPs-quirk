const { test } = require('node:test');
const assert = require('node:assert');
const M = require('./carregar-motor.js');

test('taxa devolve percentual', () => {
  assert.strictEqual(M.taxa(45, 100), 45);
  assert.strictEqual(M.taxa(20, 45), 44.44444444444444);
});

test('taxa com denominador zero devolve 0, nunca NaN', () => {
  assert.strictEqual(M.taxa(5, 0), 0);
  assert.strictEqual(M.taxa(0, 0), 0);
});

test('faixaEtapa nos limites exatos', () => {
  assert.strictEqual(M.faixaEtapa('fecha', 34.9).chave, 'abaixo');
  assert.strictEqual(M.faixaEtapa('fecha', 35).chave, 'medio');
  assert.strictEqual(M.faixaEtapa('fecha', 50).chave, 'medio');
  assert.strictEqual(M.faixaEtapa('fecha', 51).chave, 'bom');
  assert.strictEqual(M.faixaEtapa('fecha', 66).chave, 'excelente');
  assert.strictEqual(M.faixaEtapa('comparece', 50).chave, 'medio');
  assert.strictEqual(M.faixaEtapa('agenda', 40).chave, 'medio');
});

test('notaEtapa interpola dentro da faixa', () => {
  assert.strictEqual(M.notaEtapa('agenda', 40), 40);
  assert.strictEqual(M.notaEtapa('comparece', 50), 40);
  assert.ok(Math.abs(M.notaEtapa('responde', 45) - 47.5) < 0.01);
  assert.ok(Math.abs(M.notaEtapa('fecha', 50) - 62.5) < 0.01);
});

test('notaEtapa nos extremos', () => {
  assert.strictEqual(M.notaEtapa('responde', 0), 0);
  assert.strictEqual(M.notaEtapa('responde', 100), 100);
});

test('indice e a media ponderada', () => {
  const notas = { responde:47.5, engaja:46.6, agenda:40, comparece:40, fecha:62.5 };
  assert.ok(Math.abs(M.indice(notas) - 47.72) < 0.05);
});

test('faixaIndice nos limites', () => {
  assert.strictEqual(M.faixaIndice(39.9).chave, 'critico');
  assert.strictEqual(M.faixaIndice(40).chave, 'abaixo');
  assert.strictEqual(M.faixaIndice(60).chave, 'media');
  assert.strictEqual(M.faixaIndice(90).chave, 'elite');
});

test('gargalo e a menor nota', () => {
  assert.strictEqual(
    M.gargalo({ responde:80, engaja:70, agenda:30, comparece:60, fecha:75 }),
    'agenda'
  );
});

test('empate escolhe a etapa mais ao fundo', () => {
  assert.strictEqual(
    M.gargalo({ responde:40, engaja:40, agenda:40, comparece:40, fecha:70 }),
    'comparece'
  );
  assert.strictEqual(
    M.gargalo({ responde:50, engaja:50, agenda:50, comparece:50, fecha:50 }),
    'fecha'
  );
});
