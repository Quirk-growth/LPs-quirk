# LP Iscas Quirk — KPI + GPA

LP de captura standalone com formulário multi-step embedado, pronta pra deploy em qualquer hospedagem (Vercel, Netlify, cPanel, S3, etc).

## Estrutura

```
lp-iscas-quirk/
├── index.html         ← landing page + formulário
├── obrigado.html      ← thank you page (downloads)
├── assets/
│   ├── styles.css     ← estilos (mobile-first)
│   └── form.js        ← lógica do form
├── SPEC.md            ← decisões de design
└── README.md          ← este arquivo
```

---

## ⚙️ Antes de subir — Configuração obrigatória

Você **precisa** trocar 5 valores em 3 arquivos antes do deploy:

### 1. `assets/form.js` — Webhook do Make

No topo do arquivo:

```js
const CONFIG = {
  WEBHOOK_URL: 'https://hook.eu1.make.com/SEU_WEBHOOK_ID', // ← TROQUE
  THANK_YOU_URL: 'obrigado.html',
  DEBUG_MODE: false  // ← deixe true pra testar local (não envia pro Make)
};
```

### 2. `index.html` e `obrigado.html` — Pixel da Meta

Procure por `SEU_PIXEL_ID` (aparece em 2 lugares em cada arquivo: no script e no `<noscript>`).

### 3. `index.html` e `obrigado.html` — Google Analytics

Procure por `G-XXXXXXXXXX` (aparece em 2 lugares em cada arquivo).

### 4. `obrigado.html` — Links de download

Procure por `LINK_DA_PLANILHA_AQUI` e `LINK_DO_GPA_AQUI` e troque pelos links diretos dos arquivos (recomendado: Google Drive com permissão pública, ou S3/Cloudflare R2).

**Dica:** no Google Drive, use o link no formato `https://drive.google.com/uc?export=download&id=ID_DO_ARQUIVO` pra forçar download direto.

### 5. `index.html` — CNPJ no footer

Procure por `XX.XXX.XXX/0001-XX` e troque pelo CNPJ real.

---

## 🎨 Customização visual (opcional)

Tudo configurável via CSS variables no topo do `assets/styles.css`:

```css
:root {
  --color-bg: #0a0a0a;           /* fundo principal */
  --color-accent: #ff5a1f;       /* cor da marca (botões, destaques) */
  --color-accent-hover: #ff7842; /* hover */
  /* ... */
}
```

Pra mudar a cor da marca, troca só `--color-accent` e `--color-accent-hover`.

---

## 🚀 Deploy

### Opção A — Vercel (recomendado, 2 minutos)

1. `npm i -g vercel`
2. `cd lp-iscas-quirk && vercel`
3. Aponte teu domínio pro Vercel (Settings > Domains)

### Opção B — Netlify (drag & drop)

1. Acessa app.netlify.com
2. Arrasta a pasta `lp-iscas-quirk` na área de upload
3. Aponta o domínio via DNS

### Opção C — Hospedagem tradicional (cPanel, FTP)

1. Comprime a pasta e sobe na raiz do domínio (ou subpasta tipo `/materiais/`)
2. Acessa `teusite.com.br` ou `teusite.com.br/materiais/`

### Opção D — Subdomínio dedicado (ideal pra LPs)

Configura `materiais.quirkgrowth.com.br` apontando pra Vercel/Netlify. Mantém atribuição limpa pro Meta Ads.

---

## 🧪 Como testar localmente

```bash
cd lp-iscas-quirk
python3 -m http.server 8000
# abre http://localhost:8000
```

**Antes de testar:** deixe `DEBUG_MODE: true` no `form.js`. Assim o submit não envia pro Make — só loga no console.

---

## 🔗 Webhook do Make — Payload que chega

Quando alguém envia o form, o Make recebe um POST JSON com:

```json
{
  "nome": "João Silva",
  "instagram": "joaoimob",
  "atuacao": "corretor_autonomo",
  "tempo_mercado": "3_5",
  "vgv": "1m_3m",
  "trafego": "sozinho",
  "investimento_atual": "2k_5k",
  "processo": "parcial",
  "kpis": "alguns",
  "experiencia_agencia": "negativa",
  "experiencia_detalhe": "Prometeram leads e entregaram engajamento vazio",
  "email": "joao@email.com",
  "whatsapp": "(11) 91234-5678",
  "lgpd": "on",
  "score": 75,
  "tier": "hot",
  "submitted_at": "2026-05-27T15:30:00.000Z",
  "utm_source": "facebook",
  "utm_medium": "cpc",
  "utm_campaign": "iscas_kpi_gpa_v1",
  "referrer": "https://facebook.com"
}
```

### Roteiro do cenário Make (sugestão)

```
[Webhook]
   ↓
[Router]
   ├──→ [ActiveCampaign: Add Contact + Tag por tier]
   │       └─→ se tier=hot, tag "score-quente"
   │       └─→ dispara automação de email (entrega + nutrição)
   ├──→ [ClickUp: Create Task no funil comercial]
   │       └─→ campos custom: VGV, score, @Instagram, experiencia_detalhe
   ├──→ [Google Sheets: Append Row no BI]
   └──→ [Filter: tier === "hot"]
        └─→ [WhatsApp/Slack: notifica SDR]
```

---

## 📊 Lead Scoring (já calculado no front)

A lógica completa tá em `form.js → calculateScore()`. Resumo:

| Resposta | Pontos |
|---|---|
| VGV > R$5M | +30 |
| VGV R$3–5M | +25 |
| VGV R$1–3M | +20 |
| VGV "inconsistente" | -20 |
| Já investe em tráfego | +20 |
| Processo estruturado | +20 |
| Acompanha KPIs (todos) | +15 |
| Investe >R$10k/mês | +20 |
| Experiência negativa com agência | +10 |

**Tiers:**
- 🔥 **hot** (≥70) — SDR notificado em <5min
- 🟡 **warm** (40–69) — nutrição padrão
- 🔵 **cold** (<40) — newsletter

⚠️ Score é calculado client-side. **Recalcule no Make** com a mesma lógica pra evitar tampering.

---

## 🐛 Troubleshooting

**Form não envia:**
- Confere se `WEBHOOK_URL` tá certo
- Confere CORS no Make (precisa aceitar POST do teu domínio)
- Abre o console (F12) e vê o erro

**Pixel não dispara:**
- `SEU_PIXEL_ID` foi trocado em todos os lugares?
- Usa o "Meta Pixel Helper" (extensão Chrome) pra verificar

**Mobile parece quebrado:**
- A LP é mobile-first. Se quebrou, provavelmente é viewport: verifica se o `<meta name="viewport">` tá no `<head>`.

---

## 📝 Checklist pré-lançamento

- [ ] Trocou `WEBHOOK_URL` no `form.js`
- [ ] Trocou `SEU_PIXEL_ID` em `index.html` e `obrigado.html` (2 lugares cada)
- [ ] Trocou `G-XXXXXXXXXX` em `index.html` e `obrigado.html`
- [ ] Trocou `LINK_DA_PLANILHA_AQUI` e `LINK_DO_GPA_AQUI` em `obrigado.html`
- [ ] Trocou CNPJ no footer do `index.html`
- [ ] `DEBUG_MODE = false` no `form.js`
- [ ] Testou submit ponta a ponta (form → webhook → email → thank you)
- [ ] Testou no mobile real (Chrome DevTools não basta)
- [ ] Cenário Make tá ativo
- [ ] Automação ActiveCampaign tá ativa
- [ ] Tag/lista ClickUp criada

---

## 📌 Próximas evoluções (fora do escopo v1)

- A/B test de headline via UTM
- Variante da LP por origem de tráfego (orgânico vs ads)
- Captcha invisível (se aparecer spam)
- Página de obrigado com vídeo de boas-vindas do Renan
- Sequência de WhatsApp via ManyChat após o lead
