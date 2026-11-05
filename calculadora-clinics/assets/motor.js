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
  //
  // `elegiveis` existe porque uma etapa sem origem (denominador zero)
  // recebe nota 0 por INDEFINIÇÃO, não por desempenho ruim. Num funil
  // 100/50/25/0/0/0 o gargalo é `agenda` — comparece e fecha nunca
  // tiveram chance. Sem este filtro o desempate "mais ao fundo" entrega
  // `fecha`, a tela escreve "de cada 0 pessoas, só 0 fecham" e o closer
  // liga orientado a treinar fechamento quando o problema é agendar.
  function gargalo(notas, elegiveis) {
    var lista = (elegiveis && elegiveis.length) ? elegiveis : ETAPAS;
    var escolhida = lista[0];
    var menor = notas[lista[0]];
    for (var i = 1; i < lista.length; i++) {
      var e = lista[i];
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

  // `naoMedidas` recebe as etapas cujo denominador é zero hoje. A taxa
  // delas não é 0% — é desconhecida. Projetá-las como 0 fazia o cenário
  // "arruma só o gargalo" render zero paciente exatamente para a clínica
  // mais quebrada, que é quem mais precisa de ver o ganho. A média de
  // mercado é a única suposição não arbitrária; em troca, o diagnóstico
  // sai marcado como estimativa.
  function cenario(taxasBase, etapasAlteradas, contagensHoje, naoMedidas) {
    var taxas = {};
    for (var i = 0; i < ETAPAS.length; i++) {
      var e = ETAPAS[i];
      // Math.max: uma clínica que já está acima do alvo não pode ser
      // "corrigida" para baixo. Sem isto, um funil forte via a tela
      // recomendar que ele piorasse, com selo "+-7 pacientes".
      var projeta = etapasAlteradas.indexOf(e) >= 0 ||
                    (naoMedidas && naoMedidas.indexOf(e) >= 0);
      taxas[e] = projeta ? Math.max(taxasBase[e], alvoBom(e)) : taxasBase[e];
    }
    var proj = projetar(taxas);
    return {
      etapas: ETAPAS.map(function (e) {
        return { etapa: e, antes: Math.round(contagensHoje[e]), depois: Math.round(proj[e]) };
      }),
      fechamentosPor100: Math.round(proj.fecha)
    };
  }

  var ROTULO_CAMPO = {
    leads: 'leads', respondem: 'respostas', engajam: 'engajamentos',
    agendam: 'agendamentos', comparecem: 'comparecimentos', fecham: 'fechamentos'
  };

  // Fala em CAMPOS, não em ETAPAS: devolve o input que a pessoa errou.
  // Sem isto, um funil com mais agendamentos que leads produz diagnóstico
  // sem sentido e envenena o lead no comercial.
  function validarFunil(entrada) {
    for (var n = 0; n < CAMPOS.length; n++) {
      var v = entrada[CAMPOS[n]];
      if (typeof v !== 'number' || !isFinite(v) || v < 0) {
        return { ok: false, campo: CAMPOS[n],
                 mensagem: 'Preencha o número de ' + ROTULO_CAMPO[CAMPOS[n]] + '.' };
      }
    }
    for (var i = 1; i < CAMPOS.length; i++) {
      var atual = entrada[CAMPOS[i]], anterior = entrada[CAMPOS[i - 1]];
      if (atual > anterior) {
        return {
          ok: false,
          campo: CAMPOS[i],
          mensagem: 'Não dá para ter mais ' + ROTULO_CAMPO[CAMPOS[i]] +
                    ' do que ' + ROTULO_CAMPO[CAMPOS[i - 1]] + '. Confira o número.'
        };
      }
    }
    return { ok: true };
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
      detalhe.push({
        etapa: e, de: de, para: para, taxa: t, nota: notas[e],
        faixa: faixaEtapa(e, t),
        porCem: Math.round(contagens[e]),   // a tela mostra ISTO, não o bruto
        definida: de > 0
      });
    }

    var valorIndice = indice(notas);
    var elegiveis = detalhe.filter(function (d) { return d.definida; })
                           .map(function (d) { return d.etapa; });
    var naoMedidas = detalhe.filter(function (d) { return !d.definida; })
                            .map(function (d) { return d.etapa; });
    var pior = gargalo(notas, elegiveis);

    return {
      indice: valorIndice,
      faixaIndice: faixaIndice(valorIndice),
      etapas: detalhe,
      gargalo: pior,
      fechamentosPor100: Math.round((entrada.fecham || 0) * fator),
      estimativa: leads < VOLUME_MINIMO || naoMedidas.length > 0,
      cenarioGargalo: cenario(taxas, [pior], contagens, naoMedidas),
      cenarioTudoBom: cenario(taxas, ETAPAS.slice(), contagens, naoMedidas)
    };
  }

  // Payload plano. O cenário do Make é quem monta o respostas[] do CRM.
  // Normaliza aqui para o advanced matching do Meta: minúsculas, e
  // telefone só dígitos com 55 na frente.
  // Lê a query string sem URLSearchParams, que não existe no ambiente de
  // teste do motor (e o motor não pode tocar browser).
  var UTMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];
  function lerUtms(busca) {
    var achados = {}, i;
    for (i = 0; i < UTMS.length; i++) achados[UTMS[i]] = '';
    var cru = String(busca || '').replace(/^\?/, '');
    if (!cru) return achados;
    var pares = cru.split('&');
    for (i = 0; i < pares.length; i++) {
      var corte = pares[i].indexOf('=');
      if (corte < 0) continue;
      var chave = pares[i].slice(0, corte);
      if (UTMS.indexOf(chave) < 0) continue;
      try { achados[chave] = decodeURIComponent(pares[i].slice(corte + 1).replace(/\+/g, ' ')); }
      catch (e) { achados[chave] = pares[i].slice(corte + 1); }
    }
    return achados;
  }

  function montarPayload(funil, contato, resultado, busca) {
    var nomeCompleto = String(contato.nome || '').trim();
    // Tira título de tratamento antes de partir o nome: neste mercado
    // "Dra Ana Paula" é o caso comum, e sem isto o first_name vira "dra".
    // Casa a palavra inteira, então "Drago" não é confundido com "Dra".
    var partes = nomeCompleto.split(/\s+/).filter(function (w) {
      return !/^(dr|dra|drs|doutor|doutora|prof|profa|professor|professora)\.?$/i.test(w);
    });
    if (!partes.length) partes = nomeCompleto.split(/\s+/);
    // Decide por COMPRIMENTO, não por prefixo: DDD 55 é Santa Maria, e
    // testar /^55/ fazia (55) 99999-8888 virar 55999998888 — 11 dígitos,
    // sem código de país. O lead chegava no CRM com número impossível.
    var tel = String(contato.whatsapp || '').replace(/\D/g, '');
    if (tel && tel.length <= 11) tel = '55' + tel;
    var ig = String(contato.instagram || '').trim().replace(/^@+/, '');

    var p = {
      nome: nomeCompleto,
      email: String(contato.email || '').trim().toLowerCase(),
      whatsapp: tel,
      instagram: ig ? '@' + ig : '',
      first_name: (partes[0] || '').toLowerCase(),
      last_name: (partes.slice(1).join(' ') || '').toLowerCase(),

      indice: Math.round(resultado.indice),
      faixa: resultado.faixaIndice.rotulo,
      gargalo: resultado.gargalo,
      fechamentos_por_100: resultado.fechamentosPor100,
      estimativa: resultado.estimativa,

      origem: 'Calculadora Clinics',
      url: (typeof location !== 'undefined') ? location.href : '',
      enviado_em: new Date().toISOString(),
      event_id: 'lead_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11),
      event_name: 'Lead'
    };
    p.event_source_url = p.url;

    // Atribuição: esta página vive numa URL própria, trackeada separado da
    // LP. Sem UTM o lead chega no hub sem saber qual anúncio pagou por ele.
    var utms = lerUtms(busca !== undefined ? busca
                       : ((typeof location !== 'undefined') ? location.search : ''));
    for (var u = 0; u < UTMS.length; u++) p[UTMS[u]] = utms[UTMS[u]];

    for (var i = 0; i < CAMPOS.length; i++) p[CAMPOS[i]] = funil[CAMPOS[i]];
    return p;
  }

  raiz.MotorClinics = {
    montarPayload: montarPayload,
    CAMPOS: CAMPOS,
    ETAPAS: ETAPAS,
    ORIGEM: ORIGEM,
    FAIXAS: FAIXAS,
    PESOS: PESOS,
    VOLUME_MINIMO: VOLUME_MINIMO,
    alvoBom: alvoBom,
    validarFunil: validarFunil,
    diagnostico: diagnostico,
    taxa: taxa,
    faixaEtapa: faixaEtapa,
    notaEtapa: notaEtapa,
    indice: indice,
    faixaIndice: faixaIndice,
    gargalo: gargalo
  };

})(typeof window !== 'undefined' ? window : globalThis);
