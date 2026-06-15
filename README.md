# Triagem Automática das Filas de Suporte da Betha

Monorepo de automações de triagem para chamados de suporte da Betha Sistemas, executadas duas vezes por dia útil por agentes de IA (Claude). Cada **vertical** (Arrecadação, Pessoal etc.) tem sua própria configuração e logs, mas todos compartilham os mesmos scripts auxiliares e regras de plataforma.

## O que esse projeto faz, em uma frase

A cada execução, o agente:

1. Coleta a fila atual do Jira da Betha via JQL específica da vertical.
2. Filtra chamados já analisados (idempotência) e em status encerrado.
3. Busca soluções aprovadas em chamados históricos.
4. Posta um comentário **interno** (visível só para suporte/implantação) com a sugestão técnica, citando os chamados históricos usados como base.
5. Registra a execução em `verticais/<nome>/logs/YYYY-MM-DD.md` para auditoria.

## Estrutura do monorepo

```
triagem_filas_betha/
├── README.md                              # Este arquivo
├── .gitignore                             # Cobre logs/, outputs/, .env em qualquer nível
├── MIGRACAO.md                            # Checklist da migração dos repos antigos (temporário)
├── scripts/                               # COMPARTILHADO — uma atualização atinge todas as verticais
│   ├── post_comentarios.js                # Postagem em lote como Nota Interna (caminho alternativo)
│   ├── registrar_uso_tokens.js            # Auditoria de tokens via Admin Usage API
│   ├── test_post.js                       # Diagnóstico de erros HTTP do Jira
│   ├── .env.example
│   ├── .env                               # NÃO versionado — preencha localmente
│   └── README.md
├── docs/                                  # COMPARTILHADO — docs transversais a todas as verticais
│   ├── README.md
│   └── incidente_mcp_add_comment.md       # Histórico do bug do MCP (resolvido em 2026-06-01)
└── verticais/                             # Configuração + dados POR VERTICAL
    ├── arrecadacao/
    │   ├── CLAUDE.md                      # Instruções operacionais (JQL, produtos, regras)
    │   ├── docs/                          # Docs específicos da Arrecadação (glossário tributário, ADRs)
    │   ├── logs/                          # Histórico diário (versionado)
    │   └── outputs/                       # Arquivos diários de comentários (ignorados pelo Git)
    ├── pessoal/
    │   ├── CLAUDE.md                      # Instruções operacionais
    │   ├── docs/                          # Docs específicos do Pessoal (eventos eSocial, jornada)
    │   ├── logs/
    │   └── outputs/
    ├── saude/
    │   ├── CLAUDE.md                      # Instruções operacionais (rascunho de email vai para Maitê)
    │   ├── docs/                          # Docs específicos de Saúde (SIGTAP, Datasus, e-SUS APS)
    │   ├── logs/
    │   └── outputs/
    ├── contabil/
    │   ├── CLAUDE.md                      # Instruções operacionais
    │   ├── docs/                          # Docs específicos do Contábil (PCASP, MSC, e-Sfinge contábil)
    │   ├── logs/
    │   └── outputs/
    ├── compras_contratos/
    │   ├── CLAUDE.md                      # Instruções operacionais
    │   ├── docs/                          # Docs específicos de Compras/Contratos (NLLC, PNCP, TCE-SC)
    │   ├── logs/
    │   └── outputs/
    └── servicos/                          # FILA DE SERVIÇOS — atravessa todos os produtos
        ├── CLAUDE.md                      # Triagem de escopo + horas estimadas (não sugere solução)
        ├── docs/                          # Catálogo de serviços, critérios de similaridade
        ├── logs/
        └── outputs/
```

## Verticais cobertas

| Vertical | Produtos abrangidos | Destinatário do rascunho de email |
|----------|---------------------|-----------------------------------|
| **arrecadacao** | Tributos, Procuradoria, Gestão Fiscal, e-Nota, Cidadão Web, Livro Eletrônico, Protocolo | arimanoel.gomes@betha.com.br (Ari) |
| **pessoal** | Folha Cloud, eSocial, Minha Folha, Ponto (Cloud), Pontual (Cloud), Recursos Humanos (Cloud) | arimanoel.gomes@betha.com.br (Ari) |
| **saude** | Sistemas de Saúde Municipal (PEC, e-SUS APS, BPA, RAAS, regulação, agendamento, farmácia, vacinas etc.) | maite.passos@betha.com.br (Maitê) |
| **contabil** | Contábil (Cloud), Planejamento, Tesouraria, Prestação de Contas (e-Sfinge/MSC/SICONFI), Portal do Gestor | arimanoel.gomes@betha.com.br (Ari) |
| **compras_contratos** | Compras (Cloud), Contratos (Cloud), licitações, PNCP, envio de atos de contratação ao TCE-SC | arimanoel.gomes@betha.com.br (Ari) |
| **servicos** | Fila de serviços (`Equipe responsável` ∈ "Serviço", "Serviços Especializados", "Migração") de TODOS os produtos — Arrecadação/ISS, Pessoal+Saúde+Educação, Contábil, Compras/Contratos | arimanoel.gomes@betha.com.br (Ari) |

Cada vertical tem sua **JQL própria** (definida no `CLAUDE.md` da pasta correspondente) e os 2 agendamentos consolidados (manhã + tarde) processam todas em sequência. **Cada vertical gera seu próprio rascunho de email** — nunca consolidamos rascunhos entre verticais.

> **A vertical `servicos` é de natureza diferente.** Em vez de sugerir a **solução** de uma dúvida/incidente (como as verticais de produto), ela faz a **triagem de serviços**: identifica qual serviço está sendo solicitado e sugere ao analista o **escopo** (campo "Informações para negociação", `cf[16000]`) e as **horas estimadas** — calculadas pela **média ponderada das horas efetivamente apontadas** (`timespent`) em chamados de serviço já solucionados semelhantes, **não** pela estimativa original. Isso evita orçar serviços abaixo do que historicamente consomem. Considera como "serviço" as equipes responsáveis "Serviço", "Serviços Especializados" e "Migração". Usa a tag de idempotência própria `[#IA-TRIAGEM-SERVICOS#]`.

## Regras críticas (aplicam-se a todas as verticais)

- **Nunca** envia mensagens públicas ao cliente — apenas comentários internos (badge "Interno" no Jira).
- **Nunca** inventa soluções — todas devem vir de chamados históricos `Fechado/Resolvido` com solução **aprovada pelo cliente**.
- Leis, instruções normativas e regras de negócio podem ser buscadas externamente, mas sempre identificadas como tal na seção "Análise Complementar" do comentário.
- **Sem emojis** fora do BMP no corpo dos comentários (limitação de encoding do Jira da Betha — emojis modernos quebram a API com HTTP 500).
- **Idempotência reforçada:** chamados com a tag `[#IA-TRIAGEM-AUTOMATICA#]` são pulados; antes de cada postagem, a IA re-verifica via `get_issue` (proteção contra race condition entre execuções).
- **Cruzamento com o backlog (Passo 3.1, todas as verticais desde 2026-06-11):** chamados cuja necessidade sugere funcionalidade de produto são cruzados com Características/Stories do `jira-desenv`; o resultado vai para o log e para o rascunho de email (comentário no Jira só se o item estiver Atendido).

Detalhamento por vertical: `verticais/<nome>/CLAUDE.md`.

## Pré-requisitos

- **Windows 10/11** (caminhos deste guia; Linux/macOS funcionam com ajustes mínimos).
- **Git** — https://git-scm.com/download/win.
- **Node.js 18 ou superior** — https://nodejs.org. Verifique com `node --version`.
- **Cowork** (Claude Desktop com modo agente) instalado.
- **Acesso ao Jira da Betha** (`https://atendimento.betha.com.br`) com credenciais válidas.
- **Acesso aos MCPs internos** (`jira-atendimento` e `jira-desenv`).
- **(Opcional) Admin Key da organização Anthropic** (`sk-ant-admin01-...`) — para registrar o consumo de tokens diário.

## Setup rápido

```cmd
:: 1. Clonar
cd C:\Scripts\ias\projetos_de_ia
git clone https://github.com/arimanoelgomes-ctrl/triagem_filas_betha.git
cd triagem_filas_betha

:: 2. Configurar credenciais (uma vez só — comum a todas as verticais)
cd scripts
copy .env.example .env
notepad .env

:: 3. Pre-aprovar permissoes no Cowork
:: Na sidebar do Cowork, clique em "Scheduled" → "Run now" em cada agendamento
```

Detalhes de cada script: `scripts/README.md`.
Detalhes de cada vertical: `verticais/<nome>/CLAUDE.md`.

## Operação diária

Os agendamentos rodam automaticamente nos horários configurados no Cowork. **Há 2 execuções por dia útil** (manhã 07:30 e tarde 15:00), e cada uma processa as verticais em sequência (arrecadacao, pessoal, saude, contabil, compras_contratos e servicos).

### Notificações e rascunhos de email

- **Manhã:** apenas processa a triagem e gera os logs do dia. **Não cria rascunho de email.**
- **Tarde:** processa o delta sobre a manhã + **cria um rascunho de email diário consolidado por vertical** (manhã + tarde em um único resumo). **Condicional:** o rascunho só é criado se aquela vertical teve **pelo menos 1 comentário postado** no dia. Se uma vertical não comentou nada hoje, o rascunho dela é suprimido para reduzir ruído na caixa de entrada.

Cada vertical mantém seu **destinatário próprio** (rascunhos NUNCA são consol