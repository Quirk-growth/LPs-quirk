// Carrega assets/motor.js num contexto isolado e devolve o MotorClinics.
//
// O motor é um arquivo de browser: não usa require nem export, publica no
// objeto global. Este carregador existe para que o MESMO arquivo sirva a
// página e os testes, sem build e sem duplicar a lógica.

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const caminho = path.join(__dirname, '..', 'assets', 'motor.js');
const fonte = fs.readFileSync(caminho, 'utf8');

// runInThisContext, e não createContext: um contexto novo é outro realm,
// onde Array e Object têm prototypes diferentes dos do processo de teste.
// Isso faz assert.deepStrictEqual recusar arrays idênticos com
// "same structure but not reference-equal" — um falso negativo que
// custa caro pra diagnosticar.
vm.runInThisContext(fonte, { filename: 'motor.js' });

if (!globalThis.MotorClinics) {
  throw new Error('motor.js não publicou MotorClinics no objeto global');
}

module.exports = globalThis.MotorClinics;
