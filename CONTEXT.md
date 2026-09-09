# WinFit — contexto de engenharia

Atualizado em 2026-09-09. Aplicativo independente nesta raiz; não vive em `apps/`.

## Arquitetura atual

- React 18 + TypeScript + Vite; rotas hash em `src/App.tsx`.
- `src/lib/generator.ts`: templates, filtros de equipamento/limitação, prescrição e orçamento de tempo.
- `src/data/exercises.ts`: 74 exercícios com instruções textuais, sem vídeos.
- `src/lib/store.ts`: Zustand persistido em `localStorage` (`winfit-v1`); perfil, plano, planos arquivados, sessões, recordes e sessão ativa. Cada alteração é persistida.
- `src/lib/progression.ts`: sugestão de carga/repetições e PR de carga.
- `src/lib/homeWorkout.ts`: ciclo adicional de casa, sem equipamentos nem apoios, reutilizando o gerador.
- `server/worker.ts`: relay opcional do Apple Watch; o treino principal continua local. Não existe banco de usuários ou sincronização de histórico.
- `src/lib/pwa.ts` + `vite.config.ts`: instalação e cache do shell. Deploy estático em `dist/`.

## Treino em casa

Home → seção Treino em casa → prévia expansível → Começar em casa → player existente → resumo e histórico.
Mantém objetivo, experiência, estado atual e limitações; usa ciclo de corpo inteiro e orçamento de até 30 minutos.
É sessão adicional: conta na semana, sem avançar a sequência da academia. Detalhes e contrato em [docs/home-workout.md](docs/home-workout.md).

## Operação e validação

`npm install`, `npm run dev`; produção: `npm run build` e `npm run preview`.

- `npx tsx scripts/test-generator.ts`: 56.000 combinações do gerador.
- `npx tsx scripts/test-home-workout.ts`: filtros, histórico, preservação e retomada.
- `npx tsx scripts/test-watch-sync.ts`: comandos do Watch na store (não testa relógio físico ou rede do relay).

Visão de produto em `PRODUCT_SPEC.md`; estado real e prioridades em [docs/backlog-audit.md](docs/backlog-audit.md).
