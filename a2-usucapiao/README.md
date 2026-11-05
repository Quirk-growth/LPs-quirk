# LP — A2 Arquitetura · Assistência Técnica para Usucapião

**Cliente:** A2 Arquitetura e Construção
**Produto:** Assistência Técnica para Usucapião Judicial e Extrajudicial
**Ticket médio estimado:** R$ 7.500
**Arquivo:** `index.html` (autônomo — HTML + CSS + JS vanilla, zero dependências)
**Conversão:** clique direto no WhatsApp. **Sem formulário, sem webhook, sem backend.**

---

## A tese da página

O briefing tem uma tensão que define toda a copy: a A2 quer **mais** lead no
WhatsApp e ao mesmo tempo **menos** gente procurando "planta barata".

Os concorrentes diretos levantados (MAP Topografia, Aerovante, GBC, CST
Topografia, Engequipe, TOPO ADM, Topografia Com) vendem todos a mesma coisa —
"planta e memorial para usucapião", item avulso, preço por peça. Competir nesse
plano é competir por preço, e um ticket de R$ 7.500 perde.

Por isso o eixo da página não é o entregável, é **risco de processo**:

> planta barata → exigência do cartório ou do juízo → processo parado meses →
> refaz a peça → sai mais caro

Isso justifica o ticket e fala com os dois públicos ao mesmo tempo: o proprietário
teme travar, o advogado teme a exigência cair no processo dele.

A voz foi herdada da própria A2 — a página `/aprovacao-declaratoria-eletronica/`
do site deles já argumenta assim ("O custo de errar é muito maior do que o custo
de fazer com quem sabe").

---

## Como a página converte

Decisão do Renan (05/11/2026): **sem formulário e sem automação.** A A2 sempre
atendeu pelo botão do WhatsApp e esse procedimento fica como está.

Uma versão anterior desta LP tinha um quiz de 5 etapas que postava num webhook.
Foi removida. Se um dia a triagem automática voltar à mesa, o histórico está no
git e a lógica de qualificação está descrita no fim deste arquivo.

### A triagem que sobrou: mensagem contextual por botão

Sem formulário, **a primeira mensagem do WhatsApp é a única triagem que existe**.
Por isso cada botão abre o WhatsApp com um texto diferente, dizendo de onde a
pessoa veio:

| `data-wa` | Onde está | Mensagem que abre |
|---|---|---|
| `advogados` | seção de advogados | "Sou advogado(a)… quero falar sobre **parceria técnica** para os processos do escritório." |
| `orcamento`, `final-2` | após entregáveis e no CTA final | "…quero um **orçamento** da assistência técnica para o meu caso." |
| `risco` | seção de risco | "Meu **processo precisa de assistência técnica**…" |
| `header`, `hero`, `reframe`, `final`, `dock`, `footer` | resto | mensagem padrão |

Isso permite à A2 separar advogado de proprietário final **antes de responder** —
são atendimentos diferentes, e o advogado é lead de parceria recorrente.

### ⚠️ O formato do link não é escolha estética

Os links usam `https://api.whatsapp.com/send?phone=…&text=…`, **não `wa.me`**.

A tag 58 do container `GTM-TLXM73BN` dispara o Pixel do Meta quando a URL do link
clicado **contém a palavra "whatsapp"**. Um link `wa.me` não casa com essa condição
e a conversão não seria registrada. **Não troque o formato sem ler o `GTM.md`.**

---

## Identidade visual

Extraída dos arquivos de logo do próprio site (hex reais, não estimados):

| Token | Hex | Uso |
|---|---|---|
| Vermelho A2 | `#ED0E13` | CTAs, acentos, kickers |
| Bordô | `#981209` | Bloco extrajudicial, gradiente da seção de advogados |
| Grafite | `#625F5E` | Texto do selo circular |
| Base escura | `#14161A` | Hero, seções de risco, footer |

Tipografia: **Archivo** (títulos) + **Inter** (corpo), via Google Fonts.

Assets em `assets/`, baixados de `a2arquiteturaeconstrucao.com.br/wp-content/uploads/`:
- `logo-a2.png` — chevron A2 (header, favicon, footer)
- `logo-a2-selo.png` — selo circular com "ARQUITETURA E CONSTRUÇÃO"
- `og-a2.png` — imagem de compartilhamento (o `og:image` aponta para a cópia
  hospedada no site da A2; este arquivo é backup)

---

## Estrutura

Hero · A dor · Por que trava (4 cards) · O reframe · O que está incluso (4 blocos) ·
O que você recebe · **Judicial × Extrajudicial** · E se fizer com quem só mede ·
**Seção para advogados** · Depoimentos · Quem é a A2 · Área de atendimento · FAQ ·
CTA final.

Duas seções que nenhum concorrente levantado faz bem: a comparação **judicial ×
extrajudicial** com a base normativa correta, e a **seção dedicada a advogados**
com CTA e mensagem próprios.

---

## Tracking

Container do **cliente**: `GTM-TLXM73BN` — o mesmo que já roda no site da A2.
O que precisa ser configurado dentro dele está em **`GTM.md`**, nesta pasta.
**Leia antes de ligar tráfego**: o container tem defeitos que não são desta LP.

A página emite, via `dataLayer`:

| Evento | Quando | Campos |
|---|---|---|
| `whatsapp_click` | **a conversão** — clique em qualquer botão de WhatsApp | `cta_local`, `content_name`, `content_category`, + UTMs se houver |
| `cta_click` | clique em CTA de âncora (ex.: "Ver o que está incluso") | `cta_local` |
| `faq_open` | abertura de pergunta do FAQ | `faq_pergunta` |
| `scroll_depth` | 25 / 50 / 75 / 100% | `percent_scrolled` |

As UTMs (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`,
`fbclid`, `gclid`) são capturadas da URL e anexadas ao evento `whatsapp_click` —
**não** à mensagem do WhatsApp, que a pessoa lê antes de enviar.

### Sem formulário, não há advanced matching

Numa página que converte por clique, não existe nome, e-mail ou telefone para
alimentar o advanced matching do Pixel. Isso é inerente ao modelo escolhido, não
um defeito a corrigir. O match quality do Meta vai depender de cookie e
`external_id`.

### Testado no navegador

| Verificação | Resultado |
|---|---|
| Botões de WhatsApp | 10, todos `api.whatsapp.com` |
| Condição da tag 58 (URL contém "whatsapp") | atendida em todos |
| `target="_blank"` + `rel="noopener"` | em todos |
| Mensagens contextuais distintas | 4 |
| `whatsapp_click` no dataLayer | 1 por clique |
| Âncoras quebradas | nenhuma |
| Erros no console | nenhum |
| Overflow horizontal | nenhum |
| Contraste WCAG | sem reprovação |

---

## Publicar

A LP é um arquivo único mais a pasta `assets/`. Dois caminhos:

**No domínio da A2 (recomendado)** — o site deles é WordPress. Subir como página
em `a2arquiteturaeconstrucao.com.br/usucapiao/`, mantendo o `<link rel="canonical">`
que já está no `<head>`. Vantagem: herda a autoridade do domínio e o GTM já está lá.

**No cPanel da Quirk** — subdomínio próprio. Nesse caso, lembrar do que a skill
`lp-quirk` registra: criar o subdomínio no cPanel **não publica nada** sem um
registro A no Cloudflare, os arquivos vão na **raiz** do document root, e é preciso
**purgar o cache** do Cloudflare a cada troca.

Se o caminho final não for `/usucapiao/`, **atualizar o `canonical`**.

---

## Pendências antes de ligar tráfego

- [ ] **Configurar o `GTM-TLXM73BN`** conforme `GTM.md`. O Pixel do Meta já pega
      o clique de WhatsApp sem nenhuma mudança (tag 58), mas **GA4 e Google Ads não** —
      e há um defeito sério de conversão inflada para resolver antes de olhar custo.
- [ ] **Confirmar com a A2 os depoimentos.** A apresentação institucional tem 6, mas a
      extração do PDF embaralhou a ligação entre frase e autor. Só duas são confiáveis
      e estão na página: *Julia Faria (Advogada)* e *Luciana (Arquiteta)*. A terceira está
      como "Cliente A2" justamente por isso. As outras quatro frases, depois de confirmadas:
      *"Excelente trabalho, recomendo."* · *"Fizeram um serviço de qualidade sem muita
      burocracia."* · *"Ótimo trabalho e o preço melhor ainda."* · *"Atendimento super rápido
      sem burocracia."* (nomes soltos: Clicio, Gilmara Costa, Valdir Lopes, Eduardo)
- [ ] **Confirmar o tempo de mercado.** A apresentação é de 2021 e diz "18 anos" — hoje daria
      23. Não foi para a página sem confirmação.
- [ ] **Pedir CAU/CREA e nº de RRT.** Nenhuma página do site da A2 exibe registro profissional.
      Para quem vende responsabilidade técnica, isso é lacuna de credibilidade — e é o tipo de
      prova que os concorrentes exibem.
- [ ] **Confirmar o número do WhatsApp.** A página usa `5511970382322`, que é o único número
      em todo o site da A2. A apresentação institucional também traz `11 98607-0600`.
- [ ] Clicar em um botão em produção e confirmar que o WhatsApp abre com o texto certo
- [ ] Purgar cache (se for pelo Cloudflare)

## Sobre a base normativa citada

A seção "Judicial ou extrajudicial" e o FAQ citam o **Provimento CNJ nº 65/2017**,
consolidado no **Provimento CNJ nº 149/2023**. A regra de planta e memorial está no
art. 4º, II (e a hipótese de dispensa para unidade de condomínio edilício ou lote de
loteamento regularmente instituído, no § 5º).

A página inclui ressalva explícita de que é informativa, que as exigências variam
conforme serventia e juízo, e que não substitui orientação jurídica. **Se a A2
quiser alterar qualquer afirmação normativa, é alteração que deve passar por eles.**

---

## Se a triagem automática voltar à mesa

A lógica de qualificação que existia no quiz removido, caso sirva de ponto de
partida no futuro:

| Condição | Classificação |
|---|---|
| é advogado/escritório | `PARCEIRO` — parceria recorrente, atendimento próprio |
| é corretor/imobiliária | `PARCEIRO` |
| recebeu exigência técnica | `QUENTE` |
| processo em andamento | `QUENTE` |
| tem advogado, vai abrir | `MORNO` |
| ainda não começou | `FRIO` |

---

## Desenvolvimento local

```bash
cd ~/quirk-lps/a2-usucapiao && python3 -m http.server 8781
```

Há também uma entrada `a2-usucapiao` no `.claude/launch.json` do monorepo.
