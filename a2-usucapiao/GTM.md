# GTM da A2 — container `GTM-TLXM73BN`

**Aplica a:** LP de Usucapião (`a2-usucapiao/index.html`)
**Auditoria feita em:** 05/11/2026, lendo o `gtm.js` publicado
**Quem aplica:** na interface do GTM — a LP já está pronta do lado dela

> Levantado a partir do container publicado: **30 tags, 17 predicados, 10 regras, 44 macros.**
> Os números de tag abaixo são os `tag_id` reais.

**A conversão desta LP é o clique no WhatsApp.** A página não tem formulário.

---

## IDs que o container carrega

| Plataforma | ID |
|---|---|
| GA4 | `G-LRRXEZYHN4` |
| Google Ads | `AW-11486129390` |
| Meta Pixel | `1409542581269143` |

---

## A boa notícia: o Pixel do Meta já funciona

A **tag 58** é um Meta Pixel com evento customizado `Whatsapp`, e o gatilho dela é:

```
Click URL  CONTÉM  "whatsapp"
```

Os botões desta LP usam `https://api.whatsapp.com/send?phone=…` — que **contém**
a palavra. Verificado nos 10 botões da página: todos casam.

> ⚠️ **Por isso a LP não usa `wa.me`.** Um link `wa.me/5511970382322` **não contém**
> "whatsapp" e **não dispararia** a tag 58. Se alguém "simplificar" os links para
> `wa.me`, a medição do Meta morre em silêncio. Há um comentário no topo do
> `<script>` do `index.html` avisando sobre isso.

**Conclusão: para o Meta, esta LP mede sem nenhuma mudança no container.**

---

## O que está errado hoje

### ⚠️ Defeito 1 — conversão do Google Ads em todo pageview e em todo clique

Isto é anterior a esta LP, vale para o site inteiro da A2, e **contamina qualquer
leitura de custo por conversão**:

| tag | O que é | Dispara em |
|---|---|---|
| **64** | Conversão Google Ads (label `OEylCOaNsY4ZEO7ZgeUq`) | **`gtm.js`** — todo carregamento de página |
| **92** | Conversão Google Ads (label `0aDsCLGo_7EbEO7ZgeUq`) | **`gtm.linkClick`** — qualquer clique em link, sem filtro de URL |
| **97** | Conversão Google Ads (label `Gd4oCLalnIMcEO7ZgeUq`) | **`gtm.linkClick`** — idem |

Na prática: **cada visita é reportada como conversão**, e **cada clique em qualquer
link reporta outras duas**. Nesta LP isso inclui o link do Instagram e o `mailto:`
do rodapé.

Não alterei nada. Antes de decidir verba, conferir no Google Ads se o volume de
conversões bate com o volume real de conversas no WhatsApp. Suspeito fortemente
que não bate.

**Correção:** pôr filtro de URL nos gatilhos de 92 e 97 (Click URL contém
`whatsapp`) e rever se a tag 64 deveria existir em *All Pages*.

### Defeito 2 — GA4 não registra o clique de WhatsApp

A **tag 65** é um evento GA4 chamado `whatsapp` — e **não tem gatilho nenhum**.
Existe, está configurada, nunca dispara. Hoje o GA4 da A2 não sabe quantas pessoas
clicam no WhatsApp, no site inteiro.

### Defeito 3 — várias tags de conversão órfãs

Além da 65, estas existem e **nunca disparam**:

| tag_id | Tag | Gatilho hoje |
|---|---|---|
| 84 | Meta Pixel — evento **`Lead`** (standard) | nenhum |
| 85 | GA4 — **`generate_lead`** | nenhum |
| 71 | Meta Pixel — standard | nenhum |
| 82, 91, 96 | Google Ads — conversão | nenhum |

A única tag pendurada em *Form Submission* é a **tag 80, que está PAUSADA**.

### Defeito 4 — advanced matching apontando para campos inexistentes

As variáveis que montam `fn`, `ln`, `em` e `ph` raspam o DOM procurando IDs
herdados de uma LP em Elementor (`form-field-fn`, `form-field-ln`,
`form-field-email`, `form-field-phone`), com fallback em cookies escritos por elas
mesmas.

**Nesta LP isso é irrelevante e não há o que corrigir:** sem formulário, não existe
nome, e-mail ou telefone para enviar. O Pixel vai sair sem dados de usuário, e isso
é inerente a uma página que converte por clique. Vale saber que **as outras páginas
do site da A2 provavelmente também estão com advanced matching vazio** — é o mesmo
defeito que a LP da Clinics tinha.

---

## O que aplicar

### Passo 1 — medir o clique no GA4 (recomendado)

**Triggers › New › Custom Event**

| Campo | Valor |
|---|---|
| Nome | `CE — whatsapp_click` |
| Event name | `whatsapp_click` |
| This trigger fires on | All Custom Events |

**Variables › New › Data Layer Variable** (Version 2):

| Nome | Data Layer Variable Name |
|---|---|
| `DLV — cta_local` | `cta_local` |
| `DLV — content_name` | `content_name` |

Depois, pôr `CE — whatsapp_click` como gatilho da **tag 65** (o evento GA4
`whatsapp` que já existe órfão) e mandar `cta_local` como parâmetro.

`cta_local` é o que diz **de qual seção** veio o clique — `advogados`, `orcamento`,
`risco`, `hero`, `dock`… É o dado mais útil que a página produz: mostra qual
argumento converte.

### Passo 2 — sinal de conversão para o Meta otimizar (decidir)

A tag 58 já dispara um evento **customizado** (`Whatsapp`). Eventos customizados
funcionam para público e para relatório, mas o Meta otimiza melhor com evento
**padrão**.

A **tag 84** é justamente um `Lead` padrão, hoje sem gatilho. Pendurá-la em
`CE — whatsapp_click` daria ao Meta um sinal de `Lead` para otimizar.

**É uma decisão, não um conserto.** Um clique no WhatsApp não é um lead confirmado —
parte das pessoas não manda a mensagem. Pendurar `Lead` ali infla o número de leads
reportados, mas é o melhor sinal disponível numa página sem formulário. Se a A2 e a
Quirk forem comparar "leads" do Meta com conversas reais no WhatsApp, precisam saber
que são coisas diferentes.

### Passo 3 — arrumar o Google Ads (urgente, ver Defeito 1)

1. Conferir no Google Ads a que corresponde cada um dos três conversion labels.
2. Pôr filtro `Click URL contém whatsapp` nos gatilhos das tags **92** e **97**.
3. Decidir se a tag **64** deve continuar disparando em *All Pages*.

### Passo 4 — funil de leitura (opcional)

A LP também emite `cta_click` (clique em âncora), `faq_open` (com o texto da
pergunta) e `scroll_depth` (25/50/75/100). Hoje nada escuta.

`faq_open` é o mais interessante: mostra **qual dúvida** trava a decisão, e isso
alimenta tanto a copy da página quanto os criativos.

> O listener de scroll nativo do container usa marcos próprios. Para medir o scroll
> **desta** LP, é preciso um Custom Event trigger chamado `scroll_depth`.

---

## Como validar

1. **GTM Preview** na URL da LP.
2. Clicar em **Falar com um especialista** no hero.
   → a **tag 58** (Pixel `Whatsapp`) tem que disparar. Ela já funciona hoje.
   → se o Passo 1 foi aplicado, a **tag 65** dispara com `cta_local = hero`.
3. Clicar no botão da **seção de advogados**.
   → mesmas tags, mas `cta_local = advogados`, e o WhatsApp abre com a mensagem de
   parceria técnica.
4. **Meta Events Manager › Test Events**: um evento `Whatsapp` por clique.
5. Conferir que clicar no link do **Instagram no rodapé** não dispara conversão do
   Google Ads (se o Passo 3 foi aplicado). Hoje dispara duas.

---

## Quando a CAPI pelo CRM entrar

O plano é mandar o dado de volta ao Meta pela API de Conversões, a partir do CRM,
depois que a conversa do WhatsApp virar lead. Três coisas a registrar agora, porque
são o tipo de detalhe que se perde no caminho:

**1. Não deduplique com o clique.** O evento do navegador (tag 58, `Whatsapp`) e o
evento que vier do CRM são **etapas diferentes do funil** — um é "clicou pra falar",
o outro é "virou lead qualificado". Eles **não** devem compartilhar `event_id` nem
ser deduplicados. Deduplicação é para o mesmo evento chegando por dois caminhos;
aqui são dois eventos distintos, e tratá-los como um só apaga o topo do funil.

**2. O telefone é o que casa.** A atribuição vai funcionar pelo `ph` (telefone com
hash) que o CRM tem da conversa do WhatsApp. É sinal forte e é o padrão para funil
de WhatsApp. Mandar também `em` quando existir melhora o match.

**3. O `fbclid` se perde no salto para o WhatsApp.** A página captura as UTMs e o
`fbclid` da URL e anexa ao evento `whatsapp_click`, mas eles **não** acompanham a
pessoa até a conversa — não há backend para guardá-los, e pôr um código de
rastreio dentro da mensagem deixaria a conversa com cara de robô. Ou seja: a
atribuição da CAPI vai depender do telefone, não do click ID. Isso é aceitável e
esperado nesse modelo; só não construa o cálculo de ROAS supondo atribuição por
click ID.

---

## Observação sobre ligar tráfego

Com conversão do Google Ads em todo pageview e em todo clique de link, **o histórico
de conversão desse container não vale como baseline**. Qualquer custo por conversão
medido antes da correção do Passo 3 está inflado.

Vale aplicar os Passos 1 e 3, validar com cliques de teste e só então ligar a verba.
