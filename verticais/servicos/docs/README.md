# Documentação Específica — Vertical Serviços

Esta pasta armazena documentação **específica da triagem de Serviços** (fila em que a `Equipe responsável` = "Serviço" / chamados de serviço negociável). Para documentação compartilhada com outras verticais (incidentes da plataforma, padrões gerais), veja `../../docs/`.

Diferente das demais verticais (organizadas por **produto/domínio**), a vertical Serviços é organizada por **fila/processo**: ela atravessa todos os produtos (Arrecadação, Pessoal, Saúde, Educação, Contábil, Compras/Contratos) e tem um objetivo próprio — **não** sugerir a solução de uma dúvida, e sim estimar **escopo** e **horas** de um serviço solicitado, com base em serviços semelhantes já executados.

## Conteúdo sugerido

- **Catálogo de serviços recorrentes** — relação dos tipos de serviço mais comuns por produto (ex.: cálculo de folha complementar, RRA/pagamentos anteriores, e-Sfinge Tributário mensal, correção de IRRF, tratamento de dados de matrícula, customização de eventos) e sua faixa típica de horas apontadas.
- **Mapeamento de campos** — `customfield_21500` = Equipe responsável; `customfield_16000` = Informações para negociação (escopo); `timespent` = Tempo Gasto (horas apontadas, em segundos); `timeoriginalestimate` = estimativa original (em segundos).
- **Critérios de similaridade** — anotações sobre como decidir que um chamado solucionado é "o mesmo serviço" (sistema, tipo de chamado, palavras-chave do escopo).
- **Exemplos** — chamados-base anonimizados e a estimativa de escopo+horas esperada (ex.: BTHSC-273350).
- **Decisões de projeto (ADRs)** — registros sobre mudanças no método de cálculo da média ponderada ao longo do tempo.

> Esta pasta é versionada no Git e seu conteúdo serve como fonte de consulta para a IA e para os analistas.
