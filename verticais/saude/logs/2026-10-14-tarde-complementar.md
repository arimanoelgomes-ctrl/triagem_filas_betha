# Log de Triagem — Saúde — 2026-10-14 (execução COMPLEMENTAR da tarde)

**Início:** 2026-10-14 16:54 BRT (quarta-feira)
**Orquestrador:** execução avulsa solicitada pelo coordenador (somente vertical Saúde)
**MCPs:** jira-atendimento **OK** | jira-desenv **OK**
**Janela coberta:** 14/10 16:20 → 14/10 17:05 (delta sobre a execução da tarde do mesmo dia)

## Totais

| Métrica | Valor |
|---|---|
| Fila total no recorte | **12** (tarde: 15 — manhã: 6) |
| Já tagueados `[#IA-TRIAGEM-AUTOMATICA#]` | 7 |
| Delta por criação na janela | **4** |
| Analisados nesta run | **4** |
| **Comentários postados** | **2** |
| Verificação pós-postagem | **2/2 confirmadas** (e 8/8 do dia na vertical) |

## O cluster de indicadores cresceu de 4 para 6 em 45 minutos

A execução da tarde (16:20) registrou 4 chamados de indicador em 4 entidades e levantou **SAUD-79415** como candidata a causa comum. Em menos de uma hora chegaram mais dois, do mesmo relator (Arthur Abreu de Assis):

| Chamado | Entidade | Indicador | Natureza |
|---|---|---|---|
| SOL-5364 | PM Capitão Andrade | C5 comp. B | inconsistência |
| **SOL-5370** | **PM Santana da Vargem** | **C5 comp. B** | **dúvida de regra de negócio** |
| SOL-5367 | PM Santana da Vargem | C7 comp. A | inconsistência |
| **SOL-5369** | **PM Timóteo** | **C7 comp. A** | **inconsistência** |
| SOL-5368 | PM Santana da Vargem | C7 comp. B | inconsistência |
| BW-37261 | PM Turiuba/SP | C2–C5 | pedido de reprocessamento |

**Seis chamados, cinco entidades, três indicadores, um único dia.** Reforça a leitura de causa comum em infraestrutura (migração Kafka→SNS, SAUD-79415) em vez de seis problemas independentes.

## Comentários postados

| Chamado | Assunto | Baseline histórico | commentId |
|---|---|---|---|
| **SOL-5369** | C7 citopatológicos não contabilizam — PM Timóteo | **SOL-5320** (28/09, mesma entidade) + SOL-5301, **SOL-5253** | `14757723` |
| **SOL-5370** | C5 comp. B — dúvida sobre a janela de 6 meses | **BW-36586** (30/09) + BTHSC-355955 (aprovado 24/09) | `14757727` |

### SOL-5369 — a entidade já teve este defeito corrigido, e ele voltou

PM Timóteo é a entidade de **todos** os precedentes úteis desta família:

- **SOL-5320** (encerrado 28/09): clientes válidos só apareciam no indicador **após novo lançamento de ficha**; corrigido por **SAUD-78870** ("não exige liberação de versão"). O cliente deste chamado **reproduziu o contorno do precedente sem saber** — vendo que o lançamento de 13/10 não contabilizou, fez um novo em 14/10.
- **SOL-5301** (encerrado 24/09): mesmo relator, mesmo C7, e a conferência mostrou que **o indicador estava contabilizando** — falso positivo. Por isso o comentário começa por conferir.
- **SOL-5253**: alerta de esforço. Precisou de **três manutenções em sequência** (SAUD-78499 → SAUD-78616 na versão 1.129.3 → SAUD-78796), com o relator **reprovando duas vezes**, porque cada correção resolvia um componente e deixava outro.

O ponto registrado no comentário: nesta entidade, **prever mais de uma rodada e validar todos os componentes antes de encerrar**.

### SOL-5370 — o chamado que separa (ou une) os outros dois

Este é o **único dos seis aberto como dúvida de regra de negócio**, e não como inconsistência. O relator levanta uma hipótese própria: a janela de 6 meses do C5 componente B seria contada a partir do **fim do quadrimestre** (portanto a partir de 07/2026), e não da data corrente — o que excluiria legitimamente uma aferição de 09/06.

**Não há precedente na base sobre a regra de temporalidade**, e o comentário diz isso explicitamente em vez de inventar resposta. O que a triagem fez foi **delimitar**:

| Chamado | Cliente | Data da aferição | Dentro de janela iniciada em 07/2026? |
|---|---|---|---|
| **SOL-5370** | GILBERTO SALGADO | **09/06/2026** | **NÃO** |
| SOL-5364 | EVA FERREIRA DE MELO | 26/08/2026 | SIM |
| SOL-5364 | ESDRAS DOMINGOS | 17/08/2026 | SIM |

Conclusão registrada: **se a hipótese do relator estiver correta, ela explica o SOL-5370 e não explica o SOL-5364** (registros de agosto caem na janela em qualquer cálculo). Se estiver errada, os dois são a mesma ocorrência. **Confirmar a regra separa ou une os dois casos** — e isso deve vir da nota metodológica do indicador C5 (fonte MS), não do comportamento observado no sistema, sob pena de documentar como regra aquilo que pode ser o defeito.

Ressalva adicional: BW-36586 estabelece causa que **não depende de data** — o vínculo do profissional à equipe na data do atendimento. Se o médico não tinha vínculo em 09/06, a questão da janela é irrelevante.

## Analisados sem comentário

| Chamado | Assunto | Motivo |
|---|---|---|
| **BTHSC-361648** | Usuária sem permissão de acesso (FM Abdon Batista) | **Autorresolvido.** A própria solicitante comentou "problema solucionado" antes da triagem. |
| **BTHSC-361599** | Importação do CNES travada em "Aguardando" desde 8:55 (PM Feliz/RS) | **Sem baseline.** A busca retornou apenas chamados de importação/exportação e-SUS e dois registros de consultoria (PUBINFOS-59148/59156) sem conteúdo técnico. É fila de processamento travada — diagnóstico de infraestrutura, não dúvida com solução histórica. Ver observação 2. |

## Chamados x Backlog de Desenvolvimento (Passo 3.1)

Sem itens novos além dos já registrados na execução da tarde. Reafirmados nos dois comentários:

| Item | Status | Relevância |
|---|---|---|
| **SAUD-79415** — reprocessamento apaga o quadrimestre sem repor (Kafka→SNS) | **Aguardando liberação** | Candidata a causa comum do cluster de 6; **reprocessar agora é destrutivo** |
| SAUD-79416 — Implementação da correção acima | Atendida | — |
| **SAUD-78988** — C5 (Hipertensão): listagem de aferições vazia para quem pontua na boa prática B | **Não atendida** | Sintoma de SOL-5364 e SOL-5370 |
| SAUD-78870 (SOL-5320), SAUD-78796 (SOL-5253) | Atendidas | Precedentes de correção na PM Timóteo |

## Observações e incidentes

1. **A fila caiu de 15 para 12 com 4 criações na janela** — ou seja, 7 saídas em 45 minutos. Mantém o padrão já registrado quatro vezes de que nesta vertical a variação da fila não mede vazão.
2. **BTHSC-361599 não teve portfólio definido** — o Jira registrou automaticamente *"Não foi possível definir o portfólio de atendimento. A conta não foi encontrada no CRM"*. É a repetição exata do padrão de BTHSC-360630 (09/10): chamado sem portfólio no CRM. Na Saúde isso não afeta a JQL (a vertical não filtra por portfólio), mas **afetaria em qualquer outra vertical** — vale conferir se a conta da PM Feliz/RS está cadastrada.
3. **SOL-5364 saiu de "Aguardando atendimento N2" para "Em atendimento N2" com responsável atribuído** (Renata Trento Gomes Maccari) depois do comentário da tarde. O chamado que carregava o alerta de reprocessamento ganhou dono.
4. **Passo 6 — rascunho COMPLEMENTAR criado a pedido explícito do coordenador.** O rascunho consolidado da Saúde do dia já havia sido enviado pela automação às **15:46 BRT** para maite.passos@betha.com.br, cobrindo os 6 comentários da tarde. A regra de cota (máximo 1 rascunho por vertical por dia) impede recriar **por iniciativa da triagem**, mas prevê a exceção de pedido explícito do coordenador — que foi o caso. Criado às **17:10 BRT** um segundo rascunho, com assunto `[Triagem Saúde] Complemento do dia 2026-10-14 - 2 chamados adicionais`, deixando claro no corpo que **complementa** o anterior e não repete nada do que já foi enviado. Precedente registrado: é a segunda vez que a vertical Saúde recebe dois emails no mesmo dia (a primeira foi em 25/09, por falha de postagem).
5. Nenhum emoji fora do BMP; corpo dos comentários em wiki markup ASCII; `internal: true` nas duas postagens.
6. **Verificação pós-postagem:** 2/2 desta run confirmadas; reconsultadas também as 6 da tarde — **8/8 do dia com a tag gravada**, zero lacunas.
