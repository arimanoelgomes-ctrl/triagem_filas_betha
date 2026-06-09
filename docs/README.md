# Documentação genérica do monorepo

Esta pasta armazena documentação **compartilhada** entre todas as verticais do projeto — incidentes, padrões de arquitetura, decisões transversais, glossário de termos comuns à plataforma.

## Conteúdo atual

- **`incidente_mcp_add_comment.md`** — histórico do bug do MCP `@betha/jira-mcp` (resolvido em 2026-06-01) e da limitação de encoding do Jira (sem emojis fora do BMP). Aplicável a todas as verticais.

## Documentação específica de cada vertical

Cada vertical tem sua própria pasta `docs/` para conteúdo de domínio (glossário, regras de negócio, ADRs específicos):

- `verticais/arrecadacao/docs/` — Tributos, ISS, IPTU, ITBI, e-Nota, Procuradoria, etc.
- `verticais/pessoal/docs/` — Folha, eSocial, Ponto, RH, eventos S-2xxx, jornada, banco de horas, etc.

## Regras

- Esta pasta é versionada no Git.
- Documente aqui qualquer mudança que afete **mais de uma vertical** (incidentes de plataforma, novos padrões de comentário, mudanças no fluxo geral).
- Para conteúdo específico, prefira `verticais/<nome>/docs/`.
