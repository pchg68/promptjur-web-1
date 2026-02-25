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
  | 'solucao-problemas';

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
];

export default tutoriais;
