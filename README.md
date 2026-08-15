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
- TanStack Start
- Tailwind CSS
- Lucide Icons
- Zod (Validação)
- Service Worker (Offline First - Stale While Revalidate)

## 🌐 Publicação no GitHub
Para subir este código para o seu GitHub:
1. Crie um repositório vazio no GitHub.
2. No seu computador, dentro da pasta do projeto:
```bash
git init
git add .
git commit -m "feat: suporte offline e gestão de equipes"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

