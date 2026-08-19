---
name: vw-smartflow-branding
description: Design System e Diretrizes de Branding corporativo/industrial do Painel de Gestão Operacional e VW SmartFlow (paleta OKLCH/HSL, tipografia Barlow/Roboto Mono, cards de KPIs industriais, status Andon e componentes de telemetria).
---

# VW SmartFlow - Design System & Industrial UI Guidelines

Esta skill define a identidade visual, padrões de branding, componentes de telemetria e o design system do **Painel de Gestão Operacional / VW SmartFlow**. Use estas diretrizes para construir ou replicar interfaces industriais, dashboards de chão de fábrica, sistemas de presença e controle operacional em qualquer plataforma (React, Vue, Svelte, Next.js, HTML/Tailwind puro, mobile ou desktop).

---

## 1. Filosofia de Design & Conceito Visual

- **Proposta:** Interface de alta densidade de informação e leitura instantânea (menos de 2 segundos para o supervisor avaliar a célula/linha de produção).
- **Estilo:** *Industrial High-Precision Dashboard* — combina a sobriedade corporativa automotiva (tons profundos de ardósia e azul petróleo) com toques industriais vibrantes (âmbar/dourado de atenção) e semáforos de status no padrão Andon.
- **Ambiente de Uso:** Telas de chão de fábrica, totens industriais, tablets de líderes de linha e monitores de gestão à vista.
- **Princípio:** Alto contraste, tipografia com larguras bem definidas (condensada para títulos e números tabulares para telemetria), feedback visual claro em microinterações.

---

## 2. Tipografia

O sistema utiliza uma tríade tipográfica rigorosa via Google Fonts:

| Função | Família Tipográfica | Variáveis / Classes | Uso Principal |
| :--- | :--- | :--- | :--- |
| **Display / Títulos / KPIs** | `Barlow Condensed` (600, 700) | `font-display`, `uppercase`, `tracking-wide`, `tracking-widest` | Cabeçalhos principais, nomes de células, números grandes de KPI e botões de ação |
| **Interface / Textos Corridos** | `Barlow` (400, 500, 600, 700) | `font-sans` | Nomes de operadores, funções, rótulos de formulários e textos gerais |
| **Telemetria / Dados / Relógio** | `Roboto Mono` (400, 500, 700) | `font-mono`, `tabular-nums` | Horários de batida, relógio com segundos (`HH:mm:ss`), matrículas e números de crachá |

### Inclusão Google Fonts (HTML):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

---

## 3. Paleta de Cores e Tokens Semânticos

O sistema usa cores em formato **OKLCH** (ou HSL/Hex equivalente) com suporte nativo a temas Claro (Light) e Escuro (Dark).

### 3.1. Cores de Estrutura & Superfície
- **Background Claro:** `oklch(0.968 0.003 250)` (~ `#f8fafc` - off-white industrial suave)
- **Background Escuro:** `oklch(0.129 0.042 264.695)` (~ `#0f172a` - ardósia espacial profunda)
- **Primary / Corporate Navy:** `#001E50` (Azul corporativo clássico da VW)
- **Accent Brand (Âmbar / Ouro Industrial):** `#E8A800` / `oklch(0.78 0.16 75)` / `text-amber-400` (destaque de botões, portal SmartFlow e indicadores ativos)
- **Cards / Containers:** Fundo sólido branco no tema claro (`#ffffff`) ou `oklch(0.208 0.042 265.755)` no tema escuro, com bordas finas sutis (`border-border`).

### 3.2. Cores de Status Operacional (Padrão Andon Estendido)
Cada status possui a sua cor pura de destaque (borda/ponto) e a versão `soft` (fundo com opacidade controlada para badges):

| Status | Cor Pura (Ponto / Borda Lateral) | Cor Suave (Fundo Badge) | Significado Operacional |
| :--- | :--- | :--- | :--- |
| **Presente** | `oklch(0.53 0.16 150)` (Verde Esmeralda) | `oklch(0.94 0.05 150)` | Operador ativo no posto de trabalho |
| **Ausente** | `oklch(0.52 0.22 27)` (Vermelho Alerta) | `oklch(0.94 0.05 27)` | Falta não justificada / posto desocupado |
| **Pendente** | `oklch(0.62 0.16 66)` (Laranja / Âmbar) | `oklch(0.95 0.06 80)` | Aguardando batida de início de turno |
| **Afastado / Férias** | `oklch(0.52 0.11 250)` (Azul Aço / Aéreo) | `oklch(0.94 0.03 250)` | Férias, licença médica ou folga programada |
| **Enfermaria** | `oklch(0.65 0.15 210)` (Ciano / Turquesa) | `oklch(0.92 0.04 210)` | Atendimento médico no ambulatório |

---

## 4. Tokens CSS / Tailwind (V4 ou V3)

```css
@theme inline {
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.625rem;
  --radius-xl: 0.75rem;

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);

  --color-status-present: var(--status-present);
  --color-status-present-soft: var(--status-present-soft);
  --color-status-absent: var(--status-absent);
  --color-status-absent-soft: var(--status-absent-soft);
  --color-status-pending: var(--status-pending);
  --color-status-pending-soft: var(--status-pending-soft);
  --color-status-leave: var(--status-leave);
  --color-status-leave-soft: var(--status-leave-soft);
  --color-status-enfermaria: var(--status-enfermaria);
  --color-status-enfermaria-soft: var(--status-enfermaria-soft);

  --font-display: "Barlow Condensed", system-ui, sans-serif;
  --font-sans: "Barlow", system-ui, sans-serif;
  --font-mono: "Roboto Mono", monospace;
}

:root {
  --background: oklch(0.968 0.003 250);
  --foreground: oklch(0.21 0.02 258);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.21 0.02 258);
  --primary: #001E50;
  --primary-foreground: oklch(0.985 0.002 250);
  --muted: oklch(0.945 0.005 250);
  --muted-foreground: oklch(0.52 0.02 256);
  --border: oklch(0.9 0.008 255);

  --status-present: oklch(0.53 0.16 150);
  --status-present-soft: oklch(0.94 0.05 150);
  --status-absent: oklch(0.52 0.22 27);
  --status-absent-soft: oklch(0.94 0.05 27);
  --status-pending: oklch(0.62 0.16 66);
  --status-pending-soft: oklch(0.95 0.06 80);
  --status-leave: oklch(0.52 0.11 250);
  --status-leave-soft: oklch(0.94 0.03 250);
  --status-enfermaria: oklch(0.65 0.15 210);
  --status-enfermaria-soft: oklch(0.92 0.04 210);
}

.dark {
  --background: oklch(0.129 0.042 264.695);
  --foreground: oklch(0.984 0.003 247.858);
  --card: oklch(0.208 0.042 265.755);
  --card-foreground: oklch(0.984 0.003 247.858);
  --primary: oklch(0.929 0.013 255.508);
  --primary-foreground: oklch(0.208 0.042 265.755);
  --muted: oklch(0.279 0.041 260.031);
  --muted-foreground: oklch(0.704 0.04 256.788);
  --border: oklch(1 0 0 / 10%);
}
```

---

## 5. Anatomia e Padrões de Componentes

### 5.1. Header de Telemetria Operacional
- **Barra Superior Fixa (`sticky top-0 z-20`):** Cor de fundo primária corporativa com borda inferior sutil.
- **Identidade da Aplicação:** Ícone industrial em caixa arredondada (`Factory`), Título em caixa alta (`font-display font-bold text-2xl uppercase tracking-wide`), e seletor dropdown de turno integrado.
- **Relógio de Precisão:** Data e hora sincronizadas em tempo real com segundos (`font-mono tabular-nums font-bold text-lg`).
- **Badge do Auditor / Supervisor:** Identificação imediata de quem está no comando (`NOME • CARGO`).
- **Ações Rápidas:** Botão de Log com badge numérico de auditoria, link de atalho destacado em âmbar para portais complementares e botão de logout.

```tsx
<header className="sticky top-0 z-20 border-b border-border bg-primary text-primary-foreground">
  <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
    <div className="flex items-center gap-3">
      <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary-foreground/10">
        <Factory className="size-6" strokeWidth={1.75} />
      </div>
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Gestão Operacional</h1>
        <p className="text-sm text-primary-foreground/70">1º Turno &middot; 06:00 às 15:48 &middot; turno em andamento</p>
      </div>
    </div>
    {/* Relógio + Ações */}
  </div>
</header>
```

### 5.2. Card de Métrica / KPI (High-Impact Card)
- **Faixa Lateral de Status:** Faixa colorida de 6px (`w-1.5`) na borda esquerda com transição de cor suave.
- **Tipografia Gigante:** Número principal em `font-display text-4xl sm:text-5xl font-bold tabular-nums`.
- **Rótulo Superior:** Caixa alta com espaçamento largo (`text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground`).
- **Marca D'água:** Ícone semântico translúcido posicionado à direita (`size-8 text-muted-foreground/50`).

```tsx
<div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
  <span className="absolute inset-y-0 left-0 w-1.5 bg-status-present" aria-hidden />
  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 pl-2">
    <div>
      <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">Presentes</p>
      <p className="font-display text-4xl sm:text-5xl font-bold tabular-nums text-foreground">38</p>
    </div>
    <CheckCircle2 className="size-8 text-muted-foreground/50" strokeWidth={1.5} />
  </div>
</div>
```

### 5.3. Card de Equipe com Progresso Operacional (%)
- Botão/Card interativo para selecionar o agrupamento de trabalho.
- Mostra a taxa de presença percentual calculada instantaneamente.
- Quando ativo: assume cor primária de destaque e exibe uma barra de progresso suave no rodapé do card (`h-1 bg-white/20`).

```tsx
<button className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border p-4 sm:p-6 border-primary bg-primary text-primary-foreground shadow-lg scale-[1.02]">
  <p className="font-display text-sm font-bold uppercase tracking-widest">Equipe Alpha</p>
  <div className="mt-2 flex items-baseline gap-1">
    <span className="text-3xl sm:text-4xl font-bold tabular-nums">94</span>
    <span className="text-sm font-semibold opacity-70">%</span>
  </div>
  <p className="mt-1 text-[0.65rem] font-medium uppercase opacity-60">Presença Efetiva</p>
  <div className="absolute bottom-0 left-0 h-1 w-full bg-white/20">
    <div className="h-full bg-white transition-all duration-500" style={{ width: "94%" }} />
  </div>
</button>
```

### 5.4. Card de Operador (Chão de Fábrica)
- **Faixa Lateral:** Reflete o status em tempo real.
- **Avatar Industrial:** Caixa quadrada arredondada (`size-12 rounded-lg bg-muted`) com as iniciais do operador em negrito + ponto semafórico circular na quina inferior direita (`size-3.5 border-2 border-card`).
- **Bloco de Identificação:** Nome em destaque, Função em tom atenuado e Matrícula formatada em `font-mono text-xs`.
- **Badge de Status:** Pill arredondado com ícone e texto correspondente ao status.
- **Horário de Batida & Nota de Auditoria:** Matrícula e batida de ponto em fonte mono. Se houve edição manual pelo líder, exibe o carimbo (`[Supervisor] • [Horário]`) em tom de alerta âmbar.
- **Indicador de Ação:** Micro-pulso animado no canto superior direito para operadores com status interagível (ex: transferir para enfermaria).

---

## 6. Diretrizes de Microinterações & UX

1. **Feedback sem Recarregamento:** Qualquer alteração de presença deve registrar auditoria e refletir nos KPIs instantaneamente.
2. **Confirmação Clara com Toast:** Ações de troca de status (ex: mover operador para enfermaria ou retornar ao posto) devem disparar um Toast descritivo com botão de confirmação (`toast.info(..., { action: { label: 'Confirmar' } })`).
3. **Ordenação Inteligente:** Operadores ausentes ou pendentes devem ser exibidos no topo da listagem de conferência para priorização visual do líder de turno.
4. **Exportação Fiel:** Sempre fornecer exportação de relatórios em CSV (com UTF-8 BOM `\ufeff` para compatibilidade com Excel) e PDF formatado.

---

## 7. Checklist de Implementação para Outras Plataformas

Ao criar novos módulos ou replicar o painel em outros projetos:
- [ ] Importar as fontes `Barlow`, `Barlow Condensed` e `Roboto Mono`.
- [ ] Configurar os tokens semânticos das 5 cores de status (`present`, `absent`, `pending`, `leave`, `enfermaria`).
- [ ] Aplicar classes de caixa alta (`uppercase`), `tracking-wider` / `tracking-widest` nos títulos e rótulos de métricas.
- [ ] Utilizar a faixa lateral de 6px (`w-1.5`) nos cards para identificação periférica rápida de status.
- [ ] Manter o cabeçalho escuro com relógio sincronizado em tempo real e seletor de turno.
- [ ] Prover busca em tempo real por nome e matrícula em conjunto com filtros rápidos por status.
