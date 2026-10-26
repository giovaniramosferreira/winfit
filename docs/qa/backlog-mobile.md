# QA móvel do backlog

Execução local: 2026-10-26T18:54:49.029Z · Chrome headless · http://127.0.0.1:5173/

- PASS: Hub contém quatro módulos e links auxiliares
- PASS: Academia e calistenia preservam sessão, índice, séries e descanso
- PASS: Watch sem consentimento gera zero requests
- PASS: Watch opt-in inicia relay mock e revogação interrompe
- PASS: Saúde pélvica inicia, pausa e recarrega pausada
- PASS: Alimentação: pendência, edição, exclusão, restauração e meta persistem
- PASS: Rotina: checklist e lembretes desligados persistem
- PASS: Progresso abre detalhes das séries históricas
- PASS: Assistente mostra proposta sem aplicar automaticamente
- PASS: Layout 390px /home
- PASS: Layout 390px /training
- PASS: Layout 390px /calisthenics
- PASS: Layout 390px /pelvic
- PASS: Layout 390px /nutrition
- PASS: Layout 390px /routine
- PASS: Layout 390px /progress
- PASS: Layout 390px /assistant
- PASS: Layout 320px /home
- PASS: Layout 320px /training
- PASS: Layout 320px /calisthenics
- PASS: Layout 320px /pelvic
- PASS: Layout 320px /nutrition
- PASS: Layout 320px /routine
- PASS: Layout 320px /progress
- PASS: Layout 320px /assistant



Console pageerrors: 0. Requests externos interceptados: 4; nenhum encaminhado à rede. Relay mock: 4.

Inspeção visual de Home390, Nutrition320 e Routine320: módulos legíveis e sem corte horizontal. Routine usa controles nativos pequenos e labels colados; recomendar padronização de campos e áreas de toque antes da liberação. Sem baseline visual: regressão de aparência inconclusiva. Screenshots em docs/testing/artifacts/backlog-*.png. Não substitui Safari físico, leitor de tela ou medição de Core Web Vitals.

```json
{
  "results": [
    "Hub contém quatro módulos e links auxiliares",
    "Academia e calistenia preservam sessão, índice, séries e descanso",
    "Watch sem consentimento gera zero requests",
    "Watch opt-in inicia relay mock e revogação interrompe",
    "Saúde pélvica inicia, pausa e recarrega pausada",
    "Alimentação: pendência, edição, exclusão, restauração e meta persistem",
    "Rotina: checklist e lembretes desligados persistem",
    "Progresso abre detalhes das séries históricas",
    "Assistente mostra proposta sem aplicar automaticamente",
    "Layout 390px /home",
    "Layout 390px /training",
    "Layout 390px /calisthenics",
    "Layout 390px /pelvic",
    "Layout 390px /nutrition",
    "Layout 390px /routine",
    "Layout 390px /progress",
    "Layout 390px /assistant",
    "Layout 320px /home",
    "Layout 320px /training",
    "Layout 320px /calisthenics",
    "Layout 320px /pelvic",
    "Layout 320px /nutrition",
    "Layout 320px /routine",
    "Layout 320px /progress",
    "Layout 320px /assistant"
  ],
  "failures": [],
  "errors": [],
  "externalRequests": 4,
  "relayRequests": [
    "status",
    "status",
    "events",
    "poll"
  ],
  "viewportScreenshots": "C:\\IA\\winfit\\docs\\testing\\artifacts"
}
```
