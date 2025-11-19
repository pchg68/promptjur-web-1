# PromptJur - Lista de Tarefas

## Fase 1: Planejamento e Arquitetura
- [x] Inicializar projeto web com autenticação e banco de dados
- [x] Criar todo.md com roadmap completo
- [x] Definir schema completo do banco de dados

## Fase 2: Backend e Banco de Dados
- [x] Criar tabelas: prompts, análises, templates, fontes_juridicas, historico
- [x] Implementar procedures tRPC para análise de prompts
- [x] Implementar procedures tRPC para geração de prompts
- [x] Implementar procedures tRPC para otimização de prompts
- [ ] Implementar sistema de verificação de fontes jurídicas
- [x] Integrar com LLM (invokeLLM) para processamento

## Fase 3: Frontend - Design e Layout
- [x] Implementar design "Legal Blueprint" (navy #1a2332, ouro #d4af37)
- [x] Criar página inicial (landing page) profissional
- [x] Criar dashboard do usuário com tabs
- [x] Implementar navegação entre seções

## Fase 4: Funcionalidades Principais
- [x] Interface de Análise de Prompts
  - [x] Campo de entrada de texto
  - [x] Exibição de resultados (área jurídica, qualidade, sugestões)
  - [x] Extração de entidades e palavras-chave
  - [x] Badge de qualidade visual
- [x] Interface de Geração de Prompts
  - [x] Seletor de área jurídica (12 áreas)
  - [x] Campo de objetivo
  - [x] Slider de nível de detalhe
  - [x] Campo de persona
  - [x] Checkbox de referências legais
  - [x] Geração com templates especializados
- [x] Interface de Otimização de Prompts
  - [x] Campo de entrada de prompt original
  - [x] Comparação lado a lado (antes/depois)
  - [x] Explicação das melhorias aplicadas

## Fase 5: Funcionalidades Avançadas
- [ ] Sistema de Verificação de Fontes
  - [ ] Validação automática de citações
  - [ ] Links para fontes oficiais (STF, STJ, Planalto)
  - [ ] Marcação visual de confiança (verde/amarelo/vermelho)
  - [ ] Nunca inventar jurisprudência
- [ ] Arquitetura Multi-Agente (simulada)
  - [ ] Agente Pesquisador
  - [ ] Agente Analisador
  - [ ] Agente Redator
  - [ ] Agente Verificador
  - [ ] Orquestrador central
- [ ] Interface Conversacional
  - [ ] Chat interativo para coleta de informações
  - [ ] Perguntas contextualizadas
  - [ ] Validação progressiva

## Fase 6: Dashboard e Histórico
- [x] Histórico de prompts gerados
- [ ] Métricas de uso (total de análises, gerações, otimizações)
- [x] Favoritos e salvos
- [ ] Exportação de resultados

## Fase 7: Integrações e APIs
- [ ] Integração com APIs jurídicas brasileiras (se disponível)
- [ ] Sistema de cache para consultas frequentes
- [ ] Rate limiting e controle de uso

## Fase 8: Qualidade e Testes
- [ ] Testes de funcionalidades principais
- [ ] Validação de design responsivo
- [ ] Otimização de performance
- [ ] Tratamento de erros

## Fase 9: Deploy e Documentação
- [ ] Deploy em produção
- [ ] Documentação de uso
- [ ] Guia de início rápido


## Bugs e Correções
- [x] Corrigir página travada - diagnosticar e resolver erros


## Novas Funcionalidades (Solicitadas pelo Usuário)
- [x] Histórico de Prompts
  - [x] Atualizar schema para salvar histórico completo
  - [x] Criar procedures tRPC para listar histórico
  - [x] Implementar página de histórico com filtros (área, data, tipo)
  - [ ] Adicionar funcionalidade de reutilização de prompts (botão funcional)

- [ ] Sistema de Templates Salvos
  - [x] Adicionar tabela de templates personalizados
  - [x] Criar procedures para salvar/listar/deletar templates
  - [ ] Implementar interface de gerenciamento de templates
  - [ ] Adicionar botão "Salvar como Template" nas páginas

- [ ] Verificação de Fontes Jurídicas
  - [ ] Pesquisar e documentar APIs oficiais (STF, STJ, CNJ)
  - [ ] Implementar integração com APIs jurídicas
  - [ ] Adicionar validação automática de citações
  - [ ] Implementar badges de confiabilidade (verde/amarelo/vermelho)
  - [ ] Adicionar links diretos para fontes oficiais

- [x] Corrigir erro de API retornando HTML ao invés de JSON no Dashboard (problema era falta de import useState)

## Melhorias em Implementação (Sessão Atual)
- [x] Adicionar navegação no header do dashboard (links para Histórico e Templates)
- [x] Implementar página de Templates Salvos (/templates)
  - [x] Interface de listagem de templates
  - [x] Botão de deletar template
  - [x] Botão de copiar template
  - [x] Visualização de detalhes do template
  - [x] Estado vazio com mensagem e CTA
- [x] Adicionar botão "Salvar como Template" no dashboard
  - [x] Na aba de Análise
  - [x] Na aba de Geração
  - [x] Na aba de Otimização
  - [x] Dialog para entrada de nome e descrição
- [x] Testar todas as funcionalidades implementadas

## Bugs Reportados
- [x] Corrigir erro de <a> aninhados no header (Link do wouter já renderiza <a>)

## Melhorias UX (Sessão Atual)
- [x] Adicionar cards de métricas no topo do Dashboard
  - [x] Total de análises realizadas
  - [x] Total de gerações realizadas
  - [x] Total de otimizações realizadas
  - [x] Total de templates salvos
- [x] Implementar sistema de busca na página de Templates
  - [x] Campo de busca por nome/descrição/área
  - [x] Filtro em tempo real
  - [x] Estado vazio quando nenhum resultado encontrado
- [x] Adicionar botão "Usar Template" na página de Templates
  - [x] Navegação para Dashboard com template pré-carregado
  - [x] Preenchimento automático do campo de análise
  - [x] Toast de confirmação ao carregar template

## Funcionalidades Avançadas (Sessão Atual)
- [x] Adicionar filtros por área jurídica na página de Templates
  - [x] Chips clicáveis das 12 áreas jurídicas
  - [x] Filtro combinado com busca textual
  - [x] Botão "Limpar Filtros"
- [x] Implementar página de Histórico completa
  - [x] Tabela com histórico de ações
  - [x] Filtros por tipo de ação (análise/geração/otimização)
  - [x] Dialog de detalhes com informações completas
  - [x] Visualizar detalhes do prompt
  - [x] Design consistente com tema Legal Blueprint
- [x] Adicionar botões de exportação nos resultados
  - [x] Exportar como PDF (via impressão do navegador)
  - [x] Exportar como Markdown (download direto)
  - [x] Botões nas 3 abas (Análise, Geração, Otimização)

## Funcionalidades Avançadas v2 (Sessão Atual)
- [x] Sistema de tags personalizadas
  - [x] Adicionar tabela de tags ao schema
  - [x] Criar procedures para gerenciar tags
  - [x] UI para criar tags com nome e cor
  - [x] Filtro por múltiplas tags na página de Templates
  - [x] Dialog de criação de tags
- [ ] Comparação de versões (adiado - complexidade alta)
  - [x] Schema de versões criado
  - [ ] UI de comparação (não implementado)
- [x] Seção de Analytics no Dashboard
  - [x] Tempo médio de processamento por tipo
  - [x] Integração com backend de analytics
  - [x] Exibição de métricas de desempenho
