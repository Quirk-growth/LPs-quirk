# Calculadora de Conversão — Quirk Clinics

**Produção:** https://clinics.quirkgrowth.com.br/calculadora/
**Owner:** Renan Real · contato@quirkgrowth.com.br
**Spec:** `../docs/superpowers/specs/2026-11-04-calculadora-clinics-design.md`

Isca de captação para donos de clínica. A pessoa informa seis números do
funil, recebe o diagnóstico de onde perde paciente, e vira lead
enriquecido no hub da Quirk — o closer abre a ligação já sabendo onde
aquela clínica sangra.

---

## ⚠️ Antes de publicar

**O cenário do Make não existe.** `assets/app.js` aponta para
`SUBSTITUIR_PELO_WEBHOOK_DA_CALCULADORA`. Sem trocar isso, o lead não
tem destino — a página mostra o diagnóstico e o lead se perde.

**Conferir a Ferramenta de Configuração de Eventos do Meta** para
`clinics.quirkgrowth.com.br/calculadora/`. Aquelas regras casam por
**texto de botão**, e esta página tem botões com texto parecido com o da
LP. Uma regra dessas gerou semanas de conversão fantasma na LP.

---

## As regras que não podem ser quebradas

**Não existe `<form>` nesta página, e nenhum botão é `type="submit"`.**
O container `GTM-TGBQHFJ9` é compartilhado com outras LPs e tem um
listener de formulário sem filtro. Foi ele que duplicou conversões na LP
da Clinics. Se alguém introduzir um `<form>` com botão de submit aqui, a
duplicação volta.

**`fbq('set','autoConfig',false,...)` vem ANTES do `init`.** Sem isso o
Pixel baixa uma config de ~135 KB e passa a inferir eventos a partir de
cliques em botão — conversões fantasma.

**O motor não toca DOM.** `assets/motor.js` é testado sem browser por
`tests/carregar-motor.js`, que executa o arquivo no Node. Se alguém
colocar `document` ou `window` lá dentro, os testes param de rodar.

---

## Build

O CSS é **embutido** no `index.html` para eliminar um round trip. A
fonte editável continua sendo `assets/styles.css`.

```bash
python3 build.py
```

Esquecer de rodar significa que o site não muda — falha visível, não
silenciosa.

## Testes

```bash
node --test "tests/*.test.js"
```

Sem framework, sem instalar nada: `node:test` é nativo. Cobrem taxa,
faixa, interpolação de nota, índice, gargalo com desempate, os dois
cenários, validação de funil e montagem do payload.

---

## O modelo

Funil de seis etapas, médias de mercado para lead de **tráfego pago**:

| Etapa | Por 100 leads | Taxa |
|---|---|---|
| Leads | 100 | — |
| Respondem | 50 | 50% |
| Engajam | 25 | 50% |
| Agendam | 10–15 | 40–60% |
| Comparecem | 5–10 | ~60% |
| Fecham | 2–5 | ~47% |

A nota de cada etapa é **interpolada dentro da faixa**, não fixa por
faixa como no motor da calculadora de VGV. Com nota fixa, um funil
inteiro na mesma faixa empata em tudo, o gargalo sai por desempate e o
cenário de correção rende zero — o argumento principal da tela desmonta.

Índice: média ponderada com peso crescente até o fechamento
(0,15 / 0,15 / 0,25 / 0,20 / 0,25).

Gargalo: menor nota; em empate, a etapa mais ao fundo, que é a que custa
mais caro.

---

## Contrato do payload

Plano, 23 campos. O cenário do Make é quem monta o `respostas[]` do CRM.

```
nome · email · whatsapp · instagram · first_name · last_name
leads · respondem · engajam · agendam · comparecem · fecham
indice · faixa · gargalo · fechamentos_por_100 · estimativa
origem · url · enviado_em · event_id · event_source_url · event_name
```

`origem` é sempre `"Calculadora Clinics"`. `estimativa` é verdadeiro
quando o volume está abaixo de 30 leads/mês e o diagnóstico é frágil.

O cenário do Make precisa de quatro módulos — CRM, e-mail interno,
e-mail para o lead, Google Sheets — **todos com tratamento de erro
`Ignore`**. A LP já entrou em loop de reenvio de e-mail quando um módulo
sem tratamento falhou e o Make reexecutou o fluxo inteiro cinco vezes.

---

## Deploy

Subpasta de `clinics.quirkgrowth.com.br`, então **herda o `.htaccess` da
LP** — incluindo cache de um ano com `immutable` em CSS e JS.

```bash
zip -r ../calculadora-clinics.zip . -x "tests/*" "build.py" "README.md" "*.DS_Store"
```

1. Extrair em `public_html/clinics.quirkgrowth.com.br/calculadora/`
2. `find . -type d -exec chmod 755 {} \;` e `find . -type f -exec chmod 644 {} \;`
3. Purgar o Cloudflare

**A disciplina do `?v=` vale desde o primeiro deploy.** Editar
`motor.js` ou `app.js` sem subir a versão no `index.html` faz a mudança
não chegar em quem já visitou. Versões atuais: `motor.js?v=1.0`,
`app.js?v=1.1`.
