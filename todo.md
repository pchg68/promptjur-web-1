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

## Melhorias Finais (Sessão Atual)
- [x] Renomear "Salvar Template" para "Salvar Prompt"
  - [x] Atualizar textos no Dashboard
  - [x] Atualizar labels e botões
- [ ] Implementar atribuição de tags aos templates (funcionalidade futura)
  - [x] Backend preparado (mutations criadas)
  - [ ] UI de gerenciamento (pendente)
- [ ] Adicionar gráficos visuais no Analytics (funcionalidade futura)
  - [ ] Gráfico de linha: evolução de uso
  - [ ] Gráfico de pizza: distribuição por tipo
- [ ] Sistema de favoritos (funcionalidade futura)
  - [ ] Schema e backend
  - [ ] UI de favoritar

## Implementação Final (Sessão Atual)
- [x] Completar UI de gerenciamento de tags
  - [x] Botão "Gerenciar Tags" nos cards de template
  - [x] Dialog com checkboxes de tags disponíveis
  - [x] Exibir tags atribuídas nos cards com badges coloridos
- [x] Adicionar busca no Histórico
  - [x] Campo de busca por conteúdo/área
  - [x] Filtro em tempo real
- [x] Sistema de compartilhamento de templates
  - [x] Campo isPublico no schema (já existia)
  - [x] Botão de alternar visibilidade (público/privado)
  - [x] Botão de copiar link de compartilhamento

## Próximas Melhorias (Sessão Atual)
- [x] Middleware de limites de uso
  - [x] Criar verificação de subscriptionPlan nos routers
  - [x] Bloquear operações para usuários gratuitos após limite
  - [x] Exibir modal de upgrade para plano pago
- [x] Gráficos visuais no Analytics
  - [x] Integrar Chart.js no projeto
  - [x] Criar gráfico de linha para evolução de uso
  - [x] Criar gráfico de barras para distribuição por tipo
- [x] Sistema de favoritos
  - [x] Adicionar campo isFavorito no schema de prompts (já existia)
  - [x] Criar procedure toggleFavorito (já existia)
  - [x] Adicionar seção de favoritos na UI
  - [x] Criar query listarFavoritos para filtrar apenas favoritos

## Novas Melhorias (Sessão Atual)
- [x] Sistema de exportação de prompts
  - [x] Implementar exportação em PDF com formatação profissional
  - [x] Implementar exportação em DOCX
  - [x] Adicionar botão de exportação na UI de favoritos
  - [x] Incluir metadados (área jurídica, data, qualidade)
- [x] Sistema de tags personalizadas
  - [x] Criar tabela de tags no schema (já existia)
  - [x] Criar procedures para CRUD de tags
  - [x] Implementar UI de gerenciamento de tags
  - [x] Adicionar procedures para atribuir tags a prompts
- [ ] Histórico de versões (infraestrutura backend pronta)
  - [x] Criar tabela de versões no schema (já existia)
  - [x] Procedures de salvamento e listagem criadas
  - [ ] Salvar versão automaticamente ao otimizar (pendente)
  - [ ] Implementar UI de comparação lado a lado (pendente)
  - [ ] Adicionar restauração de versões anteriores (pendente)

## Sugestões de Melhoria (Implementação em Andamento)
- [x] Adicionar "Processo Civil" às áreas jurídicas disponíveis
- [x] Reutilização de Prompts do Histórico
  - [x] Criar procedure loadPrompt(id) no tRPC
  - [x] Adicionar navegação com query string na Dashboard
  - [x] Preencher campos automaticamente ao carregar prompt
- [x] Gerenciamento de Templates com Edição
  - [x] Adicionar botão "Editar" na listagem de templates
  - [x] Criar modal de edição de templates
  - [x] Implementar procedure de atualização
## Implementações Restantes (Em Andamento)
- [x] Atribuição de Tags ao Salvar Prompts
  - [x] Adicionar campo de seleção múltipla de tags no dialog de salvamento
  - [x] Integrar atribuição de tags no fluxo de salvamento de prompts
  - [x] Atualizar UI para mostrar tags selecionadas
- [x] Salvamento Automático de Versões
  - [x] Integrar saveVersion() na mutation de otimizar
  - [x] Registrar estado anterior antes de otimizar
  - [x] Testar versionamento automático
- [x] UI de Comparação Lado a Lado
  - [x] Criar componente de duas colunas para comparação
  - [x] Exibir promptOriginal vs promptOtimizado
  - [x] Destacar diferenças entre versões
  - [ ] Adicionar botão de restauração de versões (funcionalidade futura)

## Melhorias de UX - Reorganização do Dashboard (Sessão Atual)
- [x] Reorganizar layout do Dashboard
  - [x] Mover tabs principais (Analisar, Gerar, Otimizar) para o topo da página
  - [x] Reposicionar seções secundárias (métricas, favoritos, tags, analytics) após as tabs
  - [x] Melhorar hierarquia visual e foco nas funcionalidades principais

## Modo de Visualização Compacto (Sessão Atual)
- [x] Implementar botão de alternância para Modo Compacto
  - [x] Adicionar estado para controlar visibilidade das seções secundárias
  - [x] Criar botão toggle no header do Dashboard
  - [x] Implementar lógica de ocultar/mostrar seções (métricas, favoritos, tags, analytics)
  - [x] Adicionar persistência do estado no localStorage
  - [x] Adicionar ícone e feedback visual adequados

## Fluxo Automatizado entre Tabs (Sessão Atual)
- [x] Implementar comunicação automática entre Análise, Geração e Otimização
  - [x] Botão "Gerar Baseado nesta Análise" após resultados de análise
    - [x] Navegar automaticamente para tab "Gerar"
    - [x] Preencher campo "Objetivo" com insights da análise
    - [x] Pré-selecionar área jurídica detectada
  - [x] Botão "Otimizar Este Prompt" após resultados de geração
    - [x] Navegar automaticamente para tab "Otimizar"
    - [x] Preencher campo com prompt gerado
  - [x] Botão "Gerar Nova Versão" após resultados de otimização
    - [x] Retornar para tab "Gerar" com prompt otimizado como base
  - [x] Eliminar necessidade de copiar/colar manualmente
  - [x] Criar fluxo circular: Analisar → Gerar → Otimizar → Iterar
