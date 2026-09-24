# Corrigir o Resumo Financeiro e refazer seu relatório

## Objetivo
Organizar o cabeçalho do Resumo Financeiro e substituir a página atual por um relatório mensal no mesmo padrão visual de planilha usado em Contas.

## Alterações
- Alinhar o título “Resumo Financeiro”, “Menu Principal” e “Relatório” na mesma faixa, com tamanhos e espaçamentos consistentes no computador e empilhamento organizado no celular.
- Refazer o topo do relatório com:
  - título “Relatório Resumo Financeiro”;
  - mês e ano selecionados;
  - setas para navegar entre meses;
  - botões “Voltar” e “Exportar PDF”.
- Criar uma planilha principal de indicadores com:
  - Saldo Consolidado;
  - Contas bancárias;
  - Investimentos;
  - Cartões crédito disponível;
  - Receitas do Mês;
  - Despesas do Mês;
  - Resultado do Mês.
- Separar o detalhamento em planilhas próprias:
  - cartões, com limite, valor utilizado e disponível, incluindo totais;
  - bancos, com saldo individual e saldo total;
  - “Para onde vai meu dinheiro?”, com despesas por categoria, percentual e total.
- Atualizar a exportação em PDF para refletir as mesmas seções, o mês escolhido e seus totais.
- Manter os cálculos e dados já existentes, sem alterar cadastros ou banco de dados.

## Validação
- Conferir a página em computador e celular, incluindo alinhamento, rolagem horizontal das planilhas e textos sem sobreposição.
- Validar navegação de mês, retorno ao painel e geração do PDF.
- Confirmar que a aplicação continua sem erros.

## Detalhes técnicos
- Reutilizar os dados atuais de contas, bancos, investimentos e cartões.
- Calcular crédito disponível por cartão como limite menos valor utilizado.
- Calcular Saldo Consolidado como contas bancárias mais investimentos.
- Calcular Resultado do Mês como receitas menos despesas.
