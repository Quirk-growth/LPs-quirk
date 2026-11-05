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
