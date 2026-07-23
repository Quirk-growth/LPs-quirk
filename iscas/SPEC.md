# LP Iscas Quirk — KPI + GPA

**Data:** 2026-05-27
**Owner:** Renan Real (Quirk Growth)
**Objetivo:** Captar e qualificar corretores/imobiliárias que baixam 2 iscas (Planilha de KPIs + GPA), e alimentar máquina comercial (SDR/closers).

## Arquitetura

```
Tráfego (Meta Ads + Orgânico)
        ↓
    index.html (LP + form multi-step embedado)
        ↓ submit (fetch POST → webhook Make)
    obrigado.html (download + confirmação de email)
        ↓ (em paralelo, via Make)
    ActiveCampaign + ClickUp + Google Sheets + WhatsApp SDR
```

## Stack

- **Frontend:** HTML5 + CSS3 + JS vanilla. Zero dependências externas além de Google Fonts (Inter).
- **Form:** nativo, multi-step (uma pergunta por tela), barra de progresso, lógica condicional.
- **Tracking:** Meta Pixel + GA4 (placeholders configuráveis).
- **Submit:** POST JSON pro webhook do Make (URL configurável).
- **Hosting:** qualquer um (Vercel, Netlify, cPanel, S3+CloudFront).

## Estrutura de arquivos

```
lp-iscas-quirk/
├── index.html         ← LP + form
├── obrigado.html      ← thank you page com downloads
├── assets/
│   ├── styles.css     ← CSS variables pra customização
│   └── form.js        ← lógica multi-step + submit
├── SPEC.md            ← este arquivo
└── README.md          ← deploy + configuração
```

## Decisões de design

**LP minimalista (4 seções):**
1. Hero (headline + sub + mockup das 2 iscas + CTA scroll)
2. O que você vai receber (2 cards)
3. Formulário multi-step
4. Footer (LGPD + CNPJ)

**Form (13 perguntas, 4 blocos):**
- Bloco 1: nome + Instagram
- Bloco 2: atuação, tempo de mercado, VGV
- Bloco 3: tráfego, investimento, processo comercial, KPIs, experiência com agência
- Bloco 4: email, WhatsApp, LGPD

**Lógica condicional:**
- Se "Nunca investiu em tráfego" → pergunta "quanto estaria disposto" em vez de "quanto investe hoje"
- Se "Nunca teve experiência com agência" → pula Q10b (campo aberto)

**Entrega híbrida:**
- Página de obrigado tem botões de download direto
- Email é disparado pelo Make/ActiveCampaign em paralelo

## Lead Scoring (calculado client-side, validado no Make)

```
+30 pts  VGV > R$1M
+20 pts  já investe em tráfego
+20 pts  tem processo comercial estruturado
+15 pts  acompanha KPIs com regularidade
+15 pts  investe >R$2k/mês em mkt
+10 pts  experiência negativa com agência (carente de solução)
-20 pts  "não atua de forma consistente"

🔥 ≥70 pts: hot lead → SDR notificado
🟡 40-69:   morno  → nutrição padrão
🔵 <40:     frio   → newsletter
```

## Placeholders configuráveis (no topo dos arquivos)

- `WEBHOOK_URL` (form.js) — endpoint do cenário Make
- `META_PIXEL_ID` (index.html, obrigado.html)
- `GA4_MEASUREMENT_ID` (index.html, obrigado.html)
- `DOWNLOAD_URL_PLANILHA` (obrigado.html)
- `DOWNLOAD_URL_GPA` (obrigado.html)

## Fora de escopo (versão 1)

- A/B testing automatizado (fazer manual no Meta Ads)
- Múltiplas variantes da LP
- Internacionalização
- Backend próprio (Make resolve)
- Captcha (deixar pra fase 2 se aparecer spam)
