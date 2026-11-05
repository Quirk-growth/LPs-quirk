# Pack de criativos — Calculadora Quirk Clinics

16 arquivos: 8 ângulos × feed (1080×1350) e story (1080×1920).
Destino de todos: **https://clinics.quirkgrowth.com.br/calculadora/**

Dois públicos, quatro ângulos cada. A variedade é proposital: com 8 criativos
distintos o Meta tem o que otimizar, em vez de quatro versões da mesma ideia
competindo entre si.

---

## A regra que sustenta o pack

**Nenhuma peça promete mais paciente.** Todas prometem mostrar onde os
pacientes que já chegam estão sumindo. É o que a calculadora entrega de fato;
prometer crescimento seria vender outra coisa e queimar o lead na primeira
conversa.

Os números usados são os benchmarks de mercado que validamos para tráfego pago
em clínica: de 100 leads, ~50 respondem, ~25 engajam, 10–15 agendam, 5–10
comparecem, 2–5 fecham. Operação ajustada fecha 6 a 8. Nada inventado.

---

## Público A — ainda acha que o problema é falta de lead

Esteticista ou dentista dona do próprio negócio, faturamento até ~R$ 30 mil,
verba curta. Ela é o gargalo de tudo: atende, responde o direct, decide o
anúncio. Para ela o diagnóstico é **revelação**.

### A1 · O gargalo invisível
**Arte:** "Você não tem problema de lead. Você tem problema de agenda."
**Título:** Descubra em qual etapa sua clínica perde paciente
**Texto principal:**
> De cada 100 pessoas que chegam na sua clínica, 2 viram paciente.
>
> Não é falta de lead. É que o lead entra e morre pelo caminho: não responde,
> não engaja, não agenda, não aparece. Quase nenhuma clínica mede isso, então
> a conta vai toda pro anúncio.
>
> São seis números que você já tem. Dois minutos e você vê onde está perdendo.

### A2 · O no-show
**Arte:** "Você pagou pelas 10. Só 6 apareceram."
**Título:** A etapa mais barata de arrumar da clínica inteira
**Texto principal:**
> Você pagou o anúncio. Seu time respondeu. A pessoa marcou.
>
> E não apareceu.
>
> Comparecimento é a etapa mais barata de corrigir de uma clínica, porque todo
> o custo já foi pago antes dela. E é onde quase todo mundo sangra sem saber.
>
> Descubra quanto da sua agenda evapora: seis números, dois minutos.

### A3 · Não é falta de esforço
**Arte:** "Respondo todo mundo. Posto todo dia. E a agenda não enche."
**Título:** O problema não é quanto você trabalha
**Texto principal:**
> "Eu respondo todo mundo. Eu posto todo dia. Eu já aumentei o anúncio. E a
> agenda não enche."
>
> Se isso é você, o problema não é esforço. É que o esforço está vazando numa
> etapa que ninguém mede.
>
> Em dois minutos dá pra saber qual é.

### A4 · A régua
**Arte:** "Clínica ajustada fecha 6 a 8 a cada 100 leads."
**Título:** Compare sua clínica com a média do mercado
**Texto principal:**
> Clínica com funil ajustado fecha de 6 a 8 pacientes a cada 100 leads.
>
> A média real do mercado é 2.
>
> Saber em qual dos dois lados você está muda a decisão do mês. Seis números,
> dois minutos, o diagnóstico inteiro.

---

## Público B — já desconfia que o problema não é o anúncio

Clínica com equipe, faturamento maior, alguém cuidando do digital. Ela olha
custo por lead. Para ela o diagnóstico é **confirmação com número**.

### B1 · O custo depois do lead
**Arte:** "Seu custo por lead não é o problema. É o que vem depois."
**Título:** O gargalo não está no anúncio
**Texto principal:**
> Você negocia CPL, testa criativo, troca de gestor. E o faturamento não
> acompanha.
>
> Porque o lead não morre na entrada. Ele morre entre a primeira resposta e a
> cadeira, numa das quatro etapas que ninguém no time mede.
>
> Seis números e você vê exatamente em qual.

### B2 · A pergunta para a recepção
**Arte:** "Pergunte quantos agendaram. Agora quantos apareceram."
**Título:** O número que quase nenhuma clínica tem
**Texto principal:**
> Faça isso agora: pergunte à sua recepção quantas pessoas agendaram no mês
> passado.
>
> Agora pergunte quantas apareceram.
>
> Quase nenhuma clínica tem a segunda resposta. E é nela que está o dinheiro
> que você acha que está faltando em anúncio.

### B3 · Escalar o vazamento
**Arte:** "Dobrar o investimento numa operação que perde 90% é dobrar o vazamento."
**Título:** Meça antes de escalar
**Texto principal:**
> Antes de aumentar a verba, uma conta: se hoje 100 leads viram 2 pacientes,
> 200 leads viram 4.
>
> Você dobrou o custo para dobrar um número que continua ruim. Escalar uma
> operação que vaza é escalar o vazamento.
>
> Seis números dizem onde arrumar primeiro.

### B4 · Seis números, dois minutos
**Arte:** "Seis números da sua clínica. Dois minutos. O diagnóstico inteiro."
**Título:** Diagnóstico de conversão da sua clínica
**Texto principal:**
> Seis números que você já tem: leads, quantos responderam, engajaram,
> agendaram, compareceram e fecharam.
>
> Em dois minutos você recebe o índice de conversão da sua clínica, em qual
> etapa você perde mais paciente e quanto muda se arrumar só ela.
>
> Sem reunião, sem cadastro longo.

**Use a B4 em retargeting** de quem viu as outras e não converteu. É a de menor
atrito e a mais racional.

---

## Como regerar

As artes são compostas em HTML e renderizadas em Chrome headless, não
desenhadas por gerador de imagem. É o que garante Sora e Inter de verdade, o
`#4A8FE8` exato e o logo como arquivo em vez de reconstrução — gerador de
imagem erra texto e inventa logo.

```bash
python3 gerar.py          # as 16
python3 gerar.py A2 B1    # só as citadas
```

Editar copy em `copy.json`. Chaves por peça:

- `escala_h1` — multiplicador do corpo do título, para headline longa que
  quebraria com órfã (A1 usa 0.84)
- `brilho` — correção da foto; as fotos vieram mais escuras que a identidade
  light da Clinics

## Arquivos

```
fotos/     5 fotos geradas, 1856×2304  (01 descartada: escura e com moldura)
saida/     os 16 PNG prontos
copy.json  a copy de cada peça
gerar.py   o compositor
```

**No story, o rodapé para 300px antes da base de propósito.** O Instagram cobre
essa faixa com a barra de resposta; CTA e logo colados no fim ficam atrás dela.

## Identidade

Clinics é a identidade **light**, não a Growth (dark). Sora nos títulos, Inter
no corpo, `#4A8FE8` / `#2F6FC4`, fundo branco. Logo = arquivo real
(`calculadora-clinics/assets/img/logo-quirk.webp`) + wordmark Quirk preto e
Clinics azul.
