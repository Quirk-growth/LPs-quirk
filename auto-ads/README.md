# Quirk Auto Ads — Landing Page

LP standalone que vende o **Quirk Auto Ads** para **corretor de imóveis** (autônomo, no início de carreira, ou em time pequeno) que ainda não tem caixa pra fechar com a Quirk Growth.

**Preço:** R$ 497/mês recorrente no cartão, sem fidelidade.

**ICP:** corretor de imóveis. Incorporadoras e imobiliárias com VGV consolidado vão direto pra Quirk Growth (agência), não são target deste produto.

**Posicionamento honesto:** melhor que gestor amador, NÃO substitui agência especializada — é o **produto de entrada** da Quirk pra corretor que ainda está construindo carteira.

---

## Stack

- HTML estático + CSS vars (zero deps, zero framework)
- Google Fonts: Sora (headings) + Poppins (corpo) + JetBrains Mono (exemplos)
- Meta Pixel + GA4 prontos
- Form opt-in que POSTa em webhook Make

## Estrutura

```
.
├── index.html              # página única
├── assets/
│   ├── styles.css          # paleta Quirk + ciano-neon como diferenciação
│   └── img/
│       ├── logo-quirk.svg  # logo oficial Quirk
│       ├── favicon-quirk.png
│       └── renan-ceo.jpg   # TODO: foto real do Renan (placeholder fallback "RR")
└── .claude/launch.json     # config preview dev
```

## Rodar local

```bash
python3 -m http.server 5777 --directory .
# abre http://localhost:5777/
```

---

## Checklist pré-deploy

### 1. Substituir placeholders no `index.html`

- [ ] `G-XXXXXXXXXX` (linha ~37) → ID real do GA4
- [ ] `https://hook.us2.make.com/QUIRK_AUTO_ADS_LEAD_HOOK` (script `submitLead`) → URL do webhook Make criado para o Auto Ads
- [ ] Pixel Meta `905158130958739` — confirmar se é o pixel certo desta LP (atualmente reusa o do LP Iscas)

### 2. Foto do CEO

- [x] `assets/img/renan-ceo.jpg` (440×440px, crop centralizado, 24KB) — foto profissional do Renan. Se quiser trocar, basta substituir o arquivo mantendo nome e dimensões.

### 3. Atualizar OG image (opcional)

- [ ] Criar imagem `assets/img/og-image.png` (1200x630px) e adicionar `<meta property="og:image">` no `<head>`

### 4. Make scenario do form

- [ ] Criar novo scenario "Quirk Auto Ads — Lead Captura" com webhook trigger
- [ ] Mesma planilha Leads (aba nova "Leads Auto Ads") + send WhatsApp via UAZAPI
- [ ] Trigger automático no fluxo do Auto Ads no n8n (`wf_id=fBUin1UPt5xJEp6g`) — opcional: criar cliente automático

---

## Deploy

### Opção A — Vercel (recomendado)

```bash
npx vercel deploy --prod
# ou via dashboard: novo project → import git → root = ./ → framework = "Other"
```

`vercel.json` já está configurado pra cache headers e clean URLs.

### Opção B — Netlify

```bash
npx netlify deploy --prod --dir=.
```

### Opção C — Cloudflare Pages

- New project → Connect git → root = `.` → build command vazio → output = `.`

### DNS — subdomínio recomendado

```
autoads.quirkgrowth.com.br  CNAME  cname.vercel-dns.com
# (ou apex via A records do provedor)
```

---

## Métricas de sucesso pra acompanhar

- **CTR Hero CTA** ("Quero começar agora"): alvo > 8%
- **Form submit rate**: alvo > 3% dos visitantes únicos
- **WhatsApp click-through** (Pixel `Lead` event): alvo > 5%
- **Scroll até comparativo** (proxy de intent): alvo > 40%

---

## Copy ownership

Toda copy desta página foi escrita reforçando a tese da Quirk Growth: **não inventar resultado**, falar a verdade direta, posicionar Auto Ads como *produto de entrada* e não como substituto da agência.

Mudanças de copy devem manter:
1. Honestidade sobre os limites (NÃO substitui agência especializada)
2. Posicionamento como melhor opção vs "gestor amador" / agência genérica
3. Foco no público que está no início (sem caixa pra fechar Quirk completa)
4. Tom Renan: direto, técnico-comercial, sem firula

---

Built by Renan Real · Quirk Growth · 2026
