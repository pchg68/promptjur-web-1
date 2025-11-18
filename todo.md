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
- [ ] Interface de Análise de Prompts
  - [ ] Campo de entrada de texto
  - [ ] Exibição de resultados (área jurídica, qualidade, sugestões)
  - [ ] Extração de entidades e palavras-chave
  - [ ] Badge de qualidade visual
- [ ] Interface de Geração de Prompts
  - [ ] Seletor de área jurídica (12 áreas)
  - [ ] Campo de objetivo
  - [ ] Slider de nível de detalhe
  - [ ] Campo de persona
  - [ ] Checkbox de referências legais
  - [ ] Geração com templates especializados
- [ ] Interface de Otimização de Prompts
  - [ ] Campo de entrada de prompt original
  - [ ] Comparação lado a lado (antes/depois)
  - [ ] Explicação das melhorias aplicadas

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
- [ ] Histórico de prompts gerados
- [ ] Métricas de uso (total de análises, gerações, otimizações)
- [ ] Favoritos e salvos
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
