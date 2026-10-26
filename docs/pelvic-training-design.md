# Saúde pélvica — E2 / E3

Conteúdo português próprio versão 1. Não houve revisão por profissional de saúde. Por isso a rotina de contração aparece apenas como prévia, sem tempos ou progressão, e o store rejeita seu início. A liberação geral depende de revisão profissional registrada, inclusive adequação, contraindicações, linguagem e progressão. Não há promessa sexual ou clínica.

A rotina disponível é uma pausa de bem-estar de 70 segundos: preparo 5 s, respiração confortável 60 s e repouso 5 s. Esses números organizam a interface, não prescrevem duração de inspiração/expiração. Sem retenção, contração, empurrar ou ritmo respiratório obrigatório.

Fontes primárias consultadas em 26/10/2026:
- [NHS: breathing exercises for stress](https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/): posição confortável e respiração sem forçar.
- [NHS: urinary incontinence](https://www.nhs.uk/conditions/urinary-incontinence/10-ways-to-stop-leaks/): respirar normalmente e relaxar nos exercícios. A rotina clínica da fonte não foi copiada nem liberada no aplicativo.
- [NHS: pelvic pain](https://www.nhs.uk/symptoms/pelvic-pain/): necessidade de avaliação para dor persistente e sinais de urgência.
- [NHS Inform: pelvic floor muscles](https://www.nhsinform.scot/healthy-living/womens-health/middle-years-around-25-to-50-years/pelvic-health/pelvic-floor-muscles/): importância do relaxamento. A referência não equivale a revisão do conteúdo Winfit.

## Garantias e integração

`Pelvic.tsx` exporta a página padrão para `/pelvic`. `usePelvicStore` é um store Zustand independente do treino principal. Não escreve séries, treinos, recordes ou meta semanal.

API: `start(programId, now?)` retorna boolean; `tick(now?)`, `pause(now?)`, `resume(now?)`, `stop(now?)`, `setSignals(audio, vibration)`, `exportData(): string`, `importData(json): boolean`, `resetAll()`. Campos: `active`, `history`, `audio`, `vibration`, `error`. Factory `createPelvicStore(storage?)` permite testes e integração sem browser. Chave `winfit-pelvic-v1`, envelope `version: 1`. Integrar explicitamente export/import/reset com backup global. Não incluir dados pélvicos em nuvem sem consentimento.

Timer puro: fases prepare/contract/relax/rest, concluído como estado terminal. Tempo por âncora, sem decremento por tick. Pause conserva o gasto; resume cria âncora nova. Relógio inválido ou regressivo pausa. Reload reconstrói as fases a partir do conteúdo confiável e retorna pausado. Ocultação de página, pagehide e saída da rota pausam. Sessão concluída é registrada uma única vez; interrupção tem status próprio sem crédito de conclusão. Sinais não são relógio e não são obrigatórios. Áudio e vibração opt-in, desligados inicialmente, sem animação obrigatória.

Import valida versão, duração, referências de programa, timestamps, duplicatas e histórico concluído. Campos derivados do timer e fases importadas são reconstruídos. Backup inválido não substitui estado; storage corrompido bloqueia gravação automática até import válido ou reset explícito. Erros de quota aparecem no `error` e na tela; estado permanece em memória para exportação.

## Evidência TDD

Jornadas derivadas de E2/E3: respirar sem contrações; retomar sem contar tempo de ausência; não perder uma sessão ou duplicar conclusão; não permitir iniciar protocolo não revisado; separar histórico e tratar backup inválido/quota.

- RED `npx --yes tsx scripts/test-pelvic-timer.ts`: módulo pelvicTimer ausente (implementação nova), checkpoint 5f530b0.
- GREEN mesmo comando: phase anchors, pause, restore, invalid clocks, completion, review gate OK. Implementação checkpoint 0e781b2.
- RED `npx --yes tsx scripts/test-pelvic-store.ts`: módulo pelvicStore ausente (implementação nova), checkpoint 0e781b2.
- GREEN mesmo comando: gate, reload pause, idempotence, independent history, validated import, quota and reset OK.
- `npm run build`: TypeScript e produção Vite passaram.

Limites: não foi medido percentual de cobertura; testes usam asserts determinísticos sobre engine/persistência, não comprovam cobertura de 80%. Validação visual/toque e lifecycle no Safari físico pendentes. iOS pode não oferecer vibração, e áudio após reload pode precisar de novo gesto; texto e segundos são o canal principal. E2/E3 não devem ser marcadas concluídas quanto à revisão clínica e liberação de contrações.
