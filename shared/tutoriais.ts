// Biblioteca de Tutoriais do PromptJur
// Estrutura simplificada para evitar conflitos de sintaxe

export type NivelTutorial = 'iniciante' | 'intermediario' | 'profissional';
export type CategoriaTutorial = 
  | 'primeiros-passos'
  | 'funcionalidades-principais'
  | 'funcionalidades-avancadas'
  | 'exportacao-documentos'
  | 'organizacao-trabalho'
  | 'pagamentos-planos'
  | 'dicas-produtividade'
  | 'solucao-problemas'
  | 'faq';

export interface Tutorial {
  id: string;
  titulo: string;
  categoria: CategoriaTutorial;
  nivel: NivelTutorial;
  tempoLeitura: number; // em minutos
  conteudo: string; // Markdown
  tags: string[];
  videoId?: string; // ID do vídeo no YouTube (opcional)
  ordem: number; // Ordem dentro da categoria
}

// Mapeamento de categorias para nomes amigáveis
export const CATEGORIAS_NOMES: Record<CategoriaTutorial, string> = {
  'primeiros-passos': 'Primeiros Passos',
  'funcionalidades-principais': 'Funcionalidades Principais',
  'funcionalidades-avancadas': 'Funcionalidades Avançadas',
  'exportacao-documentos': 'Exportação de Documentos',
  'organizacao-trabalho': 'Organização do Trabalho',
  'pagamentos-planos': 'Pagamentos e Planos',
  'dicas-produtividade': 'Dicas de Produtividade',
  'solucao-problemas': 'Solução de Problemas',
  'faq': 'Perguntas Frequentes (FAQ)',
};

// Mapeamento de níveis para nomes amigáveis
export const NIVEIS_NOMES: Record<NivelTutorial, string> = {
  'iniciante': 'Iniciante',
  'intermediario': 'Intermediário',
  'profissional': 'Profissional',
};

// Descrições das categorias
export const CATEGORIAS_DESCRICOES: Record<CategoriaTutorial, string> = {
  'primeiros-passos': 'Aprenda o básico do PromptJur e comece a usar a plataforma',
  'funcionalidades-principais': 'Domine as ferramentas principais de análise, otimização e geração',
  'funcionalidades-avancadas': 'Explore recursos avançados para usuários experientes',
  'exportacao-documentos': 'Aprenda a exportar documentos em múltiplos formatos',
  'organizacao-trabalho': 'Organize seu trabalho com histórico, templates e tags',
  'pagamentos-planos': 'Entenda os planos, pagamentos e limites de uso',
  'dicas-produtividade': 'Aumente sua produtividade com dicas e melhores práticas',
  'solucao-problemas': 'Solucione problemas comuns e encontre respostas rápidas',
  'faq': 'Respostas rápidas para as perguntas mais comuns',
};

export const tutoriais: Tutorial[] = [
  {
    id: 'bem-vindo-promptjur',
    titulo: 'Bem-vindo ao PromptJur',
    categoria: 'primeiros-passos',
    nivel: 'iniciante',
    tempoLeitura: 3,
    ordem: 1,
    tags: ['introdução', 'visão geral', 'começar'],
    conteudo: `# Bem-vindo ao PromptJur

## O que é o PromptJur?

O PromptJur é uma plataforma especializada em **engenharia de prompts jurídicos** que utiliza inteligência artificial avançada para ajudar profissionais do Direito a criar, analisar e otimizar prompts para geração de documentos jurídicos de alta qualidade.

## Para quem é o PromptJur?

- **Advogados** que desejam aumentar produtividade
- **Escritórios de advocacia** buscando padronização
- **Estudantes de Direito** aprendendo redação jurídica
- **Profissionais do Direito** trabalhando com IA

## Funcionalidades Principais

### 1. Analisar Prompts
Avalie qualidade, identifique áreas jurídicas e receba sugestões.

### 2. Otimizar Prompts
Melhore prompts com técnicas avançadas de engenharia.

### 3. Gerar Prompts Profissionais
Crie prompts completos prontos para uso.

### 4. Criar Documentos Jurídicos
Gere documentos completos com formatação ABNT.

### 5. Usar Modelos Profissionais
Acesse biblioteca com 22 modelos pré-prontos.

## Aviso Importante

⚠️ **Verificação de Fontes**: Sempre revise citações legais e jurisprudências geradas por IA antes de usar em documentos oficiais.

## Próximos Passos

1. Explore a interface do Dashboard
2. Aprenda a analisar seu primeiro prompt
3. Descubra como gerar documentos jurídicos
`
  },
  
  {
    id: 'interface-dashboard',
    titulo: 'Navegando pela Interface',
    categoria: 'primeiros-passos',
    nivel: 'iniciante',
    tempoLeitura: 5,
    ordem: 2,
    tags: ['interface', 'navegação', 'dashboard', 'menu'],
    conteudo: `# Navegando pela Interface do Dashboard

## Menu Superior

- **Início**: Página inicial
- **Histórico**: Todas as ações realizadas
- **Meus Templates**: Templates salvos
- **Biblioteca**: Modelos profissionais
- **Tutoriais**: Esta seção de ajuda
- **Configurações**: Preferências da conta

## Abas Principais

### Analisar Prompt
Avalie qualidade de prompts existentes.

### Otimizar Prompt
Melhore prompts com técnicas avançadas.

### Gerar Prompt Jurídico
Crie prompts profissionais do zero.

### Documentos
Gere documentos jurídicos completos.

### Modelos
Use modelos profissionais pré-prontos.

## Dicas de Navegação

✅ Use atalhos de teclado (Tab, Enter)
✅ Explore botões de fluxo automatizado
✅ Salve prompts favoritos
✅ Ative o Modo Compacto para interface limpa
`
  },

  {
    id: 'primeiro-prompt-analise',
    titulo: 'Analisando Seu Primeiro Prompt',
    categoria: 'primeiros-passos',
    nivel: 'iniciante',
    tempoLeitura: 4,
    ordem: 3,
    tags: ['análise', 'tutorial prático', 'começar'],
    conteudo: `# Analisando Seu Primeiro Prompt

## Passo a Passo

### Passo 1: Acesse "Analisar Prompt"
Clique na primeira aba do Dashboard.

### Passo 2: Cole Seu Prompt
Insira o texto que deseja analisar.

### Passo 3: Clique em "Analisar"
Aguarde alguns segundos.

### Passo 4: Entenda os Resultados

#### 🎯 Área Jurídica Detectada
Sistema identifica automaticamente a área.

#### 🔑 Palavras-Chave
Termos jurídicos importantes identificados.

#### ⭐ Score de Qualidade
Avaliação de 0 a 100:
- 80-100: Alta qualidade (verde)
- 50-79: Média qualidade (amarelo)
- 0-49: Baixa qualidade (vermelho)

#### 💡 Sugestões de Melhoria
Recomendações específicas.

## Dicas

✅ Seja específico nos detalhes
✅ Use linguagem jurídica
✅ Inclua contexto relevante
❌ Evite prompts muito curtos
❌ Não misture áreas jurídicas
`
  },

  {
    id: 'otimizar-prompts',
    titulo: 'Otimizando Prompts',
    categoria: 'funcionalidades-principais',
    nivel: 'intermediario',
    tempoLeitura: 6,
    ordem: 1,
    tags: ['otimização', 'chain-of-thought', 'RAG', 'estratégias'],
    conteudo: `# Otimizando Prompts com Técnicas Avançadas

## Três Estratégias de Otimização

### 1. Resposta Direta
**Quando usar**: Casos simples e diretos
**Tempo**: ~5-10 segundos

### 2. Raciocínio Passo a Passo (Chain-of-Thought)
**Quando usar**: Casos complexos com múltiplas questões
**Tempo**: ~15-30 segundos
**Diferencial**: Mostra o raciocínio completo

### 3. Recuperação de Conhecimento (RAG)
**Quando usar**: Necessidade de jurisprudência atualizada
**Tempo**: ~20-40 segundos
**Diferencial**: Busca precedentes reais do CNJ

## Como Escolher

| Situação | Estratégia |
|----------|------------|
| Documento simples | Resposta Direta |
| Caso complexo | Chain-of-Thought |
| Recurso fundamentado | RAG |
| Urgência | Resposta Direta |

## Validação de Legislação

O sistema valida citações automaticamente:
- ✓ Verde: Citação válida
- ⚠ Amarelo: Parcial/desatualizada
- ✗ Vermelho: Inválida
`
  },

  {
    id: 'gerar-prompts-profissionais',
    titulo: 'Gerando Prompts Profissionais',
    categoria: 'funcionalidades-principais',
    nivel: 'intermediario',
    tempoLeitura: 5,
    ordem: 2,
    tags: ['geração', 'prompts', 'profissional', 'documentos'],
    conteudo: `# Gerando Prompts Profissionais do Zero

## Campos Principais

### Tipo de Documento
Selecione: petição, parecer, contrato, recurso, etc.

### Contexto Jurídico
Descreva a situação completa.

### Objetivo Específico
O que você quer alcançar?

### Campos Opcionais
- Partes envolvidas
- Legislação relevante
- Detalhes adicionais

## Resultado

Você receberá um prompt profissional completo, pronto para copiar e usar em ferramentas de IA como ChatGPT, Claude ou outras.

## Dicas

✅ Seja detalhado no contexto
✅ Especifique o tipo correto de documento
✅ Inclua legislação relevante quando souber
✅ Use o botão "Copiar" para facilitar
`
  },

  {
    id: 'gerar-documentos-juridicos',
    titulo: 'Gerando Documentos Jurídicos',
    categoria: 'funcionalidades-principais',
    nivel: 'intermediario',
    tempoLeitura: 7,
    ordem: 3,
    tags: ['documentos', 'geração', 'petição', 'parecer'],
    conteudo: `# Gerando Documentos Jurídicos Completos

## Aba Documentos

A aba "Documentos" gera documentos jurídicos completos e formatados, prontos para uso.

## Campos Necessários

### Contexto
Descreva a situação jurídica completa.

### Tipo de Documento
Escolha entre 8 tipos:
- Petição Inicial
- Contestação
- Parecer Jurídico
- Contrato
- Recurso
- Memorando
- Procuração
- Notificação Extrajudicial

### Estratégia de IA
Escolha entre Resposta Direta, Chain-of-Thought ou RAG.

## Resultado

Documento completo com:
- Formatação ABNT profissional
- Estrutura jurídica correta
- Fundamentação legal
- Pronto para exportação

## Exportação

Após gerar, exporte em:
- **PDF**: Formatação profissional
- **DOCX**: Editável no Word
- **TXT**: Texto simples

## Validação

O sistema valida automaticamente citações legais no documento gerado.
`
  },

  {
    id: 'usar-modelos-profissionais',
    titulo: 'Usando Modelos Profissionais',
    categoria: 'funcionalidades-principais',
    nivel: 'iniciante',
    tempoLeitura: 4,
    ordem: 4,
    tags: ['modelos', 'biblioteca', 'templates', 'pré-prontos'],
    conteudo: `# Usando Modelos Profissionais

## Biblioteca de Modelos

A aba "Modelos" oferece 22 modelos profissionais pré-prontos, organizados por tipo e área jurídica.

## Tipos Disponíveis

- **Petições** (8 modelos)
- **Pareceres** (5 modelos)
- **Contratos** (4 modelos)
- **Recursos** (3 modelos)
- **Defesas** (2 modelos)

## Como Usar

1. Navegue pela galeria de modelos
2. Use filtros por tipo ou área jurídica
3. Clique em "⚡ Usar Este Modelo"
4. Campos são preenchidos automaticamente
5. Ajuste conforme necessário
6. Gere o prompt final

## Modelos Premium

Alguns modelos são marcados com badge "Premium" (amarelo) e requerem plano pago.

## Dica

Os modelos são excelentes pontos de partida para casos similares. Sempre ajuste os detalhes para seu caso específico.
`
  },

  {
    id: 'exportar-documentos',
    titulo: 'Exportando Documentos',
    categoria: 'exportacao-documentos',
    nivel: 'iniciante',
    tempoLeitura: 3,
    ordem: 1,
    tags: ['exportação', 'PDF', 'DOCX', 'download'],
    conteudo: `# Exportando Documentos em Múltiplos Formatos

## Formatos Disponíveis

### PDF
- Formatação profissional
- Não editável
- Ideal para envio e impressão

### DOCX
- Editável no Microsoft Word
- Mantém formatação ABNT
- Ideal para ajustes finais

### TXT
- Texto simples
- Sem formatação
- Ideal para copiar/colar

## Como Exportar

1. Após gerar resultado (análise, otimização, documento)
2. Clique em "Preview e Exportar"
3. Visualize o documento formatado
4. Escolha opções de formatação:
   - Incluir cabeçalho do escritório
   - Incluir data e hora
5. Clique no botão do formato desejado
6. Arquivo é baixado automaticamente

## Cabeçalho Personalizado

Configure seu cabeçalho em **Configurações** para incluir automaticamente:
- Nome do escritório
- OAB
- Endereço e contatos

## Dica

Use "Preview" antes de exportar para verificar a formatação final.
`
  },

  {
    id: 'organizacao-historico-templates',
    titulo: 'Organizando com Histórico e Templates',
    categoria: 'organizacao-trabalho',
    nivel: 'intermediario',
    tempoLeitura: 5,
    ordem: 1,
    tags: ['histórico', 'templates', 'organização', 'tags'],
    conteudo: `# Organizando Seu Trabalho

## Histórico

Acesse **Histórico** no menu superior para ver todas as ações realizadas.

### Filtros Disponíveis
- Por tipo (análise, geração, otimização)
- Por área jurídica
- Por data
- Busca por palavras-chave

### Ações no Histórico
- Ver detalhes completos
- Reutilizar prompt
- Marcar como favorito

## Templates Salvos

Salve prompts frequentes como templates reutilizáveis.

### Como Salvar
1. Após gerar resultado
2. Clique em "Salvar Prompt"
3. Dê um nome e descrição
4. Atribua tags para organização

### Gerenciar Templates
Acesse **Meus Templates** para:
- Listar todos os templates
- Buscar por nome/descrição
- Filtrar por área jurídica ou tags
- Editar ou deletar templates
- Compartilhar templates (público/privado)

## Sistema de Tags

Crie tags personalizadas para organizar:
- Por cliente
- Por tipo de caso
- Por urgência
- Por status

## Favoritos

Marque prompts importantes como favoritos para acesso rápido no Dashboard.
`
  },

  {
    id: 'planos-pagamentos',
    titulo: 'Planos e Pagamentos',
    categoria: 'pagamentos-planos',
    nivel: 'iniciante',
    tempoLeitura: 4,
    ordem: 1,
    tags: ['planos', 'pagamento', 'limites', 'upgrade'],
    conteudo: `# Planos e Pagamentos

## Planos Disponíveis

### Plano Free
- 10 análises/mês
- 5 gerações/mês
- 5 otimizações/mês
- Modelos básicos
- Exportação limitada

### Plano Premium
- Análises ilimitadas
- Gerações ilimitadas
- Otimizações ilimitadas
- Todos os 22 modelos profissionais
- Exportação ilimitada
- Suporte prioritário
- Sem anúncios

## Limites de Uso

Quando atingir o limite do plano Free, você verá um modal de upgrade.

### Como Verificar Uso
- Dashboard mostra métricas de uso
- Seção Analytics exibe estatísticas detalhadas

## Como Fazer Upgrade

1. Clique em "Fazer Upgrade" no modal
2. Escolha o plano Premium
3. Preencha dados de pagamento
4. Confirme a assinatura

## Formas de Pagamento

- Cartão de crédito
- Boleto bancário
- PIX

## Cancelamento

Você pode cancelar a qualquer momento em **Configurações → Assinatura**.
`
  },

  {
    id: 'dicas-produtividade',
    titulo: 'Dicas de Produtividade',
    categoria: 'dicas-produtividade',
    nivel: 'profissional',
    tempoLeitura: 6,
    ordem: 1,
    tags: ['produtividade', 'dicas', 'workflow', 'automação'],
    conteudo: `# Dicas de Produtividade Avançadas

## Fluxo Automatizado

Use os botões de fluxo para navegar automaticamente:
1. Analisar → "Otimizar Este Prompt"
2. Otimizar → "Gerar Prompt Profissional"
3. Gerar → "Criar Documento"

## Atalhos de Teclado

- **Tab**: Navegar entre campos
- **Enter**: Confirmar ações
- **Ctrl+S**: Salvar prompt
- **Ctrl+C**: Copiar resultado

## Modo Compacto

Ative o Modo Compacto para ocultar seções secundárias e focar nas ferramentas principais.

## Templates Inteligentes

Crie templates para casos recorrentes:
- Ações de cobrança
- Divórcios consensuais
- Contratos padrão

## Validação Automática

Sempre revise a validação de legislação antes de usar documentos.

## Integração com Ferramentas

Copie prompts gerados e use em:
- ChatGPT
- Claude
- Outras IAs jurídicas

## Organização por Tags

Use tags para:
- Clientes específicos
- Tipos de caso
- Urgência
- Status do processo

## Exportação em Lote

Para múltiplos documentos:
1. Gere todos os prompts
2. Salve como templates
3. Exporte quando necessário
`
  },

  {
    id: 'solucao-problemas',
    titulo: 'Solucionando Problemas Comuns',
    categoria: 'solucao-problemas',
    nivel: 'intermediario',
    tempoLeitura: 5,
    ordem: 1,
    tags: ['troubleshooting', 'erros', 'suporte', 'FAQ'],
    conteudo: `# Solucionando Problemas Comuns

## Problemas de Geração

### "Erro ao gerar documento"
**Solução**:
- Verifique sua conexão com internet
- Tente novamente em alguns segundos
- Simplifique o prompt se muito complexo

### "Limite de uso atingido"
**Solução**:
- Aguarde renovação mensal (plano Free)
- Faça upgrade para plano Premium

## Problemas de Exportação

### "Erro ao exportar PDF"
**Solução**:
- Verifique se o documento foi gerado completamente
- Tente exportar em DOCX primeiro
- Limpe cache do navegador

### "Formatação incorreta"
**Solução**:
- Configure cabeçalho em Configurações
- Marque/desmarque opções no Preview
- Use DOCX para edição manual

## Problemas de Validação

### "Citação marcada como inválida"
**Solução**:
- Sempre revise citações manualmente
- Busque a legislação em fontes oficiais
- Atualize referências se necessário

## Problemas de Login

### "Não consigo fazer login"
**Solução**:
- Verifique email e senha
- Use "Esqueci minha senha"
- Limpe cookies do navegador

## Suporte

### Email
suporte@promptjur.com.br

### Chat (em breve)
Disponível em Configurações → Suporte

### FAQ
Consulte seção de Perguntas Frequentes

## Tempo de Resposta

- **Plano Free**: Até 48 horas (úteis)
- **Plano Premium**: Até 24 horas (úteis)
- **Urgências**: Até 12 horas (úteis)
`
  },
  // FAQs (Perguntas Frequentes) - Respostas rápidas
  {
    id: 'faq-o-que-e-promptjur',
    titulo: 'O que é o PromptJur?',
    categoria: 'faq' as const,
    nivel: 'iniciante' as const,
    tempoLeitura: 1,
    conteudo: `# O que é o PromptJur?

O PromptJur é uma plataforma especializada em **engenharia de prompts jurídicos**, desenvolvida para advogados e profissionais do direito.

## Principais Funcionalidades

- **Análise de Prompts**: Avalia a qualidade e eficácia de prompts jurídicos
- **Otimização**: Melhora prompts existentes com técnicas avançadas
- **Geração**: Cria prompts profissionais do zero
- **Documentos Jurídicos**: Gera petições, contratos e outros documentos
- **Validação**: Verifica citações de legislação e precedentes

## Para Quem é?

- Advogados que usam IA em seu trabalho
- Escritórios de advocacia buscando eficiência
- Estudantes de direito aprendendo sobre IA jurídica
- Profissionais do direito que querem melhorar seus prompts`,
    tags: ['introdução', 'básico', 'plataforma'],
    ordem: 1
  },
  {
    id: 'faq-como-comecar',
    titulo: 'Como começar a usar o PromptJur?',
    categoria: 'faq' as const,
    nivel: 'iniciante' as const,
    tempoLeitura: 2,
    conteudo: `# Como começar a usar o PromptJur?

## Passo 1: Faça Login
Acesse a plataforma e faça login com sua conta Google ou GitHub.

## Passo 2: Explore as Abas
- **Analisar**: Cole um prompt para análise
- **Otimizar**: Melhore um prompt existente
- **Gerar**: Crie um novo prompt do zero
- **Documentos**: Gere documentos jurídicos completos

## Passo 3: Experimente com um Exemplo
Comece com algo simples:
\`\`\`
Preciso elaborar uma petição inicial de ação de indenização por danos morais decorrentes de acidente de trânsito
\`\`\`

## Passo 4: Refine os Resultados
Use as sugestões da plataforma para melhorar seus prompts.

## Dica
Consulte os tutoriais na aba "Tutoriais" para aprender técnicas avançadas!`,
    tags: ['primeiros passos', 'tutorial', 'início'],
    ordem: 2
  },
  {
    id: 'faq-quanto-custa',
    titulo: 'Quanto custa o PromptJur?',
    categoria: 'faq' as const,
    nivel: 'iniciante' as const,
    tempoLeitura: 2,
    conteudo: `# Quanto custa o PromptJur?

## Plano Free (Gratuito)
- **1000 requisições/hora**
- Acesso a todas as funcionalidades básicas
- Análise, otimização e geração de prompts
- Exportação em PDF, DOCX e TXT
- Ideal para: Testes e uso pessoal

## Plano Pro (Em Breve)
- Requisições ilimitadas
- Prioridade no processamento
- Acesso a modelos avançados de IA
- Suporte prioritário
- Templates personalizados

## Plano Enterprise (Em Breve)
- Tudo do Pro +
- API dedicada
- Integração com sistemas jurídicos
- Treinamento personalizado
- SLA garantido

## Como Atualizar?
Atualmente, todos os usuários têm acesso ao plano Free. Os planos pagos serão lançados em breve.`,
    tags: ['preços', 'planos', 'pagamento', 'custo'],
    ordem: 3
  },
  {
    id: 'faq-exportar-documentos',
    titulo: 'Como exportar documentos?',
    categoria: 'faq' as const,
    nivel: 'iniciante' as const,
    tempoLeitura: 1,
    conteudo: `# Como exportar documentos?

## Formatos Disponíveis
- **PDF**: Ideal para impressão e compartilhamento
- **DOCX**: Editável no Microsoft Word
- **TXT**: Texto simples para cópia

## Passo a Passo
1. Gere ou analise um prompt/documento
2. Clique no botão **"Preview e Exportar"**
3. Visualize o documento formatado
4. Escolha as opções de formatação:
   - ☑️ Incluir cabeçalho do escritório
   - ☑️ Incluir data e hora
5. Clique em **"Salvar PDF"**, **"Salvar .DOCX"** ou **"Salvar .TXT"**

## Formatação ABNT
Todos os documentos exportados seguem as normas ABNT:
- Fonte Arial 12pt
- Espaçamento 1.5
- Margens: 3cm (esquerda/superior) e 2cm (direita/inferior)`,
    tags: ['exportação', 'pdf', 'docx', 'download'],
    ordem: 4
  },
  {
    id: 'faq-validacao-legislacao',
    titulo: 'Como funciona a validação de legislação?',
    categoria: 'faq' as const,
    nivel: 'intermediario' as const,
    tempoLeitura: 2,
    conteudo: `# Como funciona a validação de legislação?

## O Que é Validado?
A plataforma verifica automaticamente:
- **Leis**: Ex: Lei 8.078/1990 (CDC)
- **Artigos**: Ex: Art. 5º da CF/88
- **Precedentes**: Súmulas, jurisprudências
- **Normas**: Resoluções, portarias

## Processo de Validação
1. **Extração**: Identifica citações no texto
2. **Verificação**: Consulta bases de dados oficiais
3. **Classificação**: Marca como válida, inválida ou não encontrada
4. **Relatório**: Exibe estatísticas e avisos

## Interpretação dos Resultados
- ✅ **Verde**: Citação válida e verificada
- ⚠️ **Amarelo**: Citação encontrada mas com ressalvas
- ❌ **Vermelho**: Citação inválida ou não encontrada

## Limitações
- Validação automática pode ter falsos positivos
- Sempre revise manualmente citações críticas
- Base de dados atualizada periodicamente`,
    tags: ['validação', 'legislação', 'citações', 'verificação'],
    ordem: 5
  },
  {
    id: 'faq-estrategias-ia',
    titulo: 'Quais são as estratégias de IA disponíveis?',
    categoria: 'faq' as const,
    nivel: 'intermediario' as const,
    tempoLeitura: 3,
    conteudo: `# Quais são as estratégias de IA disponíveis?

## 1. Resposta Direta
**Quando usar**: Documentos simples e diretos
**Vantagens**: Rápido (5-10 segundos)
**Desvantagens**: Menos detalhado

## 2. Raciocínio Passo a Passo (Chain of Thought)
**Quando usar**: Casos complexos que exigem análise detalhada
**Vantagens**: Mais preciso e fundamentado
**Desvantagens**: Mais lento (15-30 segundos)

## 3. Recuperação de Conhecimento (RAG)
**Quando usar**: Quando precisa de precedentes e jurisprudências reais
**Vantagens**: Busca precedentes do CNJ e STF
**Desvantagens**: Requer conexão com bases externas

## Como Escolher?
- **Petição simples**: Resposta Direta
- **Caso complexo**: Raciocínio Passo a Passo
- **Precisa de precedentes**: Recuperação de Conhecimento

## Dica Profissional
Experimente todas as estratégias e compare os resultados para encontrar a melhor para seu caso!`,
    tags: ['estratégias', 'ia', 'chain of thought', 'rag'],
    ordem: 6
  },
  {
    id: 'faq-templates-personalizados',
    titulo: 'Como criar templates personalizados?',
    categoria: 'faq' as const,
    nivel: 'profissional' as const,
    tempoLeitura: 3,
    conteudo: `# Como criar templates personalizados?

## O Que São Templates?
Templates são modelos reutilizáveis de prompts que você pode salvar e usar novamente.

## Criando um Template
1. Acesse a aba **"Modelos"**
2. Clique em **"Criar Novo Modelo"**
3. Preencha os campos:
   - **Nome**: Ex: "Petição Inicial - Danos Morais"
   - **Área Jurídica**: Ex: "Civil"
   - **Prompt Base**: Seu prompt modelo
   - **Descrição**: Quando usar este template

## Variáveis Dinâmicas
Use placeholders para personalizar:
\`\`\`
{{nome_cliente}}
{{valor_causa}}
{{data_fato}}
\`\`\`

## Compartilhamento
- **Privado**: Apenas você vê
- **Público**: Outros usuários podem usar (em breve)

## Boas Práticas
- Crie templates para casos recorrentes
- Use nomes descritivos
- Documente quando usar cada template
- Mantenha templates atualizados`,
    tags: ['templates', 'modelos', 'personalização', 'avançado'],
    ordem: 7
  },
  {
    id: 'faq-historico-prompts',
    titulo: 'Como acessar meu histórico de prompts?',
    categoria: 'faq' as const,
    nivel: 'iniciante' as const,
    tempoLeitura: 1,
    conteudo: `# Como acessar meu histórico de prompts?

## Acessando o Histórico
1. Clique na aba **"Histórico"** no menu superior
2. Veja todos os prompts que você criou, analisou ou otimizou

## Filtros Disponíveis
- **Por tipo**: Análise, Otimização, Geração, Documentos
- **Por data**: Hoje, Última semana, Último mês
- **Por área jurídica**: Civil, Penal, Trabalhista, etc.
- **Por status**: Sucesso, Erro

## Ações no Histórico
- **Visualizar**: Ver detalhes completos
- **Reutilizar**: Usar novamente o prompt
- **Exportar**: Baixar em PDF/DOCX
- **Excluir**: Remover do histórico

## Estatísticas
O histórico também mostra:
- Total de análises realizadas
- Total de documentos gerados
- Áreas jurídicas mais usadas
- Taxa de sucesso`,
    tags: ['histórico', 'prompts', 'busca', 'filtros'],
    ordem: 8
  },
  {
    id: 'faq-erro-geracao',
    titulo: 'O que fazer quando a geração falha?',
    categoria: 'faq' as const,
    nivel: 'intermediario' as const,
    tempoLeitura: 2,
    conteudo: `# O que fazer quando a geração falha?

## Causas Comuns

### 1. Prompt Muito Curto
**Erro**: "Contexto insuficiente"
**Solução**: Adicione mais detalhes sobre o caso

### 2. Prompt Muito Longo
**Erro**: "Limite de tokens excedido"
**Solução**: Divida em partes menores

### 3. Limite de Requisições
**Erro**: "Rate limit exceeded"
**Solução**: Aguarde alguns minutos

### 4. Erro de Conexão
**Erro**: "Network error"
**Solução**: Verifique sua internet e tente novamente

## Dicas para Evitar Erros
- Use prompts claros e objetivos
- Evite caracteres especiais excessivos
- Não faça requisições simultâneas
- Aguarde o processamento completo

## Ainda com Problemas?
- Verifique o console do navegador (F12)
- Limpe o cache do navegador
- Tente em modo anônimo
- Entre em contato com o suporte`,
    tags: ['erro', 'problema', 'falha', 'troubleshooting'],
    ordem: 9
  },
  {
    id: 'faq-privacidade-dados',
    titulo: 'Meus dados estão seguros?',
    categoria: 'faq' as const,
    nivel: 'iniciante' as const,
    tempoLeitura: 2,
    conteudo: `# Meus dados estão seguros?

## Segurança e Privacidade

### Criptografia
- Todos os dados são transmitidos via **HTTPS**
- Senhas nunca são armazenadas (usamos OAuth)
- Dados em repouso são criptografados

### Armazenamento
- Prompts são salvos apenas na sua conta
- Ninguém mais tem acesso aos seus dados
- Você pode excluir seus dados a qualquer momento

### Conformidade
- **LGPD**: Totalmente conforme
- **GDPR**: Compatível
- **OAB**: Segue normas de sigilo profissional

## O Que Coletamos?
- Email e nome (via OAuth)
- Prompts e documentos que você cria
- Estatísticas de uso (anônimas)

## O Que NÃO Coletamos?
- Dados sensíveis de clientes
- Informações bancárias
- Localização precisa

## Seus Direitos
- Acessar seus dados
- Corrigir informações
- Excluir sua conta
- Exportar seus dados`,
    tags: ['privacidade', 'segurança', 'lgpd', 'dados'],
    ordem: 10
  }
];
