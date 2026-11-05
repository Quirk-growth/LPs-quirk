// Fecha a brecha que o primeiro teste expos: com onError continueRegularOutput,
// um no que falha devolve { error } e o n8n ainda marca a execucao como
// "Succeeded". Os dois e-mails morreram por credencial vencida e a lista de
// execucoes mostrou verde. Quem so olhasse ali concluiria que estava tudo bem.
//
// A blindagem continua, porque e ela que impede o efeito cascata: e-mail
// quebrado nao pode impedir a gravacao do lead nem o outro envio. O que muda e
// que a falha agora aparece. Este no roda por ultimo, le o resultado dos tres
// destinos e derruba a execucao se algum tiver erro.
const DESTINOS = [
  'Registrar na planilha',
  'E-mail interno (comercial)',
  'E-mail para o lead'
];

const falhas = [];
for (const nome of DESTINOS) {
  let itens;
  try {
    itens = $(nome).all();
  } catch (e) {
    // No que nao chegou a rodar e falha tambem: o lead nao chegou ao destino.
    falhas.push(`${nome}: nao executou`);
    continue;
  }
  for (const item of itens) {
    const erro = item.json && item.json.error;
    if (erro) falhas.push(`${nome}: ${typeof erro === 'string' ? erro : JSON.stringify(erro)}`);
  }
}

if (falhas.length) {
  throw new Error(
    'Lead recebido, mas ' + falhas.length + ' destino(s) falharam: ' + falhas.join(' | ')
  );
}

return $input.all();
