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

**Importar e ATIVAR o workflow do n8n** (`n8n/calculadora-clinics.n8n.json`).
A página já aponta para
`https://n8n.quirkgrowth.online/webhook/calculadora-clinics`. Com o
workflow inativo o n8n devolve 404 e o lead **se perde em silêncio** — o
envio é `no-cors`, então a página não consegue ler a resposta e não tem
como avisar.

**Conferir a Ferramenta de Configuração de Eventos do Meta** para
`clinics.quirkgrowth.com.br/calculadora/`. Aquelas regras casam por
**texto de botão**, e esta página tem botões com texto parecido com o da
LP. Uma regra dessas gerou semanas de conversão fantasma na LP.

---

## A tela

**Duas telas, não sete.** Os seis números do funil ficam empilhados numa
tela só, visíveis sem clicar em nada; a segunda tela pede o contato.
A primeira versão tinha um número por tela atrás de um hero, e quem
abria a página não encontrava onde preencher.

**Sem travessão em nenhuma copy** (página e e-mails).

**Erro aponta o campo.** Com seis números juntos, dizer "preencha o
número de agendamentos" sem destacar o input faz a pessoa procurar.

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

Sem framework, sem instalar nada: `node:test` é nativo. 29 testes. Cobrem
taxa, faixa, interpolação de nota, índice, gargalo com desempate, os
dois cenários, validação de funil, UTM, título de tratamento no nome e
montagem do payload.

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

Plano, 29 campos, **tudo string** — o envio é form-urlencoded.

```
nome · email · whatsapp · instagram · first_name · last_name
leads · respondem · engajam · agendam · comparecem · fecham
indice · faixa · gargalo · fechamentos_por_100 · estimativa
origem · url · enviado_em · event_id · event_source_url · event_name
utm_source · utm_medium · utm_campaign · utm_content · utm_term · fbclid
```

`origem` é sempre `"Calculadora Clinics"`. `estimativa` é verdadeiro
quando o volume está abaixo de 30 leads/mês **ou** quando alguma etapa
tem denominador zero — nesse caso a taxa não foi medida, e os cenários
projetam aquela etapa pela média de mercado.

`first_name` sai minúsculo de propósito (normalização do advanced
matching do Meta) e **sem título de tratamento**: "Dra Ana Paula" rende
`ana` / `paula souza`, não `dra`.

### Por que form-urlencoded e não JSON

JSON cross-origin dispara preflight `OPTIONS`. Se o n8n ou o proxy não
responder o preflight, o browser bloqueia e o lead desaparece sem erro
visível. Form-urlencoded com `mode:'no-cors'` é requisição simples: não
tem preflight para falhar. É o mesmo padrão que a LP do VSL já usa
contra este mesmo n8n. O `keepalive:true` existe porque a pessoa clica
no CTA e sai da página logo depois do resultado.

---

## O workflow do n8n

`n8n/calculadora-clinics.n8n.json`. **Já existe no n8n** como
*Calculadora Clinics | leads* (`/workflow/A1IIYDipGHoBhByw`), salvo e
**desativado**. O arquivo é a fonte: para recriar, colar o conteúdo de
`n8n/colar.min.json` no canvas (Cmd+V). Cinco nós:

```
Webhook (POST /webhook/calculadora-clinics)
   └─ Preparar lead (Code)
        ├─ E-mail interno (comercial)
        ├─ E-mail para o lead
        └─ Registrar na planilha
```

**Depois de importar, três coisas:**

1. Conferir as credenciais dos três nós finais. O n8n casou sozinho
   "Gmail Quirk" e "Google Sheets account" pelo nome; vale abrir e
   confirmar.
2. **Dar acesso da planilha à conta Google do n8n.** A aba
   `Diagnóstico Clinics` já existe na planilha
   `1WmzgFMidtIUMdg_Qg11AXlduPoY_qghrjaiQnlHxnu0` com as 26 colunas,
   mas a credencial "Google Sheets account" do n8n devolve **403
   Forbidden, "The caller does not have permission"** nesse arquivo.
   A credencial funciona (lista outras planilhas, entre elas uma
   homônima, `LEADS | QUIRK GROWTH`, que é outro arquivo); ela só não
   foi compartilhada nesta. Compartilhar como Editor resolve.

   Não trocar a conta da credencial: ela é usada por outros workflows.

   Enquanto o 403 durar, o nó mostra "No columns found in Google
   Sheets" e **o mapeamento das colunas não carrega**.

   **Ao recolar `n8n/colar.min.json`, conferir `Índice` e
   `Diagnóstico`.** Foram as duas únicas colunas que chegaram vazias ao
   colar, e são justamente as duas com acento no cabeçalho. As outras 24
   vieram mapeadas. Preencher à mão, em modo Expression:
   `{{ $json.indice }}` e `{{ $json.diagnostico_titulo }}`. Uma coluna
   vazia não dá erro: o lead entra na planilha com a célula em branco, e
   ninguém percebe.
3. **Ativar o workflow.** Sem isso o webhook responde 404.

**Todo nó que fala com serviço externo tem `onError:
continueRegularOutput` e `retryOnFail: false`.** Não é decoração: no
Make, um módulo sem tratamento de erro fez o cenário reexecutar inteiro
e reenviar o mesmo e-mail cinco vezes para o mesmo lead. O e-mail para
o lead não pode depender de a planilha ter funcionado.

A cópia do diagnóstico (a frase "de cada N pessoas que agendam, só M
aparecem") mora no nó **Preparar lead**, em `n8n/preparar.js`, não na
página — é o e-mail que a consome. Editar o `.js` solto não muda nada:
o código vive dentro do JSON do workflow. Para regerar, substituir o
`jsCode` do nó Code.

O nó também deriva o **tier** que o comercial usa para priorizar
ligação: `hot` = 100+ leads/mês e índice abaixo de 65 (muito volume
vazando, mais dinheiro na mesa), `warm` = 30+ leads/mês, `cold` =
volume baixo demais para confiar no diagnóstico.

---

## Deploy

Subpasta de `clinics.quirkgrowth.com.br`, então **herda o `.htaccess` da
LP** — incluindo cache de um ano com `immutable` em CSS e JS.

```bash
zip -r ../calculadora-clinics.zip . -x "tests/*" "n8n/*" "build.py" "README.md" "*.DS_Store"
```

1. Extrair em `public_html/clinics.quirkgrowth.com.br/calculadora/`
2. `find . -type d -exec chmod 755 {} \;` e `find . -type f -exec chmod 644 {} \;`
3. Purgar o Cloudflare

**A disciplina do `?v=` vale desde o primeiro deploy.** Editar
`motor.js` ou `app.js` sem subir a versão no `index.html` faz a mudança
não chegar em quem já visitou. Versões atuais: `motor.js?v=1.0`,
`app.js?v=1.1`.
