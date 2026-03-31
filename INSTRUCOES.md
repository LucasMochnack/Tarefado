# Tarefado — Sistema de Gestão Comercial

## Como rodar o projeto

### Pré-requisitos
- Node.js 18 ou superior instalado → https://nodejs.org/
- npm ou pnpm

### Passo a passo

```bash
# 1. Acesse a pasta do projeto
cd "Tarefado"

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev

# 4. Abra no navegador
# http://localhost:5173
```

### Build para produção
```bash
npm run build
npm run preview
```

---

## Estrutura do projeto

```
src/
├── components/
│   ├── layout/        → Sidebar, Header, Layout
│   ├── kanban/        → KanbanBoard, KanbanColumn, KanbanCard
│   ├── tasks/         → TaskFormModal, TaskDetailsDrawer
│   ├── projects/      → ProjectFormModal
│   ├── shared/        → StatusBadge, PriorityBadge, StatCard, ConfirmDialog
│   └── voice/         → VoiceModal
├── hooks/             → useVoice (Web Speech API)
├── store/             → useStore (Zustand + localStorage)
├── pages/             → Dashboard, Kanban, Projetos, Times, Prioridades, Tarefas, Config
├── data/              → mockData.ts (24 tarefas + 8 projetos)
├── utils/             → priority.ts, voice-parser.ts, dates.ts
└── types/             → index.ts
```

---

## Funcionalidades implementadas

### Dashboard
- 8 cards de resumo (pendentes, andamento, concluídas, atrasadas, etc.)
- Seções: próximas entregas, atrasadas, prioridades críticas
- Gráficos de status e prioridade (Recharts)
- Resumo dos 3 times com barra de progresso
- Lista de tarefas recentemente atualizadas

### Kanban
- Drag and drop completo com dnd-kit
- 4 colunas: A Fazer, Em Andamento, Aguardando, Concluído
- Ao arrastar, status atualiza automaticamente
- Filtros por time, projeto, prioridade, responsável, atrasadas, paradas
- Busca textual
- Abertura de tarefa em painel lateral (drawer)

### Projetos — Matriz de Eisenhower
- 4 quadrantes: Fazer Agora, Agendar, Delegar, Eliminar
- Cards de projeto com progresso, tarefas e prazo
- Progresso atualiza automaticamente ao concluir tarefas

### Detalhe do Projeto
- Visão completa com stats e barra de progresso
- Lista de tarefas filtráveis por status
- Editar e excluir projeto
- Criar tarefas vinculadas

### Times (B2C, Campinas, Produtos)
- Hub de times com stats por time
- Página individual com hero colorido por time
- 3 visualizações: lista, kanban, prioridades
- Filtros completos
- Botão "Gerar prioridades" que recalcula scores

### Prioridades
- Tabela executiva com score, nível e motivo
- Filtros por time, projeto, nível, atrasadas, paradas
- 4 cards de resumo por nível (clicáveis para filtrar)
- Ordenação por score decrescente

### Tarefas
- 3 visualizações: lista, cards, tabela
- Filtros completos + busca global
- Editar e excluir inline

### Tarefa — Drawer lateral
- Status, prioridade, time, score e motivo
- Mover status com um clique
- Checklist com progresso
- Comentários com adição inline
- Botões editar e excluir com confirmação

### Configurações
- Toggle dark mode
- Recalcular prioridades
- Restaurar dados de demonstração
- Limpar todos os dados

### Voz (Web Speech API)
- Funciona no Chrome/Edge
- Cria tarefas por comando de voz
- Parser interpreta time, prazo e prioridade
- Modal com feedback visual e edição antes de confirmar

---

## Lógica de prioridades

Cada tarefa tem um **scorePrioridade** calculado automaticamente:

| Regra | Pontos |
|-------|--------|
| Prazo vencido | +40 |
| Vence em até 2 dias | +25 |
| Sem atualização há 7+ dias | +20 |
| Projeto importante+urgente | +30 |
| Sem responsável | +15 |
| Bloqueada por outra tarefa | +20 |
| Aguardando há muito tempo | +15 |
| Projeto com prazo próximo e baixo progresso | +20 |
| Bônus por time e tags específicas | +10 |

**Classificação:**
- 80+ → 🔴 Crítica
- 60–79 → 🟠 Alta
- 40–59 → 🟡 Média
- 0–39 → ⚪ Baixa

---

## Tecnologias

| Lib | Uso |
|-----|-----|
| React 18 | UI |
| TypeScript | Tipagem |
| Tailwind CSS | Estilo |
| Radix UI | Componentes acessíveis |
| dnd-kit | Drag and drop |
| Zustand | Estado global |
| localStorage | Persistência |
| Recharts | Gráficos |
| date-fns | Datas |
| Web Speech API | Voz |
| react-hot-toast | Notificações |
| lucide-react | Ícones |
| React Router v6 | Rotas |
