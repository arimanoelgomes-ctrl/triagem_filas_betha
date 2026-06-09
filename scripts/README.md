# Scripts auxiliares (compartilhados entre verticais)

Estes scripts servem a **todas as verticais** do monorepo. Cada um aceita o parâmetro `--vertical <nome>` para focar em uma vertical específica (`arrecadacao`, `pessoal`, etc.).

A pasta `scripts/` é única na raiz — qualquer melhoria aqui beneficia automaticamente todas as verticais.

## Pré-requisitos

- **Node.js 18 ou superior** (usa `fetch` nativo — sem dependências externas).

```cmd
node --version
```

Se for inferior a 18, atualize antes de continuar.

## Setup (primeira vez)

1. Entre no diretório:

   ```cmd
   cd C:\Scripts\ias\projetos_de_ia\triagem_filas_betha\scripts
   ```

2. Crie o `.env` a partir do template:

   ```cmd
   copy .env.example .env
   ```

3. Abra `scripts\.env` num editor e preencha:

   ```
   JIRA_BASE_URL=https://atendimento.betha.com.br
   JIRA_USERNAME=seu_usuario
   JIRA_PASSWORD=sua_senha_ou_token

   # Opcional — só se for Owner da org Anthropic
   ANTHROPIC_ADMIN_API_KEY=sk-ant-admin01-...
   ```

   > **Importante:** `scripts/.env` está no `.gitignore` do projeto — nunca será commitado.

---

## `post_comentarios.js`

Posta os comentários gerados pela triagem como **Nota Interna** no Jira da Betha.

Caminho preferido para postagem hoje é direto pelo MCP `jira-atendimento__add_comment` com `internal: true` (a partir de 2026-06-01 — ver `docs/incidente_mcp_add_comment.md`). Este script permanece útil como caminho alternativo: o coordenador pode revisar o arquivo de outputs antes de postar em lote, e o script é idempotente por chave.

### Uso

#### Listar arquivos de comentários disponíveis

```cmd
:: Todas as verticais
node post_comentarios.js --list

:: Uma vertical específica
node post_comentarios.js --vertical arrecadacao --list
node post_comentarios.js --vertical pessoal --list
```

#### Dry-run (não posta — apenas mostra o que seria postado)

```cmd
node post_comentarios.js --vertical arrecadacao --dry-run
node post_comentarios.js --vertical pessoal --dry-run
```

Por padrão pega o arquivo mais recente em `verticais/<nome>/outputs/`. Para apontar um arquivo específico:

```cmd
node post_comentarios.js --dry-run --file ../verticais/pessoal/outputs/2026-06-09_comentarios_para_postar.md
```

#### Postar de verdade

```cmd
node post_comentarios.js --vertical pessoal
```

O script vai:

1. Listar os comentários candidatos.
2. **Pedir confirmação interativa** (`s/N`).
3. Para cada comentário:
   - Verificar status (se estiver em `Fechado`, `Encerrado`, etc., **ignora**).
   - Verificar idempotência (se já existe comentário com `[#IA-TRIAGEM-AUTOMATICA#]` no chamado, **ignora**).
   - Postar como **Nota Interna**.
4. Mostrar resumo final com totais (postados / ignorados / erros).

Pular a confirmação interativa (uso em scripts):

```cmd
node post_comentarios.js --vertical pessoal --yes
```

#### Postar apenas um chamado

```cmd
node post_comentarios.js --vertical pessoal --issue BTHSC-319007
```

### Validação pós-postagem

**Sempre** confirme visualmente no Jira que pelo menos um dos comentários ficou com o destaque de Nota Interna (badge "Interno" ao lado direito do comentário, classe CSS `js-sd-internal-comment active`).

---

## `registrar_uso_tokens.js`

Consulta a **Admin Usage API** da Anthropic e grava o consumo de tokens do dia em `verticais/<nome>/logs/YYYY-MM-DD-usage.json`, além de injetar um bloco `## Consumo de tokens (Admin API)` no fim do `verticais/<nome>/logs/YYYY-MM-DD.md` correspondente. Fecha o ciclo de auditoria diária do projeto com o custo medido pela fonte oficial.

### Requisitos

- Node.js 18+.
- **Admin Key** da organização Anthropic — `sk-ant-admin01-...` (gerada em `console.anthropic.com → Settings → Admin Keys` por um Owner). Chaves comuns `sk-ant-api03-...` **não funcionam**.
- Variável `ANTHROPIC_ADMIN_API_KEY` no `scripts/.env`.

Sem a Admin Key, o script grava um **placeholder JSON** com instruções e sai com código 0 — útil para registrar que tentou e permitir preenchimento manual posterior.

### Uso

```cmd
:: Todas as verticais, dia de hoje (BRT)
node registrar_uso_tokens.js

:: Uma vertical específica
node registrar_uso_tokens.js --vertical arrecadacao

:: Vertical e dia específicos
node registrar_uso_tokens.js --vertical pessoal --date 2026-06-08

:: Só grava JSON, não toca no log .md
node registrar_uso_tokens.js --no-inject

:: Filtra por workspace (se a sua org tiver workspaces)
node registrar_uso_tokens.js --workspace-id ws_XXX
```

A janela consultada é sempre **00:00 a 24:00 BRT** (UTC-3). O script converte para UTC internamente antes de chamar a API.

### Limitação importante para múltiplas verticais

A Admin Usage API agrega por **chave de API/organização**, sem segmentar por agendamento. Quando você roda sem `--vertical`, o script grava o **mesmo total** em cada vertical (ambas as verticais usam a mesma chave). Para custo segmentado por vertical, o caminho oficial é o **Cost Report** da Console (endpoint distinto, requer agregação por workspace_id e configurar agendamentos com workspaces diferentes).

### Saída

- `verticais/<nome>/logs/YYYY-MM-DD-usage.json` — totais por modelo, custo estimado e payload bruto. Versionado no Git.
- `verticais/<nome>/logs/YYYY-MM-DD.md` — bloco `## Consumo de tokens (Admin API)` injetado no final. Idempotente: ao reexecutar, o bloco existente é **substituído**.

### Quando executar

Depois da triagem do dia, idealmente entre **02:00 e 04:00 BRT do dia seguinte** (para o dia BRT alvo ter encerrado e a Admin API retornar o total fechado).

### Tabela de preços

A estimativa de custo USD é calculada localmente pela tabela `PRECOS_USD_POR_MTK` no topo do script. Quando a Anthropic ajustar a tabela oficial, atualize as constantes. Para custo definitivo, use o **Cost Report** da Console.

---

## `test_post.js`

Script de diagnóstico para isolar causas de erros HTTP da API do Jira. Use em situações de troubleshooting (encoding, properties, payload). Não depende de vertical.

```cmd
node test_post.js --issue BTHSC-XXXXX --case 1
```

Casos numerados de 1 a 6 (do mais simples ao mais próximo do real). Cada caso posta um comentário; **apague manualmente após confirmar**.
