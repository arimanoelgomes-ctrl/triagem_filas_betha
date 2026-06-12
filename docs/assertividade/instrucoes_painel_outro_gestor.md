# Painel "Triagem x Eficiência" — instruções de instalação no Cowork

Estas instruções acompanham o arquivo `painel_triagem_eficiencia.html` e servem para qualquer gestor com Cowork instalado reproduzir o painel na própria máquina, com dados ao vivo do Jira.

## Pré-requisitos

1. **Cowork** (Claude Desktop com modo agente) instalado e funcionando.
2. **Conector MCP do Jira da Betha** configurado no Cowork com o nome exato **`jira-atendimento`** — o mesmo usado pelas rotinas de triagem. O painel chama a ferramenta `mcp__jira-atendimento__search_issues`; se o conector estiver com outro nome, o painel não encontra a ferramenta (ver "Problemas comuns" abaixo).
3. Usuário do Jira com permissão de **leitura** nos projetos de atendimento (BTHSC e correlatos). O painel só faz consultas — não escreve nada.

## Instalação (uma vez só)

1. Salve o arquivo `painel_triagem_eficiencia.html` em qualquer pasta da sua máquina.
2. Abra o Cowork e anexe o arquivo na conversa (ou dê acesso à pasta onde ele está).
3. Envie este pedido ao Claude:

   > Crie um artifact com o HTML do arquivo painel_triagem_eficiencia.html, exatamente como está, com id "triagem-x-eficiencia" e com acesso à ferramenta MCP mcp__jira-atendimento__search_issues.

4. O painel aparece na barra lateral do Cowork (seção de artifacts). Na primeira abertura, o Cowork pedirá permissão para o painel consultar o Jira — aprove.

## Uso

- Abra o painel pela barra lateral a qualquer momento; os dados são consultados ao vivo no Jira a cada abertura (botão Reload atualiza).
- Filtro de período (30/90 dias/tudo) no topo; clique num cartão de vertical para filtrar a tabela.
- Hierarquia de avaliação: rótulo do analista (`IA-UTIL`/`IA-NAO-UTIL`) > rótulo automático (`IA-UTIL-AUTO`, aplicado pela auditoria semanal) > proxy de desfecho (status/resolução). A coluna "Fonte" mostra de onde veio cada avaliação.
- Metodologia completa: `docs/assertividade/README.md` no repositório `triagem_filas_betha`.

## Problemas comuns

- **"Erro ao consultar o Jira" / ferramenta não encontrada:** o conector do Jira não está com o nome `jira-atendimento`. Renomeie o conector nas configurações do Cowork ou peça ao Claude: "ajuste o artifact para usar o nome do meu conector do Jira".
- **Painel vazio ou contagens diferentes das do Ari:** verifique se o seu usuário do Jira enxerga os mesmos projetos (a consulta respeita as permissões de quem está logado no conector).
- **Pedido de permissão a cada abertura:** aprove marcando a opção de lembrar/permitir sempre, se disponível.

## Observação

O arquivo HTML não contém nenhuma credencial nem dado de chamado — apenas o código do painel. Os dados vêm do Jira no momento da consulta, com as credenciais do próprio usuário. Por isso é seguro enviá-lo por email/chat interno, mas o painel só funciona dentro do Cowork.
