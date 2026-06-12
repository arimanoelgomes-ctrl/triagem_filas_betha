# Solicitação — Permitir atualização de rótulos via API em chamados Fechados

**Para:** time de administração do Jira da Betha / mantenedores do MCP `@betha/jira-mcp`
**De:** Arimanoel Gomes (Coordenação de Portfólio)
**Data:** 2026-06-12
**Contexto:** projeto de triagem automática das filas de suporte (monorepo `triagem_filas_betha`) — rotina semanal de auditoria de assertividade.

## Necessidade

A rotina de auditoria da triagem automática precisa aplicar o rótulo `IA-UTIL-AUTO` em chamados **já fechados** (a avaliação compara a sugestão da IA com a solução final, que só existe após o encerramento). Hoje isso falha via API.

## O que foi testado (2026-06-12, chamados BTHSC-323959 e BTHSC-321418, ambos Fechados)

1. `PUT /rest/api/2/issue/{key}` com `fields.labels` (via MCP `add_labels`) → **HTTP 400**.
2. `PUT /rest/api/2/issue/{key}` com `update.labels [{add}]` (via MCP `update_issue`, operação atômica) → **HTTP 400**.
3. `GET /rest/api/2/issue/{key}/transitions` → expõe apenas a transição "Ajuste de informações" (id 3781).
4. Na **interface web**, o botão **"Alterar Rótulo"** está disponível em chamados Fechados e permite editar a lista de rótulos — ou seja, a operação existe e é permitida para usuários, mas não está acessível via API (provável ação de tela customizada/plugin, não exposta como transição).

## O que pedimos (qualquer uma das alternativas resolve)

1. **Liberar a edição do campo `labels` via API em chamados Fechados** (propriedade do workflow que hoje bloqueia a edição), idealmente restrita ao usuário de integração `mcpintegracao`; OU
2. **Expor a ação "Alterar Rótulo" como transição de workflow com tela**, para que a API possa executá-la via `POST /transitions` com o campo `labels` (neste caso, também é necessário o MCP `transition_issue` aceitar `fields`); OU
3. **Criar um endpoint/ação no MCP** que reproduza o comportamento do botão "Alterar Rótulo".

## Impacto se atendido

- A auditoria semanal passa a marcar automaticamente no Jira os chamados em que a sugestão da triagem foi confirmada pela solução final (`IA-UTIL-AUTO`), dando visibilidade direta nos chamados e nos painéis via JQL (`labels in (IA-UTIL-AUTO)`).
- Sem isso, o controle segue funcionando por registro local (`avaliados.csv` no repositório do projeto), porém sem visibilidade do rótulo dentro do próprio Jira.

## Observação de segurança

A rotina só **adiciona** o rótulo `IA-UTIL-AUTO` (nunca remove rótulos, nunca usa `IA-UTIL`/`IA-NAO-UTIL`, que são exclusivos dos analistas, e nunca altera status ou posta comentários por esta via).
