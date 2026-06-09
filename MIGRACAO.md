# Migração — Consolidação em monorepo `triagem_filas_betha`

> Documento temporário. Pode ser apagado após a migração ser concluída e validada.

**Data:** 2026-06-09
**Repositório novo:** https://github.com/arimanoelgomes-ctrl/triagem_filas_betha
**Repositórios antigos (a serem arquivados):**
- https://github.com/arimanoelgomes-ctrl/triagem_fila_arrecadacao → vira `verticais/arrecadacao/`
- https://github.com/arimanoelgomes-ctrl/triagem_fila_pessoal → vira `verticais/pessoal/`

## Estado atual do monorepo

Já criado pelo agente (estrutura, scripts refatorados, CLAUDE.md de cada vertical, READMEs):

```
triagem_filas_betha/
├── README.md
├── .gitignore
├── MIGRACAO.md (este arquivo)
├── scripts/
│   ├── post_comentarios.js          # Refatorado: aceita --vertical
│   ├── registrar_uso_tokens.js      # Refatorado: aceita --vertical
│   ├── test_post.js
│   ├── .env.example
│   └── README.md
├── docs/
│   ├── README.md
│   └── incidente_mcp_add_comment.md  # Versão consolidada (com seção "Resolução em 2026-06-01")
└── verticais/
    ├── arrecadacao/
    │   ├── CLAUDE.md
    │   ├── docs/README.md
    │   └── logs/README.md
    └── pessoal/
        ├── CLAUDE.md
        ├── docs/README.md
        └── logs/README.md
```

Falta:
- Migrar logs históricos das verticais (arquivos `logs/YYYY-MM-DD.md` e `logs/YYYY-MM-DD-usage.json`).
- Migrar `outputs/` históricos (opcional — só se você quer manter a trilha).
- Migrar `docs/` específicos das verticais (se houver conteúdo customizado nas pastas antigas além dos README genéricos).
- Inicializar Git + primeiro push.
- Atualizar os 2 agendamentos do Cowork para apontarem para os novos CLAUDE.md.
- Arquivar os 2 repos antigos no GitHub.

## Checklist (para o Ari executar localmente)

### 1. Criar o repositório vazio no GitHub

Acesse https://github.com/new → nome `triagem_filas_betha`. **Não** inicialize com README, .gitignore ou licença (deixe vazio).

### 2. Migrar conteúdo histórico das verticais

Os logs e outputs das pastas antigas precisam ser movidos para dentro de `verticais/<nome>/`.

No cmd ou PowerShell:

```cmd
:: Logs da Arrecadação (todos os arquivos .md e .json da pasta logs/)
xcopy /Y C:\Scripts\ias\projetos_de_ia\triagem_fila_arrecadacao\logs\*.md ^
         C:\Scripts\ias\projetos_de_ia\triagem_filas_betha\verticais\arrecadacao\logs\
xcopy /Y C:\Scripts\ias\projetos_de_ia\triagem_fila_arrecadacao\logs\*.json ^
         C:\Scripts\ias\projetos_de_ia\triagem_filas_betha\verticais\arrecadacao\logs\ 2>nul

:: Outputs da Arrecadação (opcional — só se quiser preservar histórico de comentários gerados)
xcopy /Y C:\Scripts\ias\projetos_de_ia\triagem_fila_arrecadacao\outputs\*.md ^
         C:\Scripts\ias\projetos_de_ia\triagem_filas_betha\verticais\arrecadacao\outputs\

:: Logs do Pessoal (caso haja — provavelmente vazio ainda)
xcopy /Y C:\Scripts\ias\projetos_de_ia\triagem_fila_pessoal\logs\*.md ^
         C:\Scripts\ias\projetos_de_ia\triagem_filas_betha\verticais\pessoal\logs\ 2>nul
xcopy /Y C:\Scripts\ias\projetos_de_ia\triagem_fila_pessoal\logs\*.json ^
         C:\Scripts\ias\projetos_de_ia\triagem_filas_betha\verticais\pessoal\logs\ 2>nul

:: Outputs do Pessoal (caso haja)
xcopy /Y C:\Scripts\ias\projetos_de_ia\triagem_fila_pessoal\outputs\*.md ^
         C:\Scripts\ias\projetos_de_ia\triagem_filas_betha\verticais\pessoal\outputs\ 2>nul
```

> O `logs/README.md` do destino é diferente do origem (já está atualizado), então NÃO sobrescreva. Os comandos acima copiam só `*.md` e `*.json` que casam com nomes de data, preservando o README atualizado da pasta destino. Confirme manualmente após executar.

> Os outputs estão no `.gitignore` (pasta `outputs/` ignorada em qualquer nível), então mesmo migrando, eles não serão commitados — só ficam disponíveis localmente como referência.

### 3. Migrar `docs/` específicos (se necessário)

Se você adicionou conteúdo customizado em `docs/` dentro dos repos antigos (além do README e do `incidente_mcp_add_comment.md`), copie para `verticais/<nome>/docs/`:

```cmd
:: Verifique se ha mais arquivos alem do README e do incidente
dir C:\Scripts\ias\projetos_de_ia\triagem_fila_arrecadacao\docs\
dir C:\Scripts\ias\projetos_de_ia\triagem_fila_pessoal\docs\

:: Se houver outros, copie pra subpasta da vertical
xcopy /Y /S C:\Scripts\ias\projetos_de_ia\triagem_fila_arrecadacao\docs\*.md ^
            C:\Scripts\ias\projetos_de_ia\triagem_filas_betha\verticais\arrecadacao\docs\
```

O `incidente_mcp_add_comment.md` **NÃO** precisa ser copiado — já está em `docs/` raiz com versão consolidada.

### 4. Configurar credenciais

```cmd
cd C:\Scripts\ias\projetos_de_ia\triagem_filas_betha\scripts
copy .env.example .env
notepad .env
```

Use as mesmas credenciais que estavam nos `.env` antigos (`mcpintegracao`, Anthropic Admin Key se tiver).

### 5. Inicializar Git e fazer o push inicial

```cmd
cd C:\Scripts\ias\projetos_de_ia\triagem_filas_betha

git init -b main
git remote add origin https://github.com/arimanoelgomes-ctrl/triagem_filas_betha.git
git add .
git commit -m "feat: consolidacao em monorepo (arrecadacao + pessoal)"
git push -u origin main
```

### 6. Validar os scripts no novo caminho

```cmd
cd scripts

:: Dry-run da Arrecadação
node post_comentarios.js --vertical arrecadacao --dry-run

:: Dry-run do Pessoal
node post_comentarios.js --vertical pessoal --dry-run

:: Listar arquivos disponíveis
node post_comentarios.js --list
```

Se o parsing dos arquivos estiver OK, o setup está funcional.

### 7. Atualizar os 2 agendamentos do Cowork

Eu (agente) faço isso na sequência desta migração (próximo passo após você confirmar). O que vai mudar:

- `triagem-fila-arrecadacao-diaria` → prompt aponta para `C:\Scripts\ias\projetos_de_ia\triagem_filas_betha\verticais\arrecadacao\CLAUDE.md`
- `triagem-fila-pessoal-diaria` → prompt aponta para `C:\Scripts\ias\projetos_de_ia\triagem_filas_betha\verticais\pessoal\CLAUDE.md`
- Os horários e cron permanecem os mesmos.
- Cada um continua gerando seu próprio rascunho de email (separado por vertical).

### 8. Arquivar os repositórios antigos no GitHub

Depois que o push do novo repo funcionar e a primeira execução do agendamento atualizado rodar com sucesso (provavelmente na segunda-feira), arquive os repos antigos no GitHub:

1. `triagem_fila_arrecadacao` → Settings → "Archive this repository" → confirma.
2. `triagem_fila_pessoal` → Settings → "Archive this repository" → confirma.

Os repos ficam como **read-only** mas continuam acessíveis para auditoria histórica.

### 9. Apagar as pastas antigas no Windows (opcional)

Quando estiver confiante de que tudo está migrado:

```cmd
:: Backup primeiro, por seguranca
move C:\Scripts\ias\projetos_de_ia\triagem_fila_arrecadacao C:\Scripts\ias\projetos_de_ia\_archived\triagem_fila_arrecadacao
move C:\Scripts\ias\projetos_de_ia\triagem_fila_pessoal     C:\Scripts\ias\projetos_de_ia\_archived\triagem_fila_pessoal
```

Mantenha o `_archived/` por algumas semanas antes de apagar definitivamente.

## O que NÃO mudou

- A JQL de cada vertical permanece igual.
- O fluxo dos 7 passos (coletar → filtrar → analisar → comentar → log → email → tokens) permanece igual.
- A regra de não consolidar rascunhos de email entre verticais permanece.
- Idempotência reforçada, sem emoji, sem comentário público — todas as regras críticas permanecem.

## Após a migração — apagar este arquivo

Quando os 2 agendamentos novos rodarem com sucesso por uma semana e tudo estiver funcionando, apague `MIGRACAO.md` do repo:

```cmd
del MIGRACAO.md
git add MIGRACAO.md
git commit -m "chore: remove guia de migracao apos consolidacao validada"
git push
```
