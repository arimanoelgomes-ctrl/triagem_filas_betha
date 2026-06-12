# Comunicado — Feedback das sugestões da Triagem Automática (rótulos IA-UTIL / IA-NAO-UTIL)

Pessoal, tudo bem?

Como vocês já notaram, os chamados das nossas filas vêm recebendo um comentário interno de **Triagem Automática** (identificado pela tag `[#IA-TRIAGEM-AUTOMATICA#]`), com sugestões de resolução extraídas de chamados históricos já aprovados. Para medirmos se essas sugestões estão de fato ajudando — e para melhorarmos a triagem onde ela erra — precisamos do feedback de vocês, e ele é bem simples: **um rótulo no chamado**.

## O que fazer

Ao resolver um chamado que recebeu o comentário da Triagem Automática, adicione no campo **Rótulos (labels)** do chamado:

- **`IA-UTIL`** — se a sugestão da IA ajudou na resolução (usou o procedimento sugerido, o diagnóstico estava certo ou o chamado histórico citado levou à solução).
- **`IA-NAO-UTIL`** — se a sugestão não ajudou (diagnóstico errado, procedimento não se aplicava, ou a solução veio por caminho totalmente diferente).

São dois cliques: abrir o campo Rótulos, digitar o rótulo, salvar. Não é preciso justificar nem comentar nada.

## Pontos de atenção

- Grafia exata, em maiúsculas e com hífen: `IA-UTIL` e `IA-NAO-UTIL` (sem acento, sem espaço).
- **Adicione o rótulo ANTES de fechar o chamado** — depois de fechado, o Jira bloqueia a edição de rótulos.
- O rótulo é sobre a **utilidade da sugestão da IA**, não sobre a dificuldade do chamado.
- Se o chamado não recebeu comentário da Triagem Automática, não precisa de rótulo.
- Vocês podem encontrar chamados com o rótulo **`IA-UTIL-AUTO`** — ele é aplicado automaticamente pela rotina semanal de auditoria quando a solução final do chamado confirma a sugestão da IA. **Não removam** esse rótulo; se discordarem da avaliação automática, basta adicionar `IA-NAO-UTIL`, que o feedback de vocês prevalece.

## Por que isso importa

Esses rótulos alimentam o painel de assertividade da triagem e o relatório semanal por vertical. O feedback de vocês é o sinal mais confiável que temos: é com ele que vamos calibrar as sugestões, reduzir ruído nos comentários e fazer a triagem trabalhar a favor do atendimento — não o contrário.

Qualquer dúvida, me procurem.

Obrigado!
Ari
