/* =====================================================================
   Motor de cálculo — Calculadora de Conversão Quirk Clinics
   ---------------------------------------------------------------------
   Funções puras. NÃO toca DOM, não conhece a interface.

   É essa fronteira que permite testar a matemática sem browser:
   tests/carregar-motor.js executa este arquivo num contexto isolado do
   Node. Se alguém colocar document ou window aqui dentro, os testes
   param de rodar.

   DOIS ESPAÇOS DE NOME, de propósito:

     CAMPOS   quantidades que a pessoa preenche  (agendam)
     ETAPAS   transições que recebem nota        (agenda)

   Nota, faixa e gargalo falam em ETAPAS. A validação fala em CAMPOS,
   porque ela aponta para o input que a pessoa errou.
   ===================================================================== */
(function (raiz) {
  'use strict';

  var CAMPOS = ['leads', 'respondem', 'engajam', 'agendam', 'comparecem', 'fecham'];
  var ETAPAS = ['responde', 'engaja', 'agenda', 'comparece', 'fecha'];

  // Cada transição: de qual campo para qual campo.
  var ORIGEM = {
    responde:  { de: 'leads',      para: 'respondem'  },
    engaja:    { de: 'respondem',  para: 'engajam'    },
    agenda:    { de: 'engajam',    para: 'agendam'    },
    comparece: { de: 'agendam',    para: 'comparecem' },
    fecha:     { de: 'comparecem', para: 'fecham'     }
  };

  // Limiares em percentual, `min` inclusivo. Copiados da spec.
  var FAIXAS = {
    responde:  [{ chave:'abaixo', rotulo:'Abaixo da média', min:0 }, { chave:'medio', rotulo:'Médio', min:40 }, { chave:'bom', rotulo:'Bom', min:56 }, { chave:'excelente', rotulo:'Excelente', min:71 }],
    engaja:    [{ chave:'abaixo', rotulo:'Abaixo da média', min:0 }, { chave:'medio', rotulo:'Médio', min:40 }, { chave:'bom', rotulo:'Bom', min:56 }, { chave:'excelente', rotulo:'Excelente', min:71 }],
    agenda:    [{ chave:'abaixo', rotulo:'Abaixo da média', min:0 }, { chave:'medio', rotulo:'Médio', min:40 }, { chave:'bom', rotulo:'Bom', min:61 }, { chave:'excelente', rotulo:'Excelente', min:76 }],
    comparece: [{ chave:'abaixo', rotulo:'Abaixo da média', min:0 }, { chave:'medio', rotulo:'Médio', min:50 }, { chave:'bom', rotulo:'Bom', min:71 }, { chave:'excelente', rotulo:'Excelente', min:86 }],
    fecha:     [{ chave:'abaixo', rotulo:'Abaixo da média', min:0 }, { chave:'medio', rotulo:'Médio', min:35 }, { chave:'bom', rotulo:'Bom', min:51 }, { chave:'excelente', rotulo:'Excelente', min:66 }]
  };

  // Faixa de nota de cada faixa de taxa. A nota é interpolada DENTRO da
  // faixa — e não fixa por faixa, como no motor da calculadora de VGV.
  // Com nota fixa, um funil inteiro na mesma faixa empata em tudo, o
  // gargalo sai por desempate e o cenário de correção rende zero.
  var NOTA_FAIXA = {
    abaixo:    [0, 39],
    medio:     [40, 64],
    bom:       [65, 89],
    excelente: [90, 100]
  };

  function taxa(num, den) {
    if (!den || den <= 0) return 0;
    return (num / den) * 100;
  }

  function faixaEtapa(etapa, t) {
    var faixas = FAIXAS[etapa];
    var escolhida = faixas[0];
    for (var i = 0; i < faixas.length; i++) {
      if (t >= faixas[i].min) escolhida = faixas[i];
    }
    return { chave: escolhida.chave, rotulo: escolhida.rotulo };
  }

  function notaEtapa(etapa, t) {
    var faixas = FAIXAS[etapa];
    var i = 0;
    for (var k = 0; k < faixas.length; k++) {
      if (t >= faixas[k].min) i = k;
    }
    var taxaMin = faixas[i].min;
    var taxaMax = (i + 1 < faixas.length) ? faixas[i + 1].min : 100;
    var nota = NOTA_FAIXA[faixas[i].chave];

    if (taxaMax <= taxaMin) return nota[1];
    var dentro = (t - taxaMin) / (taxaMax - taxaMin);
    if (dentro < 0) dentro = 0;
    if (dentro > 1) dentro = 1;
    return nota[0] + dentro * (nota[1] - nota[0]);
  }

  raiz.MotorClinics = {
    CAMPOS: CAMPOS,
    ETAPAS: ETAPAS,
    ORIGEM: ORIGEM,
    FAIXAS: FAIXAS,
    taxa: taxa,
    faixaEtapa: faixaEtapa,
    notaEtapa: notaEtapa
  };

})(typeof window !== 'undefined' ? window : globalThis);
