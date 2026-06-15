# Logs de Execução — Triagem de Serviços

Esta pasta armazena o histórico diário de execução da triagem da **vertical Serviços** (fila em que a `Equipe responsável` = "Serviço"). Cada execução gera um arquivo Markdown no formato `YYYY-MM-DD.md`.

## Finalidade

- **Auditoria** — rastrear quais chamados de serviço foram analisados, ignorados ou comentados em cada dia.
- **Qualidade do orçamento** — registrar o escopo e as horas estimadas sugeridas, junto da base histórica (chamados solucionados) usada no cálculo.
- **Diagnóstico** — investigar comportamentos inesperados da IA (similaridade fraca, médias distorcidas etc.).

## Nomenclatura

- `YYYY-MM-DD.md` — log textual do dia (versionado).
- `YYYY-MM-DD-usage.json` — consumo de tokens medido pela Admin API (versionado, gerado por `../../../scripts/registrar_uso_tokens.js`).

## Formato do log

Cada arquivo deve seguir o template abaixo:

```markdown
# Triagem Automática de Serviços — YYYY-MM-DD

**Início da execução:** HH:MM (BRT)
**Fim da execução:** HH:MM (BRT)
**Total de chamados retornados pela JQL:** N
**Ignorados (já analisados):** N
**Ignorados (status encerrado):** N
**Analisados nesta execução:** N
**Comentários postados:** N
**Sem comentário (sem base histórica suficiente):** N

---

## Chamados ignorados (idempotência)

| Chave | Resumo | Motivo |
|-------|--------|--------|
| BTHSC-1234 | ... | Já possui tag [#IA-TRIAGEM-SERVICOS#] |

## Chamados com sugestão postada

### BTHSC-5678 — Resumo curto do serviço solicitado
- **Tipo do chamado:** Acompanhamento técnico / Customização / Tratamento de dados / Incidente
- **Sistema / Vertical de origem:** Pessoal (Folha Cloud) / Arrecadação (Tributos) / ...
- **Município:** Itajaí
- **Serviço identificado:** (descrição curta do que está sendo solicitado)
- **Chamados solucionados usados como base:** BTHSC-1111 (12h), BTHSC-2222 (18h), BTHSC-3333 (9h)
- **Horas estimadas sugeridas (média ponderada):** N h  (faixa: mín–máx h; nº base: K; estimativa original média: M h)
- **Escopo sugerido (resumo):** ...
- **ID do comentário interno:** 14XXXXXX

## Chamados analisados sem comentário

| Chave | Resumo | Motivo de não comentar |
|-------|--------|------------------------|
| BTHSC-9999 | ... | Nenhum chamado solucionado semelhante com horas apontadas |

## Observações / incidentes

- (Erros de API, chamados problemáticos, similaridade duvidosa, ajustes a discutir etc.)
```

## Regras

- Os logs são **versionados no Git** para servir de trilha de auditoria.
- Nunca incluir nos logs dados sensíveis do contribuinte/servidor (CPF/CNPJ completos, valores monetários do contrato, endereços, matrículas). Quando necessário citar, anonimize.
- O log deve ser gerado **mesmo quando a fila estiver vazia** ou quando todos os chamados forem ignorados — neste caso, o arquivo registra apenas o cabeçalho com totais zerados.
- O bloco `## Consumo de tokens (Admin API)` ao final do arquivo é injetado automaticamente pelo `scripts/registrar_uso_tokens.js` no dia seguinte. Não editar manualmente.
