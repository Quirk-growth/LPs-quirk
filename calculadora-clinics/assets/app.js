/* =====================================================================
   Calculadora de Conversão Quirk Clinics — interface
   ---------------------------------------------------------------------
   Consome MotorClinics (assets/motor.js). Toda a matemática mora lá e é
   testada sem browser; aqui só tem passos, validação de tela, render e
   envio.

   REGRA QUE NÃO PODE SER QUEBRADA
   Esta página NUNCA dispara um evento `submit` nativo. Não existe
   <form>; todos os botões são type="button". O container GTM-TGBQHFJ9 é
   compartilhado com outras LPs e tem um listener de formulário sem
   filtro — foi isso que duplicou conversões na LP da Clinics.
   ===================================================================== */
(function () {
  'use strict';

  // Webhook do n8n (workflow "Calculadora Clinics — leads").
  // O workflow precisa estar ATIVO: inativo, o n8n devolve 404 e o lead
  // se perde silenciosamente, porque o envio é no-cors e não dá para ler
  // a resposta.
  var WEBHOOK_URL = 'https://n8n.quirkgrowth.online/webhook/calculadora-clinics';

  var PIXEL = '1669763490913089';
  var M = window.MotorClinics;
  var dl = (window.dataLayer = window.dataLayer || []);

  var passos = Array.prototype.slice.call(document.querySelectorAll('.passo'));
  var fill = document.getElementById('progresso-fill');
  var painel = document.getElementById('resultado');
  var atual = 0;

  /* ---------------- navegação ---------------- */

  function mostrar(i) {
    passos.forEach(function (p, k) { p.classList.toggle('ativo', k === i); });
    atual = i;
    fill.style.width = Math.round((i / (passos.length - 1)) * 100) + '%';
    var campo = passos[i].querySelector('input');
    if (campo) setTimeout(function () { campo.focus(); }, 60);
    passos[i].scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function erro(i, msg) {
    var el = passos[i].querySelector('[data-erro]');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('visivel', !!msg);
  }

  function num(id) {
    var v = document.getElementById(id).value.trim();
    if (v === '') return null;
    var n = Number(v);
    return (isFinite(n) && n >= 0) ? Math.floor(n) : null;
  }

  function coletaFunil() {
    var e = {};
    M.CAMPOS.forEach(function (c) { e[c] = num(c); });
    return e;
  }

  // Valida o passo atual. Passos 1..6 são os números do funil; o 7 é o
  // contato. Cada número é checado contra o anterior assim que é
  // digitado, não só no fim — errar na etapa 3 e descobrir na 6 é ruim.
  function validarPasso(i) {
    erro(i, '');

    if (i >= 1 && i <= 6) {
      var campo = M.CAMPOS[i - 1];
      var valor = num(campo);
      if (valor === null) { erro(i, 'Preencha este número para continuar.'); return false; }
      if (i === 1 && valor === 0) { erro(i, 'Sem leads não há funil para diagnosticar.'); return false; }

      // Só reclama de campo JÁ preenchido: os de baixo ainda estão vazios
      // e `validarFunil` acusaria ausência. Mas se a incoerência aponta
      // para um campo anterior, a mensagem aparece — antes isso era
      // engolido e a pessoa seguia com funil impossível até o resultado.
      var v = M.validarFunil(coletaFunil());
      if (!v.ok && M.CAMPOS.indexOf(v.campo) <= i - 1) { erro(i, v.mensagem); return false; }
      return true;
    }

    if (i === 7) {
      var f = document.getElementById('nome').value.trim();
      var w = document.getElementById('whatsapp').value.replace(/\D/g, '');
      var m = document.getElementById('email').value.trim();
      if (!f) { erro(i, 'Precisamos do seu nome.'); return false; }
      if (w.length < 10) { erro(i, 'Confira o WhatsApp — faltam dígitos.'); return false; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m)) { erro(i, 'Confira o e-mail.'); return false; }
      return true;
    }

    return true;
  }

  document.querySelectorAll('[data-avancar]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!validarPasso(atual)) return;
      if (atual < passos.length - 1) mostrar(atual + 1);
    });
  });

  document.querySelectorAll('[data-voltar]').forEach(function (b) {
    b.addEventListener('click', function () { if (atual > 0) mostrar(atual - 1); });
  });

  // Enter avança, sem passar por evento submit nativo.
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    // Enter em cima de um link ou de outro botão é daquele elemento, não
    // nosso: sequestrar fazia o foco no "Voltar" avançar o passo.
    if (e.target && e.target.closest && e.target.closest('a,button')) return;
    if (!painel.classList.contains('ativo')) {
      e.preventDefault();
      var btn = passos[atual].querySelector('[data-avancar]') || document.getElementById('enviar');
      if (btn) btn.click();
    }
  });

  (function mascaraTelefone() {
    var el = document.getElementById('whatsapp');
    el.addEventListener('input', function (ev) {
      var v = ev.target.value.replace(/\D/g, '').slice(0, 11);
      if (v.length > 6) v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
      else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
      ev.target.value = v;
    });
  })();

  /* ---------------- resultado ---------------- */

  var COR_FAIXA = { abaixo:'var(--f-abaixo)', medio:'var(--f-medio)', bom:'var(--f-bom)', excelente:'var(--f-excelente)' };
  var TINTA_FAIXA = { abaixo:'var(--f-tinta-clara)', medio:'var(--f-tinta-clara)', bom:'var(--f-tinta-escura)', excelente:'var(--f-tinta-escura)' };
  var NOME_ETAPA = { responde:'Respondem', engaja:'Engajam', agenda:'Agendam', comparece:'Comparecem', fecha:'Fecham' };
  // Forma nominal, para o título do cenário: "Você arruma só o
  // agendamento" — nunca "Você arruma só agendam".
  var NOME_NOMINAL = { responde:'a resposta', engaja:'o engajamento', agenda:'o agendamento',
                       comparece:'o comparecimento', fecha:'o fechamento' };
  // Preposição já contraída: "antes do comparecimento", não "antes de o".
  var NOME_DE = { responde:'da resposta', engaja:'do engajamento', agenda:'do agendamento',
                  comparece:'do comparecimento', fecha:'do fechamento' };

  // O diagnóstico fala em gente, nunca em taxa. Dono de clínica pensa em
  // pessoas; "taxa de comparecimento de 50%" não diz nada a ele.
  // Concordância: "só 1 aparecem" é o tipo de erro que o dono da clínica
  // lê como desleixo, e ele está julgando a Quirk pela tela.
  function pl(n, um, muitos) { return n === 1 ? um : muitos; }

  function fraseGargalo(r) {
    var et = r.etapas.filter(function (e) { return e.etapa === r.gargalo; })[0];
    var de = Math.round(et.de), para = Math.round(et.para);
    var pessoas = 'De cada ' + de + ' ' + pl(de, 'pessoa', 'pessoas');
    var textos = {
      responde:  [pessoas + pl(de, ' que chega', ' que chegam') + ', só ' + para + pl(para, ' responde.', ' respondem.'),
                  'A maior parte do que você paga em anúncio morre antes da primeira conversa. Normalmente é velocidade de resposta e primeira mensagem.'],
      engaja:    ['De cada ' + de + pl(de, ' que responde', ' que respondem') + ', só ' + para + pl(para, ' continua a conversa.', ' continuam a conversa.'),
                  'O time conversa, mas não prende. É a etapa onde falta qualificação e condução — a pessoa responde e some.'],
      agenda:    [pessoas + ' interessada' + pl(de, '', 's') + ', só ' + para + pl(para, ' marca consulta.', ' marcam consulta.'),
                  'Elas queriam. Perguntaram preço, procedimento, horário — e não fecharam a agenda. Falta pedir o agendamento de forma direta.'],
      comparece: [pessoas + pl(de, ' que agenda', ' que agendam') + ', só ' + para + pl(para, ' aparece.', ' aparecem.'),
                  'Parte da sua agenda evapora antes da consulta. Você já pagou o anúncio, já respondeu, já convenceu a marcar — e perde ali. É a etapa mais barata de arrumar da clínica inteira.'],
      fecha:     [pessoas + pl(de, ' que senta', ' que sentam') + ' na cadeira, só ' + para + pl(para, ' fecha.', ' fecham.'),
                  'A pessoa veio até você e saiu sem comprar. Isso é consulta: diagnóstico, apresentação de proposta e fechamento.']
    };
    return textos[r.gargalo];
  }

  function linhaFunil(e, ehGargalo) {
    return '<div class="linha' + (ehGargalo ? ' gargalo' : '') + '">' +
      '<span class="nome">' + NOME_ETAPA[e.etapa] + '</span>' +
      '<span class="qtd">' + e.porCem + '</span>' +
      '<div class="barra"><i style="width:' + Math.min(100, e.taxa).toFixed(1) + '%;background:' + COR_FAIXA[e.faixa.chave] + '"></i></div>' +
      '<span class="tx">' + Math.round(e.taxa) + '%</span>' +
      '<span class="fx"><span class="pill" style="background:' + COR_FAIXA[e.faixa.chave] + ';color:' + TINTA_FAIXA[e.faixa.chave] + '">' + e.faixa.rotulo + '</span></span>' +
      '</div>';
  }

  function linhaDelta(d, maximo) {
    var mudou = d.antes !== d.depois;
    return '<div class="delta">' +
      '<span class="nome">' + NOME_ETAPA[d.etapa] + '</span>' +
      '<span class="a">' + d.antes + '</span>' +
      '<span class="seta" aria-hidden="true">→</span>' +
      '<span class="b">' + d.depois + '</span>' +
      '<div class="barra"><i style="width:' + Math.min(100, (d.depois / maximo) * 100).toFixed(1) + '%;background:' + (mudou ? 'var(--f-bom)' : '#D8E3F0') + '"></i></div>' +
      '</div>';
  }

  function seloGanho(delta) {
    if (delta <= 0) return 'sem ganho aqui';
    return '+' + delta + (delta === 1 ? ' paciente' : ' pacientes');
  }

  // Math.floor, não round: 6,5× vira "6× mais", nunca "7×". Num número
  // que o comercial vai repetir, arredondar a favor é exagerar.
  function seloMultiplo(depois, antes) {
    // Sem base para multiplicar (fecha zero hoje), o múltiplo não existe
    // — o número absoluto é o que diz algo a quem está olhando.
    if (antes <= 0) {
      return depois > 0 ? '+' + depois + (depois === 1 ? ' paciente' : ' pacientes')
                        : 'sem ganho aqui';
    }
    var m = Math.floor(depois / antes);
    if (m >= 2) return m + '× mais';
    var d = depois - antes;
    return d > 0 ? '+' + d + (d === 1 ? ' paciente' : ' pacientes') : 'já está no alvo';
  }

  function blocoCenario(titulo, sub, cen, selo) {
    var maximo = Math.max.apply(null, cen.etapas.map(function (d) { return d.depois; })) || 1;
    return '<div class="cen">' +
      '<h3>' + titulo + '</h3><p class="sub">' + sub + '</p>' +
      cen.etapas.map(function (d) { return linhaDelta(d, maximo); }).join('') +
      '<div class="total"><span class="n">' + cen.fechamentosPor100 + '</span>' +
      '<span class="t">pacientes a cada 100 leads</span>' +
      '<span class="pill" style="background:var(--f-excelente);color:#fff">' + selo + '</span></div></div>';
  }

  // Duas razões diferentes marcam o diagnóstico como estimativa, e a
  // pessoa precisa saber qual é a dela: volume baixo é "margem de erro",
  // etapa zerada é "essa parte do funil não foi medida".
  function avisoEstimativa(r) {
    var zeradas = r.etapas.filter(function (e) { return !e.definida; });
    if (zeradas.length) {
      return 'Seu funil para antes ' + NOME_DE[zeradas[0].etapa] +
             ', então essa parte não foi medida — os cenários usam a média de ' +
             'mercado dali para frente. Trate este diagnóstico como estimativa.';
    }
    return 'Com menos de ' + M.VOLUME_MINIMO + ' leads por mês, um paciente a mais ' +
           'ou a menos muda muito o resultado. Trate este diagnóstico como estimativa.';
  }

  function renderResultado(r) {
    var g = fraseGargalo(r);
    var html = '';

    html += '<div class="bloco"><p class="rotulo">Seu índice de conversão</p>' +
      '<div class="heroi"><span class="n">' + Math.round(r.indice) + '</span><span class="de">/ 100</span>' +
      '<span class="pill" style="background:var(--qc-blue-soft);color:var(--qc-blue-deep)">' + r.faixaIndice.rotulo + '</span></div>' +
      '<div class="trilha"><i style="flex:4;background:var(--f-abaixo)"></i><i style="flex:2;background:var(--f-medio)"></i><i style="flex:2;background:var(--f-bom)"></i><i style="flex:2;background:var(--f-excelente)"></i></div>' +
      '<p class="frase">Sua clínica fecha <strong>' + r.fechamentosPor100 + '</strong> ' +
      (r.fechamentosPor100 === 1 ? 'paciente' : 'pacientes') +
      ' a cada 100 leads. Uma operação bem ajustada fecha de 6 a 8.</p>' +
      (r.estimativa ? '<p class="aviso">' + avisoEstimativa(r) + '</p>' : '') +
      '</div>';

    html += '<div class="bloco"><p class="rotulo">Seu funil, a cada 100 leads</p>' +
      '<div class="linha"><span class="nome">Leads</span><span class="qtd">100</span>' +
      '<div class="barra"><i style="width:100%;background:#D8E3F0"></i></div>' +
      '<span class="tx"></span><span class="fx"></span></div>' +
      r.etapas.map(function (e) { return linhaFunil(e, e.etapa === r.gargalo); }).join('') + '</div>';

    html += '<div class="bloco diag"><p class="rotulo">Diagnóstico</p>' +
      '<p class="titulo">' + g[0] + '</p><p>' + g[1] + '</p></div>';

    html += '<div class="bloco"><p class="rotulo">O que muda se você arrumar</p>' +
      blocoCenario('Você arruma só ' + NOME_NOMINAL[r.gargalo],
                   'Uma etapa, a mais barata de corrigir.',
                   r.cenarioGargalo,
                   seloGanho(r.cenarioGargalo.fechamentosPor100 - r.fechamentosPor100)) +
      blocoCenario('Todas as etapas acima da média',
                   'Nenhuma etapa excelente. Só todas boas.',
                   r.cenarioTudoBom,
                   seloMultiplo(r.cenarioTudoBom.fechamentosPor100, r.fechamentosPor100)) +
      '</div>';

    html += '<div class="bloco" style="text-align:center">' +
      '<p class="frase" style="margin:0 0 18px">Quer o plano para sair do papel?</p>' +
      '<a class="btn" href="https://clinics.quirkgrowth.com.br/?utm_source=calculadora&utm_medium=resultado" data-track="cta-resultado">Falar com a Quirk Clinics<span aria-hidden="true">→</span></a>' +
      '</div>';

    painel.innerHTML = html;
    painel.classList.add('ativo');
    document.getElementById('cartao').style.display = 'none';
    fill.style.width = '100%';
    painel.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  /* ---------------- envio ---------------- */

  var botao = document.getElementById('enviar');
  var rotuloBotao = botao.innerHTML;
  var enviando = false, enviado = false;

  botao.addEventListener('click', function () {
    if (enviando || enviado) return;
    if (!validarPasso(7)) return;

    var funil = coletaFunil();
    var coerente = M.validarFunil(funil);
    if (!coerente.ok) { erro(7, coerente.mensagem); return; }

    enviando = true;
    botao.disabled = true;
    botao.innerHTML = 'Calculando…';

    var contato = {
      nome: document.getElementById('nome').value,
      email: document.getElementById('email').value,
      whatsapp: document.getElementById('whatsapp').value,
      instagram: document.getElementById('instagram').value
    };
    var r = M.diagnostico(funil);
    var payload = M.montarPayload(funil, contato, r);

    // Lead real para o Meta. Só chega aqui depois da validação passar,
    // então não existe Lead sem funil preenchido. O eventID é o mesmo do
    // webhook, que é a chave de deduplicação.
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Lead', {
        content_name: 'Calculadora Clinics',
        content_category: r.gargalo,
        value: 0, currency: 'BRL'
      }, { eventID: payload.event_id });
    }

    dl.push({
      event: 'lead_submit',
      event_id: payload.event_id,
      lead: { nome: payload.nome, email: payload.email, whatsapp: payload.whatsapp,
              first_name: payload.first_name, last_name: payload.last_name,
              instagram: payload.instagram },
      diagnostico: { indice: payload.indice, faixa: payload.faixa, gargalo: payload.gargalo,
                     fechamentos_por_100: payload.fechamentos_por_100 },
      content_name: 'Calculadora Clinics',
      value: 0, currency: 'BRL'
    });

    // O resultado aparece mesmo se o webhook falhar: a pessoa cumpriu a
    // parte dela. Perder o lead é problema nosso, não dela.
    renderResultado(r);
    enviado = true;

    // Corpo form-urlencoded e mode:'no-cors' — é o padrão que a LP do VSL
    // já usa contra este mesmo n8n. JSON cross-origin dispara preflight
    // OPTIONS; se o n8n ou o proxy não responder o preflight, o browser
    // bloqueia e o lead desaparece sem erro visível. Requisição simples
    // não tem preflight para falhar.
    //
    // keepalive: a pessoa clica no CTA e sai da página logo depois do
    // resultado. Sem isso o browser cancela o envio na navegação.
    var corpo = [];
    Object.keys(payload).forEach(function (k) {
      corpo.push(encodeURIComponent(k) + '=' + encodeURIComponent(String(payload[k])));
    });

    fetch(WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: corpo.join('&')
    }).catch(function (e) { console.error('Falha ao enviar o lead:', e); });
  });

  mostrar(0);
})();
