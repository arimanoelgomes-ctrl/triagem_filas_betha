# Assertividade da Triagem — Snapshots Diários

Esta pasta guarda a série histórica da análise **Triagem x Eficiência**, gerada todo dia útil às 08:00 pelo agendamento `triagem-assertividade-semanal` (nome mantido por histórico; periodicidade alterada para diária em 2026-06-12).

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
| `taxa_assertividade_pct` | acertos avaliados ÷ total avaliados × 100 — considera APENAS chamados avaliados (rótulos humanos, IA-UTIL-AUTO e análise semântica: Aderente = acerto; Parcial e Divergente contam no denominador). Encerrar com sucesso sem avaliação NÃO conta como acerto |
| `aderentes` / `parciais` / `divergentes` | Resultado da análise semântica dos encerrados NA SEMANA: a solução final usou a sugestão da IA? |
| `label_ia_util` / `label_ia_nao_util` | Chamados com label de feedback manual dos analistas (se o processo de marcação for adotado) |

## Hierarquia de avaliação (definida em 2026-06-12)

1. **Rótulo humano do analista** (`IA-UTIL` / `IA-NAO-UTIL`) — prevalece sempre. IA-UTIL = acerto; IA-NAO-UTIL = erro.
2. **Rótulo automático** (`IA-UTIL-AUTO`) — aplicado pelo próprio snapshot quando a análise semântica classifica o chamado como Aderente (ver abaixo). Conta como acerto, mas um rótulo humano posterior prevalece sobre ele.
3. **Sem rótulos, chamado encerrado** — no snapshot, entra na análise semântica; no painel em tempo real, vale o proxy de desfecho (resolução de sucesso vs sem confirmação).
4. **Sem rótulos, chamado aberto** — "em andamento" (sem avaliação).

O painel em tempo real não faz análise semântica (só rótulos > proxy); a comparação de conteúdo é exclusiva do snapshot semanal.

## Rotulagem automática (IA-UTIL-AUTO) e registro local de avaliados

Quando a análise semântica do snapshot classifica um chamado encerrado como **Aderente** e ele não tem rótulo, o snapshot **tenta** aplicar o label `IA-UTIL-AUTO`. **Limitação investigada em 2026-06-12:** em chamados Fechados, os dois caminhos da API retornam HTTP 400 (`add_labels` e `update_issue` com operação atômica `labels add`) — o workflow bloqueia edição pós-fechamento. A interface web tem o botão **"Alterar Rótulo"**, que permite editar rótulos em chamados fechados, mas ele é uma ação de tela customizada que **não aparece na API** (`get_transitions` só expõe "Ajuste de informações") — ou seja, funciona para analistas, não para integração. Solicitação aberta ao time de administração do Jira/MCP (ver `solicitacao_rotulo_api.md`). Enquanto isso, o controle de "já avaliado" NÃO depende do rótulo: a fonte de verdade é o **`avaliados.csv`** desta pasta (chamado, vertical, data, classificação, se o rótulo foi aplicado).

Regras: o snapshot **nunca** usa `IA-UTIL`/`IA-NAO-UTIL` (exclusivos dos analistas), nunca remove labels e nunca posta comentários. Casos Parcial/Divergente não recebem rótulo — ficam no relatório e no `avaliados.csv`. Se um analista discordar de uma avaliação automática, basta adicionar `IA-NAO-UTIL` — o rótulo humano prevalece. Para o analista, o ideal é rotular **antes** de fechar o chamado, único momento em que o label é editável.

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
