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

  // Peso crescente em direção ao fundo do funil: uma etapa lá embaixo já
  // consumiu todas as anteriores, então perder ali custa mais caro.
  var PESOS = {
    responde:  0.15,
    engaja:    0.15,
    agenda:    0.25,
    comparece: 0.20,
    fecha:     0.25
  };

  var FAIXAS_INDICE = [
    { chave:'critico', rotulo:'Crítico',         min:0  },
    { chave:'abaixo',  rotulo:'Abaixo da média', min:40 },
    { chave:'media',   rotulo:'Na média',        min:60 },
    { chave:'forte',   rotulo:'Forte',           min:75 },
    { chave:'elite',   rotulo:'Elite',           min:90 }
  ];

  function indice(notas) {
    var soma = 0;
    for (var i = 0; i < ETAPAS.length; i++) {
      var e = ETAPAS[i];
      soma += PESOS[e] * (notas[e] || 0);
    }
    return soma;
  }

  function faixaIndice(valor) {
    var escolhida = FAIXAS_INDICE[0];
    for (var i = 0; i < FAIXAS_INDICE.length; i++) {
      if (valor >= FAIXAS_INDICE[i].min) escolhida = FAIXAS_INDICE[i];
    }
    return { chave: escolhida.chave, rotulo: escolhida.rotulo };
  }

  // Menor nota. O `<=` é o que faz o empate cair na etapa mais ao fundo,
  // porque ETAPAS está em ordem de funil.
  function gargalo(notas) {
    var escolhida = ETAPAS[0];
    var menor = notas[ETAPAS[0]];
    for (var i = 1; i < ETAPAS.length; i++) {
      var e = ETAPAS[i];
      if (notas[e] <= menor) { menor = notas[e]; escolhida = e; }
    }
    return escolhida;
  }

  // Abaixo disto o diagnóstico sai marcado como estimativa. Uma clínica
  // com 15 leads e 1 fechamento normaliza para 7/100 e devolveria "bom",
  // o que é ruído, não sinal.
  var VOLUME_MINIMO = 30;

  // Ponto médio da faixa "bom" da etapa — o alvo que os cenários usam.
  function alvoBom(etapa) {
    var faixas = FAIXAS[etapa];
    for (var i = 0; i < faixas.length; i++) {
      if (faixas[i].chave === 'bom') {
        var fim = (i + 1 < faixas.length) ? faixas[i + 1].min : 100;
        return (faixas[i].min + fim) / 2;
      }
    }
    return 100;
  }

  // Projeta um funil de 100 leads a partir de um mapa etapa -> taxa.
  function projetar(taxas) {
    var atual = 100;
    var saida = {};
    for (var i = 0; i < ETAPAS.length; i++) {
      atual = atual * (taxas[ETAPAS[i]] / 100);
      saida[ETAPAS[i]] = atual;
    }
    return saida;
  }

  function cenario(taxasBase, etapasAlteradas, contagensHoje) {
    var taxas = {};
    for (var i = 0; i < ETAPAS.length; i++) {
      var e = ETAPAS[i];
      taxas[e] = etapasAlteradas.indexOf(e) >= 0 ? alvoBom(e) : taxasBase[e];
    }
    var proj = projetar(taxas);
    return {
      etapas: ETAPAS.map(function (e) {
        return { etapa: e, antes: Math.round(contagensHoje[e]), depois: Math.round(proj[e]) };
      }),
      fechamentosPor100: Math.round(proj.fecha)
    };
  }

  function diagnostico(entrada) {
    var taxas = {}, notas = {}, contagens = {}, detalhe = [];
    var leads = entrada.leads || 0;
    var fator = leads > 0 ? 100 / leads : 0;

    for (var i = 0; i < ETAPAS.length; i++) {
      var e = ETAPAS[i];
      var de = entrada[ORIGEM[e].de] || 0;
      var para = entrada[ORIGEM[e].para] || 0;
      var t = taxa(para, de);
      taxas[e] = t;
      notas[e] = notaEtapa(e, t);
      contagens[e] = para * fator;
      detalhe.push({ etapa: e, de: de, para: para, taxa: t, nota: notas[e], faixa: faixaEtapa(e, t) });
    }

    var valorIndice = indice(notas);
    var pior = gargalo(notas);

    return {
      indice: valorIndice,
      faixaIndice: faixaIndice(valorIndice),
      etapas: detalhe,
      gargalo: pior,
      fechamentosPor100: Math.round((entrada.fecham || 0) * fator),
      estimativa: leads < VOLUME_MINIMO,
      cenarioGargalo: cenario(taxas, [pior], contagens),
      cenarioTudoBom: cenario(taxas, ETAPAS.slice(), contagens)
    };
  }

  raiz.MotorClinics = {
    CAMPOS: CAMPOS,
    ETAPAS: ETAPAS,
    ORIGEM: ORIGEM,
    FAIXAS: FAIXAS,
    PESOS: PESOS,
    VOLUME_MINIMO: VOLUME_MINIMO,
    alvoBom: alvoBom,
    diagnostico: diagnostico,
    taxa: taxa,
    faixaEtapa: faixaEtapa,
    notaEtapa: notaEtapa,
    indice: indice,
    faixaIndice: faixaIndice,
    gargalo: gargalo
  };

})(typeof window !== 'undefined' ? window : globalThis);
