# Gestão Operacional - PWA Industrial

Sistema de gestão de presença em tempo real para chão de fábrica.

## 🚀 Como Iniciar

### 1. Configurar Ambiente
Renomeie o arquivo `.env.example` para `.env` e preencha as variáveis necessárias:
```bash
cp .env.example .env
```

### 2. Instalar Dependências
```bash
bun install
# ou
npm install
```

### 3. Iniciar em Desenvolvimento
```bash
bun run dev
# ou
npm run dev
```

O projeto estará disponível em `http://localhost:8080`.

## 📦 Build para Produção
```bash
bun run build
```

## 🛠 Tecnologias
- React + Vite
- TanStack Start (Router + Server Functions)
- Tailwind CSS
- Lucide Icons
- Zod (Validação)
