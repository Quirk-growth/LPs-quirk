// ── Prepara o lead: deriva o texto do diagnóstico e o tier ──────────────
// A página manda números; quem liga precisa de frase. A cópia do
// diagnóstico mora AQUI, não na página, porque é o e-mail que a consome.
// A página envia form-urlencoded (requisição simples, sem preflight CORS),
// então todo valor chega como string. Aceita também JSON e corpo em texto,
// para o workflow não quebrar se alguém mudar o envio depois.
const entrada = $input.first().json;
let p = entrada.body ?? entrada;
if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = {}; } }

const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

const ORIGEM = {
  responde:  ['leads',      'respondem'],
  engaja:    ['respondem',  'engajam'],
  agenda:    ['engajam',    'agendam'],
  comparece: ['agendam',    'comparecem'],
  fecha:     ['comparecem', 'fecham']
};

const NOME = {
  responde:'Resposta', engaja:'Engajamento', agenda:'Agendamento',
  comparece:'Comparecimento', fecha:'Fechamento'
};

const pl = (n, um, muitos) => (n === 1 ? um : muitos);

const COPY = {
  responde: (de, para) => [
    `De cada ${de} ${pl(de,'pessoa que chega','pessoas que chegam')}, só ${para} ${pl(para,'responde','respondem')}.`,
    'A maior parte do que ele paga em anúncio morre antes da primeira conversa. Normalmente é velocidade de resposta e primeira mensagem.'],
  engaja: (de, para) => [
    `De cada ${de} que ${pl(de,'responde','respondem')}, só ${para} ${pl(para,'continua','continuam')} a conversa.`,
    'O time conversa, mas não prende. Falta qualificação e condução — a pessoa responde e some.'],
  agenda: (de, para) => [
    `De cada ${de} ${pl(de,'pessoa interessada','pessoas interessadas')}, só ${para} ${pl(para,'marca','marcam')} consulta.`,
    'Elas queriam. Perguntaram preço, procedimento, horário — e não fecharam a agenda. Falta pedir o agendamento de forma direta.'],
  comparece: (de, para) => [
    `De cada ${de} ${pl(de,'pessoa que agenda','pessoas que agendam')}, só ${para} ${pl(para,'aparece','aparecem')}.`,
    'Parte da agenda evapora antes da consulta. Ele já pagou o anúncio, já respondeu, já convenceu a marcar — e perde ali. É a etapa mais barata de arrumar da clínica inteira.'],
  fecha: (de, para) => [
    `De cada ${de} ${pl(de,'pessoa que senta','pessoas que sentam')} na cadeira, só ${para} ${pl(para,'fecha','fecham')}.`,
    'A pessoa foi até a clínica e saiu sem comprar. Isso é consulta: diagnóstico, apresentação de proposta e fechamento.']
};

const gargalo = String(p.gargalo || 'agenda');
const [campoDe, campoPara] = ORIGEM[gargalo] || ORIGEM.agenda;
const de = num(p[campoDe]), para = num(p[campoPara]);
const [titulo, porque] = (COPY[gargalo] || COPY.agenda)(de, para);

// Funil normalizado por 100 leads — o mesmo número que a pessoa viu na
// tela. Mandar a contagem bruta num e-mail que diz "a cada 100" foi
// exatamente o defeito que o review pegou na página.
const leads = num(p.leads);
const por100 = {};
if (leads > 0) {
  let atual = 100;
  for (const etapa of Object.keys(ORIGEM)) {
    const [cDe, cPara] = ORIGEM[etapa];
    const base = num(p[cDe]);
    const taxa = base > 0 ? (num(p[cPara]) / base) : 0;
    atual = atual * taxa;
    por100[etapa] = Math.round(atual);
  }
}
const funilLinha = leads > 0
  ? `100 leads → ${por100.responde} respondem → ${por100.engaja} engajam → ` +
    `${por100.agenda} agendam → ${por100.comparece} comparecem → ${por100.fecha} fecham`
  : 'funil sem leads informados';

// Tier: volume × desperdício. Quem tem muito lead e converte mal é quem
// tem mais dinheiro na mesa — é esse que o comercial liga primeiro.
const indice = num(p.indice);
let tier = 'cold';
if (leads >= 100 && indice < 65)      tier = 'hot';
else if (leads >= 30 && indice < 65)  tier = 'warm';
else if (leads >= 30)                 tier = 'warm';

const estimativa = p.estimativa === true || p.estimativa === 'true';

// first_name vem minúsculo de propósito (normalização do advanced matching
// do Meta). Para cumprimentar alguém num e-mail isso não serve.
const primeiro = String(p.first_name || '').trim();
const primeiroNome = primeiro ? primeiro.charAt(0).toUpperCase() + primeiro.slice(1) : '';
// A saudação inteira vem montada: sem nome, "Olá," em vez de "Olá ,".
const saudacao = primeiroNome ? `Olá ${primeiroNome},` : 'Olá,';

return [{ json: {
  ...p,
  primeiro_nome: primeiroNome,
  saudacao,
  gargalo_nome: NOME[gargalo] || gargalo,
  diagnostico_titulo: titulo,
  diagnostico_porque: porque,
  funil_por_100: funilLinha,
  tier,
  estimativa_texto: estimativa ? 'SIM — volume baixo ou etapa não medida, tratar como estimativa' : 'não',
  assunto_interno: `[Lead Calculadora Clinics] ${p.nome || 'sem nome'} — índice ${indice} (${tier})`
}}];
