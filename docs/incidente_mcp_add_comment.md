# Incidente — MCP `jira-atendimento__add_comment` não respeita `properties`

**Data de abertura:** 2026-05-25
**Data de resolução:** 2026-06-01
**Severidade:** Alta (risco de exposição de comentário interno como público)
**Status:** RESOLVIDO — fix validado em 2026-06-01 (atalho `internal: true` implementado pelo time do MCP).

## Identificação do componente

- **Pacote NPM:** `@betha/jira-mcp`
- **Registry:** `http://nexus3.betha.com.br/repository/npm-all/`
- **Forma de execução:** `npx -y --registry http://nexus3.betha.com.br/repository/npm-all/ @betha/jira-mcp`
- **Ferramenta afetada:** `add_comment`.

---

## Resumo (versão original do incidente)

O MCP interno `jira-atendimento__add_comment` aceitava o parâmetro `properties` no schema (não retornava erro de validação), mas **não o repassava para a API REST do Jira**. Como consequência, comentários que deveriam ser marcados como **Nota Interna** (`sd.public.comment` com `internal: true`) eram gravados como **comentários públicos** — visíveis ao cliente.

Este incidente foi identificado durante a primeira execução de validação do projeto **Triagem Automática da Fila de Arrecadação** (em 2026-05-25). Por o pacote `@betha/jira-mcp` ser compartilhado por todas as verticais, o bug afetava ambas (Arrecadação e Pessoal) até a correção.

---

## Reprodução

### 1. Payload esperado pela API do Jira (capturado via DevTools)

Endpoint: `POST https://atendimento.betha.com.br/rest/api/2/issue/{issueId}/comment`

```json
{
    "body": "teste interno",
    "properties": [
        {
            "key": "sd.public.comment",
            "value": {
                "internal": true
            }
        }
    ]
}
```

Quando enviado pela interface do Jira (botão de Nota Interna ativo, com classe CSS `js-sd-internal-comment active`), o comentário é gravado como **interno**.

### 2. Chamada via MCP equivalente (antes do fix)

```
mcp__jira-atendimento__add_comment(
  issueKey: "BTHSC-318167",
  comment: "teste interno via MCP",
  explicitUserRequest: true,
  properties: [{"key": "sd.public.comment", "value": {"internal": true}}]
)
```

**Resultado antes do fix:**
- O MCP retornava sucesso (`commentId`).
- Porém, ao inspecionar visualmente no Jira, o comentário ficava **público** (sem o badge "Interno").

### 3. Variações testadas (antes do fix)

| Tentativa | Parâmetros | Resultado |
|-----------|------------|-----------|
| A | `body` + `properties` | Erro 400 — schema rejeitou `body` (esperava `comment`) |
| B | `comment` + `explicitUserRequest: true` + `internal: true` + `properties` | Erro 400 |
| C | `comment` + `explicitUserRequest: true` + `properties` | Sucesso (200), mas **comentário ficou público** |

---

## Diagnóstico

O parâmetro `properties` estava documentado no schema do MCP (aceito sem erro), mas o wrapper **não o serializava no body do request HTTP** enviado ao Jira. Hipóteses descartadas após análise do código:

1. **Bug de propagação:** o handler do `add_comment` ignorava silenciosamente o campo `properties` antes de chamar a API.
2. **Conversão indevida:** o campo era convertido para uma estrutura que o Jira não reconhecia (e a API silenciosamente descartava).
3. **Flag alternativa não exposta:** o MCP tinha capacidade de marcar internos via outra rota, mas a flag não estava no schema público.

---

## Solicitação ao time responsável pelo MCP

Pedimos uma das duas correções (em ordem de preferência):

1. **Repassar `properties` corretamente:** se o consumidor enviar `properties: [{key, value}]`, o MCP deve serializar esse array no body do POST exatamente como recebido.
2. **OU expor flag de conveniência `internal: true`:** o MCP recebe `internal: true` e monta internamente o `properties: [{key: "sd.public.comment", value: {internal: true}}]` antes de chamar a API.

A opção 1 é mais geral; a opção 2 é mais idiomática para o caso de uso comum.

---

## Impacto operacional enquanto o MCP não foi corrigido (25/05 → 01/06)

- Todos os comentários da triagem automatizada foram **gerados em arquivo Markdown** (`outputs/YYYY-MM-DD_comentarios_para_postar.md`).
- A postagem efetiva foi feita via `node scripts/post_comentarios.js`, que chama a API REST direta com o payload correto.
- O log diário registrou os comentários como "preparados" e indicou se já foram postados.
- A postagem automática direta pelo MCP **ficou suspensa** durante esse intervalo.

---

## Como validar o fix (procedimento usado em 2026-06-01)

```
mcp__jira-atendimento__add_comment(
  issueKey: "<chamado-teste>",
  comment: "teste de nota interna pos-fix",
  explicitUserRequest: true,
  internal: true
)
```

**Critério de aceitação:** o comentário aparece no Jira com a marcação visual de nota interna (badge "Interno", `js-sd-internal-comment active`) e **não dispara notificação ao cliente** no e-mail do reporter.

---

## Observação adicional (descoberta em paralelo)

Durante os testes, descobrimos uma limitação **separada** do servidor Jira da Betha: o body do comentário não pode conter caracteres Unicode fora do Basic Multilingual Plane (emojis modernos como 🤖, 🚀, ✅) — eles causam HTTP 500 silencioso, possivelmente porque o banco está com encoding restrito (latin1 ou versão antiga). O script `scripts/post_comentarios.js` já sanitiza esses caracteres antes do envio, e o template das verticais instrui a triagem a não emitir emojis. Esta limitação é **independente** do bug do MCP descrito acima e permanece válida mesmo após o fix.

---

## Resolução em 2026-06-01

O time mantenedor do `@betha/jira-mcp` implementou a **opção 2** sugerida — atalho de conveniência `internal: true`. O schema do `add_comment` agora aceita os dois campos:

- `internal: boolean` — atalho que monta internamente o `properties: [{ key: "sd.public.comment", value: { internal: true } }]` antes da chamada à API REST.
- `properties: [{ key, value }]` — campo livre para qualquer property do Jira (também passou a ser repassado corretamente, conforme schema).

### Teste de aceitação executado

Foi executado no projeto **Triagem da Fila de Arrecadação** (mesmo MCP, ambos os projetos compartilham o componente):

```
mcp__jira-atendimento__add_comment(
  issueKey: "BTHSC-318167",
  comment: "[TESTE-IA-MCP-INTERNO] Teste de validacao do fix do MCP add_comment (atalho `internal: true`). Comentario sera removido em seguida.",
  explicitUserRequest: true,
  internal: true
)
```

**Resultado:**

- `commentId: 14270695` criado às 16:19 BRT em 2026-06-01.
- Verificação visual no Jira (coordenador Ari): comentário apareceu com o badge **Interno** no canto direito (autor `MCP Integração Atendimento`).
- Comentário removido em seguida via `delete_comment` (~16:24 BRT) — sem prejuízo ao cliente.

### Decisão operacional

- A regra do CLAUDE.md que proibia `add_comment` via MCP **foi relaxada**: a partir de 2026-06-01, é seguro postar comentários internos via MCP usando o atalho `internal: true`.
- O script `scripts/post_comentarios.js` permanece disponível como caminho alternativo (útil em batch e quando o coordenador prefere revisar o arquivo `outputs/YYYY-MM-DD_comentarios_para_postar.md` antes da postagem). Ambos os fluxos passam a ser válidos.
- O CLAUDE.md de cada vertical foi atualizado nessa mesma data para refletir as duas opções e remover o veto à `add_comment`.

### Idempotência reforçada (lição aprendida)

Durante o mesmo dia em que o fix foi entregue, na execução da Arrecadação observamos que o snapshot inicial de idempotência do Passo 2 pode ficar **obsoleto** se outra sessão paralela já tiver postado entre o snapshot e a postagem efetiva. Como mitigação:

- **Antes de cada `add_comment` individual**, re-verificar via `get_issue` (com `includeComments: true`) se a tag `[#IA-TRIAGEM-AUTOMATICA#]` já foi posta no chamado naquele instante.
- Se já estiver postada, **pular** sem duplicar.
- Essa proteção "just-in-time" complementa o filtro em lote do Passo 2 e cobre race conditions entre execuções concorrentes (humano vs agendamento, dois agendamentos próximos, retry após erro).

Esta regra foi incorporada ao CLAUDE.md de ambas as verticais.
