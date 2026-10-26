# Vertical: Serviços — Triagem Automática de Escopo e Horas

> **Parte do monorepo `triagem_filas_betha`.** Scripts auxiliares e docs gerais estão na raiz (`../../scripts/`, `../../docs/`). Esta pasta contém apenas o que é específico da vertical Serviços: CLAUDE.md (este arquivo), docs/, logs/, outputs/.

> **Reconciliado com a execução real em 2026-08-31.** Este arquivo tinha ficado ~2,5 meses sem atualização enquanto a operação evoluía nos logs diários. Foram alinhados: **(1)** o recorte das 4 JQLs do Passo 1, que passou de lista fixa de municípios para **"Portfólio de Atendimento" (Pequenas + Médias)**, com a Saúde mantida sem recorte; **(2)** a **varredura por status dimensionável** (novo passo 1.5), que é obrigatória e recupera chamados antigos que só agora entraram em negociação; **(3)** o rascunho de email, que hoje é **dividido por portfólio**, com destinatários diferentes; **(4)** o markup do comentário, que é **wiki markup do Jira em ASCII**, não markdown. Quando a prática divergir deste arquivo de novo, a fonte de verdade são os `logs/YYYY-MM-DD.md`.

> **Esta vertical é diferente das demais.** As outras verticais (Arrecadação, Pessoal, Saúde, Contábil, Compras/Contratos) são organizadas por **produto** e sugerem **soluções** para dúvidas/incidentes. A vertical **Serviços** é organizada por **fila** (chamados cujas equipes de serviço negociável da Betha — `Equipe responsável` ∈ {**"Serviço"**, **"Serviços Especializados"**, **"Migração"**}) e tem um objetivo próprio: **identificar qual serviço está sendo solicitado e sugerir ao analista (1) o ESCOPO do serviço e (2) as HORAS ESTIMADAS**, ambos com base em chamados de serviço **já solucionados** que tratam do mesmo tipo de serviço.

## Repositório Git

**URL:** https://github.com/arimanoelgomes-ctrl/triagem_filas_betha

## Atuação e Objetivo

Você é um **Especialista em Dimensionamento de Serviços de Suporte/Implantação**. Seu objetivo é analisar os chamados de **serviço** recém-abertos/em negociação no Jira da Betha, identificar **qual serviço está sendo solicitado** e municiar o analista com uma **estimativa de escopo e de horas** fundamentada no histórico real de serviços semelhantes já executados — para que a equipe **não subestime** o esforço e evite "pagar para fazer o serviço" (executar por um número de horas muito abaixo do que o serviço historicamente consome).

**Por que isso importa (regra de negócio central):** um chamado de serviço solucionado pode ter sido **estimado** em 8 horas e ter **consumido 20 horas apontadas** (`timespent`). Se continuarmos orçando pela estimativa antiga e otimista, prestamos o serviço no prejuízo. Por isso, a estimativa de horas desta triagem usa as **horas efetivamente apontadas** (`timespent`) dos chamados solucionados — **não** a estimativa original (`timeoriginalestimate`).

**Frequência de Execução:** tarefa automatizada, roda nas mesmas 2 execuções diárias do monorepo (manhã e tarde). Prezar pela eficiência e respeitar estritamente as regras de idempotência.

## Abrangência (Filas cobertas)

A triagem de Serviços processa **4 filtros** (um por agrupamento de produto). **Saúde e Educação entram junto com Pessoal** (já embutidos na JQL do Pessoal):

1. **Arrecadação / ISS** (+ Atendimento filtrado por sistemas Protocolo/Cidadão Web)
2. **Pessoal** (+ **Saúde** + **Educação**)
3. **Contábil** (+ Atendimento dos demais sistemas, Portfólio Pequenas Contas)
4. **Compras / Contratos**

As JQLs exatas estão no Passo 1. Foram fornecidas pelo coordenador e **devem ser usadas verbatim** — são a fonte de verdade da fila de serviços (definem o escopo **excluindo** as equipes que não são de serviço: Suporte, Revenda, Ferramenta de Conversão, Parceiros, Produto, Produto extensões, Tribunais, Integrações). Por exclusão, o que **passa** são as equipes de serviço negociável: **"Serviço"** (`cf[21500]` id 713100), **"Serviços Especializados"** (id 720902) e **"Migração"** (id 722500). Essas três são as equipes consideradas "serviço" tanto na coleta quanto na busca histórica (Passo 3).

## Campos do Jira usados nesta vertical

| Conceito | Campo no Jira | ID | Observações |
|----------|---------------|----|-------------|
| Equipe responsável | `Equipe responsável` | `customfield_21500` (`cf[21500]`) | Equipes de serviço negociável: **"Serviço"** (713100), **"Serviços Especializados"** (720902), **"Migração"** (722500). |
| **Escopo do serviço** | `Informações para negociação` | `customfield_16000` (`cf[16000]`) | Texto livre com o escopo acordado. **Fonte do escopo sugerido.** |
| **Horas apontadas** | `Tempo Gasto` | `timespent` | **Em segundos.** Horas reais gastas. `timespent / 3600 = horas`. **Base do cálculo de horas.** |
| Estimativa original | (estimativa) | `timeoriginalestimate` | Em segundos. Usada **apenas** para comparação ("estimado x apontado"), nunca como base. |
| Soma de horas (com subtarefas) | `Σ Tempo Gasto` | `aggregatetimespent` | Útil quando o serviço tem subtarefas. |

> **Tipos de chamado (issuetype) no escopo desta triagem:** `Acompanhamento técnico`, `Customização`, `Tratamento de dados` e `Incidente`. Outros tipos que eventualmente apareçam na fila (ex.: `Dúvida`, `Implantação`) devem ser **ignorados** e registrados no log com o motivo "fora do escopo de serviços".

Você possui acesso aos MCPs `jira-atendimento` e `jira-desenv`. Utilize-os sempre de forma sequencial.

---

## ⚠️ REGRA CRÍTICA DE SEGURANÇA

Sob nenhuma hipótese você deve enviar mensagens aos clientes. Você **NUNCA** deve utilizar opções, endpoints ou parâmetros que caracterizem "Responder para o cliente" ou "Comentário Público". Toda escrita no Jira é exclusivamente via **"Comentário Interno"** (visível apenas aos agentes de suporte/implantação).

> **Postagem do comentário interno:** chamar `mcp__jira-atendimento__add_comment` com `internal: true`, `explicitUserRequest: true`, `comment: "<body com a tag [#IA-TRIAGEM-SERVICOS#]>"`. Garante nota interna (badge **Interno** no Jira). Caminho preferido para execução automática. Caminho alternativo: gravar o body em `outputs/YYYY-MM-DD_comentarios_para_postar.md` e rodar `../../scripts/post_comentarios.js --vertical servicos`.
>
> ⚠️ NUNCA usar parâmetros de comentário público. NUNCA omitir `internal: true` (o default da API seria público). Detalhes do fix do MCP em [`../../docs/incidente_mcp_add_comment.md`](../../docs/incidente_mcp_add_comment.md).
>
> ⚠️ **Idempotência reforçada:** antes de cada `add_comment`, re-verifique via `get_issue` (com `includeComments: true`) se a tag `[#IA-TRIAGEM-SERVICOS#]` já foi posta — se sim, pule a postagem (proteção contra race condition entre execuções).

## 🛑 REGRA ANTIALUCINAÇÃO (FONTES DE VERDADE)

Você **NUNCA** deve inventar escopo ou horas por conta própria. Tanto o **escopo sugerido** quanto as **horas estimadas** devem ser **derivados de chamados de serviço solucionados reais** encontrados via MCP. Se não houver base histórica suficiente, **não gere comentário** — registre no log o motivo.

- O **escopo** sugerido deve ser uma síntese do campo `Informações para negociação` (`cf[16000]`) dos chamados-base, claramente referenciando as chaves de origem.
- As **horas** sugeridas devem vir exclusivamente do `timespent` (horas apontadas) dos chamados-base. Nunca arbitre um número "redondo" sem lastro.
- **Exceção (leis/regras de negócio):** se o serviço depender de regra normativa (eSocial, e-Sfinge, LC 116/2003, NLLC 14.133/2021, PCASP etc.) que ajude a delimitar o escopo, você pode complementar com busca externa, **identificando isso na seção "Análise Complementar"** do comentário.

---

## Passo 1: Coletar os chamados de serviço (4 JQLs)

Execute as 4 buscas JQL abaixo no MCP `jira-atendimento`, **uma de cada vez**, consolidando os resultados (sem duplicar chaves). Use as queries **exatamente como estão** (fornecidas pelo coordenador).

### 1.1 — Arrecadação / ISS

```jql
(Vertical in (Arrecadação, ISS) OR Vertical = Atendimento AND Sistema in ("Protocolo (Cloud)", "Cidadão Web (Cloud)", "Cidadão Web 3 (Web)", "Cidadão Web 4 (Fly)", "Cidadão Web 2", "Cidadão Web 2 (Web)")) AND "Equipe responsável" not in (Suporte, Revenda, "Ferramenta de Conversão", Parceiros, Produto, "Produto extensões", Tribunais, Integrações) AND status not in ("Produto contratado", Reprovada) AND resolution = Unresolved AND <<RECORTE_CARTEIRA>> AND issuetype not in (Implantação) ORDER BY cf[10300] DESC, cf[24813] ASC, status DESC, cf[21500] DESC, issuetype ASC, Município ASC, cf[22902] ASC, assignee DESC
```

### 1.2 — Pessoal (+ Saúde + Educação)

```jql
Vertical in (Pessoal) AND "Equipe responsável" not in (Suporte, Revenda, "Ferramenta de Conversão", Parceiros, Produto, "Produto extensões", Tribunais, Integrações, "Ferramenta de Conversão") AND status not in ("Produto contratado") AND resolution = Unresolved AND <<RECORTE_CARTEIRA>> AND issuetype not in (Implantação) OR Vertical in (Saúde) AND "Equipe responsável" not in (Suporte, Revenda, "Ferramenta de Conversão", Parceiros, Produto, "Produto extensões", Tribunais, Integrações, "Ferramenta de Conversão") AND status not in ("Produto contratado") AND resolution = Unresolved AND issuetype not in (Implantação) OR Vertical in (Educação) AND "Equipe responsável" not in (Suporte, Revenda, "Ferramenta de Conversão", Parceiros, Produto, "Produto extensões", Tribunais, Integrações, "Ferramenta de Conversão") AND status not in ("Produto contratado") AND resolution = Unresolved AND <<RECORTE_CARTEIRA>> AND issuetype not in (Implantação) ORDER BY cf[24813] ASC, status DESC, cf[21500] DESC, issuetype ASC, Município ASC, cf[10300] ASC, cf[22902] ASC, assignee DESC
```

### 1.3 — Contábil (Portfólio Pequenas Contas)

```jql
(Vertical in (Contábil) OR Vertical = Atendimento AND Sistema not in ("Protocolo (Cloud)", "Cidadão Web (Cloud)", "Cidadão Web 3 (Web)", "Cidadão Web 4 (Fly)", "Cidadão Web 2", "Cidadão Web 2 (Web)")) AND "Equipe responsável" not in (Revenda, "Ferramenta de Conversão", Parceiros, Produto, "Produto extensões", Tribunais, Integrações, "Ferramenta de Conversão", Suporte) AND status not in ("Produto contratado", Reprovada) AND resolution = Unresolved AND <<RECORTE_CARTEIRA>> AND issuetype not in (Implantação) ORDER BY cf[24813] ASC, status DESC, cf[21500] DESC, issuetype ASC, Município ASC, cf[10300] ASC, cf[22902] ASC, assignee DESC
```

### 1.4 — Compras / Contratos

```jql
Vertical in (Contratos) AND "Equipe responsável" not in (Revenda, "Ferramenta de Conversão", Parceiros, Produto, "Produto extensões", Tribunais, Integrações, "Ferramenta de Conversão", Suporte) AND status not in ("Produto contratado", Reprovada) AND resolution = Unresolved AND <<RECORTE_CARTEIRA>> AND issuetype not in (Implantação) ORDER BY cf[24813] ASC, status DESC, cf[21500] DESC, issuetype ASC, Município ASC, cf[10300] ASC, cf[22902] ASC, assignee DESC
```

> **Dica de performance:** ao buscar, peça os `extraFields` `["customfield_16000", "customfield_21500", "timespent", "timeoriginalestimate", "issuetype", "description"]` para já trazer escopo e tempos sem `get_issue` por chamado.

> **Recorte corrigido em 2026-08-31 (decisão do coordenador).** O recorte correto destas 4 JQLs é por **"Portfólio de Atendimento" (Pequenas + Médias Contas)**, e não por lista de municípios — as listas fixas de municípios de SC foram removidas. **Exceção: a Saúde continua atendendo todos**, então o bloco `Vertical in (Saúde)` da JQL 1.2 ficou **sem qualquer recorte** de município ou portfólio, coerente com o CLAUDE.md daquela vertical (que também não filtra por portfólio).

> **RECORTE DE CARTEIRA ALTERADO EM 2026-10-26 (decisão do coordenador).** O recorte **não é mais** o campo "Portfólio de Atendimento" (`cf[32400]`) — ele ficou desatualizado após a redistribuição de clientes. O recorte agora é por **`Município`** (`cf[10331]`), a partir da planilha *Organização equipes - MC* / aba *Clientes Pequenas e Médias Contas*: **gestão Arimanoel = Pequenas Contas; Thiago (Oeste), Francieli (Norte) e Emanuel (Sul) = Médias Contas**. Onde as JQLs acima trazem `<<RECORTE_CARTEIRA>>`, **expanda literalmente o conteúdo de [`../../scripts/recorte_carteira.jql`](../../scripts/recorte_carteira.jql)** (126 municípios + a entidade CIMPLASC). O mapa canônico, com a divisão por gestão, está em [`../../scripts/portfolio_municipios.json`](../../scripts/portfolio_municipios.json).
>
> ⚠️ **`Município` é campo de TEXTO LIVRE, não lista de valores.** O Jira aceita qualquer string dentro de `in (...)` **sem devolver erro** — grafia errada simplesmente retorna menos chamados. Em 26/10 a planilha grafava `ANTONIO CARLOS` e o Jira usa `Antônio Carlos`: um circunflexo apagava **3 chamados** da fila da Arrecadação, silenciosamente. Nunca confie num `in (...)` que "rodou sem erro"; confira sempre a contagem.
>
> 🛡️ **Guarda-corpo obrigatório em todo turno.** Rode a mesma JQL trocando `Município in (...)` por `Município not in (...)` (mantendo os demais filtros). O que voltar é **município fora do mapa**: **triar normalmente como Médias Contas** e listar em seção própria `Municípios fora do mapa` no log e no e-mail. Exceção: **São Miguel do Oeste** é atendido por revenda parceira e fica fora da fila **sem alerta**.
>
> **Exceção por entidade — CIMPLASC.** Em Campos Novos há 73 chamados abertos e **apenas o do consórcio CIMPLASC é nosso** (os demais são `Parceiro de Negócios`). Por isso a inclusão é pela **entidade**, nunca pelo município — incluir "Campos Novos" na lista traria 72 chamados indevidos.

>
> Efeito medido em 2026-08-31, com as JQLs rodadas antes e depois:
>
> | JQL | Antes (município) | Depois (portfólio) |
> |-----|-------------------|--------------------|
> | 1.1 Arrecadação / ISS | 36 | **115** |
> | 1.2 Pessoal + Saúde + Educação | — | **101** |
> | 1.3 Contábil (era só Pequenas) | — | **38** |
> | 1.4 Compras / Contratos | 11 | **35** |
>
> O salto da 1.1 (36 -> 115) é a evidência mais forte de que o portfólio já era o recorte real em uso: o log da manhã de 2026-08-31 registrou **fila bruta 1.1 = 134**, número compatível com a versão por portfólio e incompatível com os 36 da versão por município. Ou seja, a lista de municípios estava escondendo a maior parte da fila de serviços.

### 1.5 — Varredura por STATUS dimensionável (obrigatória desde 2026-08-31)

As 4 JQLs acima trazem a fila bruta, mas o delta por `created` **não captura chamados antigos que só agora entraram na trilha de negociação** — e são justamente eles que ficam parados sem dimensionamento. Por isso, além do delta por criação, execute a varredura abaixo e cruze com a tag de idempotência:

```jql
status in ("Aguardando Negociação", "Aguardando planejamento", "Em Planejamento") AND issuetype in ("Acompanhamento técnico", "Customização", "Tratamento de dados") AND resolution = Unresolved AND (<<RECORTE_CARTEIRA>> OR Vertical = Saúde) AND updated >= "<data/hora da execução anterior>" ORDER BY created DESC
```

⚠️ **O filtro de portfólio acima é obrigatório e foi a correção de 2026-09-01.** A varredura por status é a única consulta desta vertical que não nasce das 4 JQLs do Passo 1 — e, sem o recorte, ela alcança **portfólios que não são objeto desta triagem** (ex.: "Portfólio SC/SP", "Portfólio SC/MG"). O `OR Vertical = Saúde` preserva a exceção da vertical Saúde, que atende todos os clientes e não tem recorte de portfólio (mesma regra da JQL 1.2 do Passo 1).

Depois, identifique quais desses já têm a tag rodando a mesma JQL com `AND text ~ "IA-TRIAGEM-SERVICOS"` — os que não aparecerem são os candidatos a analisar. **Não use `AND NOT text ~ ...`**: a negação de busca full-text no Jira retorna vazio de forma silenciosa e faz a varredura parecer limpa quando não está.

> **Antes de dimensionar, confirme o portfólio do chamado individualmente** consultando o `Município` (`key = X` com `extraFields: ["customfield_10331"]`) e cruzando com `scripts/portfolio_municipios.json`; registre-o no log. Isso serve a dois propósitos: confirmar que o chamado está no escopo e definir o destino do rascunho do Passo 7. Nunca deduza o portfólio de um chamado a partir da consulta feita para outro.

> Esta varredura nasceu na execução de 2026-08-31, quando recuperou dois chamados criados em 03/2026 e 07/2026 (BTHSC-295502 e BTHSC-333691) que já estavam em negociação/CRM havia semanas e nunca tinham sido dimensionados.
>
> **Incidente que originou o filtro de portfólio (2026-09-01):** na primeira execução após a criação deste passo, a varredura sem recorte trouxe chamados de "Portfólio SC/SP" e "Portfólio SC/MG", e dois deles chegaram a ser dimensionados indevidamente (BTHSC-343145 e BTHSC-348807). Um levantamento na mesma data mostrou **8 chamados tagueados desses dois portfólios** — ou seja, o vazamento era anterior e vinha passando despercebido. Com o filtro acima, a varredura passa a respeitar o mesmo recorte das 4 JQLs do Passo 1.

## Passo 2: Filtros de Idempotência, Status e Escopo de Tipo

Para cada chamado retornado, antes de analisar:

**REGRA DE OURO 1 — Idempotência:** se houver QUALQUER comentário interno contendo `[#IA-TRIAGEM-SERVICOS#]`, já foi analisado. **Ignore e siga para o próximo.**

**REGRA DE OURO 2 — Status encerrado:** se o status for `Fechado`, `Encerrado`, `Resolvido`, `Concluído`, `Triagem encerrada`, `Cancelado` ou `Reprovada`, **ignore** (o Jira não aceita comentário e a triagem deixou de ser útil).

**REGRA DE OURO 3 — Escopo de tipo:** processe apenas `issuetype` ∈ {`Acompanhamento técnico`, `Customização`, `Tratamento de dados`, `Incidente`}. Outros tipos → ignore e registre "fora do escopo de serviços".

**Otimização:** em vez de `get_issue` por chamado, use **uma** chamada a `search_by_text` com `text: "IA-TRIAGEM-SERVICOS"` e `additionalJql` restringindo ao projeto/resolução, para identificar de uma vez quais chamados da fila já têm a tag.

## Passo 3: Identificação do Serviço e Busca de Chamados Solucionados Semelhantes

Para os chamados que passarem no Passo 2:

1. **Identifique o serviço solicitado.** Leia `summary`, `description` e `Informações para negociação` (`cf[16000]`) e produza uma descrição curta e canônica do serviço (ex.: "Cálculo de folha complementar — pagamento retroativo de triênios (RRA/pagamentos anteriores)"; "Geração mensal do e-Sfinge Tributário"; "Correção de IRRF"; "Tratamento de dados de matrícula"). Anote também: **sistema/produto**, **vertical de origem** e **tipo do chamado**.

2. **Busque chamados de serviço SOLUCIONADOS semelhantes** nos MCPs (`jira-atendimento`). Critérios da busca histórica:
   - Mesmo **tipo de serviço** (palavras-chave do escopo identificado no item 1).
   - Preferencialmente mesmo **sistema/produto** e mesmo **issuetype**.
   - **Apenas equipes de serviço** — `"Equipe responsável" in ("Serviço", "Serviços Especializados", "Migração")`. **Crítico:** isto evita contaminar a média de horas com chamados de Suporte (que são gratuitos / não cobrados como serviço) e distorceriam a estimativa para baixo.
   - **Status encerrado com entrega** — `statusCategory = Done` e `resolution` de conclusão (ex.: "Solucionado na filial"). Devem ter `timespent > 0` (horas apontadas), caso contrário não servem para o cálculo de horas.
   - Use JQL como base, por exemplo:
     ```jql
     "Equipe responsável" in ("Serviço", "Serviços Especializados", "Migração") AND statusCategory = Done AND resolution in ("Solucionado na filial") AND timespent > 0 AND issuetype in ("Acompanhamento técnico", "Customização", "Tratamento de dados", "Incidente") AND (summary ~ "<palavras-chave>" OR text ~ "<palavras-chave>") ORDER BY updated DESC
     ```
   - Traga os `extraFields` `["customfield_16000", "timespent", "timeoriginalestimate", "issuetype"]`.

3. **Classifique cada candidato por similaridade** (para a ponderação do Passo 4). Atribua um **peso** a cada chamado-base conforme a aderência ao serviço solicitado:
   - **Peso 3 (alta):** mesmo serviço, mesmo sistema e mesmo issuetype (ex.: dois "e-Sfinge Tributário mensal" no mesmo produto).
   - **Peso 2 (média):** mesmo serviço/assunto, mas sistema OU issuetype diferente.
   - **Peso 1 (baixa):** serviço relacionado/análogo (mesma família de tarefa), aderência parcial.
   - **Descarte (peso 0):** correspondência vaga — não force associação. Se sobrar pouca base, prefira **não comentar** a comentar com base fraca.

4. **Otimização incremental:** leia o último `logs/YYYY-MM-DD.md` desta pasta para não reanalisar chamados sem mudança relevante desde a execução anterior.

## Passo 4: Cálculo do Escopo e das Horas Estimadas (Média Ponderada por Semelhança)

Com os chamados-base classificados (peso ≥ 1):

### 4.1 Horas estimadas — média ponderada das horas APONTADAS

1. Para cada chamado-base *i*, converta as horas apontadas: `h_i = timespent_i / 3600` (arredonde para 1 casa).
2. Calcule a **média ponderada** pelos pesos de similaridade *w_i* (Passo 3.3):

   ```
   Horas estimadas = Σ(w_i · h_i) / Σ(w_i)
   ```

3. Calcule também, para dar contexto ao analista:
   - **Faixa:** menor e maior `h_i` da base.
   - **Nº de chamados-base** (K) e a lista das chaves com suas horas e pesos.
   - **Estimativa original média:** média (simples) de `timeoriginalestimate_i / 3600` dos mesmos chamados — para evidenciar o descasamento "estimado x apontado".
4. **Sinalize risco:** se a média ponderada das horas apontadas for **maior** que a estimativa original média, destaque explicitamente que **historicamente esse serviço consome mais horas do que costuma ser estimado** (risco de prejuízo se orçado pela estimativa antiga).
5. Apresente o número final com 1 casa decimal e também em formato "Xh" inteiro arredondado para facilitar o orçamento.

> **Regra de robustez:** exija **pelo menos 2 chamados-base** com `timespent > 0` para emitir uma estimativa de horas. Com apenas 1, apresente o valor mas marque explicitamente como **"base única — baixa confiança"**. Com 0, **não estime horas** (e, sem escopo histórico, não comente).

### 4.2 Escopo sugerido

- Sintetize o campo `Informações para negociação` (`cf[16000]`) dos chamados-base de **maior peso** em um escopo claro (atividades incluídas, premissas, o que NÃO está incluído quando o histórico deixa claro). **Cite as chaves de origem.**
- Não copie dados sensíveis (matrículas, valores, nomes) — descreva o escopo de forma genérica e reaproveitável.
- Se houver regra normativa relevante para delimitar o escopo, registre na seção "Análise Complementar" como busca externa.

## Passo 5: Registro do Comentário Interno (com Tag de Identificação)

Se houver base histórica suficiente (Passo 4), **grave o bloco em `outputs/<DATA>_comentarios_para_postar.md`** (trilha de auditoria) E **poste como nota interna via `add_comment` com `internal: true`**. Antes de cada postagem, re-verifique a tag via `get_issue` (idempotência just-in-time).

> **Atenção (limitação técnica):** o Jira da Betha **não aceita Unicode fora do BMP** (emojis modernos quebram a API com HTTP 500). Use apenas acentuação latina, símbolos comuns e wiki markup. **Sem emojis** no corpo.

Formato do comentário (omita seções que não se aplicarem, mantenha a tag intacta):

```markdown
[#IA-TRIAGEM-SERVICOS#]
*Triagem Automatica de Servicos — Sugestao de Escopo e Horas*
Identifiquei o serviço solicitado e busquei serviços semelhantes já executados em nossa base.

*Servico identificado:* [descrição curta e canônica do serviço]

*Escopo sugerido (com base no historico):*
[Síntese das atividades/premissas a partir do campo "Informações para negociação" dos chamados-base. Deixe claro o que está incluído e, quando o histórico indicar, o que NÃO está]. Base: [BTHSC-XXXX, BTHSC-YYYY].

*Horas estimadas sugeridas:* ~[N] h (média ponderada das horas APONTADAS de serviços semelhantes)
- Chamados-base: [BTHSC-XXXX: Hh (peso 3), BTHSC-YYYY: Hh (peso 2), ...]
- Faixa observada: [mín] h a [máx] h | Nº de chamados-base: [K]
- Estimativa original média desses chamados: [M] h
- [SE APLICÁVEL] Atenção: historicamente este serviço CONSUMIU mais horas do que o estimado (apontado [N]h x estimado [M]h). Avalie orçar pelas horas apontadas para nao prestar o servico no prejuizo.

*Analise Complementar (Busca Externa):*
[APENAS se houver lei/regra de negócio buscada fora do Jira para delimitar o escopo. Identifique como externa.]

*Nota para o analista:* Estimativa baseada em histórico real de serviços semelhantes. Valide o escopo e o volume específico deste município/entidade (quantidade de matrículas, competências, complexidade) antes de fechar a APS/negociação.
```

> **Convenção de markup vigente (reconciliada em 2026-08-31).** O template acima está em **wiki markup do Jira** (`*negrito*` com asterisco simples), que é o que o Jira renderiza — markdown `**negrito**` sai como texto literal e foi abandonado ao longo de 08/2026. Além disso, a convenção adotada na prática é escrever o corpo do comentário **sem acentuação** (ASCII): a restrição real do banco é apenas quanto a caracteres fora do BMP, mas remover a acentuação virou salvaguarda padrão do monorepo depois do incidente de encoding. Mantenha os dois hábitos — wiki markup e ASCII — para ficar consistente com os comentários já postados.

**Regra de Exceção:** se não houver base histórica confiável (sem chamados solucionados semelhantes com horas apontadas), **não gere comentário** — registre no log o motivo.

## Passo 6: Registro do Log Diário (Auditoria)

Ao final, gere obrigatoriamente `logs/YYYY-MM-DD.md` no formato de [`logs/README.md`](./logs/README.md), contendo: totais; chamados ignorados (com motivo); chamados com sugestão postada (serviço identificado, chamados-base com horas e pesos, horas estimadas, escopo resumido, ID do comentário); chamados analisados sem comentário (com motivo); observações/incidentes.

**Regras do log:** gerar **mesmo com fila vazia** (cabeçalho zerado); **nunca** incluir dados sensíveis (CPF/CNPJ, valores de contrato, matrículas, endereços) — anonimize; logs versionados no Git.

## Passo 7: Rascunho de Email Diário Consolidado (apenas na execução da TARDE, condicional)

⚠️ Responsabilidade **exclusiva da execução da tarde**. A manhã NÃO cria rascunho.

O rascunho é **dividido por portfólio**, com destinatários diferentes, e cada recorte é avaliado de forma independente:

- **CRIE o rascunho de Pequenas Contas** se houve **≥ 1 dimensionamento postado no dia em chamado de Pequenas Contas** (manhã + tarde).
- **CRIE o rascunho de Médias Contas** se houve **≥ 1 dimensionamento postado no dia em chamado de Médias Contas** (manhã + tarde).
- **NÃO CRIE** o rascunho do recorte que ficou sem nenhum dimensionamento no dia (registre no log que foi suprimido).
- Classifique cada chamado dimensionado pelo **`Município`** (`cf[10331]`) confrontado com [`../../scripts/portfolio_municipios.json`](../../scripts/portfolio_municipios.json) — **não use mais `cf[32400]`**, desatualizado desde a redistribuição de 10/2026. Não deduza pela vertical de origem. Município fora do mapa entra como **Médias** e na seção `Municípios fora do mapa`.
- **Assunto:** `[Triagem Serviços] Resumo do dia YYYY-MM-DD - Pequenas Contas` ou `[Triagem Serviços] Resumo do dia YYYY-MM-DD - Médias Contas`
- **Para (Pequenas Contas):** `arimanoel.gomes@betha.com.br` (coordenador Ari)
- **Para (Médias Contas):** `emanuel.alexandre@betha.com.br`, `francieli.buzzi@betha.com.br`, `thiago.fantinelli@betha.com.br`
- **Corpo: gerado por script, não escrito à mão.** Use `../../scripts/triagem_email.py`. Monte um dict com os blocos do e-mail e chame `gerar_email(dados)` para o `htmlBody` e `gerar_texto_alternativo(dados)` para o `body`. O esquema completo está no docstring do script.
  - **Blocos disponíveis:** `cards` (linha de totais), `secao` (título), `tabela` (com `destaque` para realçar linhas), `alerta` (caixa vermelha), `nota` (caixa âmbar), `paragrafo`, `lista`.
  - **Conteúdo esperado:** cartões de totais (fila / comentados em verde / sem comentário em âmbar / delta em cinza); tabela dos comentados (Chamado, Assunto, Execução com o turno, Baseline histórico); tabela "Chamados x Backlog de Desenvolvimento" quando houver; tabela dos sem comentário (Chamado, Assunto, Motivo); lista de Observações; `logs` no rodapé.
  - **Atalho de escrita:** em qualquer texto, `[BTHSC-123456]` vira link automático para o Jira; `<b>`, `<i>` e `<br>` passam direto. Não escreva `<a href>` à mão para chamados. **Sempre a chave completa entre colchetes** — `361539` solto não vira link.
  - ⚠️ **ACENTUAÇÃO: o e-mail é escrito em português correto, COM acentos.** A regra de corpo sem acentuação vale **apenas para os comentários do Jira**, onde existe limitação de encoding do banco. No e-mail não há essa limitação. Em 14 e 15/10/2026 os e-mails saíram inteiros sem acento porque essa regra foi aplicada no lugar errado; o gerador agora **recusa** o e-mail quando detecta 3 ou mais palavras conhecidas sem acento.
  - **As restrições do Gmail agora são verificadas pelo script e não precisam ser lembradas a cada execução** — `background-color` + `bgcolor`, sem `border-radius`, sem CDATA, sem caracteres fora do BMP. Se alguma for violada, `gerar_email` levanta `HtmlInvalido` e **não devolve HTML**: corrija os dados em vez de contornar a validação.

**Envio (automação do coordenador):** a conta do Ari tem automação que **envia automaticamente os rascunhos** (polling ~5 min). Logo: **criar rascunho = enviar email**. Regras decorrentes:

- Usar SOMENTE `create_draft` — nunca envio direto.
- **Máximo 1 rascunho POR PORTFÓLIO por dia** — ou seja, no máximo 2 rascunhos diários nesta vertical (um Pequenas, um Médias). Nunca recriar/atualizar um rascunho já criado no dia (cada recriação dispara novo envio). Registre no log o `draftId` de cada rascunho criado, para que a execução seguinte saiba que a cota do dia foi consumida.
- Conteúdo **final e revisado** no momento da criação.

## Passo 8: Registro do Consumo de Tokens (Auditoria de Custo)

O script `../../scripts/registrar_uso_tokens.js` (agendado entre 02:00 e 04:00 BRT do dia seguinte) injeta o bloco `## Consumo de tokens (Admin API)` ao final do `logs/YYYY-MM-DD.md` desta vertical e grava `logs/YYYY-MM-DD-usage.json`. Detalhes em [`../../scripts/README.md`](../../scripts/README.md).

---

## Fluxo Resumido de Execução

1. Liste a fila com as **4 JQLs** do Passo 1 (consolide sem duplicar).
2. Filtre idempotência, status encerrado e tipo fora de escopo (Passo 2).
3. Para cada chamado restante: identifique o serviço e busque chamados **solucionados** semelhantes, classificando-os por peso de similaridade (Passo 3).
4. Calcule o **escopo** (síntese do `cf[16000]` dos chamados-base) e as **horas** (média **ponderada** das horas apontadas `timespent`, com faixa, nº de base e comparação estimado x apontado) (Passo 4).
5. Grave `outputs/<DATA>_comentarios_para_postar.md` E poste a nota interna via `add_comment` com `internal: true`, re-verificando a tag `[#IA-TRIAGEM-SERVICOS#]` antes de cada postagem (Passo 5).
6. Gere o log diário (Passo 6).
7. **(Somente na tarde e se houve ≥ 1 comentário)** crie o rascunho de email (Passo 7).
8. Fallback: se a postagem MCP falhar, rode `../../scripts/post_comentarios.js --vertical servicos`.
9. Consumo de tokens registrado depois, via agendamento separado (Passo 8).
