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
    └── pessoal/
        ├── CLAUDE.md                      # Instruções operacionais
        ├── docs/                          # Docs específicos do Pessoal (eventos eSocial, jornada)
        ├── logs/
        └── outputs/
```

## Verticais cobertas

| Vertical | Produtos abrangidos |
|----------|---------------------|
| **arrecadacao** | Tributos, Procuradoria, Gestão Fiscal, e-Nota, Cidadão Web, Livro Eletrônico, Protocolo |
| **pessoal** | Folha Cloud, eSocial, Minha Folha, Ponto (Cloud), Pontual (Cloud), Recursos Humanos (Cloud) |

Cada vertical tem sua **JQL própria** (definida no `CLAUDE.md` da pasta correspondente) e seu **agendamento próprio** no Cowork.

## Regras críticas (aplicam-se a todas as verticais)

- **Nunca** envia mensagens públicas ao cliente — apenas comentários internos (badge "Interno" no Jira).
- **Nunca** inventa soluções — todas devem vir de chamados históricos `Fechado/Resolvido` com solução **aprovada pelo cliente**.
- Leis, instruções normativas e regras de negócio podem ser buscadas externamente, mas sempre identificadas como tal na seção "Análise Complementar" do comentário.
- **Sem emojis** fora do BMP no corpo dos comentários (limitação de encoding do Jira da Betha — emojis modernos quebram a API com HTTP 500).
- **Idempotência reforçada:** chamados com a tag `[#IA-TRIAGEM-AUTOMATICA#]` são pulados; antes de cada postagem, a IA re-verifica via `get_issue` (proteção contra race condition entre execuções).

Detalhamento por vertical: `verticais/arrecadacao/CLAUDE.md`, `verticais/pessoal/CLAUDE.md`.

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

Os agendamentos rodam automaticamente nos horários configurados no Cowork. Após cada execução, você recebe:

1. Uma **notificação** do Cowork no canto da tela.
2. Um **rascunho de email no Gmail** com o resumo daquela execução — **um rascunho separado por vertical**, para você revisar e enviar como achar melhor. Os rascunhos não se misturam entre Arrecadação e Pessoal.

Você pode então:

1. **Verificar visualmente** o log do dia em `verticais/<nome>/logs/<DATA>.md`.
2. **Conferir os comentários postados** (a IA agora posta direto via MCP `add_comment` com `internal: true`).
3. **Caso queira reprocessar** algum chamado manualmente, use o `scripts/post_comentarios.js`.

## Atualizações e contribuições

Como é um monorepo, qualquer melhoria no `scripts/` ou `docs/` raiz beneficia automaticamente todas as verticais. Para adicionar uma **nova vertical**:

1. Criar `verticais/<nome>/` com `CLAUDE.md`, `docs/`, `logs/.gitkeep`, `outputs/.gitkeep`.
2. Definir a JQL e o domínio no novo `CLAUDE.md` (use os existentes como base).
3. Criar o agendamento correspondente no Cowork.
4. Adicionar a vertical à tabela acima e ao `MIGRACAO.md`/changelog.

## Repositório Git

https://github.com/arimanoelgomes-ctrl/triagem_filas_betha

Repositórios anteriores (arquivados / read-only após a consolidação):
- `triagem_fila_arrecadacao` (substituído por `verticais/arrecadacao/`)
- `triagem_fila_pessoal` (substituído por `verticais/pessoal/`)
