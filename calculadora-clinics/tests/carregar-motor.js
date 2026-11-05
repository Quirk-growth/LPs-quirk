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

const contexto = { window: undefined };
contexto.globalThis = contexto;
vm.createContext(contexto);
vm.runInContext(fonte, contexto, { filename: 'motor.js' });

if (!contexto.MotorClinics) {
  throw new Error('motor.js não publicou MotorClinics no objeto global');
}

module.exports = contexto.MotorClinics;
