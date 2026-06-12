# Assertividade da Triagem — Snapshots Semanais

Esta pasta guarda a série histórica da análise **Triagem x Eficiência**, gerada toda segunda-feira pelo agendamento `triagem-assertividade-semanal`.

## Arquivos

- `YYYY-MM-DD.md` — relatório semanal legível: métricas por vertical + análise de aderência dos chamados encerrados na semana.
- `historico.csv` — série histórica acumulada (1 linha por vertical por snapshot), base para gráficos de evolução.

## Métricas (por vertical)

| Coluna | Significado |
|--------|-------------|
| `data` | Data do snapshot (segunda-feira) |
| `vertical` | arrecadacao, pessoal, saude, contabil, compras_contratos |
| `comentados_total` | Chamados com a tag [#IA-TRIAGEM-AUTOMATICA#] (acumulado) |
| `resolvidos` | Encerrados (Done) com resolução de sucesso |
| `encerrados_sem_confirmacao` | Encerrados com "Necessidade não confirmada", "Cancelado", "Duplicado" ou "Não solucionado" |
| `em_andamento` | Ainda abertos |
| `taxa_assertividade_pct` | resolvidos ÷ (resolvidos + encerrados_sem_confirmacao) × 100 |
| `aderentes` / `parciais` / `divergentes` | Resultado da análise semântica dos encerrados NA SEMANA: a solução final usou a sugestão da IA? |
| `label_ia_util` / `label_ia_nao_util` | Chamados com label de feedback manual dos analistas (se o processo de marcação for adotado) |

## Hierarquia de avaliação (definida em 2026-06-12)

1. **Rótulo humano do analista** (`IA-UTIL` / `IA-NAO-UTIL`) — prevalece sempre. IA-UTIL = acerto; IA-NAO-UTIL = erro.
2. **Rótulo automático** (`IA-UTIL-AUTO`) — aplicado pelo próprio snapshot quando a análise semântica classifica o chamado como Aderente (ver abaixo). Conta como acerto, mas um rótulo humano posterior prevalece sobre ele.
3. **Sem rótulos, chamado encerrado** — no snapshot, entra na análise semântica; no painel em tempo real, vale o proxy de desfecho (resolução de sucesso vs sem confirmação).
4. **Sem rótulos, chamado aberto** — "em andamento" (sem avaliação).

O painel em tempo real não faz análise semântica (só rótulos > proxy); a comparação de conteúdo é exclusiva do snapshot semanal.

## Rotulagem automática (IA-UTIL-AUTO)

Quando a análise semântica do snapshot classifica um chamado encerrado como **Aderente** e ele não tem rótulo, o snapshot aplica o label `IA-UTIL-AUTO` no chamado. Isso evita depender só da disciplina manual e marca o chamado como já avaliado (não será reanalisado). Regras: o snapshot **nunca** usa `IA-UTIL`/`IA-NAO-UTIL` (exclusivos dos analistas), nunca remove labels e nunca posta comentários. Casos Parcial/Divergente não recebem rótulo — ficam só no relatório. Se um analista discordar de um `IA-UTIL-AUTO`, basta adicionar `IA-NAO-UTIL` — o rótulo humano prevalece.

## Análise de aderência (semântica)

Para cada chamado comentado pela IA que **encerrou desde o último snapshot e não possui rótulo de feedback**, o agente compara o comentário da triagem com a solução registrada no chamado e classifica:

- **Aderente** — a solução final corresponde à sugestão da IA (mesmo procedimento/causa).
- **Parcial** — a solução usou parte da sugestão ou o mesmo diagnóstico com tratamento diferente.
- **Divergente** — a solução não tem relação com o que a IA sugeriu.

Essa classificação é feita pelo agente (leitura dos comentários) e registrada no relatório da semana com justificativa de 1 linha por chamado — auditável por amostragem.

## Feedback manual dos analistas (opcional, eleva a precisão)

Convenção proposta: ao usar ou descartar uma sugestão da triagem, o analista adiciona no campo **Rótulos (labels)** do chamado:

- `IA-UTIL` — a sugestão ajudou na resolução.
- `IA-NAO-UTIL` — a sugestão não ajudou.

O snapshot conta essas labels via JQL (`labels in (IA-UTIL)`); quando existirem, prevalecem sobre o proxy automático.
