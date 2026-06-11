/**
 * Biblioteca de 100 Prompts Jurídicos — PromptJur
 * Organizados por área, com metodologia CREF
 * Complexidade: [B] Básico | [I] Intermediário | [A] Avançado
 */

export interface PromptJuridico {
  id: number;
  titulo: string;
  area: string;
  subarea: string;
  complexidade: "basico" | "intermediario" | "avancado";
  descricao: string;
  prompt: string;
}

export const AREAS_JURIDICAS = [
  "Direito do Trabalho",
  "Direito Civil",
  "Direito Penal",
  "Direito Tributário",
  "Família e Sucessões",
  "Direito Empresarial",
  "Direito Previdenciário",
  "Direito do Consumidor",
  "Direito Ambiental",
  "Direito Digital e LGPD",
] as const;

export const COMPLEXIDADE_LABELS: Record<string, string> = {
  basico: "Básico",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

export const COMPLEXIDADE_COLORS: Record<string, string> = {
  basico: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  intermediario: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  avancado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export const promptsJuridicos: PromptJuridico[] = [
  // ═══════════════════════════════════════════════
  // DIREITO DO TRABALHO (1-10)
  // ═══════════════════════════════════════════════
  {
    id: 1,
    titulo: "Contestação Trabalhista com Análise de Pedidos",
    area: "Direito do Trabalho",
    subarea: "Defesa Patronal",
    complexidade: "intermediario",
    descricao: "Contestação trabalhista completa com teses defensivas para cada pedido, fundamentação em CLT e súmulas do TST.",
    prompt: `Atue como advogado trabalhista patronal com 15 anos de experiência em defesas empresariais.

TAREFA: Elabore uma contestação trabalhista completa.

DADOS DO CASO:
- Reclamante: [nome]
- Reclamada: [empresa]
- Pedidos da inicial: [listar pedidos]
- Período do contrato: [data início] a [data fim]
- Cargo/função: [cargo]
- Salário: R$ [valor]
- Jornada contratual: [horário]
- Fatos relevantes para defesa: [descrever]

INSTRUÇÕES TÉCNICAS:
1. Inicie com preliminares cabíveis (inépcia, prescrição quinquenal, incompetência territorial)
2. Para cada pedido, apresente tese defensiva específica com fundamentação na CLT e súmulas do TST
3. Impugne valores por excesso, indicando parâmetros corretos
4. Aborde ônus da prova (art. 818 CLT e art. 373 CPC)
5. Requeira compensação/dedução de valores já pagos
6. Inclua pedido de justiça gratuita se cabível (art. 790, §4º CLT)

FORMATO: Peça processual completa com endereçamento, qualificação, preliminares, mérito por pedido, pedidos finais, requerimentos de prova.

RESTRIÇÕES: NÃO invente jurisprudência — cite apenas súmulas e OJs reais do TST.`,
  },
  {
    id: 2,
    titulo: "Cálculo de Verbas Rescisórias com Projeção de Risco",
    area: "Direito do Trabalho",
    subarea: "Cálculos Trabalhistas",
    complexidade: "basico",
    descricao: "Cálculo detalhado de verbas rescisórias conforme modalidade de dispensa, com projeção de risco financeiro.",
    prompt: `Atue como perito contábil trabalhista. Calcule as verbas rescisórias e projete o risco financeiro.

DADOS:
- Empregado: [nome, cargo]
- Data admissão: [data] | Data demissão: [data]
- Modalidade: [sem justa causa / pedido de demissão / justa causa / acordo art. 484-A]
- Último salário: R$ [valor]
- Adicionais habituais: [insalubridade, periculosidade, HE, noturno]
- Férias vencidas: [sim/não — períodos]
- FGTS depositado: R$ [valor estimado]

INSTRUÇÕES:
1. Calcule cada verba individualmente (saldo salário, aviso prévio, férias + 1/3, 13º proporcional, multa FGTS)
2. Aplique a legislação correta para cada modalidade de rescisão
3. Apresente tabela comparativa: cenário favorável × desfavorável
4. Projete risco financeiro total incluindo multas (art. 477, §8º CLT)

FORMATO: Tabela com verba | base legal | valor. Resumo com total e projeção de risco.

RESTRIÇÕES: NÃO use valores fictícios — calcule com dados fornecidos. Indique [VERIFICAR EXTRATO FGTS] quando necessário.`,
  },
  {
    id: 3,
    titulo: "Recurso Ordinário contra Sentença de Improcedência",
    area: "Direito do Trabalho",
    subarea: "Recursos Trabalhistas",
    complexidade: "avancado",
    descricao: "Recurso ordinário ao TRT com demonstração de error in judicando e confronto com provas dos autos.",
    prompt: `Atue como advogado trabalhista com experiência em recursos perante TRTs.

TAREFA: Elabore recurso ordinário contra sentença que julgou improcedentes os pedidos.

DADOS:
- Processo: [número CNJ]
- Reclamante: [nome]
- Reclamada: [razão social]
- Pedidos indeferidos: [listar cada pedido e fundamento da sentença]
- Provas produzidas: [documentos, depoimentos, perícia]
- TRT competente: [região]

INSTRUÇÕES TÉCNICAS:
1. Verifique tempestividade (art. 895 CLT — 8 dias úteis)
2. Demonstre cabimento e regularidade formal (preparo, custas, depósito recursal)
3. Para cada pedido: identifique error in judicando ou error in procedendo
4. Confronte fundamentação da sentença com provas (art. 371 CPC)
5. Aplique princípios: in dubio pro operario, primazia da realidade, proteção
6. Requeira reforma total ou parcial

FORMATO: Recurso ordinário completo com endereçamento ao TRT, tempestividade, admissibilidade, razões recursais por capítulo, pedido de reforma.

RESTRIÇÕES: NÃO invente depoimentos. NÃO invente jurisprudência — use [PESQUISAR EM FONTE OFICIAL].`,
  },
  {
    id: 4,
    titulo: "Acordo Extrajudicial Trabalhista (art. 855-B CLT)",
    area: "Direito do Trabalho",
    subarea: "Negociação e Acordos",
    complexidade: "intermediario",
    descricao: "Petição conjunta para homologação de acordo extrajudicial com requisitos formais obrigatórios.",
    prompt: `Atue como advogado trabalhista com experiência em acordos extrajudiciais.

TAREFA: Elabore petição conjunta para homologação de acordo extrajudicial (art. 855-B a 855-E CLT).

DADOS:
- Empregado: [nome, CPF, cargo, período contratual]
- Empregador: [razão social, CNPJ, representante legal]
- Advogado do empregado: [nome, OAB — DEVE ser diferente do advogado da empresa]
- Advogado do empregador: [nome, OAB]
- Valor total: R$ [montante]
- Parcelas e natureza: [discriminar indenizatórias × remuneratórias]
- Forma de pagamento: [à vista ou parcelado]
- Quitação: [geral ou parcial — especificar verbas]

INSTRUÇÕES:
1. Fundamente no art. 855-B CLT — requisitos formais obrigatórios
2. Garanta advogados distintos (art. 855-B, §1º — nulidade se mesmo advogado)
3. Discrimine natureza jurídica de cada parcela (INSS, IR, FGTS)
4. Especifique se quitação é geral ou restrita
5. Inclua cláusula de reflexão e voluntariedade
6. Requeira homologação com designação de audiência (art. 855-D)

FORMATO: Petição conjunta + Termo de acordo em anexo + Declaração de ciência.

RESTRIÇÕES: NÃO omita exigência de advogados distintos. NÃO atribua quitação geral sem concordância expressa.`,
  },
  {
    id: 5,
    titulo: "Parecer sobre Vínculo Empregatício em Plataformas Digitais",
    area: "Direito do Trabalho",
    subarea: "Novas Relações de Trabalho",
    complexidade: "avancado",
    descricao: "Parecer analisando existência de vínculo entre trabalhador e plataforma digital, com subordinação algorítmica.",
    prompt: `Atue como advogado trabalhista especializado em economia de plataformas.

TAREFA: Elabore parecer sobre existência de vínculo empregatício entre trabalhador e plataforma digital.

DADOS:
- Plataforma: [nome, modelo de negócio, forma de remuneração]
- Trabalhador: [atividade, tempo de atuação, exclusividade]
- Controle: [algoritmo de distribuição, avaliação, penalidades, geolocalização]
- Autonomia: [pode recusar tarefas? define horários? equipamento próprio?]
- Remuneração: [por tarefa, por hora, mínimo garantido?]
- Contrato formal: [termos de uso — cláusulas relevantes]

INSTRUÇÕES:
1. Analise os 5 requisitos do art. 3º CLT
2. Distinga subordinação clássica × subordinação algorítmica
3. Avalie primazia da realidade sobre forma contratual
4. Analise jurisprudência do TST [PESQUISAR EM FONTE OFICIAL]
5. Considere Tema 1291 STF (repercussão geral)
6. Pondere argumentos pró e contra com base nos fatos
7. Conclua com grau de risco (baixo/médio/alto)

FORMATO: Parecer com ementa, consulta, fundamentação fática e jurídica, tabela comparativa (autonomia × subordinação), conclusão e recomendações.

RESTRIÇÕES: NÃO apresente conclusão categórica — tema controvertido. NÃO invente jurisprudência.`,
  },
  {
    id: 6,
    titulo: "Defesa em Ação de Dano Moral Trabalhista",
    area: "Direito do Trabalho",
    subarea: "Defesa Patronal",
    complexidade: "intermediario",
    descricao: "Contestação em ação indenizatória por dano moral, demonstrando ausência de conduta ilícita do empregador.",
    prompt: `Atue como advogado trabalhista especializado em defesa empresarial.

TAREFA: Elabore contestação em ação de indenização por dano moral trabalhista.

DADOS:
- Reclamante: [nome, cargo, período do contrato]
- Reclamada: [razão social, CNPJ, atividade]
- Fatos alegados: [descrever alegações de assédio/dano]
- Provas disponíveis pela empresa: [documentos, testemunhas, câmeras, e-mails]
- Valor pretendido: R$ [valor da indenização]
- Vara do Trabalho: [número e cidade]

INSTRUÇÕES:
1. Estruture preliminares (inépcia, prescrição — art. 11 CLT)
2. Desenvolva mérito: ausência de ato ilícito, dano ou nexo causal (art. 186 e 927 CC)
3. Demonstre ambiente de trabalho adequado (NRs, compliance)
4. Impugne especificamente cada fato com contraprovas
5. Aborde quantum subsidiariamente — parâmetros do art. 223-G CLT
6. Requeira produção de provas

FORMATO: Contestação completa com endereçamento, qualificação, preliminares, mérito, pedidos, rol de testemunhas.

RESTRIÇÕES: NÃO invente jurisprudência. NÃO minimize condutas reais — defesa técnica, não negacionista.`,
  },
  {
    id: 7,
    titulo: "Reclamação Trabalhista por Horas Extras e Intervalo",
    area: "Direito do Trabalho",
    subarea: "Reclamações Trabalhistas",
    complexidade: "basico",
    descricao: "Petição inicial de reclamação trabalhista pleiteando horas extras, intervalo intrajornada e reflexos.",
    prompt: `Atue como advogado trabalhista do empregado.

TAREFA: Elabore reclamação trabalhista pleiteando horas extras e intervalo intrajornada.

DADOS:
- Reclamante: [nome, CPF, endereço, cargo]
- Reclamada: [razão social, CNPJ, endereço]
- Período: [admissão] a [demissão]
- Jornada real: [horário efetivo — entrada, saída, intervalo real]
- Jornada contratual: [horário registrado]
- Salário: R$ [valor]
- Intervalo concedido: [tempo real — se inferior a 1h]
- Controles de ponto: [existem? são fidedignos?]

INSTRUÇÕES:
1. Fundamente horas extras no art. 7º, XVI CF e art. 59 CLT
2. Intervalo intrajornada: art. 71 CLT e Súmula 437 TST (natureza salarial)
3. Calcule reflexos: DSR, férias + 1/3, 13º, FGTS + 40%, aviso prévio
4. Requeira inversão do ônus da prova se empresa com +10 empregados (Súmula 338 TST)
5. Requeira AJG, honorários sucumbenciais, juros e correção

FORMATO: Petição inicial completa com endereçamento, qualificação, fatos, direito, pedidos com valores estimados, provas, valor da causa.

RESTRIÇÕES: NÃO invente dados. Use [INSERIR DADOS REAIS] para informações faltantes.`,
  },
  {
    id: 8,
    titulo: "Mandado de Segurança contra Ato de Juiz do Trabalho",
    area: "Direito do Trabalho",
    subarea: "Recursos e Mandados",
    complexidade: "avancado",
    descricao: "Mandado de segurança contra decisão judicial trabalhista irrecorrível que viola direito líquido e certo.",
    prompt: `Atue como advogado trabalhista com experiência em mandados de segurança na Justiça do Trabalho.

TAREFA: Elabore mandado de segurança contra ato judicial que viola direito líquido e certo.

DADOS:
- Impetrante: [nome/razão social, qualificação]
- Autoridade coatora: [Juiz da Xª Vara do Trabalho de...]
- Processo originário: [número CNJ]
- Ato impugnado: [descrever a decisão — bloqueio, penhora, indeferimento, etc.]
- Direito violado: [qual direito líquido e certo foi violado]
- Irrecorribilidade: [por que não cabe recurso contra o ato]

INSTRUÇÕES:
1. Fundamente no art. 5º, LXIX CF e Lei 12.016/2009
2. Demonstre cabimento: ato judicial irrecorrível (Súmula 414 TST)
3. Comprove direito líquido e certo com prova pré-constituída
4. Demonstre ilegalidade ou abuso de poder do ato
5. Requeira liminar (art. 7º, III Lei 12.016/2009)
6. Requeira notificação da autoridade e oitiva do MP

FORMATO: MS completo com endereçamento ao TRT, qualificação, ato coator, direito líquido e certo, fundamentação, pedido liminar e de mérito.

RESTRIÇÕES: NÃO use MS como substituto de recurso cabível. Verifique Súmula 414 TST.`,
  },
  {
    id: 9,
    titulo: "Impugnação à Sentença de Liquidação Trabalhista",
    area: "Direito do Trabalho",
    subarea: "Execução Trabalhista",
    complexidade: "intermediario",
    descricao: "Impugnação aos cálculos de liquidação com demonstração de excesso de execução e parâmetros corretos.",
    prompt: `Atue como advogado trabalhista com experiência em fase de execução.

TAREFA: Elabore impugnação à sentença de liquidação por excesso de execução.

DADOS:
- Processo: [número CNJ]
- Exequente: [nome]
- Executada: [razão social]
- Valor homologado em liquidação: R$ [valor]
- Valor que a executada entende correto: R$ [valor]
- Divergências: [listar — base de cálculo, período, índices, reflexos indevidos]
- Sentença exequenda: [resumir o que foi deferido]

INSTRUÇÕES:
1. Fundamente no art. 884, §3º CLT (impugnação à sentença de liquidação)
2. Para cada divergência: demonstre o cálculo correto × o cálculo do perito/exequente
3. Indique parâmetros da sentença que limitam a execução (art. 879, §1º CLT)
4. Questione inclusão de parcelas não deferidas (excesso — art. 884, §4º CLT)
5. Apresente planilha alternativa com valores corretos
6. Requeira nova perícia ou retificação dos cálculos

FORMATO: Impugnação com endereçamento, qualificação, divergências numeradas, planilha comparativa, pedidos.

RESTRIÇÕES: NÃO invente valores. A impugnação deve se ater aos limites da coisa julgada.`,
  },
  {
    id: 10,
    titulo: "Ação de Consignação em Pagamento de Verbas Rescisórias",
    area: "Direito do Trabalho",
    subarea: "Ações Especiais",
    complexidade: "intermediario",
    descricao: "Ação de consignação quando o empregado se recusa a receber verbas rescisórias ou dar quitação.",
    prompt: `Atue como advogado trabalhista patronal.

TAREFA: Elabore ação de consignação em pagamento de verbas rescisórias.

DADOS:
- Consignante (empregador): [razão social, CNPJ]
- Consignatário (empregado): [nome, CPF]
- Motivo da recusa: [empregado não compareceu / recusou assinar / divergência de valores]
- Verbas a consignar: [listar com valores]
- Tentativas de pagamento: [datas e formas tentadas]
- Prazo do art. 477 CLT: [se já expirou]

INSTRUÇÕES:
1. Fundamente nos arts. 539-549 CPC c/c art. 769 CLT
2. Demonstre mora do credor (recusa injustificada ou impossibilidade de pagamento)
3. Deposite judicialmente o valor integral das verbas
4. Requeira citação do empregado para levantar ou contestar
5. Requeira declaração de quitação das verbas consignadas
6. Se prazo do art. 477 já expirou: argumente boa-fé e ausência de culpa

FORMATO: Petição inicial com endereçamento, qualificação, fatos, direito, depósito, pedidos.

RESTRIÇÕES: O valor depositado deve ser integral — consignação parcial não libera o devedor.`,
  },
  // ═══════════════════════════════════════════════
  // DIREITO CIVIL (11-20)
  // ═══════════════════════════════════════════════
  {
    id: 11,
    titulo: "Ação de Indenização por Responsabilidade Civil Médica",
    area: "Direito Civil",
    subarea: "Responsabilidade Civil",
    complexidade: "avancado",
    descricao: "Petição inicial de ação indenizatória por erro médico com análise de obrigação de meio vs. resultado.",
    prompt: `Atue como advogado civilista especializado em responsabilidade civil médica.

TAREFA: Elabore petição inicial de ação de indenização por erro médico.

DADOS:
- Autor (paciente): [nome, CPF, endereço]
- Réu (médico/hospital): [nome/razão social, CRM/CNPJ]
- Procedimento realizado: [descrever cirurgia/tratamento]
- Dano sofrido: [sequelas, agravamento, resultado diverso do esperado]
- Nexo causal: [como o erro causou o dano]
- Provas: [prontuário, laudos, perícias, fotos]
- Valores pretendidos: [danos morais, materiais, estéticos, pensão]

INSTRUÇÕES:
1. Distinga obrigação de meio × resultado (art. 14 CDC para hospital; art. 951 CC para médico)
2. Demonstre culpa (imperícia, imprudência ou negligência) ou defeito do serviço
3. Fundamente dano moral in re ipsa se aplicável
4. Cumule danos: morais + materiais + estéticos (Súmula 387 STJ)
5. Se incapacidade: requeira pensão mensal (art. 950 CC)
6. Requeira inversão do ônus da prova (art. 6º, VIII CDC)
7. Requeira tutela de urgência para tratamento se necessário

FORMATO: Petição inicial completa com endereçamento, qualificação, fatos, direito, pedidos discriminados, valor da causa.

RESTRIÇÕES: NÃO presuma erro sem fundamentar. NÃO invente laudos médicos — use [INSERIR DADOS REAIS].`,
  },
  {
    id: 12,
    titulo: "Ação de Usucapião Extraordinária",
    area: "Direito Civil",
    subarea: "Direitos Reais",
    complexidade: "intermediario",
    descricao: "Petição inicial de usucapião extraordinária com demonstração de posse ad usucapionem e requisitos legais.",
    prompt: `Atue como advogado civilista especializado em direito das coisas.

TAREFA: Elabore petição inicial de ação de usucapião extraordinária (art. 1.238 CC).

DADOS:
- Requerente: [nome, CPF, estado civil, profissão]
- Imóvel: [endereço, área, confrontações, matrícula se houver]
- Tempo de posse: [período — superior a 15 anos, ou 10 com moradia/obra]
- Natureza da posse: [mansa, pacífica, ininterrupta, animus domini]
- Provas: [IPTU pago, contas, benfeitorias, testemunhos]
- Proprietário registral: [se conhecido]
- Comarca: [foro competente]

INSTRUÇÕES:
1. Fundamente no art. 1.238 CC (15 anos) ou parágrafo único (10 anos com moradia)
2. Demonstre requisitos: posse ad usucapionem, tempo, continuidade, pacificidade
3. Requeira citação de confinantes, proprietário registral e interessados
4. Requeira intimação da Fazenda Pública (art. 246, §3º CPC)
5. Requeira publicação de edital (art. 259 CPC)
6. Junte planta e memorial descritivo (profissional habilitado)

FORMATO: Petição inicial com endereçamento, qualificação, fatos, direito, pedidos, provas, valor da causa.

RESTRIÇÕES: NÃO dispense planta e memorial — requisito legal. NÃO confunda extraordinária com ordinária. Verifique se imóvel não é público (art. 183, §3º CF).`,
  },
  {
    id: 13,
    titulo: "Contrato de Prestação de Serviços com NDA e PI",
    area: "Direito Civil",
    subarea: "Contratos",
    complexidade: "intermediario",
    descricao: "Contrato de prestação de serviços com cláusulas robustas de sigilo e cessão de propriedade intelectual.",
    prompt: `Atue como advogado civilista/empresarial especializado em contratos e propriedade intelectual.

TAREFA: Elabore contrato de prestação de serviços com NDA e cessão de PI.

DADOS:
- Contratante: [razão social/nome, CNPJ/CPF, representante]
- Contratado: [razão social/nome, CNPJ/CPF]
- Objeto: [serviço a ser prestado]
- Prazo: [determinado/indeterminado]
- Remuneração: R$ [valor, periodicidade]
- Informações confidenciais: [tipos de dados protegidos]
- Criações intelectuais: [software, design, textos, metodologias]
- Foro: [comarca]

INSTRUÇÕES:
1. Objeto com escopo claro e delimitado (art. 421 CC)
2. Sigilo: definição, exceções, prazo pós-contrato (2-5 anos), penalidades
3. PI: cessão integral ao contratante (art. 4º Lei 9.609/98; art. 49 Lei 9.610/98)
4. Não-concorrência: prazo, território, atividade (razoabilidade)
5. Responsabilidades e obrigações de cada parte
6. Rescisão, multa e aviso prévio
7. Resolução de disputas (mediação → arbitragem ou judicial)

FORMATO: Contrato completo com preâmbulo, cláusulas numeradas, foro, assinaturas. Anexo I: escopo. Anexo II: informações confidenciais.

RESTRIÇÕES: NÃO use cláusulas genéricas. Alertar que não-concorrência sem contraprestação pode ser inválida.`,
  },
  {
    id: 14,
    titulo: "Ação de Reparação por Vazamento de Dados Pessoais",
    area: "Direito Civil",
    subarea: "Responsabilidade Civil e LGPD",
    complexidade: "avancado",
    descricao: "Ação indenizatória por dano moral decorrente de vazamento de dados pessoais com fundamento na LGPD.",
    prompt: `Atue como advogado civilista especializado em responsabilidade civil e proteção de dados.

TAREFA: Elabore petição inicial de ação indenizatória por vazamento de dados pessoais.

DADOS:
- Autor: [nome, CPF, dados vazados — especificar quais]
- Réu: [empresa controladora — razão social, CNPJ]
- Incidente: [descrever vazamento — data, circunstâncias, como tomou conhecimento]
- Danos: [fraudes, constrangimento, ligações indesejadas, score afetado]
- Provas: [notificação, prints, BO, notícias sobre o vazamento]
- Valor pretendido: R$ [estimativa]

INSTRUÇÕES:
1. Fundamente na LGPD: art. 42 (responsabilidade), art. 44 (tratamento irregular), art. 46 (segurança)
2. Aplique responsabilidade objetiva (art. 42 LGPD c/c art. 927, p.ú. CC)
3. Demonstre dano in re ipsa (dados sensíveis) ou dano concreto
4. Invoque art. 5º, X CF (inviolabilidade da intimidade)
5. Requeira inversão do ônus da prova (art. 42, §2º LGPD)
6. Cumule obrigação de fazer: notificação à ANPD, eliminação, relatório de impacto
7. Requeira tutela de urgência se risco continuado (art. 300 CPC)

FORMATO: Petição inicial com endereçamento, qualificação, fatos, direito (LGPD + CC + CF), pedidos, valor da causa.

RESTRIÇÕES: NÃO presuma dano sem fundamentar — distinga dados sensíveis de comuns. NÃO invente jurisprudência.`,
  },
  {
    id: 15,
    titulo: "Embargos de Terceiro em Execução Civil",
    area: "Direito Civil",
    subarea: "Processo de Execução",
    complexidade: "intermediario",
    descricao: "Embargos de terceiro para desconstituir penhora sobre bem de propriedade do embargante não devedor.",
    prompt: `Atue como advogado civilista com experiência em execução e defesa de terceiros.

TAREFA: Elabore embargos de terceiro para desconstituir penhora.

DADOS:
- Embargante (terceiro): [nome, CPF — não é parte na execução]
- Exequente: [nome/razão social]
- Executado: [nome — devedor]
- Processo de execução: [número CNJ, vara]
- Bem penhorado: [descrição — imóvel, veículo, conta]
- Prova de propriedade: [escritura, contrato, nota fiscal, registro]
- Data da ciência da penhora: [para prazo — art. 675 CPC]

INSTRUÇÕES:
1. Fundamente no art. 674 CPC — legitimidade do terceiro
2. Verifique tempestividade (art. 675 CPC)
3. Demonstre propriedade ou posse anterior à constrição
4. Requeira suspensão da execução quanto ao bem (art. 678 CPC)
5. Se imóvel: verifique registro (art. 1.245 CC) ou posse com justo título
6. Se bem de família: fundamente na Lei 8.009/90
7. Requeira tutela de urgência para suspender atos expropriatórios

FORMATO: Petição de embargos com endereçamento, qualificação, processo originário, fatos, direito, pedidos.

RESTRIÇÕES: NÃO confunda com embargos à execução (do devedor). Verifique se embargante não é responsável patrimonial (art. 790 CPC).`,
  },
  {
    id: 16,
    titulo: "Ação Revisional de Contrato Bancário",
    area: "Direito Civil",
    subarea: "Contratos Bancários",
    complexidade: "intermediario",
    descricao: "Ação revisional de cláusulas abusivas em contrato bancário com pedido de recálculo e repetição de indébito.",
    prompt: `Atue como advogado civilista/consumerista com experiência em contratos bancários.

TAREFA: Elabore ação revisional de contrato bancário com cláusulas abusivas.

DADOS:
- Autor: [nome, CPF]
- Réu: [banco — razão social, CNPJ]
- Contrato: [número, tipo — empréstimo/financiamento/cartão, data]
- Valor contratado: R$ [valor]
- Taxa de juros contratada: [% a.m.]
- Taxa média de mercado (BACEN): [% a.m.]
- Cláusulas questionadas: [juros abusivos, capitalização, comissão de permanência, TAC, seguros]
- Valor pago até agora: R$ [valor]

INSTRUÇÕES:
1. Fundamente no CDC (art. 6º, V — revisão de cláusulas) e CC (art. 421, 422)
2. Compare taxa contratada × taxa média BACEN (Súmula 382 STJ)
3. Questione capitalização de juros (Súmula 539 STJ — só se expressamente pactuada)
4. Impugne cobrança cumulada de comissão de permanência (Súmula 472 STJ)
5. Requeira recálculo com expurgo de ilegalidades
6. Requeira repetição de indébito em dobro (art. 42, p.ú. CDC) ou compensação
7. Requeira tutela para manutenção do nome limpo durante a ação

FORMATO: Petição inicial com endereçamento, qualificação, fatos, cláusulas abusivas, direito, pedidos, valor da causa.

RESTRIÇÕES: NÃO alegue usura sem comparar com taxa média BACEN. Verifique se contrato permite capitalização.`,
  },
  {
    id: 17,
    titulo: "Ação de Cobrança com Pedido de Tutela de Urgência",
    area: "Direito Civil",
    subarea: "Obrigações",
    complexidade: "basico",
    descricao: "Ação de cobrança por inadimplemento contratual com pedido de arresto cautelar de bens do devedor.",
    prompt: `Atue como advogado civilista com experiência em cobranças judiciais.

TAREFA: Elabore ação de cobrança com pedido de tutela cautelar.

DADOS:
- Autor (credor): [nome/razão social, CPF/CNPJ]
- Réu (devedor): [nome/razão social, CPF/CNPJ]
- Origem da dívida: [contrato, nota promissória, cheque, serviço prestado]
- Valor original: R$ [valor]
- Data do vencimento: [data]
- Notificação prévia: [se houve — data e forma]
- Bens conhecidos do devedor: [se houver informação]
- Risco de dilapidação: [devedor vendendo bens, transferindo patrimônio]

INSTRUÇÕES:
1. Fundamente no art. 389 CC (inadimplemento) e arts. 318-326 CC (pagamento)
2. Demonstre a existência da obrigação, vencimento e inadimplemento
3. Calcule valor atualizado: principal + juros moratórios (art. 406 CC) + correção monetária
4. Requeira tutela cautelar de arresto (art. 301 CPC) se risco de dilapidação
5. Requeira citação para pagar em 15 dias ou contestar
6. Requeira honorários de 10-20% e custas

FORMATO: Petição inicial com endereçamento, qualificação, fatos, direito, memória de cálculo, pedidos, valor da causa.

RESTRIÇÕES: NÃO requeira arresto sem demonstrar risco concreto. Junte prova documental da dívida.`,
  },
  {
    id: 18,
    titulo: "Ação de Despejo por Falta de Pagamento",
    area: "Direito Civil",
    subarea: "Locações",
    complexidade: "basico",
    descricao: "Ação de despejo cumulada com cobrança de aluguéis atrasados e pedido liminar de desocupação.",
    prompt: `Atue como advogado civilista com experiência em direito imobiliário e locações.

TAREFA: Elabore ação de despejo por falta de pagamento cumulada com cobrança.

DADOS:
- Locador (autor): [nome, CPF]
- Locatário (réu): [nome, CPF]
- Imóvel: [endereço completo]
- Contrato de locação: [data, prazo, valor do aluguel]
- Aluguéis em atraso: [meses — listar com valores]
- Garantia: [caução, fiador, seguro — se houver]
- Notificação prévia: [se houve tentativa extrajudicial]

INSTRUÇÕES:
1. Fundamente na Lei 8.245/91 (Lei de Locações): art. 9º, III (falta de pagamento)
2. Requeira liminar de desocupação em 15 dias mediante caução (art. 59, §1º, IX)
3. Cumule cobrança dos aluguéis e encargos vencidos e vincendos (art. 62, I)
4. Informe que o réu pode purgar a mora (art. 62, II — pagamento integral em 15 dias)
5. Se há fiador: inclua como litisconsorte passivo
6. Requeira multa contratual, juros e correção

FORMATO: Petição inicial com endereçamento, qualificação, fatos, direito, pedido liminar, pedidos de mérito, valor da causa.

RESTRIÇÕES: NÃO esqueça de informar possibilidade de purgação da mora. Verifique se contrato está vigente ou prorrogado.`,
  },
  {
    id: 19,
    titulo: "Ação de Dissolução de Condomínio com Alienação Judicial",
    area: "Direito Civil",
    subarea: "Direitos Reais",
    complexidade: "intermediario",
    descricao: "Ação de extinção de condomínio sobre bem indivisível com pedido de alienação judicial e partilha do preço.",
    prompt: `Atue como advogado civilista com experiência em direito das coisas e condomínio.

TAREFA: Elabore ação de dissolução de condomínio com alienação judicial.

DADOS:
- Autor (condômino): [nome, CPF, fração ideal]
- Réu (condômino): [nome, CPF, fração ideal]
- Bem em condomínio: [descrição — imóvel, matrícula, valor estimado]
- Origem do condomínio: [herança, compra conjunta, doação]
- Tentativa de acordo: [se houve proposta de venda ou compra da parte]
- Indivisibilidade: [por que o bem não pode ser dividido fisicamente]

INSTRUÇÕES:
1. Fundamente no art. 1.320 CC — direito potestativo de exigir divisão ou alienação
2. Demonstre que o bem é indivisível ou que a divisão reduziria seu valor (art. 1.322 CC)
3. Requeira alienação judicial com direito de preferência aos condôminos (art. 1.322, p.ú. CC)
4. Requeira avaliação judicial do bem
5. Requeira partilha do preço conforme frações ideais
6. Se urgente: requeira nomeação de administrador provisório

FORMATO: Petição inicial com endereçamento, qualificação, fatos, direito, pedidos, valor da causa (valor da fração do autor).

RESTRIÇÕES: NÃO ignore direito de preferência dos condôminos. Verifique se não há cláusula de indivisibilidade temporária.`,
  },
  {
    id: 20,
    titulo: "Parecer sobre Responsabilidade Civil em Acidente com Veículo Autônomo",
    area: "Direito Civil",
    subarea: "Responsabilidade Civil",
    complexidade: "avancado",
    descricao: "Parecer jurídico sobre cadeia de responsabilidade em acidente envolvendo veículo com direção autônoma.",
    prompt: `Atue como advogado civilista especializado em responsabilidade civil e novas tecnologias.

TAREFA: Elabore parecer sobre responsabilidade civil em acidente com veículo autônomo.

DADOS:
- Veículo: [marca, modelo, nível de automação SAE 1-5]
- Acidente: [dinâmica, local, condições]
- Vítima: [pedestre, motorista, passageiro — lesões]
- Condutor/operador: [estava no veículo? interviu? sistema ativado?]
- Fabricante: [empresa do sistema de IA]
- Seguradora: [se aplicável]

INSTRUÇÕES:
1. Analise cadeia de responsabilidade: proprietário × condutor × fabricante × desenvolvedor
2. Aplique responsabilidade pelo fato do produto (art. 12 CDC)
3. Avalie culpa do condutor na supervisão
4. Analise teoria do risco (art. 927, p.ú. CC)
5. Discuta art. 932, III CC se veículo corporativo
6. Aborde excludentes: caso fortuito, força maior, culpa exclusiva da vítima
7. Considere regulamentação CONTRAN e direito comparado

FORMATO: Parecer com ementa, consulta, análise fática, fundamentação, tabela de cenários (responsável × fundamento), conclusão, recomendações.

RESTRIÇÕES: NÃO apresente solução definitiva — tema sem jurisprudência consolidada. NÃO invente precedentes. Indique lacuna legislativa.`,
  },
  // ═══════════════════════════════════════════════
  // DIREITO PENAL (21-30)
  // ═══════════════════════════════════════════════
  {
    id: 21,
    titulo: "Habeas Corpus contra Prisão Preventiva Desproporcional",
    area: "Direito Penal",
    subarea: "Liberdade e Cautelares",
    complexidade: "avancado",
    descricao: "HC com pedido liminar demonstrando ausência de requisitos do art. 312 CPP e desproporcionalidade da custódia.",
    prompt: `Atue como advogado criminalista com experiência em habeas corpus.

TAREFA: Elabore HC contra prisão preventiva desproporcional.

DADOS:
- Paciente: [nome, qualificação, preso desde quando]
- Autoridade coatora: [juízo que decretou]
- Processo: [número CNJ, tipo penal]
- Fundamentos da decisão: [motivos do juiz]
- Condições pessoais: [residência, trabalho, família, primariedade]
- Tribunal competente: [TJ ou TRF]

INSTRUÇÕES:
1. Demonstre ausência dos requisitos do art. 312 CPP
2. Ataque fundamentação genérica (art. 315, §2º CPP — Lei 13.964/2019)
3. Invoque proporcionalidade: pena permite regime aberto/semiaberto?
4. Demonstre cabimento de cautelares diversas (art. 319 CPP)
5. Invoque presunção de inocência (art. 5º, LVII CF)
6. Se aplicável: excesso de prazo (Súmula 21 STJ)
7. Requeira liminar e concessão da ordem

FORMATO: HC completo com endereçamento, qualificação, fatos, constrangimento ilegal, fundamentação, pedido liminar e de mérito.

RESTRIÇÕES: NÃO invente jurisprudência. NÃO omita informações desfavoráveis. Verifique Súmula 691 STF.`,
  },
  {
    id: 22,
    titulo: "Memoriais em Ação Penal por Estelionato Digital",
    area: "Direito Penal",
    subarea: "Crimes Cibernéticos",
    complexidade: "avancado",
    descricao: "Alegações finais escritas em favor do réu em ação penal por estelionato mediante fraude eletrônica.",
    prompt: `Atue como advogado criminalista especializado em crimes cibernéticos.

TAREFA: Elabore memoriais em favor do réu por estelionato digital (art. 171, §2º-A CP).

DADOS:
- Réu: [nome, qualificação]
- Processo: [número CNJ, vara criminal]
- Fatos imputados: [conduta atribuída pela denúncia]
- Provas da acusação: [laudos, IPs, logs, depoimentos]
- Provas da defesa: [álibis, perícias, testemunhas]
- Instrução: [resumo dos depoimentos]

INSTRUÇÕES:
1. Analise tipicidade: todos os elementos demonstrados?
2. Questione autoria: IP não é prova absoluta (spoofing, uso compartilhado)
3. Avalie cadeia de custódia digital (art. 158-A a 158-F CPP)
4. Verifique autorização judicial para quebra de sigilo (art. 5º, XII CF)
5. Analise proporcionalidade (§2º-A: 4-8 anos reclusão)
6. Explore teses subsidiárias: desclassificação, tentativa, arrependimento (art. 15 CP)
7. Requeira absolvição (art. 386 CPP) ou pena mínima

FORMATO: Memoriais com síntese processual, teses defensivas (principal e subsidiárias), dosimetria subsidiária, pedidos.

RESTRIÇÕES: NÃO invente jurisprudência. NÃO minimize condutas graves — defesa técnica.`,
  },
  {
    id: 23,
    titulo: "Acordo de Não Persecução Penal (ANPP)",
    area: "Direito Penal",
    subarea: "Justiça Negocial",
    complexidade: "intermediario",
    descricao: "Requerimento ou análise de proposta de ANPP com verificação de requisitos e condições proporcionais.",
    prompt: `Atue como advogado criminalista com experiência em justiça negocial.

TAREFA: Elabore requerimento de ANPP ou analise proposta do MP.

DADOS:
- Investigado/Réu: [nome, qualificação, antecedentes]
- Crime: [tipo penal, pena mínima — deve ser < 4 anos]
- Circunstâncias: [fatos, confissão formal, reparação do dano]
- Antecedentes: [primário? sem ANPP anterior em 5 anos?]
- Condições do MP: [se já houve proposta — listar]
- Vítima: [houve dano? valor? reparação possível?]

INSTRUÇÕES:
1. Verifique requisitos do art. 28-A CPP: pena < 4 anos, sem violência/grave ameaça, confissão
2. Verifique impedimentos (§2º, I a IV): reincidência, ANPP anterior, violência doméstica
3. Analise condições (art. 28-A, I a V CPP)
4. Avalie proporcionalidade das condições
5. Se MP recusou: fundamente e requeira remessa ao PGJ/CSMP (§14)
6. Oriente sobre consequências: não gera reincidência nem antecedente

FORMATO: Requerimento ao juízo ou análise com parecer ao cliente. Quadro: condições × proporcionalidade × recomendação.

RESTRIÇÕES: NÃO omita que confissão formal é requisito. NÃO garanta resultado. Alertar sobre rescisão por descumprimento (§10).`,
  },
  {
    id: 24,
    titulo: "Resposta à Acusação em Crime contra a Honra",
    area: "Direito Penal",
    subarea: "Crimes contra a Honra",
    complexidade: "intermediario",
    descricao: "Resposta à acusação em ação penal privada com teses de atipicidade e excludentes do art. 142 CP.",
    prompt: `Atue como advogado criminalista com experiência em crimes contra a honra.

TAREFA: Elabore resposta à acusação (art. 396 CPP) em ação penal privada.

DADOS:
- Querelado: [nome, qualificação]
- Querelante: [nome, relação com querelado]
- Crime: [calúnia 138 / difamação 139 / injúria 140 CP]
- Fatos na queixa: [expressões/condutas imputadas]
- Contexto: [redes sociais, reunião, documento, imprensa]
- Teses disponíveis: [retratação, exceção da verdade, exercício regular, provocação]

INSTRUÇÕES:
1. Verifique preliminares: decadência (6 meses — art. 38 CPP), legitimidade, inépcia
2. Analise requisitos formais da queixa (art. 41 CPP)
3. Tese principal: atipicidade — liberdade de expressão/crítica?
4. Tese subsidiária: exceção da verdade (art. 138, §3º) ou retratação (art. 143)
5. Excludentes do art. 142 CP (imunidades)
6. Se injúria: perdão judicial por provocação (art. 140, §1º)
7. Requeira absolvição sumária (art. 397 CPP)

FORMATO: Resposta à acusação com endereçamento, preliminares, mérito, pedidos, rol de testemunhas.

RESTRIÇÕES: NÃO confunda os tipos penais. Verifique se não é injúria racial (Lei 7.716/89 — inafiançável).`,
  },
  {
    id: 25,
    titulo: "Revisão Criminal por Prova Nova",
    area: "Direito Penal",
    subarea: "Recursos Excepcionais",
    complexidade: "avancado",
    descricao: "Revisão criminal fundamentada em prova nova que demonstra inocência do condenado após trânsito em julgado.",
    prompt: `Atue como advogado criminalista com experiência em revisão criminal.

TAREFA: Elabore revisão criminal por prova nova (art. 621, III CPP).

DADOS:
- Requerente (condenado): [nome, estabelecimento prisional]
- Processo originário: [número, vara, crime, pena, trânsito em julgado]
- Condenação: [resumo dos fatos]
- Prova nova: [DNA, testemunha, documento, perícia, retratação]
- Por que não foi apresentada antes: [justificar]
- Tribunal competente: [TJ ou TRF]

INSTRUÇÕES:
1. Fundamente no art. 621, III CPP
2. Demonstre que a prova é genuinamente nova
3. Demonstre idoneidade e relevância para alterar resultado
4. Requeira produção perante o Tribunal (art. 625, §1º CPP)
5. Demonstre que condenação é contrária à evidência
6. Requeira absolvição (art. 626 CPP) ou novo julgamento
7. Se preso: requeira suspensão da execução

FORMATO: Revisão criminal com endereçamento, qualificação, certidão de trânsito, fatos, prova nova, fundamentação, pedidos (rescindendo + rescisório).

RESTRIÇÕES: NÃO invente provas. NÃO confunda com HC (não exige trânsito). Revisão NUNCA é pro societate.`,
  },
  {
    id: 26,
    titulo: "Defesa Prévia em Ação Penal por Tráfico de Drogas",
    area: "Direito Penal",
    subarea: "Lei de Drogas",
    complexidade: "avancado",
    descricao: "Resposta à acusação em ação penal por tráfico com teses de desclassificação para uso pessoal.",
    prompt: `Atue como advogado criminalista com experiência em Lei de Drogas.

TAREFA: Elabore defesa prévia em ação penal por tráfico (art. 33 Lei 11.343/06).

DADOS:
- Réu: [nome, qualificação, antecedentes]
- Denúncia: [art. 33, caput ou §1º — descrever conduta]
- Droga apreendida: [tipo, quantidade]
- Circunstâncias da apreensão: [local, hora, flagrante, busca domiciliar]
- Provas da acusação: [laudo pericial, depoimentos policiais, interceptação]
- Condições pessoais: [trabalho, residência, dependência química]

INSTRUÇÕES:
1. Verifique legalidade da prova: mandado de busca, flagrante regular, cadeia de custódia
2. Tese principal: desclassificação para art. 28 (uso pessoal) — critérios do art. 28, §2º
3. Subsidiária: tráfico privilegiado (art. 33, §4º — pena reduzida 1/6 a 2/3)
4. Questione depoimentos policiais como prova isolada (princípio da corroboração)
5. Analise proporcionalidade da quantidade × contexto
6. Requeira liberdade provisória (Tema 959 STF — inconstitucionalidade do art. 44 Lei 11.343)
7. Requeira absolvição sumária ou desclassificação

FORMATO: Resposta à acusação com preliminares, mérito, pedidos, rol de testemunhas.

RESTRIÇÕES: NÃO ignore a quantidade — é relevante mas não determinante. Verifique RE 635.659 (STF) sobre porte para uso.`,
  },
  {
    id: 27,
    titulo: "Pedido de Liberdade Provisória com Medidas Cautelares",
    area: "Direito Penal",
    subarea: "Liberdade e Cautelares",
    complexidade: "intermediario",
    descricao: "Pedido de revogação de prisão preventiva com substituição por medidas cautelares diversas.",
    prompt: `Atue como advogado criminalista.

TAREFA: Elabore pedido de liberdade provisória com medidas cautelares alternativas.

DADOS:
- Preso: [nome, qualificação, preso desde]
- Crime imputado: [tipo penal, pena em abstrato]
- Fundamento da prisão: [garantia da ordem pública, conveniência da instrução, etc.]
- Condições pessoais: [residência fixa, trabalho, família, primariedade]
- Medidas propostas: [tornozeleira, recolhimento noturno, proibição de contato, comparecimento]
- Juízo: [vara criminal]

INSTRUÇÕES:
1. Demonstre que medidas cautelares diversas (art. 319 CPP) são suficientes
2. Ataque cada fundamento da prisão com fatos concretos
3. Invoque princípio da proporcionalidade e excepcionalidade
4. Proponha combinação de medidas adequadas ao caso
5. Demonstre que o preso não representa risco concreto
6. Invoque condições pessoais favoráveis
7. Se excesso de prazo: fundamente (razoabilidade da duração)

FORMATO: Petição com endereçamento, qualificação, fatos, fundamentação, medidas propostas, pedido.

RESTRIÇÕES: NÃO proponha medidas incompatíveis com a situação do preso. Seja realista nas propostas.`,
  },
  {
    id: 28,
    titulo: "Queixa-Crime por Difamação em Redes Sociais",
    area: "Direito Penal",
    subarea: "Crimes contra a Honra",
    complexidade: "basico",
    descricao: "Queixa-crime por difamação praticada em redes sociais com preservação de provas digitais.",
    prompt: `Atue como advogado criminalista com experiência em crimes digitais contra a honra.

TAREFA: Elabore queixa-crime por difamação em redes sociais (art. 139 CP).

DADOS:
- Querelante (vítima): [nome, CPF, profissão]
- Querelado (autor): [nome, perfil na rede social, se identificado]
- Fatos: [publicação difamatória — transcrever conteúdo]
- Rede social: [Instagram, Facebook, X, TikTok, etc.]
- Data da publicação: [data — verificar prazo decadencial de 6 meses]
- Provas: [prints com URL, ata notarial, metadados]
- Testemunhas: [pessoas que viram a publicação]

INSTRUÇÕES:
1. Fundamente no art. 139 CP — imputação de fato desonroso (não criminoso)
2. Demonstre publicidade (rede social = terceiros tomaram conhecimento)
3. Preserve provas: ata notarial ou prints com URL, data, hora, perfil
4. Requeira quebra de sigilo se autor anônimo (art. 22 Marco Civil)
5. Verifique prazo decadencial (6 meses — art. 38 CPP)
6. Requeira citação e audiência de conciliação (art. 520 CPP)

FORMATO: Queixa-crime com endereçamento, qualificação, fatos, tipificação, provas, pedidos, rol de testemunhas.

RESTRIÇÕES: NÃO confunda difamação (fato desonroso) com calúnia (fato criminoso) ou injúria (qualidade negativa). Verifique se não é mera opinião.`,
  },
  // ═══════════════════════════════════════════════
  // DIREITO TRIBUTÁRIO (29-38... continuando 29-40 abaixo)
  // Nota: ajustando IDs para manter 10 por área
  // ═══════════════════════════════════════════════
  {
    id: 29,
    titulo: "Mandado de Segurança contra ITBI Arbitrado",
    area: "Direito Tributário",
    subarea: "Impostos Municipais",
    complexidade: "intermediario",
    descricao: "MS contra arbitramento unilateral de base de cálculo do ITBI acima do valor da transação.",
    prompt: `Atue como advogado tributarista com experiência em mandado de segurança.

TAREFA: Elabore MS contra arbitramento de base de cálculo do ITBI pelo município.

DADOS:
- Impetrante: [nome/razão social, CPF/CNPJ]
- Autoridade coatora: [Secretário de Fazenda Municipal]
- Município: [nome]
- Imóvel: [endereço, matrícula, área]
- Valor da transação (escritura): R$ [valor]
- Valor arbitrado pelo município: R$ [valor]
- Base do arbitramento: [planta genérica? avaliação? IPTU?]

INSTRUÇÕES:
1. Fundamente no Tema 1113 STJ (REsp 1.937.821): base do ITBI é valor da transação
2. Demonstre que município não pode arbitrar sem procedimento (art. 148 CTN)
3. Invoque art. 38 CTN — valor venal = valor de mercado = valor da transação
4. Demonstre ilegalidade do arbitramento sem contraditório
5. Requeira liminar para suspender exigibilidade (art. 151, IV CTN)
6. Requeira concessão para ITBI sobre valor declarado

FORMATO: MS com endereçamento, qualificação, autoridade coatora, direito líquido e certo, fundamentação, pedido liminar e de mérito.

RESTRIÇÕES: NÃO ignore que transação simulada pode justificar arbitramento. NÃO confunda valor venal do IPTU com base do ITBI.`,
  },
  {
    id: 30,
    titulo: "Exclusão do ICMS da Base do PIS/COFINS — Execução de Créditos",
    area: "Direito Tributário",
    subarea: "Teses Tributárias",
    complexidade: "avancado",
    descricao: "Petição para execução ou recuperação de créditos da 'tese do século' com cálculos e modulação temporal.",
    prompt: `Atue como advogado tributarista com experiência em teses tributárias e execução de créditos.

TAREFA: Elabore petição para recuperação de créditos — exclusão do ICMS da base do PIS/COFINS.

DADOS:
- Empresa: [razão social, CNPJ, regime — lucro real ou presumido]
- Decisão favorável: [se já tem — número, trânsito] ou [se precisa ajuizar]
- Período de recuperação: [meses/anos — prescrição quinquenal]
- ICMS destacado: [valores por período]
- Modalidade: [compensação via PER/DCOMP ou precatório/RPV]

INSTRUÇÕES:
1. Fundamente no RE 574.706/PR (Tema 69 STF) — ICMS destacado
2. Observe modulação: efeitos a partir de 15/03/2017 (exceto ação anterior)
3. Se compensação: art. 170-A CTN + IN RFB 2.055/2021
4. Calcule: faturamento × ICMS destacado × alíquotas PIS (1,65%) e COFINS (7,6%)
5. Atualize pela SELIC (art. 39, §4º Lei 9.250/95)
6. Verifique prescrição quinquenal (art. 168 CTN)

FORMATO: Petição com memória de cálculo detalhada (mês a mês) ou ação nova com pedido de restituição/compensação.

RESTRIÇÕES: NÃO use ICMS recolhido — STF definiu ICMS DESTACADO. NÃO ignore modulação (15/03/2017). Use [INSERIR DADOS CONTÁBEIS].`,
  },
  {
    id: 31,
    titulo: "Ação Anulatória de Débito Fiscal por Vício de Motivação",
    area: "Direito Tributário",
    subarea: "Contencioso Administrativo",
    complexidade: "intermediario",
    descricao: "Ação anulatória de auto de infração com vício de motivação e cerceamento de defesa no processo administrativo.",
    prompt: `Atue como advogado tributarista com experiência em contencioso fiscal.

TAREFA: Elabore ação anulatória de débito fiscal por vício de motivação.

DADOS:
- Autor (contribuinte): [razão social, CNPJ]
- Réu: [ente federativo — União/Estado/Município]
- Auto de infração: [número, tributo, período, valor]
- Vício alegado: [motivação genérica, cerceamento de defesa, nulidade formal]
- Processo administrativo: [se houve — resultado]
- Depósito/garantia: [se oferecerá para suspender exigibilidade]

INSTRUÇÕES:
1. Fundamente nulidade: art. 142 CTN (requisitos do lançamento)
2. Demonstre vício de motivação (art. 50 Lei 9.784/99)
3. Se cerceamento: art. 5º, LV CF (ampla defesa no PAF)
4. Requeira suspensão da exigibilidade (art. 151 CTN — depósito ou tutela)
5. Subsidiariamente: ataque mérito do lançamento
6. Requeira produção de provas (pericial contábil)

FORMATO: Petição inicial com endereçamento, qualificação, fatos, nulidades, mérito subsidiário, pedidos, valor da causa.

RESTRIÇÕES: NÃO ignore que ação anulatória não suspende automaticamente — precisa de depósito ou tutela. Verifique prescrição (art. 174 CTN).`,
  },
  {
    id: 32,
    titulo: "Planejamento Tributário para Holding Familiar",
    area: "Direito Tributário",
    subarea: "Planejamento e Consultoria",
    complexidade: "avancado",
    descricao: "Parecer sobre estruturação de holding familiar para sucessão patrimonial com economia tributária lícita.",
    prompt: `Atue como advogado tributarista com experiência em planejamento patrimonial e sucessório.

TAREFA: Elabore parecer sobre holding familiar para planejamento tributário-sucessório.

DADOS:
- Patrimônio: [imóveis, participações, investimentos — valores]
- Patriarca/Matriarca: [idade, estado civil, regime de bens]
- Herdeiros: [quantidade, idades, relações]
- Renda dos imóveis: [aluguéis mensais]
- ITCMD estadual: [alíquota do estado — 4% a 8%]
- Objetivo: [sucessão, proteção, economia tributária]

INSTRUÇÕES:
1. Compare cenários: inventário judicial × holding × doação com reserva
2. Calcule carga tributária em cada cenário (ITCMD, IRPJ, CSLL, IR ganho de capital)
3. Analise integralização de imóveis (art. 156, §2º, I CF — imunidade ITBI)
4. Estruture doação de cotas com reserva de usufruto e cláusulas restritivas
5. Avalie regime tributário da holding (lucro presumido × real)
6. Alerte sobre riscos: simulação, abuso de forma, planejamento agressivo
7. Considere reforma tributária (EC 132/2023) — impactos futuros

FORMATO: Parecer com cenários comparativos (tabela), economia estimada, riscos, cronograma de implementação, recomendações.

RESTRIÇÕES: NÃO garanta economia sem análise caso a caso. NÃO ignore ITCMD sobre doação de cotas. Alertar sobre ADI da imunidade ITBI.`,
  },
  {
    id: 33,
    titulo: "Impugnação a Lançamento de ISS sobre Software",
    area: "Direito Tributário",
    subarea: "Impostos Municipais",
    complexidade: "intermediario",
    descricao: "Impugnação administrativa contra cobrança de ISS sobre licenciamento de software padronizado (SaaS).",
    prompt: `Atue como advogado tributarista com experiência em tributação de tecnologia.

TAREFA: Elabore impugnação ao lançamento de ISS sobre software/SaaS.

DADOS:
- Contribuinte: [razão social, CNPJ, atividade]
- Município: [nome, legislação local]
- Auto de infração: [número, período, valor]
- Modelo de negócio: [SaaS, licenciamento, download, customização]
- Enquadramento pelo município: [item da lista anexa LC 116/03]
- Posição do contribuinte: [por que não deve ISS]

INSTRUÇÕES:
1. Analise ADIs 5659 e 1945 (STF): software padronizado = mercadoria (ICMS, não ISS)
2. Distinga: software customizado (ISS) × padronizado (ICMS) × SaaS (controvérsia)
3. Verifique item da lista anexa LC 116/03 usado pelo município
4. Analise se há obrigação de fazer predominante ou cessão de direito de uso
5. Considere Convênio ICMS 181/2015 e legislação estadual
6. Requeira cancelamento do auto ou suspensão

FORMATO: Impugnação administrativa com qualificação, fatos, direito, pedidos, documentos.

RESTRIÇÕES: NÃO ignore que reforma tributária (IBS/CBS) unificará — mas para lançamentos passados, legislação atual se aplica. Tema em evolução.`,
  },
  {
    id: 34,
    titulo: "Recuperação de Créditos de ICMS-ST (Substituição Tributária)",
    area: "Direito Tributário",
    subarea: "ICMS",
    complexidade: "avancado",
    descricao: "Pedido de restituição de ICMS-ST recolhido a maior quando base presumida supera operação real.",
    prompt: `Atue como advogado tributarista com experiência em ICMS e substituição tributária.

TAREFA: Elabore pedido de restituição de ICMS-ST pago a maior.

DADOS:
- Contribuinte: [razão social, CNPJ, atividade — substituído]
- Estado: [UF, legislação estadual]
- Produto: [NCM, descrição]
- MVA aplicada: [% — margem de valor agregado presumida]
- Preço real de venda: [valores — inferior à base presumida]
- Período: [meses de apuração]
- Diferença: R$ [valor a restituir]

INSTRUÇÕES:
1. Fundamente no RE 593.849 (Tema 201 STF): direito à restituição quando base real < presumida
2. Aplique art. 150, §7º CF — restituição imediata e preferencial
3. Demonstre com documentos fiscais: NF-e de venda × base de cálculo da ST
4. Verifique legislação estadual de restituição (procedimento administrativo)
5. Calcule diferença mês a mês com atualização pela SELIC
6. Se via judicial: requeira repetição de indébito (art. 165 CTN)

FORMATO: Pedido administrativo ou petição judicial com memória de cálculo (planilha), fundamentação, pedidos.

RESTRIÇÕES: NÃO ignore prazo prescricional (5 anos — art. 168 CTN). Verifique se estado regulamentou procedimento (alguns exigem via administrativa primeiro).`,
  },
  {
    id: 35,
    titulo: "Consulta Tributária Formal à Receita Federal",
    area: "Direito Tributário",
    subarea: "Consultoria",
    complexidade: "basico",
    descricao: "Formulação de consulta tributária formal à RFB sobre interpretação de legislação para caso concreto.",
    prompt: `Atue como advogado tributarista com experiência em consultas à RFB.

TAREFA: Elabore consulta tributária formal à Receita Federal (IN RFB 2.058/2021).

DADOS:
- Consulente: [razão social, CNPJ, atividade]
- Tributo: [qual tributo federal]
- Dúvida: [situação fática concreta + dúvida sobre interpretação]
- Dispositivos legais: [artigos que geram dúvida]
- Operação: [descrever a operação concreta que motiva a consulta]

INSTRUÇÕES:
1. Observe requisitos formais (IN RFB 2.058/2021, art. 3º)
2. Descreva situação fática de forma clara e objetiva
3. Formule pergunta específica (não genérica)
4. Indique dispositivos legais sobre os quais recai a dúvida
5. Demonstre que não há solução de consulta anterior sobre o tema
6. Informe que não há procedimento fiscal em curso sobre o tema

FORMATO: Consulta formal com identificação, descrição dos fatos, dispositivos, pergunta objetiva, declarações obrigatórias.

RESTRIÇÕES: NÃO formule consulta genérica (será declarada ineficaz). NÃO consulte sobre fato já objeto de fiscalização. Verifique se há solução COSIT vinculante.`,
  },
  // ═══════════════════════════════════════════════
  // FAMÍLIA E SUCESSÕES (36-45... ajustando para 36-40)
  // ═══════════════════════════════════════════════
  {
    id: 36,
    titulo: "Ação de Divórcio Litigioso com Partilha e Guarda",
    area: "Família e Sucessões",
    subarea: "Divórcio",
    complexidade: "intermediario",
    descricao: "Petição inicial de divórcio litigioso com pedido de partilha de bens, guarda compartilhada e alimentos.",
    prompt: `Atue como advogado familiarista com experiência em divórcio litigioso.

TAREFA: Elabore petição inicial de divórcio litigioso cumulado com partilha, guarda e alimentos.

DADOS:
- Autor(a): [nome, CPF, profissão, renda]
- Réu/Ré: [nome, CPF, profissão, renda estimada]
- Casamento: [data, regime de bens, certidão]
- Filhos: [nomes, idades]
- Bens a partilhar: [imóveis, veículos, investimentos, empresas]
- Guarda pretendida: [compartilhada com residência fixa / unilateral]
- Alimentos: [para filhos e/ou cônjuge — valor pretendido]
- Motivo: [se relevante para guarda — violência, abandono]

INSTRUÇÕES:
1. Fundamente no art. 226, §6º CF e art. 1.571 CC (divórcio direto)
2. Partilha: conforme regime de bens (art. 1.658-1.688 CC)
3. Guarda: art. 1.583-1.584 CC — preferência por compartilhada
4. Alimentos: art. 1.694 CC — binômio necessidade × possibilidade
5. Se violência: requeira medidas protetivas (Lei Maria da Penha)
6. Requeira tutela de urgência para alimentos provisórios (art. 300 CPC)

FORMATO: Petição inicial com endereçamento, qualificação, fatos, direito por pedido, pedidos discriminados, valor da causa.

RESTRIÇÕES: NÃO discuta culpa — divórcio é direito potestativo. NÃO exponha intimidades desnecessárias.`,
  },
  {
    id: 37,
    titulo: "Inventário Extrajudicial com Testamento",
    area: "Família e Sucessões",
    subarea: "Sucessões",
    complexidade: "intermediario",
    descricao: "Minuta de escritura pública de inventário extrajudicial quando há testamento já registrado.",
    prompt: `Atue como advogado com experiência em direito sucessório e inventário extrajudicial.

TAREFA: Elabore minuta para inventário extrajudicial com testamento.

DADOS:
- De cujus: [nome, data óbito, último domicílio]
- Testamento: [tipo — público/cerrado/particular, data, cartório de registro]
- Herdeiros legítimos: [nomes, parentesco, CPFs]
- Legatários: [se houver — nomes, bens legados]
- Bens: [imóveis, veículos, contas, investimentos — com valores]
- Dívidas: [se houver]
- ITCMD: [alíquota estadual, guia recolhida]

INSTRUÇÕES:
1. Verifique requisitos: todos capazes, concordes, assistidos por advogado (art. 610, §§1º e 2º CPC)
2. Testamento deve ter sido previamente registrado e não haver litígio sobre validade
3. Respeite legítima (art. 1.846 CC — 50% para herdeiros necessários)
4. Calcule quinhões conforme testamento + sucessão legítima
5. Inclua declaração de inexistência de outros herdeiros
6. Recolha ITCMD antes da lavratura
7. Providencie certidões negativas (RFB, PGFN)

FORMATO: Minuta de escritura pública com qualificação das partes, bens, partilha, declarações, recolhimentos.

RESTRIÇÕES: NÃO faça inventário extrajudicial se houver incapaz ou litígio. Verifique se testamento foi registrado (Provimento CNJ 56/2016).`,
  },
  {
    id: 38,
    titulo: "Ação de Alimentos Gravídicos",
    area: "Família e Sucessões",
    subarea: "Alimentos",
    complexidade: "basico",
    descricao: "Petição inicial de alimentos gravídicos com demonstração de indícios de paternidade e necessidades gestacionais.",
    prompt: `Atue como advogado familiarista.

TAREFA: Elabore petição inicial de alimentos gravídicos (Lei 11.804/2008).

DADOS:
- Autora (gestante): [nome, CPF, profissão, renda]
- Réu (suposto pai): [nome, CPF, profissão, renda estimada]
- Indícios de paternidade: [relacionamento, mensagens, fotos, testemunhas]
- Semanas de gestação: [tempo]
- Despesas: [pré-natal, exames, medicamentos, enxoval, alimentação especial]
- Valor pretendido: R$ [mensal]

INSTRUÇÕES:
1. Fundamente na Lei 11.804/2008 (alimentos gravídicos)
2. Demonstre indícios de paternidade (art. 6º — convicção, não certeza)
3. Discrimine despesas da gestação (art. 2º)
4. Requeira fixação liminar (art. 6º, p.ú. — decisão em 5 dias)
5. Alimentos convertem-se em pensão ao nascituro após nascimento (art. 6º, p.ú.)
6. Requeira AJG se necessário

FORMATO: Petição inicial com endereçamento, qualificação, fatos, direito, despesas discriminadas, pedido liminar, pedidos.

RESTRIÇÕES: NÃO exija prova de paternidade — bastam indícios. NÃO inclua despesas do filho (são alimentos gravídicos, não pensão alimentícia).`,
  },
  {
    id: 39,
    titulo: "Ação de Reconhecimento de União Estável Post Mortem",
    area: "Família e Sucessões",
    subarea: "União Estável",
    complexidade: "avancado",
    descricao: "Ação declaratória de união estável post mortem para fins sucessórios com demonstração dos requisitos legais.",
    prompt: `Atue como advogado familiarista com experiência em direito sucessório.

TAREFA: Elabore ação de reconhecimento de união estável post mortem.

DADOS:
- Autor(a) (companheiro sobrevivente): [nome, CPF, profissão]
- De cujus: [nome, data óbito]
- Período da convivência: [data início a data óbito]
- Provas: [coabitação, contas conjuntas, dependente em IR/INSS, fotos, testemunhas]
- Herdeiros do falecido: [filhos, pais — se contestam]
- Bens em questão: [patrimônio do falecido]
- Objetivo: [habilitação no inventário, pensão por morte, etc.]

INSTRUÇÕES:
1. Fundamente no art. 1.723 CC — requisitos: convivência pública, contínua, duradoura, com objetivo de família
2. Demonstre cada requisito com provas documentais e testemunhais
3. Requeira declaração com efeitos sucessórios (art. 1.790 CC — declarado inconstitucional pelo STF, Tema 809)
4. Aplique regime de comunhão parcial (art. 1.725 CC) salvo contrato
5. Se houve impedimento: demonstre separação de fato do cônjuge (art. 1.723, §1º CC)
6. Requeira habilitação no inventário ou abertura

FORMATO: Petição inicial com endereçamento, qualificação, fatos, provas, direito, pedidos.

RESTRIÇÕES: NÃO ignore impedimentos matrimoniais (art. 1.521 CC). Verifique Tema 809 STF (equiparação ao cônjuge na sucessão).`,
  },
  {
    id: 40,
    titulo: "Testamento Público com Cláusulas Restritivas",
    area: "Família e Sucessões",
    subarea: "Sucessões",
    complexidade: "intermediario",
    descricao: "Minuta de testamento público com cláusulas de inalienabilidade, impenhorabilidade e incomunicabilidade.",
    prompt: `Atue como advogado com experiência em planejamento sucessório.

TAREFA: Elabore minuta de testamento público com cláusulas restritivas.

DADOS:
- Testador: [nome, estado civil, CPF, idade]
- Herdeiros necessários: [filhos — nomes]
- Legatários: [se houver — pessoas e bens específicos]
- Patrimônio: [bens disponíveis para disposição testamentária]
- Cláusulas desejadas: [inalienabilidade, impenhorabilidade, incomunicabilidade]
- Disposições especiais: [usufruto, fideicomisso, deserdação, reconhecimento de filho]

INSTRUÇÕES:
1. Respeite legítima (50% — art. 1.846 CC): cláusulas restritivas sobre legítima exigem justa causa (art. 1.848 CC)
2. Parte disponível (50%): livre disposição com ou sem cláusulas
3. Cláusulas restritivas: art. 1.911 CC — inalienabilidade implica impenhorabilidade e incomunicabilidade
4. Se fideicomisso: art. 1.951 CC — apenas para prole eventual
5. Indique testamenteiro (art. 1.976 CC)
6. Forme: art. 1.864 CC — requisitos do testamento público

FORMATO: Minuta de testamento com declarações preliminares, disposições, cláusulas restritivas com justa causa, nomeação de testamenteiro.

RESTRIÇÕES: NÃO imponha cláusulas sobre legítima sem justa causa fundamentada. NÃO exceda parte disponível. Alertar sobre necessidade de 2 testemunhas.`,
  },
  // ═══════════════════════════════════════════════
  // DIREITO EMPRESARIAL (41-50)
  // ═══════════════════════════════════════════════
  {
    id: 41,
    titulo: "Recuperação Judicial — Petição Inicial com Plano Preliminar",
    area: "Direito Empresarial",
    subarea: "Recuperação Judicial",
    complexidade: "avancado",
    descricao: "Petição inicial de recuperação judicial com demonstração de viabilidade e esboço do plano de reestruturação.",
    prompt: `Atue como advogado empresarial com experiência em recuperação judicial.

TAREFA: Elabore petição inicial de recuperação judicial (art. 51 Lei 11.101/2005).

DADOS:
- Devedora: [razão social, CNPJ, atividade, porte]
- Faturamento: [últimos 3 anos]
- Passivo: [total, discriminado por classe — trabalhista, garantia real, quirografário, ME/EPP]
- Ativos: [bens, recebíveis, contratos]
- Causa da crise: [pandemia, perda de contrato, mercado, gestão]
- Empregados: [quantidade]
- Ações/execuções em curso: [quantidade e valores]

INSTRUÇÕES:
1. Demonstre requisitos do art. 48 (atividade regular > 2 anos, não falida, sem RJ < 5 anos)
2. Junte documentos do art. 51 (demonstrações, relação de credores, empregados, bens)
3. Demonstre viabilidade econômica (art. 47 — função social)
4. Esboce plano: meios de recuperação (art. 50 — deságio, prazo, dação, cisão, etc.)
5. Requeira processamento, nomeação de AJ, suspensão de ações (stay period — art. 6º)
6. Requeira dispensa de CND (Súmula 581 STJ)

FORMATO: Petição inicial com qualificação, exposição da crise, demonstração de viabilidade, documentos, pedidos.

RESTRIÇÕES: NÃO omita documentos obrigatórios do art. 51. NÃO garanta aprovação do plano. Alertar sobre prazo de 60 dias para apresentar plano (art. 53).`,
  },
  {
    id: 42,
    titulo: "Impugnação de Crédito em Recuperação Judicial",
    area: "Direito Empresarial",
    subarea: "Recuperação Judicial",
    complexidade: "intermediario",
    descricao: "Impugnação de crédito listado no QGC com divergência de valor, classe ou existência.",
    prompt: `Atue como advogado empresarial com experiência em recuperação judicial.

TAREFA: Elabore impugnação de crédito na recuperação judicial.

DADOS:
- Impugnante: [credor ou devedora — quem questiona]
- Crédito impugnado: [credor, valor listado, classe atribuída]
- Divergência: [valor incorreto / classe errada / crédito inexistente / extraconcursal]
- Provas: [contratos, notas, decisões judiciais, cálculos]
- Prazo: [15 dias da publicação do QGC — art. 8º Lei 11.101/2005]
- Administrador judicial: [nome]

INSTRUÇÕES:
1. Fundamente no art. 8º Lei 11.101/2005
2. Verifique tempestividade (15 dias da publicação do edital com QGC)
3. Demonstre divergência com documentos
4. Se reclassificação: fundamente a classe correta (art. 41)
5. Se valor: apresente cálculo correto com base legal
6. Se inexistência: demonstre pagamento, prescrição ou nulidade
7. Requeira retificação do QGC

FORMATO: Impugnação com endereçamento, qualificação, crédito impugnado, fundamentação, pedidos.

RESTRIÇÕES: NÃO confunda com habilitação retardatária (art. 10). Verifique se prazo não expirou.`,
  },
  {
    id: 43,
    titulo: "Contrato de Vesting para Startup",
    area: "Direito Empresarial",
    subarea: "Startups e Venture Capital",
    complexidade: "intermediario",
    descricao: "Contrato de vesting de participação societária para cofundadores ou colaboradores-chave de startup.",
    prompt: `Atue como advogado empresarial com experiência em startups e venture capital.

TAREFA: Elabore contrato de vesting de participação societária.

DADOS:
- Startup: [razão social, CNPJ, tipo societário]
- Beneficiário: [nome, CPF, cargo/função]
- Participação total: [% do capital]
- Período de vesting: [ex: 4 anos com cliff de 1 ano]
- Cliff: [período mínimo antes do primeiro vesting]
- Eventos de aceleração: [aquisição, IPO, demissão sem justa causa]
- Condições de perda: [saída voluntária, justa causa, concorrência]
- Valor de exercício: [se opção de compra — strike price]

INSTRUÇÕES:
1. Defina natureza: opção de compra × participação direta × phantom equity
2. Estruture cronograma: cliff + vesting mensal/trimestral/anual
3. Cláusulas de saída: good leaver × bad leaver (valores diferentes)
4. Aceleração: single trigger × double trigger
5. Lock-up: restrição de venda pós-vesting
6. Direito de preferência da empresa (tag-along, drag-along)
7. Aspectos tributários: momento da tributação (exercício vs. venda)
8. Não-concorrência e não-solicitação

FORMATO: Contrato com preâmbulo, definições, cronograma, condições, saída, tributação, foro.

RESTRIÇÕES: NÃO ignore implicações tributárias (IR sobre ganho de capital). Alertar que vesting em Ltda. exige alteração contratual a cada vesting.`,
  },
  {
    id: 44,
    titulo: "Due Diligence Jurídica — Checklist e Relatório",
    area: "Direito Empresarial",
    subarea: "M&A e Societário",
    complexidade: "avancado",
    descricao: "Estrutura de due diligence jurídica para aquisição societária com checklist e modelo de relatório de riscos.",
    prompt: `Atue como advogado empresarial com experiência em M&A e due diligence.

TAREFA: Elabore checklist e estrutura de relatório de due diligence jurídica.

DADOS:
- Target (empresa-alvo): [razão social, atividade, porte]
- Tipo de operação: [aquisição de quotas/ações, incorporação, ativo]
- Setores de risco: [trabalhista, tributário, ambiental, regulatório, contratual]
- Prazo: [dias para conclusão]
- Materialidade: [valor mínimo para reportar contingência]

INSTRUÇÕES:
1. Organize por área: societário, trabalhista, tributário, cível, regulatório, ambiental, PI, contratos, compliance
2. Para cada área: documentos a solicitar + pontos de atenção + classificação de risco
3. Modelo de classificação: risco alto (deal-breaker) / médio (negociável) / baixo (aceitável)
4. Inclua template de relatório executivo para o cliente
5. Defina materialidade e critérios de provisionamento
6. Sugira cláusulas de proteção no SPA (representations, warranties, indemnification)

FORMATO: Checklist por área (tabela) + Template de relatório executivo + Recomendações para SPA.

RESTRIÇÕES: NÃO liste apenas documentos — inclua o que procurar em cada um. NÃO ignore passivos ocultos (contingências não provisionadas).`,
  },
  {
    id: 45,
    titulo: "Acordo de Sócios com Governança e Saída",
    area: "Direito Empresarial",
    subarea: "Societário",
    complexidade: "intermediario",
    descricao: "Acordo de sócios/acionistas com cláusulas de governança, deadlock, saída e proteção de minoritários.",
    prompt: `Atue como advogado societarista com experiência em governança corporativa.

TAREFA: Elabore acordo de sócios/acionistas com governança e mecanismos de saída.

DADOS:
- Sociedade: [tipo — Ltda./S.A. fechada, objeto social]
- Sócios: [nomes, participações %, papéis]
- Capital social: R$ [valor]
- Administração: [quem administra, como decide]
- Distribuição de lucros: [política]
- Investimento externo: [se previsto]

INSTRUÇÕES:
1. Governança: quórum qualificado para decisões estratégicas (venda de ativos, endividamento, admissão de sócio)
2. Direito de preferência: tag-along e drag-along
3. Lock-up: período de restrição à transferência
4. Cláusula de saída: put/call options, shotgun clause (Russian roulette)
5. Deadlock: mecanismo escalonado (mediação → arbitragem → shotgun)
6. Não-concorrência e não-solicitação (prazo, território, atividade)
7. Distribuição mínima de lucros e política de reinvestimento
8. Foro ou cláusula compromissória arbitral

FORMATO: Acordo com preâmbulo, definições, cláusulas numeradas, anexos (organograma, cronograma de vesting se aplicável).

RESTRIÇÕES: NÃO use cláusulas genéricas. Não-concorrência sem contraprestação pode ser inválida. Alertar sobre registro na Junta Comercial.`,
  },
  {
    id: 46,
    titulo: "Parecer sobre Desconsideração da Personalidade Jurídica",
    area: "Direito Empresarial",
    subarea: "Responsabilidade Societária",
    complexidade: "avancado",
    descricao: "Parecer analisando cabimento de desconsideração da PJ com distinção entre teoria maior e menor.",
    prompt: `Atue como advogado empresarial com experiência em responsabilidade societária.

TAREFA: Elabore parecer sobre cabimento de desconsideração da personalidade jurídica.

DADOS:
- Empresa: [razão social, situação — ativa/inativa/irregular]
- Sócios/administradores: [nomes, participação, atuação]
- Credor: [quem pretende desconsiderar]
- Fundamento: [abuso, confusão patrimonial, desvio de finalidade, insolvência]
- Provas disponíveis: [documentos que demonstram abuso]
- Relação jurídica: [consumerista, trabalhista, civil, ambiental]

INSTRUÇÕES:
1. Distinga teoria maior (art. 50 CC — abuso) × teoria menor (art. 28, §5º CDC — obstáculo ao ressarcimento)
2. Analise requisitos do art. 50 CC (alterado pela Lei 13.874/2019 — Liberdade Econômica)
3. Verifique se é caso de desconsideração inversa (art. 133, §2º CPC)
4. Analise procedimento: incidente (art. 133-137 CPC) — contraditório prévio
5. Avalie se há confusão patrimonial ou desvio de finalidade (art. 50, §§1º e 2º CC)
6. Conclua com grau de risco e recomendação

FORMATO: Parecer com ementa, consulta, análise fática, fundamentação (teoria maior × menor), conclusão, recomendações.

RESTRIÇÕES: NÃO confunda insolvência com abuso — mera inadimplência não justifica (teoria maior). NÃO ignore contraditório prévio obrigatório.`,
  },
  // ═══════════════════════════════════════════════
  // DIREITO PREVIDENCIÁRIO (47-56... ajustando 47-50)
  // ═══════════════════════════════════════════════
  {
    id: 47,
    titulo: "Ação de Concessão de Aposentadoria por Tempo de Contribuição",
    area: "Direito Previdenciário",
    subarea: "Aposentadorias",
    complexidade: "intermediario",
    descricao: "Ação contra o INSS para concessão de aposentadoria com reconhecimento de tempo especial e rural.",
    prompt: `Atue como advogado previdenciarista com experiência em aposentadorias.

TAREFA: Elabore ação de concessão de aposentadoria por tempo de contribuição.

DADOS:
- Autor: [nome, CPF, NIT/PIS, data nascimento]
- INSS (réu): [agência que indeferiu]
- Requerimento administrativo: [NB, data, motivo do indeferimento]
- Tempo reconhecido pelo INSS: [anos, meses, dias]
- Tempo não reconhecido: [períodos — especial, rural, informal]
- Atividade especial: [agentes nocivos, PPP, LTCAT]
- Regra de transição aplicável: [pedágio, pontos, idade mínima]

INSTRUÇÕES:
1. Demonstre esgotamento administrativo (Tema 350 STF)
2. Requeira averbação de tempo especial (art. 57 Lei 8.213/91) com conversão (fator 1,4 ou 1,2)
3. Se rural: art. 55, §3º Lei 8.213/91 — início de prova material + testemunhas
4. Aplique regra de transição mais favorável (EC 103/2019, arts. 15-21)
5. Requeira DIB na DER ou reafirmação (Tema 995 STJ)
6. Requeira tutela de urgência para implantação do benefício

FORMATO: Petição inicial com endereçamento (JEF ou Vara Federal), qualificação, fatos, tempo por período, direito, pedidos, valor da causa.

RESTRIÇÕES: NÃO some tempo sem documentos. NÃO ignore EC 103/2019 para fatos posteriores a 13/11/2019. Verifique qual regra de transição é mais vantajosa.`,
  },
  {
    id: 48,
    titulo: "Recurso ao CRPS contra Indeferimento de Auxílio-Doença",
    area: "Direito Previdenciário",
    subarea: "Benefícios por Incapacidade",
    complexidade: "basico",
    descricao: "Recurso administrativo ao Conselho de Recursos da Previdência Social contra indeferimento de auxílio por incapacidade.",
    prompt: `Atue como advogado previdenciarista.

TAREFA: Elabore recurso ao CRPS contra indeferimento de auxílio por incapacidade temporária.

DADOS:
- Recorrente: [nome, CPF, NIT]
- Benefício indeferido: [NB, espécie 31 — auxílio por incapacidade temporária]
- Data da perícia: [data]
- Conclusão do perito: [motivo — capaz, sem incapacidade, DII anterior à filiação]
- CID: [código e doença]
- Documentos médicos: [laudos, exames, internações — posteriores à perícia]
- Atividade: [profissão do segurado]

INSTRUÇÕES:
1. Fundamente no art. 305 do Regulamento (Decreto 3.048/99)
2. Conteste conclusão pericial com documentos médicos
3. Demonstre incapacidade para a atividade habitual (não exige incapacidade total)
4. Requeira nova perícia com especialista na patologia
5. Se DII questionada: demonstre agravamento posterior à filiação
6. Observe prazo: 30 dias da ciência (art. 305, §1º)

FORMATO: Recurso com qualificação, decisão recorrida, razões (fáticas e jurídicas), documentos anexos, pedidos.

RESTRIÇÕES: NÃO ignore prazo de 30 dias. NÃO apresente recurso sem documentos médicos novos — será improvido.`,
  },
  {
    id: 49,
    titulo: "Ação de Pensão por Morte com Dependência Econômica",
    area: "Direito Previdenciário",
    subarea: "Pensão por Morte",
    complexidade: "intermediario",
    descricao: "Ação para concessão de pensão por morte com demonstração de dependência econômica não presumida.",
    prompt: `Atue como advogado previdenciarista com experiência em pensão por morte.

TAREFA: Elabore ação de concessão de pensão por morte com prova de dependência econômica.

DADOS:
- Autor (dependente): [nome, CPF, parentesco com falecido]
- Falecido (segurado): [nome, NIT, data óbito, último vínculo]
- Classe de dependência: [1ª — cônjuge/filho / 2ª — pais / 3ª — irmão]
- Provas de dependência: [se classe 2ª ou 3ª — transferências, declaração IR, coabitação]
- Indeferimento: [NB, motivo — não comprovou dependência]
- Qualidade de segurado: [se questionada]

INSTRUÇÕES:
1. Fundamente no art. 74 Lei 8.213/91
2. Se classe 1ª: dependência presumida (art. 16, §4º)
3. Se classe 2ª ou 3ª: demonstre dependência econômica com início de prova material
4. Verifique qualidade de segurado na data do óbito (art. 15 Lei 8.213/91 — período de graça)
5. Se união estável: demonstre convivência (art. 16, §3º Decreto 3.048/99)
6. Requeira DIB na data do óbito ou requerimento (art. 74, I e II)
7. Requeira tutela de urgência para implantação

FORMATO: Petição inicial com endereçamento, qualificação, fatos, provas de dependência, direito, pedidos.

RESTRIÇÕES: NÃO presuma dependência para classes 2ª e 3ª. NÃO ignore período de graça se último vínculo é antigo.`,
  },
  {
    id: 50,
    titulo: "Planejamento Previdenciário com Simulação de Cenários",
    area: "Direito Previdenciário",
    subarea: "Consultoria Previdenciária",
    complexidade: "avancado",
    descricao: "Parecer de planejamento previdenciário com simulação de regras de transição e melhor momento para aposentar.",
    prompt: `Atue como advogado previdenciarista com experiência em planejamento.

TAREFA: Elabore parecer de planejamento previdenciário com simulação de cenários.

DADOS:
- Cliente: [nome, data nascimento, sexo]
- Tempo de contribuição total: [anos, meses, dias — até hoje]
- Períodos especiais: [se houver — tempo e agente nocivo]
- Salários de contribuição: [últimos 12 meses ou média — para RMI]
- Vínculos: [CNIS — resumo dos períodos]
- Objetivo: [melhor benefício × aposentar logo × continuar contribuindo]

INSTRUÇÕES:
1. Simule TODAS as regras de transição aplicáveis (EC 103/2019):
   - Art. 15: pontos (86/96 progressivo)
   - Art. 16: idade mínima progressiva
   - Art. 17: pedágio 50%
   - Art. 20: pedágio 100%
   - Art. 26: aposentadoria por idade
2. Para cada regra: data de elegibilidade + RMI estimada
3. Compare: aposentar agora × esperar (custo de oportunidade)
4. Identifique tempo especial conversível (antes de 13/11/2019)
5. Verifique direito adquirido (regras anteriores à EC 103)
6. Recomende estratégia: contribuição complementar, recolhimento em atraso

FORMATO: Parecer com tabela comparativa (regra × data × RMI × observações), análise de custo-benefício, recomendação fundamentada, próximos passos.

RESTRIÇÕES: NÃO garanta valores exatos de RMI — são estimativas. NÃO ignore descarte de contribuições (art. 26, §6º EC 103). Use [CONSULTAR CNIS ATUALIZADO].`,
  },
  // ═══════════════════════════════════════════════
  // DIREITO DO CONSUMIDOR (51-60)
  // ═══════════════════════════════════════════════
  {
    id: 51,
    titulo: "Ação de Indenização por Negativação Indevida",
    area: "Direito do Consumidor",
    subarea: "Cadastro de Inadimplentes",
    complexidade: "basico",
    descricao: "Ação indenizatória por inscrição indevida em cadastro de inadimplentes (SPC/Serasa) com dano moral in re ipsa.",
    prompt: `Atue como advogado consumerista.

TAREFA: Elabore ação de indenização por negativação indevida.

DADOS:
- Autor (consumidor): [nome, CPF]
- Réu (empresa): [razão social, CNPJ]
- Negativação: [órgão — SPC/Serasa, valor, data da inscrição]
- Motivo da indevida: [dívida paga, fraude, prescrição, desconhecimento]
- Provas: [comprovante de pagamento, BO, extrato, consulta ao órgão]
- Outras negativações: [se há — Súmula 385 STJ]

INSTRUÇÕES:
1. Fundamente no art. 43 CDC e art. 5º, X CF
2. Dano moral in re ipsa (Súmula 385 STJ — atenção: se há outras legítimas, afasta)
3. Requeira tutela de urgência para exclusão imediata (art. 300 CPC)
4. Se fraude: responsabilidade objetiva do fornecedor (art. 14 CDC — risco da atividade)
5. Se prescrição: art. 43, §1º CDC (5 anos) ou §5º (prescrição da dívida)
6. Requeira indenização por dano moral + declaração de inexistência do débito

FORMATO: Petição inicial com endereçamento (JEC se até 40 SM), qualificação, fatos, direito, pedidos, valor da causa.

RESTRIÇÕES: NÃO ignore Súmula 385 STJ (preexistência de negativação legítima). Verifique se há outras inscrições.`,
  },
  {
    id: 52,
    titulo: "Ação de Obrigação de Fazer contra Plano de Saúde",
    area: "Direito do Consumidor",
    subarea: "Saúde Suplementar",
    complexidade: "intermediario",
    descricao: "Ação com tutela de urgência para cobertura de procedimento/medicamento negado pelo plano de saúde.",
    prompt: `Atue como advogado consumerista com experiência em saúde suplementar.

TAREFA: Elabore ação de obrigação de fazer contra operadora de plano de saúde.

DADOS:
- Autor (beneficiário): [nome, CPF, plano, vigência]
- Ré (operadora): [razão social, CNPJ, ANS]
- Procedimento negado: [cirurgia, medicamento, exame, internação]
- Justificativa da negativa: [fora do rol, carência, exclusão contratual]
- Prescrição médica: [médico, CRM, indicação clínica, urgência]
- Risco: [agravamento, risco de vida, dor]

INSTRUÇÕES:
1. Fundamente na Lei 9.656/98 e CDC (relação de consumo)
2. Rol da ANS: taxativo com critérios (Lei 14.454/2022 — exceções ao rol)
3. Se fora do rol: demonstre eficácia, recomendação médica, inexistência de substituto no rol
4. Se carência: urgência/emergência afasta (art. 35-C Lei 9.656/98)
5. Requeira tutela de urgência (art. 300 CPC) — risco de dano irreparável
6. Requeira dano moral se negativa abusiva com agravamento
7. Fixe astreintes para descumprimento

FORMATO: Petição inicial com endereçamento, qualificação, fatos, urgência, direito, pedido liminar, pedidos de mérito.

RESTRIÇÕES: NÃO ignore Lei 14.454/2022 (rol taxativo com exceções). Verifique se há substituto terapêutico no rol antes de pedir off-label.`,
  },
  {
    id: 53,
    titulo: "Reclamação no Procon com Pedido de Inversão do Ônus",
    area: "Direito do Consumidor",
    subarea: "Direito Administrativo do Consumidor",
    complexidade: "basico",
    descricao: "Reclamação formal ao Procon com fundamentação jurídica para vício de produto ou serviço.",
    prompt: `Atue como advogado consumerista.

TAREFA: Elabore reclamação formal ao Procon com fundamentação jurídica.

DADOS:
- Consumidor: [nome, CPF, contato]
- Fornecedor: [razão social, CNPJ]
- Produto/serviço: [descrição, data da compra, valor]
- Problema: [vício de qualidade, quantidade, informação, prática abusiva]
- Tentativas de solução: [SAC, ouvidoria, datas, protocolos]
- Pretensão: [troca, devolução, abatimento, indenização]

INSTRUÇÕES:
1. Fundamente no CDC: art. 18 (vício de produto) ou art. 20 (vício de serviço)
2. Prazo de 30 dias para sanar (art. 18, §1º) — se expirou, opções do §1º, I a III
3. Se prática abusiva: art. 39 CDC (venda casada, recusa, etc.)
4. Requeira audiência de conciliação
5. Requeira instauração de processo administrativo contra fornecedor
6. Documente todas as tentativas anteriores

FORMATO: Reclamação formal com identificação, fatos cronológicos, fundamentação legal, pretensão, documentos anexos.

RESTRIÇÕES: NÃO use linguagem agressiva — Procon é via administrativa. Junte provas de tentativa prévia de solução.`,
  },
  {
    id: 54,
    titulo: "Ação Civil Pública por Publicidade Enganosa",
    area: "Direito do Consumidor",
    subarea: "Publicidade e Práticas Comerciais",
    complexidade: "avancado",
    descricao: "Minuta de ACP por publicidade enganosa ou abusiva com pedido de dano moral coletivo.",
    prompt: `Atue como advogado com experiência em direito do consumidor coletivo.

TAREFA: Elabore minuta de ação civil pública por publicidade enganosa.

DADOS:
- Autor (legitimado): [MP, Procon, associação — art. 82 CDC]
- Réu (anunciante): [razão social, CNPJ]
- Publicidade: [meio — TV, internet, redes sociais; conteúdo enganoso]
- Engano: [informação falsa, omissão, indução a erro — art. 37 CDC]
- Consumidores afetados: [coletividade — dimensão do dano]
- Provas: [prints, gravações, laudos técnicos, reclamações]

INSTRUÇÕES:
1. Fundamente no art. 37 CDC (publicidade enganosa) e art. 6º, IV (proteção contra publicidade)
2. Demonstre capacidade de induzir consumidor a erro (art. 37, §§1º-3º)
3. Requeira: cessação imediata + contrapropaganda (art. 56, XII CDC)
4. Requeira dano moral coletivo (art. 6º, VI e VII CDC)
5. Requeira tutela de urgência para cessação (art. 300 CPC)
6. Destine indenização ao FDD (art. 13 Lei 7.347/85)

FORMATO: ACP com endereçamento, legitimidade, fatos, publicidade impugnada, direito, pedidos (tutela + mérito).

RESTRIÇÕES: NÃO confunda publicidade enganosa (informação falsa) com abusiva (valores sociais). NÃO ignore legitimidade ativa (art. 82 CDC).`,
  },
  {
    id: 55,
    titulo: "Ação de Repetição de Indébito por Cobrança em Dobro",
    area: "Direito do Consumidor",
    subarea: "Cobranças Indevidas",
    complexidade: "intermediario",
    descricao: "Ação de repetição de indébito em dobro por cobrança indevida com análise do engano justificável.",
    prompt: `Atue como advogado consumerista.

TAREFA: Elabore ação de repetição de indébito em dobro (art. 42, p.ú. CDC).

DADOS:
- Autor (consumidor): [nome, CPF]
- Réu (fornecedor): [razão social, CNPJ]
- Cobrança indevida: [valor, data, origem — fatura, débito automático, boleto]
- Pagamento: [se pagou — comprovante]
- Motivo da indevida: [serviço não contratado, valor errado, cancelamento não processado]
- Tentativas de solução: [protocolos de reclamação]

INSTRUÇÕES:
1. Fundamente no art. 42, p.ú. CDC — repetição em dobro
2. Analise EAREsp 676.608 (STJ — Tema 929): engano justificável afasta dobro
3. Demonstre que não houve engano justificável (cobrança reiterada, sistema, negligência)
4. Se não pagou: requeira declaração de inexigibilidade + dano moral
5. Se pagou: requeira devolução em dobro + correção + dano moral
6. Requeira inversão do ônus da prova (art. 6º, VIII CDC)

FORMATO: Petição inicial com endereçamento, qualificação, fatos, direito, pedidos discriminados, valor da causa.

RESTRIÇÕES: NÃO ignore Tema 929 STJ — se fornecedor demonstrar engano justificável, devolução é simples. Fundamente por que não é engano.`,
  },
  {
    id: 56,
    titulo: "Defesa do Fornecedor em Ação Consumerista",
    area: "Direito do Consumidor",
    subarea: "Defesa Empresarial",
    complexidade: "intermediario",
    descricao: "Contestação em ação consumerista com teses de excludente de responsabilidade e ausência de defeito.",
    prompt: `Atue como advogado com experiência em defesa de fornecedores.

TAREFA: Elabore contestação em ação consumerista.

DADOS:
- Réu (fornecedor): [razão social, CNPJ, atividade]
- Autor (consumidor): [nome]
- Pedidos: [indenização, troca, devolução — valores]
- Produto/serviço: [descrição]
- Alegação do consumidor: [defeito, vício, acidente de consumo]
- Defesa disponível: [culpa exclusiva do consumidor, terceiro, inexistência de defeito, decadência]

INSTRUÇÕES:
1. Verifique preliminares: decadência (art. 26 CDC — 30/90 dias), prescrição (art. 27 — 5 anos)
2. Excludentes do art. 12, §3º CDC: não colocou no mercado, inexistência de defeito, culpa exclusiva
3. Demonstre que produto/serviço atende especificações e normas técnicas
4. Se mau uso: demonstre culpa exclusiva do consumidor (art. 12, §3º, III)
5. Impugne dano moral: mero dissabor × dano efetivo
6. Subsidiariamente: impugne quantum (proporcionalidade)

FORMATO: Contestação com preliminares, mérito (excludentes), impugnação de danos, pedidos.

RESTRIÇÕES: NÃO alegue culpa concorrente como excludente total — CDC não admite (apenas exclusiva). NÃO minimize defeito real — defesa técnica.`,
  },
  // ═══════════════════════════════════════════════
  // DIREITO AMBIENTAL (57-66... ajustando 57-60)
  // ═══════════════════════════════════════════════
  {
    id: 57,
    titulo: "Defesa Administrativa em Auto de Infração Ambiental",
    area: "Direito Ambiental",
    subarea: "Contencioso Administrativo",
    complexidade: "intermediario",
    descricao: "Defesa administrativa contra auto de infração do IBAMA/órgão estadual com teses de nulidade e mérito.",
    prompt: `Atue como advogado ambientalista com experiência em contencioso administrativo.

TAREFA: Elabore defesa administrativa contra auto de infração ambiental.

DADOS:
- Autuado: [nome/razão social, CPF/CNPJ, atividade]
- Órgão autuante: [IBAMA, órgão estadual, municipal]
- Auto de infração: [número, data, infração descrita]
- Sanção aplicada: [multa — valor, embargo, apreensão]
- Legislação invocada: [artigo da Lei 9.605/98, Decreto 6.514/08]
- Prazo: [20 dias — art. 113 Decreto 6.514/08]
- Teses: [nulidade formal, ausência de dano, excludente, desproporcionalidade]

INSTRUÇÕES:
1. Verifique nulidades formais: competência, descrição da infração, tipificação
2. Analise proporcionalidade da sanção (art. 6º Lei 9.605/98 — critérios de dosimetria)
3. Se embargo: demonstre regularidade ou possibilidade de conversão em multa
4. Teses de mérito: excludente de ilicitude, estado de necessidade, caso fortuito
5. Requeira conversão de multa em serviços ambientais (art. 72, §4º Lei 9.605/98)
6. Requeira efeito suspensivo se cabível

FORMATO: Defesa administrativa com qualificação, fatos, preliminares (nulidades), mérito, pedidos, documentos.

RESTRIÇÕES: NÃO ignore prazo de 20 dias (preclusão). NÃO negue fatos documentados — conteste tipificação ou proporcionalidade.`,
  },
  {
    id: 58,
    titulo: "Licenciamento Ambiental — Parecer sobre EIA/RIMA",
    area: "Direito Ambiental",
    subarea: "Licenciamento",
    complexidade: "avancado",
    descricao: "Parecer jurídico sobre exigibilidade de EIA/RIMA e procedimento de licenciamento ambiental.",
    prompt: `Atue como advogado ambientalista com experiência em licenciamento.

TAREFA: Elabore parecer sobre exigibilidade de EIA/RIMA e procedimento de licenciamento.

DADOS:
- Empreendimento: [tipo, porte, localização]
- Empreendedor: [razão social, CNPJ]
- Órgão licenciador: [federal/estadual/municipal — competência]
- Fase: [LP, LI, LO — qual licença se busca]
- Área: [proximidade de UC, APP, terra indígena, patrimônio]
- Estudos já realizados: [se houver]

INSTRUÇÕES:
1. Defina competência (LC 140/2011, art. 7º a 9º)
2. Verifique se atividade exige EIA/RIMA (art. 225, §1º, IV CF; Res. CONAMA 01/86)
3. Se não exige EIA: qual estudo simplificado (RAS, EAS, PCA)
4. Analise etapas do licenciamento trifásico (LP → LI → LO)
5. Verifique condicionantes especiais: UC (art. 36 Lei 9.985/00), APP (art. 8º Lei 12.651/12)
6. Audiência pública: quando obrigatória (Res. CONAMA 09/87)
7. Prazos e custos estimados

FORMATO: Parecer com ementa, consulta, análise de competência, exigibilidade de estudos, procedimento, cronograma, riscos, recomendações.

RESTRIÇÕES: NÃO ignore LC 140/2011 para competência. NÃO subestime prazos — licenciamento pode levar anos.`,
  },
  {
    id: 59,
    titulo: "Ação de Reparação de Dano Ambiental com Obrigação de Fazer",
    area: "Direito Ambiental",
    subarea: "Responsabilidade Ambiental",
    complexidade: "avancado",
    descricao: "Ação civil pública por dano ambiental com pedido de reparação in natura e indenização residual.",
    prompt: `Atue como advogado com experiência em responsabilidade ambiental.

TAREFA: Elabore ACP por dano ambiental com obrigação de reparar.

DADOS:
- Autor: [MP, associação, Defensoria — legitimado]
- Réu: [empresa/pessoa — poluidor]
- Dano: [desmatamento, contaminação, poluição hídrica — descrever extensão]
- Local: [coordenadas, bioma, área protegida]
- Provas: [laudo técnico, imagens satélite, auto de infração, perícia]
- Reparação pretendida: [restauração, compensação, indenização]

INSTRUÇÕES:
1. Responsabilidade objetiva (art. 14, §1º Lei 6.938/81; art. 225, §3º CF)
2. Teoria do risco integral — sem excludentes (REsp 1.374.284 STJ)
3. Priorize reparação in natura (restauração ecológica)
4. Subsidiariamente: compensação ecológica em área equivalente
5. Residualmente: indenização ao fundo (art. 13 Lei 7.347/85)
6. Requeira tutela de urgência para cessação imediata da atividade
7. Requeira perícia ambiental para quantificação

FORMATO: ACP com endereçamento, legitimidade, fatos, dano, nexo causal, direito, pedidos (tutela + mérito + indenização).

RESTRIÇÕES: NÃO aceite que caso fortuito exclui responsabilidade ambiental (risco integral). Imprescritibilidade do dano ambiental (Tema 999 STF).`,
  },
  {
    id: 60,
    titulo: "TAC — Termo de Ajustamento de Conduta Ambiental",
    area: "Direito Ambiental",
    subarea: "Instrumentos Negociais",
    complexidade: "intermediario",
    descricao: "Minuta de TAC ambiental com obrigações de fazer, cronograma, multa cominatória e monitoramento.",
    prompt: `Atue como advogado ambientalista com experiência em TACs.

TAREFA: Elabore minuta de Termo de Ajustamento de Conduta ambiental.

DADOS:
- Compromissário (infrator): [razão social, CNPJ, representante]
- Órgão/MP (compromitente): [quem propõe o TAC]
- Irregularidade: [descrever — desmatamento, poluição, falta de licença]
- Obrigações: [o que deve ser feito para reparar/regularizar]
- Prazo: [cronograma de cumprimento]
- Área afetada: [localização, extensão]

INSTRUÇÕES:
1. Fundamente no art. 5º, §6º Lei 7.347/85
2. Descreva obrigações de fazer com precisão (o quê, como, quando, onde)
3. Estabeleça cronograma com marcos verificáveis
4. Fixe multa cominatória por descumprimento (astreintes)
5. Preveja monitoramento periódico (relatórios, vistorias)
6. Inclua cláusula de eficácia de título executivo extrajudicial
7. Preveja hipótese de rescisão por descumprimento

FORMATO: TAC com preâmbulo, considerandos, cláusulas (obrigações, prazos, multas, monitoramento, disposições gerais), assinaturas.

RESTRIÇÕES: NÃO use obrigações genéricas ("reparar o dano") — especifique ações concretas. NÃO dispense multa cominatória.`,
  },
  // ═══════════════════════════════════════════════
  // DIREITO DIGITAL E LGPD (61-70)
  // ═══════════════════════════════════════════════
  {
    id: 61,
    titulo: "Relatório de Impacto à Proteção de Dados (RIPD/DPIA)",
    area: "Direito Digital e LGPD",
    subarea: "Compliance LGPD",
    complexidade: "avancado",
    descricao: "Elaboração de RIPD conforme art. 38 LGPD para tratamento de dados de alto risco.",
    prompt: `Atue como advogado especializado em proteção de dados e DPO.

TAREFA: Elabore Relatório de Impacto à Proteção de Dados Pessoais (RIPD).

DADOS:
- Controlador: [razão social, CNPJ, DPO]
- Tratamento: [descrição da atividade de tratamento de dados]
- Dados tratados: [categorias — pessoais, sensíveis, de menores]
- Titulares: [perfil e quantidade estimada]
- Base legal: [consentimento, legítimo interesse, contrato, etc.]
- Finalidade: [para que os dados são tratados]
- Compartilhamento: [com quem — operadores, terceiros, internacional]

INSTRUÇÕES:
1. Fundamente no art. 38 LGPD e Guia da ANPD sobre RIPD
2. Descreva o tratamento: natureza, escopo, contexto, finalidade
3. Avalie necessidade e proporcionalidade
4. Identifique riscos aos titulares (probabilidade × impacto)
5. Defina medidas de mitigação para cada risco
6. Documente base legal e legítimo interesse (se aplicável — LIA)
7. Inclua parecer do DPO

FORMATO: RIPD estruturado com: identificação, descrição do tratamento, análise de necessidade, avaliação de riscos (matriz), medidas de mitigação, conclusão do DPO.

RESTRIÇÕES: NÃO use template genérico — adapte ao tratamento específico. NÃO ignore dados sensíveis (art. 11 LGPD). Verifique se há transferência internacional (art. 33).`,
  },
  {
    id: 62,
    titulo: "Notificação de Incidente de Segurança à ANPD",
    area: "Direito Digital e LGPD",
    subarea: "Incidentes de Segurança",
    complexidade: "intermediario",
    descricao: "Comunicação de incidente de segurança à ANPD e aos titulares conforme art. 48 LGPD.",
    prompt: `Atue como advogado de proteção de dados com experiência em gestão de incidentes.

TAREFA: Elabore comunicação de incidente de segurança à ANPD e aos titulares.

DADOS:
- Controlador: [razão social, CNPJ, DPO, contato]
- Incidente: [tipo — vazamento, acesso não autorizado, ransomware, perda]
- Data/hora: [quando ocorreu e quando foi detectado]
- Dados afetados: [categorias, volume, sensibilidade]
- Titulares afetados: [quantidade estimada, perfil]
- Medidas tomadas: [contenção, investigação, correção]
- Risco: [avaliação de risco aos titulares]

INSTRUÇÕES:
1. Fundamente no art. 48 LGPD e Resolução CD/ANPD nº 15/2024
2. Prazo: 3 dias úteis para comunicar ANPD (Resolução 15/2024, art. 6º)
3. Conteúdo obrigatório (art. 48, §1º): natureza, dados, titulares, medidas, riscos
4. Comunicação aos titulares: linguagem clara e acessível
5. Avalie se incidente pode acarretar risco ou dano relevante
6. Documente registro interno (art. 48, §2º — registro de incidentes)
7. Recomende medidas aos titulares (troca de senha, monitoramento)

FORMATO: Dois documentos: (1) Comunicação à ANPD (formulário oficial) + (2) Comunicação aos titulares (e-mail/carta).

RESTRIÇÕES: NÃO minimize o incidente. NÃO comunique antes de conter — mas respeite prazo de 3 dias úteis. Verifique Resolução 15/2024 atualizada.`,
  },
  {
    id: 63,
    titulo: "Contrato de Processamento de Dados (DPA)",
    area: "Direito Digital e LGPD",
    subarea: "Contratos de Dados",
    complexidade: "intermediario",
    descricao: "Data Processing Agreement entre controlador e operador com cláusulas obrigatórias da LGPD.",
    prompt: `Atue como advogado de proteção de dados com experiência em contratos.

TAREFA: Elabore DPA (Data Processing Agreement) entre controlador e operador.

DADOS:
- Controlador: [razão social, CNPJ, DPO]
- Operador: [razão social, CNPJ, serviço prestado]
- Dados tratados: [categorias, tipos, volume]
- Finalidade: [para que o operador trata os dados]
- Duração: [prazo do contrato principal]
- Suboperadores: [se haverá — quais]
- Transferência internacional: [se dados saem do Brasil]

INSTRUÇÕES:
1. Fundamente nos arts. 37-40 LGPD e princípio da responsabilização (art. 6º, X)
2. Defina papéis: controlador × operador (art. 5º, VI e VII)
3. Limite tratamento às instruções do controlador (art. 39)
4. Cláusulas obrigatórias: finalidade, duração, dados, medidas de segurança
5. Direitos dos titulares: cooperação do operador para atender solicitações
6. Incidentes: notificação imediata ao controlador
7. Auditoria: direito do controlador de auditar
8. Término: devolução ou eliminação dos dados
9. Suboperadores: autorização prévia e responsabilidade

FORMATO: DPA com definições, objeto, obrigações do operador, segurança, suboperadores, incidentes, auditoria, término, responsabilidade.

RESTRIÇÕES: NÃO use DPA genérico europeu sem adaptar à LGPD. NÃO ignore transferência internacional (art. 33 LGPD).`,
  },
  {
    id: 64,
    titulo: "Ação de Remoção de Conteúdo na Internet (Marco Civil)",
    area: "Direito Digital e LGPD",
    subarea: "Responsabilidade de Plataformas",
    complexidade: "intermediario",
    descricao: "Ação judicial para remoção de conteúdo ilícito com base no Marco Civil da Internet.",
    prompt: `Atue como advogado com experiência em direito digital e responsabilidade de plataformas.

TAREFA: Elabore ação para remoção de conteúdo ilícito na internet.

DADOS:
- Autor: [nome, CPF — vítima]
- Réu: [plataforma — razão social, CNPJ]
- Conteúdo: [URL, descrição do conteúdo ofensivo]
- Ilicitude: [difamação, revenge porn, fake news, violação de PI, dados pessoais]
- Notificação prévia: [se houve — data, resposta da plataforma]
- Urgência: [risco de dano continuado]

INSTRUÇÕES:
1. Fundamente no art. 19 Marco Civil (remoção por ordem judicial — regra geral)
2. Se nudez/intimidade: art. 21 Marco Civil (notificação direta basta)
3. Requeira identificação do autor do conteúdo (art. 22 Marco Civil — quebra de sigilo)
4. Requeira tutela de urgência para remoção imediata (art. 300 CPC)
5. Fixe astreintes por dia/hora de descumprimento
6. Requeira indenização por dano moral contra autor do conteúdo e/ou plataforma
7. Indique URL específica (art. 19, §1º — identificação clara e específica)

FORMATO: Petição inicial com endereçamento, qualificação, fatos, URLs, direito, pedido liminar, pedidos de mérito.

RESTRIÇÕES: NÃO requeira remoção genérica ("todo conteúdo sobre mim") — deve ser específica. Verifique se é caso do art. 19 ou 21.`,
  },
  {
    id: 65,
    titulo: "Política de Privacidade para Aplicativo/SaaS",
    area: "Direito Digital e LGPD",
    subarea: "Compliance LGPD",
    complexidade: "basico",
    descricao: "Política de privacidade completa e acessível para aplicativo ou plataforma SaaS conforme LGPD.",
    prompt: `Atue como advogado de proteção de dados.

TAREFA: Elabore política de privacidade para aplicativo/plataforma SaaS.

DADOS:
- Empresa (controlador): [razão social, CNPJ, endereço]
- DPO: [nome, contato]
- Produto: [app/SaaS — descrição]
- Dados coletados: [categorias — cadastro, uso, localização, pagamento]
- Finalidades: [para que cada dado é usado]
- Bases legais: [consentimento, contrato, legítimo interesse — por finalidade]
- Compartilhamento: [parceiros, analytics, pagamento]
- Cookies: [tipos usados]
- Transferência internacional: [se dados vão para exterior — onde]

INSTRUÇÕES:
1. Atenda art. 9º LGPD (informações obrigatórias ao titular)
2. Linguagem clara e acessível (art. 9º, §1º — adequada ao público)
3. Organize por seções: dados coletados, finalidades, bases legais, compartilhamento, retenção, direitos, segurança
4. Direitos dos titulares (art. 18 LGPD): acesso, correção, eliminação, portabilidade, etc.
5. Cookies: categorias, finalidades, como gerenciar
6. Retenção: prazos por categoria de dado
7. Segurança: medidas técnicas e organizacionais (sem detalhar vulnerabilidades)
8. Canal de exercício de direitos (DPO)

FORMATO: Documento estruturado com seções, linguagem acessível, data de vigência.

RESTRIÇÕES: NÃO use linguagem jurídica inacessível. NÃO copie política genérica — adapte ao produto real. NÃO omita transferência internacional se houver.`,
  },
  {
    id: 66,
    titulo: "Parecer sobre Uso de IA Generativa em Escritório de Advocacia",
    area: "Direito Digital e LGPD",
    subarea: "IA e Ética Profissional",
    complexidade: "avancado",
    descricao: "Parecer sobre limites éticos e legais do uso de IA generativa na prática advocatícia.",
    prompt: `Atue como advogado especializado em ética profissional e tecnologia.

TAREFA: Elabore parecer sobre uso de IA generativa em escritório de advocacia.

DADOS:
- Escritório: [porte, áreas de atuação]
- Ferramentas de IA: [quais pretende usar — ChatGPT, Copilot, ferramentas jurídicas]
- Uso pretendido: [pesquisa, minutas, revisão, análise, atendimento]
- Dados de clientes: [se serão inseridos na IA]
- Preocupações: [sigilo, responsabilidade, qualidade, OAB]

INSTRUÇÕES:
1. Analise Recomendação do CFOAB sobre IA (2024)
2. Sigilo profissional: art. 7º, II EAOAB — dados de clientes em IA pública?
3. Responsabilidade: advogado responde pelo produto final (art. 32 EAOAB)
4. Dever de competência: art. 33 CED — conhecer limitações da ferramenta
5. Transparência: dever de informar cliente sobre uso de IA?
6. Alucinações: risco de citações falsas (casos internacionais)
7. LGPD: dados de clientes como dados pessoais — base legal para tratamento
8. Recomendações práticas: política interna, treinamento, revisão humana obrigatória

FORMATO: Parecer com ementa, consulta, análise (ética + LGPD + responsabilidade), recomendações práticas, modelo de política interna.

RESTRIÇÕES: NÃO ignore riscos reais (alucinação, vazamento). NÃO proíba uso — oriente uso responsável. Verifique posição atualizada da OAB.`,
  },
  // ═══════════════════════════════════════════════
  // PROMPTS ADICIONAIS — SEGUNDA LEVA (67-100)
  // Distribuídos entre as 10 áreas
  // ═══════════════════════════════════════════════
  {
    id: 67,
    titulo: "Ação de Danos Morais por Acidente de Trabalho",
    area: "Direito do Trabalho",
    subarea: "Acidente de Trabalho",
    complexidade: "avancado",
    descricao: "Ação indenizatória por acidente de trabalho com responsabilidade civil do empregador e pensão vitalícia.",
    prompt: `Atue como advogado trabalhista especializado em acidentes de trabalho.

TAREFA: Elabore ação de indenização por acidente de trabalho.

DADOS:
- Reclamante: [nome, CPF, cargo, data admissão]
- Reclamada: [razão social, CNPJ, atividade de risco]
- Acidente: [data, local, dinâmica, lesão sofrida]
- CAT: [se foi emitida — número]
- Incapacidade: [total/parcial, temporária/permanente — laudo]
- Culpa do empregador: [falta de EPI, treinamento, NR descumprida]
- Benefício INSS: [B91 — auxílio-doença acidentário]

INSTRUÇÕES:
1. Fundamente: art. 7º, XXVIII CF (responsabilidade subjetiva) ou atividade de risco (art. 927, p.ú. CC — objetiva)
2. Demonstre culpa: descumprimento de NRs, falta de EPI, ausência de treinamento
3. Cumule danos: morais + materiais + estéticos (Súmula 387 STJ)
4. Se incapacidade permanente: pensão mensal vitalícia (art. 950 CC)
5. Requeira constituição de capital (art. 533 CPC)
6. Estabilidade acidentária: art. 118 Lei 8.213/91 (12 meses)
7. Requeira tutela de urgência para tratamento

FORMATO: Reclamação trabalhista com endereçamento, qualificação, fatos, responsabilidade, danos, pedidos discriminados.

RESTRIÇÕES: NÃO confunda responsabilidade do empregador com benefício previdenciário (são cumuláveis). NÃO invente laudos.`,
  },
  {
    id: 68,
    titulo: "Ação de Adjudicação Compulsória de Imóvel",
    area: "Direito Civil",
    subarea: "Direitos Reais",
    complexidade: "intermediario",
    descricao: "Ação de adjudicação compulsória para obter registro de imóvel quando vendedor se recusa a outorgar escritura.",
    prompt: `Atue como advogado civilista com experiência em direito imobiliário.

TAREFA: Elabore ação de adjudicação compulsória.

DADOS:
- Autor (comprador): [nome, CPF]
- Réu (vendedor): [nome, CPF/CNPJ]
- Imóvel: [endereço, matrícula, área]
- Contrato: [compromisso de compra e venda — data, valor, quitação]
- Pagamento: [comprovação de quitação integral]
- Recusa: [vendedor não outorga escritura — motivo ou omissão]

INSTRUÇÕES:
1. Fundamente no art. 1.418 CC e Súmula 239 STJ (não exige registro do compromisso)
2. Demonstre: contrato irretratável + quitação integral + recusa/impossibilidade
3. Requeira sentença que supra a declaração de vontade (art. 501 CPC)
4. Requeira expedição de mandado ao CRI para registro
5. Se vendedor falecido: cite espólio/herdeiros
6. Se loteamento irregular: art. 25 Lei 6.766/79

FORMATO: Petição inicial com endereçamento, qualificação, fatos, direito, pedidos, valor da causa (valor do imóvel).

RESTRIÇÕES: NÃO ignore que quitação integral é requisito. Verifique se não há cláusula de arrependimento (art. 1.417 CC).`,
  },
  {
    id: 69,
    titulo: "Embargos Infringentes em Ação Penal (art. 609 CPP)",
    area: "Direito Penal",
    subarea: "Recursos",
    complexidade: "avancado",
    descricao: "Embargos infringentes contra acórdão não unânime desfavorável ao réu em segunda instância.",
    prompt: `Atue como advogado criminalista com experiência em recursos.

TAREFA: Elabore embargos infringentes (art. 609, p.ú. CPP).

DADOS:
- Embargante (réu): [nome, qualificação]
- Processo: [número CNJ, tribunal]
- Acórdão embargado: [resultado — condenação ou agravamento por maioria]
- Voto vencido: [desembargador, tese favorável ao réu]
- Divergência: [em que ponto houve voto minoritário]

INSTRUÇÕES:
1. Fundamente no art. 609, p.ú. CPP — cabimento: decisão não unânime desfavorável ao réu
2. Demonstre que voto vencido é mais favorável
3. Prazo: 10 dias do acórdão (art. 609, p.ú.)
4. Requeira prevalência do voto vencido
5. Delimite matéria: apenas o ponto da divergência
6. Se condenação por maioria: requeira absolvição conforme voto vencido
7. Se agravamento de pena: requeira manutenção da pena original

FORMATO: Embargos com endereçamento, qualificação, acórdão embargado, voto vencido, razões, pedido.

RESTRIÇÕES: NÃO use se decisão foi unânime. NÃO amplie matéria além da divergência. Só cabe em favor do réu (NUNCA pro societate).`,
  },
  {
    id: 70,
    titulo: "Exceção de Pré-Executividade em Execução Fiscal",
    area: "Direito Tributário",
    subarea: "Execução Fiscal",
    complexidade: "intermediario",
    descricao: "Exceção de pré-executividade para atacar CDA sem necessidade de garantia do juízo.",
    prompt: `Atue como advogado tributarista com experiência em execução fiscal.

TAREFA: Elabore exceção de pré-executividade em execução fiscal.

DADOS:
- Excipiente (executado): [razão social/nome, CNPJ/CPF]
- Exequente: [Fazenda — federal/estadual/municipal]
- CDA: [número, tributo, período, valor]
- Matéria: [prescrição, pagamento, ilegitimidade, nulidade da CDA, imunidade]
- Provas: [documentais — pré-constituídas, sem dilação probatória]
- Processo: [número, vara]

INSTRUÇÕES:
1. Fundamente na Súmula 393 STJ (admissibilidade sem garantia)
2. Matéria: apenas questões de ordem pública ou prova pré-constituída
3. Teses típicas: prescrição (art. 174 CTN), pagamento, ilegitimidade passiva, nulidade formal da CDA
4. Demonstre que não exige dilação probatória
5. Requeira extinção da execução ou exclusão do excipiente
6. Se prescrição: art. 174 CTN — 5 anos do lançamento definitivo
7. Se ilegitimidade: demonstre que não é responsável (art. 135 CTN)

FORMATO: Exceção com endereçamento, qualificação, processo, matéria, fundamentação, provas documentais, pedidos.

RESTRIÇÕES: NÃO use para matérias que exijam prova testemunhal ou pericial — será rejeitada. Verifique Súmula 393 STJ.`,
  },
  {
    id: 71,
    titulo: "Ação de Regulamentação de Visitas Avoenga",
    area: "Família e Sucessões",
    subarea: "Direito de Visita",
    complexidade: "intermediario",
    descricao: "Ação de regulamentação de visitas dos avós ao neto com fundamento no melhor interesse da criança.",
    prompt: `Atue como advogado familiarista.

TAREFA: Elabore ação de regulamentação de visitas dos avós.

DADOS:
- Autores (avós): [nomes, CPFs, parentesco — paterno/materno]
- Réu (genitor guardião): [nome, CPF]
- Neto(a): [nome, idade]
- Situação: [por que visitas estão impedidas — conflito familiar, alienação, óbito do genitor]
- Vínculo: [como era a relação antes do impedimento]
- Regime pretendido: [frequência, horários, pernoite]

INSTRUÇÕES:
1. Fundamente no art. 1.589, p.ú. CC (direito de visita dos avós — Lei 12.398/2011)
2. Princípio do melhor interesse da criança (art. 227 CF, art. 3º ECA)
3. Demonstre vínculo afetivo preexistente
4. Demonstre que visitas atendem ao interesse da criança
5. Proponha regime razoável (não conflitante com rotina)
6. Requeira estudo psicossocial se necessário
7. Requeira tutela de urgência se alienação parental (Lei 12.318/2010)

FORMATO: Petição inicial com endereçamento (Vara de Família), qualificação, fatos, direito, regime proposto, pedidos.

RESTRIÇÕES: NÃO ignore que direito é da criança (não dos avós). NÃO proponha regime que prejudique rotina escolar/social.`,
  },
  {
    id: 72,
    titulo: "Pedido de Falência por Impontualidade",
    area: "Direito Empresarial",
    subarea: "Falência",
    complexidade: "avancado",
    descricao: "Pedido de falência fundado em impontualidade injustificada de obrigação líquida materializada em título.",
    prompt: `Atue como advogado empresarial com experiência em insolvência.

TAREFA: Elabore pedido de falência por impontualidade (art. 94, I Lei 11.101/2005).

DADOS:
- Requerente (credor): [razão social, CNPJ]
- Requerida (devedora): [razão social, CNPJ, atividade]
- Título: [tipo — duplicata, cheque, nota promissória, sentença]
- Valor: [superior a 40 salários mínimos — verificar]
- Protesto: [se houve — certidão]
- Vencimento: [data — impontualidade]
- Tentativas de cobrança: [se houve]

INSTRUÇÕES:
1. Fundamente no art. 94, I Lei 11.101/2005 (impontualidade)
2. Requisitos: título executivo protestado + valor > 40 SM (art. 94, I)
3. Junte: título, certidão de protesto, demonstrativo de débito
4. Requeira citação para pagar, depositar ou apresentar defesa em 10 dias (art. 98)
5. Informe que devedor pode elidir com depósito (art. 98, p.ú.)
6. Requeira decretação da falência se não elidida

FORMATO: Petição inicial com endereçamento (Vara Empresarial), qualificação, fatos, título, direito, pedidos.

RESTRIÇÕES: NÃO peça falência sem protesto (requisito formal). NÃO use se valor < 40 SM. Verifique se devedora é empresária (art. 1º Lei 11.101).`,
  },
  {
    id: 73,
    titulo: "Ação de Benefício Assistencial (BPC/LOAS)",
    area: "Direito Previdenciário",
    subarea: "Assistência Social",
    complexidade: "intermediario",
    descricao: "Ação para concessão de BPC/LOAS com demonstração de deficiência ou idade + miserabilidade.",
    prompt: `Atue como advogado previdenciarista com experiência em BPC/LOAS.

TAREFA: Elabore ação de concessão de BPC — Benefício de Prestação Continuada.

DADOS:
- Autor: [nome, CPF, data nascimento]
- Condição: [idoso ≥ 65 anos OU pessoa com deficiência]
- Deficiência: [se aplicável — tipo, CID, laudos]
- Renda familiar per capita: [valor — deve ser ≤ 1/4 SM ou demonstrar miserabilidade]
- Composição familiar: [membros, rendas individuais]
- Indeferimento INSS: [NB, motivo — renda ou incapacidade]
- Provas: [CadÚnico, laudos, declarações, contas]

INSTRUÇÕES:
1. Fundamente no art. 203, V CF e art. 20 Lei 8.742/93 (LOAS)
2. Critério de renda: 1/4 SM per capita é objetivo, mas STF admite flexibilização (RE 567.985)
3. Se deficiência: demonstre impedimento de longo prazo (≥ 2 anos — art. 20, §2º)
4. Exclua do cálculo: BPC de outro membro (art. 20, §14) e bolsa família
5. Requeira perícia médica e social
6. Requeira tutela de urgência se situação de vulnerabilidade extrema
7. DIB: DER ou citação (Tema 1.209 STJ)

FORMATO: Petição inicial com endereçamento (JEF), qualificação, composição familiar, renda, direito, pedidos.

RESTRIÇÕES: NÃO limite prova de miserabilidade ao critério objetivo de 1/4 SM — STF flexibilizou. NÃO ignore CadÚnico como prova.`,
  },
  {
    id: 74,
    titulo: "Ação de Indenização por Atraso de Voo (Passageiro)",
    area: "Direito do Consumidor",
    subarea: "Transporte Aéreo",
    complexidade: "basico",
    descricao: "Ação indenizatória por atraso/cancelamento de voo com dano moral e material conforme Resolução ANAC.",
    prompt: `Atue como advogado consumerista.

TAREFA: Elabore ação de indenização por atraso/cancelamento de voo.

DADOS:
- Autor (passageiro): [nome, CPF]
- Ré (companhia aérea): [razão social, CNPJ]
- Voo: [número, trecho, data]
- Problema: [atraso de X horas / cancelamento / overbooking]
- Assistência: [se foi prestada — alimentação, hospedagem, reacomodação]
- Danos materiais: [perda de conexão, hotel, compromisso perdido — valores]
- Provas: [cartão de embarque, e-mails, comprovantes de gastos]

INSTRUÇÕES:
1. Fundamente no CDC (arts. 14, 20) e Resolução ANAC 400/2016
2. Atraso > 4h ou cancelamento: direito a reembolso integral ou reacomodação
3. Dano moral: jurisprudência consolida para atrasos > 4h (valor médio R$ 3.000-10.000)
4. Danos materiais: comprovar com recibos (hotel, alimentação, transporte, compromisso)
5. Se internacional: Convenção de Montreal × CDC (STF RE 636.331 — prevalece Montreal para dano material)
6. Requeira inversão do ônus da prova (art. 6º, VIII CDC)

FORMATO: Petição inicial (JEC se até 40 SM) com endereçamento, qualificação, fatos, direito, pedidos discriminados, valor da causa.

RESTRIÇÕES: NÃO ignore Convenção de Montreal para voos internacionais (limita dano material). Verifique se atraso foi > 4h para dano moral.`,
  },
  {
    id: 75,
    titulo: "Ação Popular Ambiental contra Licenciamento Irregular",
    area: "Direito Ambiental",
    subarea: "Tutela Coletiva",
    complexidade: "avancado",
    descricao: "Ação popular para anular licença ambiental concedida sem EIA/RIMA ou com vício no procedimento.",
    prompt: `Atue como advogado com experiência em tutela coletiva ambiental.

TAREFA: Elabore ação popular para anular licença ambiental irregular.

DADOS:
- Autor popular: [cidadão — nome, CPF, título de eleitor]
- Réus: [órgão licenciador + empreendedor beneficiado]
- Licença impugnada: [tipo — LP/LI/LO, número, data]
- Vício: [ausência de EIA/RIMA, audiência pública não realizada, competência errada, condicionantes descumpridas]
- Empreendimento: [descrição, impacto ambiental]
- Provas: [documentos do processo de licenciamento]

INSTRUÇÕES:
1. Fundamente no art. 5º, LXXIII CF e Lei 4.717/65
2. Demonstre lesividade ao patrimônio ambiental (bem difuso)
3. Identifique o vício: formal (procedimento) ou material (mérito técnico)
4. Requeira anulação da licença e suspensão do empreendimento
5. Requeira tutela de urgência para paralisação (risco de dano irreversível)
6. Isenção de custas para o autor popular (art. 5º, LXXIII CF)
7. Requeira perícia ambiental

FORMATO: Ação popular com endereçamento, legitimidade, fatos, ilegalidade/lesividade, pedido liminar, pedidos de mérito.

RESTRIÇÕES: NÃO confunda ação popular com ACP (legitimidade diferente). Autor deve ser cidadão (título de eleitor). NÃO questione mérito técnico sem fundamento.`,
  },
  {
    id: 76,
    titulo: "Termos de Uso para Plataforma Digital (Marketplace)",
    area: "Direito Digital e LGPD",
    subarea: "Contratos Digitais",
    complexidade: "intermediario",
    descricao: "Termos de uso completos para marketplace digital com responsabilidades, moderação e resolução de disputas.",
    prompt: `Atue como advogado com experiência em direito digital e plataformas.

TAREFA: Elabore termos de uso para plataforma digital (marketplace).

DADOS:
- Plataforma: [nome, tipo — marketplace de produtos/serviços/conteúdo]
- Operador: [razão social, CNPJ]
- Usuários: [compradores e vendedores / prestadores e tomadores]
- Funcionalidades: [o que a plataforma oferece]
- Pagamento: [se intermedia — split, escrow]
- Conteúdo: [se usuários publicam — UGC]
- Moderação: [política de remoção]

INSTRUÇÕES:
1. Defina natureza jurídica: intermediário × fornecedor (art. 19 Marco Civil)
2. Cadastro: requisitos, veracidade, responsabilidade por credenciais
3. Regras de uso: condutas permitidas e proibidas
4. Propriedade intelectual: licença sobre conteúdo publicado
5. Responsabilidades: limitação conforme Marco Civil (art. 19-21)
6. Pagamentos: se intermedia — regras de repasse, estorno, chargeback
7. Resolução de disputas: mediação → arbitragem/judicial, foro
8. Modificações: como e quando termos podem mudar
9. Rescisão: motivos para suspensão/banimento

FORMATO: Termos de uso com seções numeradas, linguagem acessível mas juridicamente precisa, data de vigência.

RESTRIÇÕES: NÃO exclua responsabilidade de forma abusiva (art. 51 CDC se B2C). NÃO ignore Marco Civil para conteúdo de terceiros.`,
  },
  {
    id: 77,
    titulo: "Ação Rescisória Trabalhista por Violação de Norma",
    area: "Direito do Trabalho",
    subarea: "Ação Rescisória",
    complexidade: "avancado",
    descricao: "Ação rescisória contra sentença transitada em julgado que violou manifestamente norma jurídica.",
    prompt: `Atue como advogado trabalhista com experiência em ações rescisórias.

TAREFA: Elabore ação rescisória trabalhista (art. 966 CPC c/c art. 836 CLT).

DADOS:
- Autor: [nome/razão social — parte prejudicada]
- Réu: [parte beneficiada pela sentença]
- Sentença rescindenda: [número, vara, data trânsito, dispositivo]
- Hipótese: [art. 966, V CPC — violação manifesta de norma jurídica]
- Norma violada: [artigo, súmula, OJ — especificar]
- Prazo: [2 anos do trânsito — art. 975 CPC]
- Depósito: [20% do valor da causa — art. 836 CLT]

INSTRUÇÕES:
1. Fundamente no art. 966, V CPC c/c art. 836 CLT
2. Demonstre violação MANIFESTA (não mera interpretação divergente)
3. Verifique prazo decadencial de 2 anos (art. 975 CPC)
4. Deposite 20% do valor da causa (art. 836 CLT — requisito de admissibilidade)
5. Formule juízo rescindendo (anulação) e rescisório (novo julgamento)
6. Requeira tutela de urgência para suspender execução se necessário

FORMATO: Ação rescisória com endereçamento (TRT), qualificação, sentença rescindenda, hipótese legal, juízo rescindendo e rescisório, pedidos.

RESTRIÇÕES: NÃO use rescisória como terceira instância. NÃO ignore depósito de 20% (será extinta sem resolução). Verifique Súmula 514 STF.`,
  },
  {
    id: 78,
    titulo: "Ação de Exigir Contas de Administrador de Sociedade",
    area: "Direito Empresarial",
    subarea: "Societário",
    complexidade: "intermediario",
    descricao: "Ação de exigir contas contra sócio-administrador com pedido de prestação detalhada e apuração de haveres.",
    prompt: `Atue como advogado empresarial com experiência em conflitos societários.

TAREFA: Elabore ação de exigir contas contra administrador de sociedade.

DADOS:
- Autor (sócio): [nome, CPF, participação %]
- Réu (administrador): [nome, CPF, cargo]
- Sociedade: [razão social, CNPJ, tipo]
- Período: [de quando a quando exige contas]
- Motivo: [não prestou contas, recusa, suspeita de desvio]
- Informações disponíveis: [o que o autor já sabe — ou não sabe]

INSTRUÇÕES:
1. Fundamente no art. 550 CPC (ação de exigir contas) e art. 1.020 CC
2. Demonstre legitimidade: sócio tem direito a informações (art. 1.021 CC)
3. Demonstre que réu tem obrigação de prestar contas (administrador)
4. Requeira que réu preste contas em 15 dias (art. 550, §5º CPC)
5. Se não prestar: contas do autor serão julgadas (art. 550, §6º CPC)
6. Requeira acesso a documentos contábeis, extratos, contratos
7. Se desvio: cumule pedido de indenização

FORMATO: Petição inicial com endereçamento, qualificação, fatos, obrigação de prestar contas, pedidos.

RESTRIÇÕES: NÃO confunda com ação de dissolução. NÃO requeira contas de quem não administra.`,
  },
  {
    id: 79,
    titulo: "Revisão de Benefício por Incapacidade (Auxílio → Aposentadoria)",
    area: "Direito Previdenciário",
    subarea: "Benefícios por Incapacidade",
    complexidade: "intermediario",
    descricao: "Ação para conversão de auxílio por incapacidade temporária em aposentadoria por incapacidade permanente.",
    prompt: `Atue como advogado previdenciarista.

TAREFA: Elabore ação para conversão de auxílio-doença em aposentadoria por invalidez.

DADOS:
- Autor: [nome, CPF, NIT, idade, profissão]
- Benefício atual: [NB, espécie 31, DIB, valor]
- Doença: [CID, diagnóstico, evolução]
- Perícias INSS: [resultados — sempre conclui capacidade]
- Laudos particulares: [conclusão de incapacidade permanente]
- Reabilitação: [se foi tentada — resultado]
- Atividade: [por que não pode exercer nenhuma atividade]

INSTRUÇÕES:
1. Fundamente no art. 42 Lei 8.213/91 (aposentadoria por incapacidade permanente)
2. Demonstre que incapacidade é total e permanente (não apenas para atividade habitual)
3. Ou: demonstre que é parcial mas permanente + impossibilidade de reabilitação (art. 42, §2º)
4. Conteste perícias do INSS com laudos detalhados
5. Requeira perícia judicial com especialista na patologia
6. Considere adicional de 25% se necessita de acompanhante (art. 45 Lei 8.213/91)
7. Requeira tutela de urgência para implantação

FORMATO: Petição inicial com endereçamento, qualificação, histórico médico, direito, pedidos.

RESTRIÇÕES: NÃO ignore que INSS pode alegar preexistência. NÃO confunda incapacidade laboral com doença (pode ter doença e ser capaz).`,
  },
  {
    id: 80,
    titulo: "Ação de Obrigação de Fazer por Vício Construtivo",
    area: "Direito do Consumidor",
    subarea: "Imóveis e Construção",
    complexidade: "intermediario",
    descricao: "Ação contra construtora/incorporadora por vícios construtivos em imóvel novo com pedido de reparação.",
    prompt: `Atue como advogado consumerista com experiência em direito imobiliário.

TAREFA: Elabore ação contra construtora por vícios construtivos.

DADOS:
- Autor (adquirente): [nome, CPF]
- Ré (construtora/incorporadora): [razão social, CNPJ]
- Imóvel: [endereço, unidade, data entrega]
- Vícios: [infiltração, rachaduras, elétrica, hidráulica — descrever]
- Reclamações: [datas, protocolos, respostas da construtora]
- Laudo: [se há laudo técnico particular]
- Prazo de garantia: [5 anos — art. 618 CC]

INSTRUÇÕES:
1. Fundamente no art. 618 CC (garantia de solidez — 5 anos) e CDC (arts. 12, 18, 26)
2. Prazo: vício aparente (90 dias — art. 26, II CDC) ou oculto (a partir da descoberta)
3. Requeira obrigação de fazer: reparação dos vícios com prazo
4. Subsidiariamente: abatimento proporcional ou rescisão (art. 18, §1º CDC)
5. Requeira dano moral se privação do uso ou risco à segurança
6. Fixe astreintes para descumprimento
7. Requeira perícia de engenharia

FORMATO: Petição inicial com endereçamento, qualificação, fatos, vícios discriminados, direito, pedidos.

RESTRIÇÕES: NÃO confunda vício aparente (prazo do art. 26 CDC) com oculto (prazo da descoberta). Verifique se está dentro dos 5 anos do art. 618 CC.`,
  },
  {
    id: 81,
    titulo: "Embargo de Declaração com Efeitos Infringentes",
    area: "Direito Civil",
    subarea: "Recursos",
    complexidade: "intermediario",
    descricao: "Embargos de declaração com prequestionamento e efeitos infringentes para correção de error in judicando.",
    prompt: `Atue como advogado civilista com experiência em recursos.

TAREFA: Elabore embargos de declaração com efeitos infringentes.

DADOS:
- Embargante: [nome/razão social]
- Decisão embargada: [sentença/acórdão — número, data]
- Vício: [omissão, contradição, obscuridade, erro material]
- Matéria omitida: [ponto que não foi enfrentado]
- Efeito pretendido: [modificação do resultado — infringência]
- Prequestionamento: [se para viabilizar REsp/RE — artigos]

INSTRUÇÕES:
1. Fundamente no art. 1.022 CPC (hipóteses de cabimento)
2. Demonstre vício específico: omissão (ponto não enfrentado), contradição (premissa × conclusão)
3. Para efeitos infringentes: demonstre que sanado o vício, resultado muda necessariamente
4. Prequestionamento: art. 1.025 CPC — consideram-se incluídos os elementos suscitados
5. Requeira manifestação sobre dispositivos legais específicos
6. Observe prazo: 5 dias (art. 1.023 CPC)

FORMATO: Embargos com endereçamento, qualificação, decisão embargada, vício, fundamentação, pedido de integração/modificação.

RESTRIÇÕES: NÃO use embargos como recurso de mérito disfarçado. Efeitos infringentes são excepcionais — fundamente bem o vício. Verifique multa por embargos protelatórios (art. 1.026, §2º CPC).`,
  },
  {
    id: 82,
    titulo: "Ação de Indenização por Erro Judiciário",
    area: "Direito Penal",
    subarea: "Responsabilidade Civil do Estado",
    complexidade: "avancado",
    descricao: "Ação indenizatória contra o Estado por erro judiciário — prisão indevida ou condenação injusta.",
    prompt: `Atue como advogado com experiência em responsabilidade civil do Estado.

TAREFA: Elabore ação de indenização por erro judiciário.

DADOS:
- Autor: [nome, CPF — vítima do erro]
- Réu: [Estado/União — ente responsável pelo Judiciário]
- Erro: [prisão indevida, condenação revertida, excesso de prazo grave]
- Período: [tempo preso indevidamente ou condenado]
- Decisão que reconheceu o erro: [absolvição, revisão criminal, HC]
- Danos: [morais, materiais, lucros cessantes, danos à imagem]

INSTRUÇÕES:
1. Fundamente no art. 5º, LXXV CF (indenização por erro judiciário)
2. Responsabilidade objetiva do Estado (art. 37, §6º CF)
3. Demonstre o erro e o dano (nexo causal)
4. Quantifique: tempo preso × salário × dano moral × dano existencial
5. Requeira pensão se houve perda de capacidade laborativa
6. Requeira dano moral presumido (in re ipsa) pela privação de liberdade
7. Prescrição: 5 anos (Decreto 20.910/32) a partir da decisão absolutória

FORMATO: Petição inicial com endereçamento (Vara da Fazenda), qualificação, fatos, erro, danos, direito, pedidos.

RESTRIÇÕES: NÃO confunda erro judiciário com decisão desfavorável. Deve haver reconhecimento formal do erro (absolvição, revisão). Verifique prescrição.`,
  },
  {
    id: 83,
    titulo: "Mandado de Segurança contra Exigência de CND para Participar de Licitação",
    area: "Direito Tributário",
    subarea: "Tributário e Administrativo",
    complexidade: "intermediario",
    descricao: "MS contra exigência de certidão negativa quando há parcelamento ativo ou suspensão da exigibilidade.",
    prompt: `Atue como advogado tributarista/administrativista.

TAREFA: Elabore MS contra exigência de CND em licitação.

DADOS:
- Impetrante: [razão social, CNPJ]
- Autoridade coatora: [pregoeiro/comissão de licitação — órgão]
- Licitação: [número, objeto, fase]
- Situação fiscal: [parcelamento ativo / decisão judicial suspensiva / depósito]
- Certidão: [CPEN — certidão positiva com efeitos de negativa]
- Ato coator: [inabilitação por falta de CND]

INSTRUÇÕES:
1. Fundamente no art. 206 CTN (CPEN tem mesmos efeitos de CND)
2. Se parcelamento: art. 151, VI CTN — suspende exigibilidade → direito à CPEN
3. Se decisão judicial: art. 151, IV ou V CTN
4. Art. 193 CTN: certidão é direito do contribuinte
5. Licitação: art. 68 Lei 14.133/2021 (regularidade fiscal)
6. Requeira liminar para participar da licitação
7. Demonstre periculum in mora (perda do certame)

FORMATO: MS com endereçamento, qualificação, autoridade coatora, direito líquido e certo, pedido liminar e de mérito.

RESTRIÇÕES: NÃO use se há débito sem suspensão — CPEN exige causa suspensiva. Verifique se parcelamento está regular (inadimplência cancela).`,
  },
  {
    id: 84,
    titulo: "Ação de Guarda Compartilhada com Alternância de Residência",
    area: "Família e Sucessões",
    subarea: "Guarda",
    complexidade: "intermediario",
    descricao: "Ação de modificação de guarda para compartilhada com alternância equilibrada de residência.",
    prompt: `Atue como advogado familiarista.

TAREFA: Elabore ação de modificação de guarda para compartilhada com alternância.

DADOS:
- Autor (genitor): [nome, CPF, profissão]
- Réu (genitor guardião): [nome, CPF]
- Filho(a): [nome, idade]
- Guarda atual: [unilateral com quem]
- Motivo da modificação: [melhor interesse, disponibilidade, proximidade]
- Proposta de alternância: [semana/semana, 5-2-2-5, etc.]
- Condições: [residências, escola, distância, rotina]

INSTRUÇÕES:
1. Fundamente no art. 1.583-1.584 CC (guarda compartilhada como regra — §2º)
2. Princípio do melhor interesse da criança (art. 227 CF)
3. Demonstre que alternância é viável (proximidade, rotina, escola)
4. Diferencie guarda compartilhada de alternada (STJ — REsp 1.251.000)
5. Proponha cronograma detalhado (dias, feriados, férias)
6. Requeira estudo psicossocial
7. Se alienação: fundamente na Lei 12.318/2010

FORMATO: Petição inicial com endereçamento, qualificação, fatos, proposta de regime, direito, pedidos.

RESTRIÇÕES: NÃO confunda compartilhada (decisões conjuntas) com alternada (residência alternada). STJ admite alternância se no melhor interesse. Verifique idade da criança.`,
  },
  {
    id: 85,
    titulo: "Cláusula de Arbitragem em Contrato Empresarial",
    area: "Direito Empresarial",
    subarea: "Arbitragem",
    complexidade: "intermediario",
    descricao: "Redação de cláusula compromissória completa para contrato empresarial com regras procedimentais.",
    prompt: `Atue como advogado empresarial com experiência em arbitragem.

TAREFA: Elabore cláusula compromissória para contrato empresarial.

DADOS:
- Partes: [nomes/razões sociais]
- Contrato: [tipo — fornecimento, licença, JV, M&A]
- Valor envolvido: [para definir complexidade do procedimento]
- Câmara preferida: [CAM-CCBC, CIESP/FIESP, CCI, ad hoc]
- Sede: [cidade]
- Idioma: [português, inglês, bilíngue]
- Número de árbitros: [1 ou 3]
- Confidencialidade: [sim/não]

INSTRUÇÕES:
1. Fundamente na Lei 9.307/96 (Lei de Arbitragem)
2. Elementos essenciais: câmara ou ad hoc, sede, idioma, número de árbitros, regras aplicáveis
3. Cláusula escalonada: mediação prévia obrigatória (30-60 dias) → arbitragem
4. Medidas urgentes: autorização para tutela judicial de urgência (art. 22-A)
5. Lei aplicável: direito material brasileiro (ou outro)
6. Confidencialidade: se desejada
7. Custos: rateio ou sucumbência
8. Cláusula patológica: evitar ambiguidades que invalidem

FORMATO: Cláusula compromissória completa + cláusula de mediação prévia + observações sobre implementação.

RESTRIÇÕES: NÃO use cláusula genérica ("as partes resolverão por arbitragem") — é patológica. Especifique TODOS os elementos. Verifique se partes são capazes e direito é disponível.`,
  },
  {
    id: 86,
    titulo: "Ação Regressiva do INSS contra Empregador (Acidente)",
    area: "Direito Previdenciário",
    subarea: "Ação Regressiva",
    complexidade: "avancado",
    descricao: "Defesa do empregador em ação regressiva do INSS por acidente de trabalho (art. 120 Lei 8.213/91).",
    prompt: `Atue como advogado com experiência em defesa empresarial previdenciária.

TAREFA: Elabore contestação em ação regressiva do INSS.

DADOS:
- Réu (empregador): [razão social, CNPJ, atividade]
- Autor (INSS): [AGU/PFE-INSS]
- Acidente: [data, dinâmica, empregado acidentado]
- Benefício pago: [espécie, valor mensal, tempo]
- Valor cobrado: [total da ação regressiva]
- Alegação do INSS: [negligência em normas de segurança]
- Defesa: [cumprimento de NRs, culpa exclusiva do empregado, caso fortuito]

INSTRUÇÕES:
1. Fundamente defesa contra art. 120 Lei 8.213/91
2. Demonstre cumprimento das NRs aplicáveis (PPRA/PGR, PCMSO, treinamentos, EPIs)
3. Tese: culpa exclusiva do empregado (ato inseguro) ou caso fortuito
4. Subsidiária: culpa concorrente (redução proporcional)
5. Questione nexo causal entre negligência alegada e acidente
6. Impugne cálculos do INSS (valor constituído × valor real pago)
7. Prescrição: 5 anos (art. 1º Decreto 20.910/32)

FORMATO: Contestação com preliminares, mérito (cumprimento de NRs, excludentes), impugnação de valores, pedidos.

RESTRIÇÕES: NÃO negue acidente documentado — conteste culpa do empregador. NÃO ignore que responsabilidade aqui é SUBJETIVA (precisa de culpa).`,
  },
  {
    id: 87,
    titulo: "Denúncia ao Ministério Público por Crime Ambiental",
    area: "Direito Ambiental",
    subarea: "Crimes Ambientais",
    complexidade: "intermediario",
    descricao: "Representação criminal ao MP por crime ambiental com elementos de autoria, materialidade e provas.",
    prompt: `Atue como advogado ambientalista.

TAREFA: Elabore representação criminal ao MP por crime ambiental.

DADOS:
- Representante: [nome, CPF — cidadão, ONG, órgão ambiental]
- Investigado: [pessoa física/jurídica — quem praticou]
- Crime: [desmatamento, poluição, maus-tratos, caça — art. da Lei 9.605/98]
- Local: [endereço, coordenadas, bioma]
- Data/período: [quando ocorreu]
- Provas: [fotos, vídeos, laudos, auto de infração, imagens satélite]
- Dano: [extensão do dano ambiental]

INSTRUÇÕES:
1. Identifique tipo penal na Lei 9.605/98 (arts. 29-69-A)
2. Demonstre materialidade (provas do dano) e indícios de autoria
3. Se pessoa jurídica: art. 3º Lei 9.605/98 (responsabilidade penal da PJ)
4. Requeira instauração de inquérito policial ou procedimento investigatório
5. Requeira medidas cautelares: busca e apreensão, embargo
6. Informe se há processo administrativo paralelo (IBAMA, órgão estadual)
7. Requeira perícia ambiental

FORMATO: Representação com qualificação, fatos, tipificação, provas, pedidos ao MP.

RESTRIÇÕES: NÃO confunda representação com denúncia (denúncia é privativa do MP). NÃO ignore responsabilidade da PJ (art. 3º). Verifique se crime é de ação penal pública incondicionada.`,
  },
  {
    id: 88,
    titulo: "Contestação em Ação de Direito ao Esquecimento Digital",
    area: "Direito Digital e LGPD",
    subarea: "Direito ao Esquecimento",
    complexidade: "avancado",
    descricao: "Defesa de veículo de imprensa ou plataforma em ação de desindexação/remoção por direito ao esquecimento.",
    prompt: `Atue como advogado com experiência em direito digital e liberdade de expressão.

TAREFA: Elabore contestação em ação de direito ao esquecimento/desindexação.

DADOS:
- Réu: [veículo de imprensa, plataforma, buscador]
- Autor: [pessoa que quer remoção/desindexação]
- Conteúdo: [matéria jornalística, resultado de busca, publicação]
- Motivo do autor: [fato antigo, reabilitação, dano à honra]
- Interesse público: [por que o conteúdo é relevante]
- Veracidade: [conteúdo é verdadeiro?]

INSTRUÇÕES:
1. Fundamente no Tema 786 STF (RE 1.010.606): "direito ao esquecimento" incompatível com CF
2. Liberdade de expressão e imprensa: arts. 5º, IX e XIV, e 220 CF
3. Distinga: remoção de conteúdo × desindexação × retificação
4. Demonstre interesse público na manutenção (história, segurança, accountability)
5. Se verdadeiro: exceptio veritatis — verdade não é ilícita
6. Proporcionalidade: medidas menos restritivas (atualização, contextualização)
7. Se buscador: art. 19 Marco Civil — não é responsável pelo conteúdo

FORMATO: Contestação com preliminares (ilegitimidade se buscador), mérito (liberdade × privacidade), pedidos.

RESTRIÇÕES: NÃO ignore Tema 786 STF — mudou o cenário. NÃO trate como absoluto — ponderar caso a caso. Verifique se há dados pessoais sensíveis (LGPD pode se aplicar separadamente).`,
  },
  {
    id: 89,
    titulo: "Ação Monitória com Base em Contrato Particular",
    area: "Direito Civil",
    subarea: "Processo de Conhecimento",
    complexidade: "basico",
    descricao: "Ação monitória para constituição de título executivo com base em prova escrita sem eficácia de título.",
    prompt: `Atue como advogado civilista.

TAREFA: Elabore ação monitória com base em documento particular.

DADOS:
- Autor (credor): [nome/razão social, CPF/CNPJ]
- Réu (devedor): [nome/razão social, CPF/CNPJ]
- Documento: [contrato particular, e-mail, WhatsApp, recibo, orçamento aprovado]
- Obrigação: [pagar quantia / entregar coisa / fazer]
- Valor: R$ [montante]
- Vencimento: [data]
- Tentativas de cobrança: [se houve]

INSTRUÇÕES:
1. Fundamente no art. 700 CPC (ação monitória)
2. Demonstre prova escrita sem eficácia de título executivo (art. 700, I a III)
3. Requeira expedição de mandado de pagamento em 15 dias (art. 701)
4. Informe consequência: se não pagar nem embargar, constitui-se título executivo (art. 701, §2º)
5. Se embargado: converte-se em procedimento comum (art. 702, §4º)
6. Requeira AJG se necessário

FORMATO: Petição inicial com endereçamento, qualificação, fatos, prova escrita, direito, pedidos, valor da causa.

RESTRIÇÕES: NÃO use monitória se já tem título executivo (use execução). NÃO use se não há prova escrita (use ação de cobrança comum). Verifique prescrição.`,
  },
  {
    id: 90,
    titulo: "Impugnação ao Cumprimento de Sentença por Excesso",
    area: "Direito Civil",
    subarea: "Cumprimento de Sentença",
    complexidade: "intermediario",
    descricao: "Impugnação ao cumprimento de sentença demonstrando excesso de execução com memória de cálculo alternativa.",
    prompt: `Atue como advogado civilista com experiência em fase de cumprimento.

TAREFA: Elabore impugnação ao cumprimento de sentença por excesso de execução.

DADOS:
- Impugnante (executado): [nome/razão social]
- Impugnado (exequente): [nome/razão social]
- Processo: [número CNJ]
- Valor cobrado: R$ [valor do exequente]
- Valor correto: R$ [valor que o executado entende devido]
- Divergências: [índice de correção, juros, honorários, período, base de cálculo]
- Garantia: [penhora, depósito — art. 525, §1º CPC]

INSTRUÇÕES:
1. Fundamente no art. 525, §1º, V CPC (excesso de execução)
2. Apresente memória de cálculo alternativa (art. 525, §4º e §5º CPC — OBRIGATÓRIO)
3. Para cada divergência: demonstre cálculo correto com base legal
4. Índices: IPCA-E, SELIC, INPC — qual foi determinado na sentença?
5. Juros: termo inicial, taxa, capitalização
6. Honorários: base de cálculo correta (valor da condenação × valor da causa)
7. Requeira acolhimento parcial se reconhece parte do débito

FORMATO: Impugnação com qualificação, divergências numeradas, memória de cálculo alternativa, pedidos.

RESTRIÇÕES: NÃO impugne sem apresentar valor que entende correto (art. 525, §4º — será rejeitada). NÃO questione mérito da sentença (coisa julgada).`,
  },
  {
    id: 91,
    titulo: "Pedido de Restituição de Contribuições Previdenciárias Acima do Teto",
    area: "Direito Previdenciário",
    subarea: "Restituição",
    complexidade: "intermediario",
    descricao: "Pedido administrativo ou judicial de restituição de contribuições previdenciárias recolhidas acima do teto do RGPS.",
    prompt: `Atue como advogado previdenciarista/tributarista.

TAREFA: Elabore pedido de restituição de contribuições acima do teto.

DADOS:
- Contribuinte: [nome, CPF, NIT]
- Período: [meses com recolhimento acima do teto]
- Vínculos simultâneos: [se tem mais de um emprego]
- Teto vigente: [valor do teto INSS no período]
- Total recolhido: [soma das contribuições]
- Total devido: [contribuição limitada ao teto]
- Diferença: R$ [valor a restituir]

INSTRUÇÕES:
1. Fundamente no art. 28, §5º Lei 8.212/91 (limite do salário-de-contribuição)
2. Se vínculos simultâneos: contribuição total não pode exceder teto (IN RFB 2.110/2022)
3. Via administrativa: PER/DCOMP (IN RFB 2.055/2021)
4. Via judicial: repetição de indébito (art. 165, I CTN)
5. Atualização pela SELIC (art. 39, §4º Lei 9.250/95)
6. Prescrição: 5 anos (art. 168 CTN)
7. Comprove com contracheques e CNIS

FORMATO: Pedido administrativo (PER/DCOMP) ou petição judicial com memória de cálculo mês a mês.

RESTRIÇÕES: NÃO ignore que a restituição é da contribuição do SEGURADO (não do empregador). Verifique se não há compensação automática já realizada.`,
  },
  {
    id: 92,
    titulo: "Ação de Nulidade de Cláusula Abusiva em Contrato de Adesão",
    area: "Direito do Consumidor",
    subarea: "Contratos de Adesão",
    complexidade: "intermediario",
    descricao: "Ação declaratória de nulidade de cláusula abusiva em contrato de adesão com pedido de revisão.",
    prompt: `Atue como advogado consumerista.

TAREFA: Elabore ação declaratória de nulidade de cláusula abusiva.

DADOS:
- Autor (consumidor): [nome, CPF]
- Réu (fornecedor): [razão social, CNPJ]
- Contrato: [tipo — adesão, data, objeto]
- Cláusula impugnada: [transcrever — número e conteúdo]
- Abusividade: [por que é abusiva — art. 51 CDC]
- Prejuízo: [como a cláusula prejudica o consumidor]
- Pretensão: [nulidade + revisão + indenização]

INSTRUÇÕES:
1. Fundamente no art. 51 CDC (rol exemplificativo de cláusulas abusivas)
2. Identifique qual inciso do art. 51 se aplica (I a XVI)
3. Nulidade de pleno direito (art. 51, caput — não depende de alegação)
4. Princípio da conservação: nulidade da cláusula, não do contrato (art. 51, §2º)
5. Requeira substituição por norma supletiva ou revisão equitativa
6. Se houve prejuízo: cumule repetição de indébito e/ou dano moral
7. Requeira inversão do ônus da prova

FORMATO: Petição inicial com endereçamento, qualificação, contrato, cláusula, abusividade, direito, pedidos.

RESTRIÇÕES: NÃO alegue abusividade sem enquadrar no art. 51 CDC. NÃO requeira nulidade total do contrato se apenas uma cláusula é abusiva.`,
  },
  {
    id: 93,
    titulo: "Embargo à Execução Fiscal com Garantia por Seguro",
    area: "Direito Tributário",
    subarea: "Execução Fiscal",
    complexidade: "intermediario",
    descricao: "Embargos à execução fiscal garantidos por seguro-garantia com teses de mérito contra a CDA.",
    prompt: `Atue como advogado tributarista com experiência em execução fiscal.

TAREFA: Elabore embargos à execução fiscal com garantia por seguro.

DADOS:
- Embargante (executado): [razão social, CNPJ]
- Embargada (Fazenda): [ente — União/Estado/Município]
- Execução fiscal: [número, CDA, tributo, período, valor]
- Garantia: [seguro-garantia judicial — apólice]
- Teses: [decadência, prescrição, inconstitucionalidade, pagamento, base de cálculo errada]
- Processo administrativo: [se houve — resultado]

INSTRUÇÕES:
1. Fundamente no art. 16 Lei 6.830/80 (embargos à execução fiscal)
2. Demonstre garantia integral (art. 16, §1º — seguro-garantia aceito: art. 9º, II, §3º)
3. Prazo: 30 dias da intimação da penhora/garantia (art. 16)
4. Desenvolva teses de mérito contra a CDA
5. Se decadência: art. 150, §4º ou art. 173 CTN
6. Se prescrição: art. 174 CTN (5 anos da constituição definitiva)
7. Requeira efeito suspensivo (art. 919, §1º CPC c/c art. 1º Lei 6.830)

FORMATO: Embargos com qualificação, execução, garantia, teses (preliminares + mérito), pedidos.

RESTRIÇÕES: NÃO embarque sem garantia integral (serão rejeitados). NÃO confunda prazo: 30 dias (LEF) ≠ 15 dias (CPC). Verifique se seguro cobre 30% adicional (prática de alguns juízos).`,
  },
  {
    id: 94,
    titulo: "Ação de Alienação Parental com Pedido de Modificação de Guarda",
    area: "Família e Sucessões",
    subarea: "Alienação Parental",
    complexidade: "avancado",
    descricao: "Ação declaratória de alienação parental com pedido de modificação de guarda e medidas do art. 6º.",
    prompt: `Atue como advogado familiarista com experiência em alienação parental.

TAREFA: Elabore ação declaratória de alienação parental com pedido de modificação de guarda.

DADOS:
- Autor (genitor alienado): [nome, CPF]
- Réu (genitor alienador): [nome, CPF]
- Filho(a): [nome, idade]
- Condutas alienadoras: [descrever — art. 2º, p.ú. Lei 12.318/2010]
- Provas: [mensagens, áudios, relatórios escolares, laudos psicológicos]
- Guarda atual: [com quem]
- Medidas pretendidas: [art. 6º — advertência, multa, modificação de guarda, etc.]

INSTRUÇÕES:
1. Fundamente na Lei 12.318/2010 (Lei de Alienação Parental)
2. Identifique condutas do art. 2º, p.ú. (rol exemplificativo)
3. Requeira perícia biopsicossocial (art. 5º — laudo em 90 dias)
4. Requeira medidas do art. 6º conforme gravidade
5. Se grave: requeira modificação de guarda (art. 6º, V)
6. Requeira tutela de urgência para garantir convivência (art. 6º, I a III)
7. Princípio do melhor interesse da criança

FORMATO: Petição inicial com endereçamento, qualificação, fatos (condutas alienadoras), direito, medidas, pedidos.

RESTRIÇÕES: NÃO confunda conflito parental com alienação (alienação é campanha deliberada). NÃO ignore que criança pode ser ouvida (art. 12 Convenção ONU). Verifique se não há violência real (art. 2º, VII — falsa denúncia × denúncia real).`,
  },
  {
    id: 95,
    titulo: "Compliance Anticorrupção — Programa de Integridade",
    area: "Direito Empresarial",
    subarea: "Compliance",
    complexidade: "avancado",
    descricao: "Estruturação de programa de integridade conforme Lei Anticorrupção com políticas e controles internos.",
    prompt: `Atue como advogado empresarial com experiência em compliance anticorrupção.

TAREFA: Elabore estrutura de programa de integridade (compliance anticorrupção).

DADOS:
- Empresa: [razão social, porte, setor, faturamento]
- Relação com poder público: [licitações, contratos, regulação]
- Estrutura atual: [se já tem algo implementado]
- Riscos identificados: [suborno, conflito de interesses, lavagem]
- Colaboradores: [quantidade, níveis hierárquicos]
- Jurisdições: [onde opera — estados, países]

INSTRUÇÕES:
1. Fundamente na Lei 12.846/2013 (Lei Anticorrupção) e Decreto 11.129/2022
2. Parâmetros do art. 42 Decreto 11.129/2022 (16 critérios de avaliação)
3. Estruture: tone from the top, código de conduta, canal de denúncias, due diligence de terceiros
4. Políticas: anticorrupção, brindes, conflito de interesses, doações, patrocínios
5. Controles: due diligence de fornecedores, monitoramento, auditoria
6. Treinamento: periodicidade, público, conteúdo
7. Canal de denúncias: anonimato, não-retaliação, investigação
8. Consequências: medidas disciplinares, remediação

FORMATO: Documento com: diagnóstico de riscos, estrutura do programa (organograma), políticas (resumo), controles, indicadores, cronograma de implementação.

RESTRIÇÕES: NÃO use programa genérico — adapte ao porte e risco. NÃO ignore que programa efetivo pode reduzir multa em até 2/3 (art. 18 Decreto 11.129).`,
  },
  {
    id: 96,
    titulo: "Ação de Aposentadoria Especial do Professor",
    area: "Direito Previdenciário",
    subarea: "Aposentadoria Especial",
    complexidade: "intermediario",
    descricao: "Ação para concessão de aposentadoria especial de professor com reconhecimento de tempo de magistério.",
    prompt: `Atue como advogado previdenciarista.

TAREFA: Elabore ação de concessão de aposentadoria especial de professor.

DADOS:
- Autor: [nome, CPF, NIT, data nascimento, sexo]
- Atividade: [professor — educação infantil, fundamental, médio]
- Tempo de magistério: [anos, meses — períodos e escolas]
- Funções exercidas: [sala de aula, coordenação, direção — art. 67 Lei 9.394/96]
- Indeferimento: [NB, motivo — período não reconhecido]
- Regra aplicável: [EC 103/2019 — qual transição]

INSTRUÇÕES:
1. Fundamente no art. 201, §8º CF (aposentadoria especial do professor)
2. Pós-EC 103/2019: art. 19 (regra permanente — 25/30 anos + 57/60 idade)
3. Regras de transição: art. 16 (idade mínima progressiva) ou art. 20, §1º (pedágio 100%)
4. Demonstre exercício exclusivo de magistério (Súmula 726 STF)
5. Funções de direção e coordenação contam (Lei 11.301/2006)
6. Se escola particular: comprove com CTPS, contracheques, declaração
7. Requeira averbação de períodos não reconhecidos

FORMATO: Petição inicial com endereçamento, qualificação, tempo por período, regra aplicável, pedidos.

RESTRIÇÕES: NÃO inclua tempo fora de magistério (administração escolar conta, mas não qualquer atividade). Verifique se é educação básica (superior não tem regra especial no RGPS).`,
  },
  {
    id: 97,
    titulo: "Ação Coletiva de Consumo por Recall Insuficiente",
    area: "Direito do Consumidor",
    subarea: "Segurança do Produto",
    complexidade: "avancado",
    descricao: "Ação civil pública por recall insuficiente ou tardio com pedido de ampliação e indenização coletiva.",
    prompt: `Atue como advogado com experiência em direito do consumidor coletivo e segurança de produtos.

TAREFA: Elabore ACP por recall insuficiente ou tardio.

DADOS:
- Autor (legitimado): [MP, Procon, associação]
- Réu (fabricante): [razão social, CNPJ]
- Produto: [descrição, lote, quantidade no mercado]
- Defeito: [risco à segurança — descrever]
- Recall realizado: [se houve — data, abrangência, efetividade]
- Problema: [tardio, parcial, comunicação insuficiente, adesão baixa]
- Acidentes: [se houve — vítimas, danos]

INSTRUÇÕES:
1. Fundamente no art. 10 CDC (recall obrigatório) e Decreto 2.181/97
2. Demonstre que recall foi insuficiente: comunicação inadequada, prazo tardio, cobertura parcial
3. Requeira ampliação do recall: novos canais, prazo estendido, busca ativa
4. Requeira substituição do produto ou devolução do valor
5. Se acidentes: responsabilidade objetiva (art. 12 CDC — fato do produto)
6. Requeira dano moral coletivo pela exposição a risco
7. Requeira tutela de urgência para retirada do produto do mercado

FORMATO: ACP com endereçamento, legitimidade, fatos, defeito, insuficiência do recall, direito, pedidos (tutela + mérito).

RESTRIÇÕES: NÃO ignore que recall é obrigação do fornecedor (art. 10, §1º CDC). NÃO confunda vício (art. 18) com defeito/fato do produto (art. 12 — risco à segurança).`,
  },
  {
    id: 98,
    titulo: "Ação de Regularização Fundiária Urbana (REURB-S)",
    area: "Direito Ambiental",
    subarea: "Regularização Fundiária",
    complexidade: "avancado",
    descricao: "Requerimento de REURB-S para comunidade de baixa renda com análise de requisitos e procedimento.",
    prompt: `Atue como advogado com experiência em regularização fundiária e direito urbanístico.

TAREFA: Elabore requerimento de REURB-S (interesse social) conforme Lei 13.465/2017.

DADOS:
- Requerente: [comunidade, associação de moradores, Defensoria, MP]
- Núcleo urbano: [localização, área, número de famílias]
- Ocupação: [desde quando — anterior a 22/12/2016?]
- Área: [pública ou privada, matrícula]
- Infraestrutura: [existente — água, luz, esgoto, vias]
- Renda: [perfil socioeconômico — baixa renda]
- Município: [responsável pela REURB]

INSTRUÇÕES:
1. Fundamente na Lei 13.465/2017 (arts. 9-72) — REURB-S (interesse social)
2. Requisitos: núcleo urbano informal consolidado até 22/12/2016
3. Legitimados: art. 14 (município, moradores, MP, Defensoria, etc.)
4. Procedimento: requerimento → instauração → projeto → CRF → registro
5. Gratuidade: REURB-S é gratuita (art. 13, §1º — registros, atos notariais, tributos)
6. Se APP: art. 11, §2º — admite regularização com estudo técnico
7. Instrumento: legitimação fundiária (art. 23) — aquisição originária

FORMATO: Requerimento ao Município com qualificação, área, ocupantes, fundamentação, documentos, pedidos.

RESTRIÇÕES: NÃO confunda REURB-S (social — gratuita) com REURB-E (específica — custos do beneficiário). Verifique marco temporal (22/12/2016). NÃO ignore que APP pode ser regularizada com condições.`,
  },
  {
    id: 99,
    titulo: "Resposta a Incidente de Segurança com Ransomware",
    area: "Direito Digital e LGPD",
    subarea: "Segurança da Informação",
    complexidade: "avancado",
    descricao: "Plano de resposta jurídica a incidente de ransomware com comunicações, preservação de provas e compliance.",
    prompt: `Atue como advogado de proteção de dados com experiência em resposta a incidentes.

TAREFA: Elabore plano de resposta jurídica a incidente de ransomware.

DADOS:
- Empresa (vítima): [razão social, CNPJ, porte, setor]
- Incidente: [ransomware — tipo, sistemas afetados, dados criptografados]
- Dados pessoais: [se há dados pessoais nos sistemas afetados — categorias, volume]
- Backup: [se há backup íntegro disponível]
- Resgate: [valor pedido, criptomoeda, prazo]
- Comunicação do atacante: [canal, ameaças]
- Status: [contido? em andamento?]

INSTRUÇÕES:
1. Fase 1 — Contenção: orientações jurídicas imediatas (NÃO pagar resgate — implicações legais)
2. Fase 2 — Preservação: cadeia de custódia digital para eventual ação penal
3. Fase 3 — Comunicação ANPD: avaliar se há risco relevante (art. 48 LGPD — 3 dias úteis)
4. Fase 4 — Comunicação titulares: se dados pessoais comprometidos
5. Fase 5 — Autoridades: BO, comunicação ao CERT.br, eventual notícia-crime
6. Fase 6 — Reguladores setoriais: BACEN (se financeiro), ANS (se saúde), etc.
7. Fase 7 — Seguro cyber: acionar apólice se houver
8. Pagar ou não pagar: análise jurídica (não é crime, mas pode financiar terrorismo — COAF)

FORMATO: Plano com timeline (primeiras 72h), checklist de comunicações obrigatórias, modelos de notificação, análise de riscos legais.

RESTRIÇÕES: NÃO recomende pagamento sem análise de risco completa. NÃO ignore obrigações setoriais. Preservar provas ANTES de restaurar sistemas.`,
  },
  {
    id: 100,
    titulo: "Ação de Produção Antecipada de Provas (art. 381 CPC)",
    area: "Direito Civil",
    subarea: "Provas",
    complexidade: "basico",
    descricao: "Ação de produção antecipada de provas para documentar situação fática antes de ação principal.",
    prompt: `Atue como advogado civilista.

TAREFA: Elabore ação de produção antecipada de provas (art. 381 CPC).

DADOS:
- Requerente: [nome/razão social, CPF/CNPJ]
- Requerido: [nome/razão social — se houver]
- Prova pretendida: [perícia, inspeção, depoimento, exibição de documento]
- Finalidade: [art. 381, I — urgência / II — viabilizar autocomposição / III — justificar ação]
- Fatos: [o que precisa ser documentado e por quê]
- Urgência: [se há risco de perecimento da prova]

INSTRUÇÕES:
1. Fundamente no art. 381 CPC (produção antecipada de provas)
2. Identifique hipótese: I (urgência), II (autocomposição) ou III (prévio conhecimento dos fatos)
3. Se urgência: demonstre risco de perecimento (art. 381, I)
4. Se autocomposição: demonstre que prova pode viabilizar acordo
5. Não há contestação no mérito — apenas sobre admissibilidade (art. 382, §4º)
6. Não se aplica o art. 300 CPC (não é tutela de urgência propriamente)
7. Requeira nomeação de perito se perícia

FORMATO: Petição inicial com endereçamento, qualificação, fatos, prova pretendida, finalidade, pedidos.

RESTRIÇÕES: NÃO confunda com tutela de urgência (art. 300). NÃO discuta mérito da futura ação — apenas a necessidade da prova. Não há defesa de mérito pelo requerido (art. 382, §4º).`,
  },
];
