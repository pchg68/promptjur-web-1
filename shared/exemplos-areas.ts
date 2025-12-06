/**
 * Exemplos práticos de casos para cada área jurídica
 * Usados no Wizard Mode para facilitar onboarding
 */

export interface ExemploArea {
  titulo: string;
  descricao: string;
  prompt: string;
}

export const EXEMPLOS_POR_AREA: Record<string, ExemploArea[]> = {
  "Direito Médico": [
    {
      titulo: "Erro Médico em Cirurgia",
      descricao: "Ação de indenização por erro médico durante procedimento cirúrgico",
      prompt: "Paciente submetido a cirurgia de apendicectomia apresentou complicações pós-operatórias devido a instrumento cirúrgico esquecido na cavidade abdominal. Elaborar petição inicial fundamentada no Código de Ética Médica e responsabilidade civil."
    },
    {
      titulo: "Prontuário Médico Incompleto",
      descricao: "Reclamação sobre prontuário eletrônico incompleto",
      prompt: "Hospital não forneceu prontuário médico completo conforme Lei 13.787/2018. Paciente necessita de documentação para segunda opinião médica. Elaborar notificação extrajudicial exigindo entrega integral do prontuário."
    },
    {
      titulo: "Responsabilidade Hospitalar",
      descricao: "Infecção hospitalar por falta de higienização adequada",
      prompt: "Paciente contraiu infecção hospitalar (MRSA) durante internação por falta de protocolos de higienização. Fundamentar ação indenizatória com base em responsabilidade objetiva do hospital e CDC."
    }
  ],
  
  "Direito Digital": [
    {
      titulo: "Vazamento de Dados Pessoais",
      descricao: "Violação da LGPD por empresa de e-commerce",
      prompt: "Empresa de e-commerce sofreu vazamento de dados pessoais de 50 mil clientes (CPF, endereço, cartão de crédito). Elaborar representação à ANPD fundamentada na LGPD (Lei 13.709/2018) solicitando aplicação de sanções."
    },
    {
      titulo: "Crime de Phishing",
      descricao: "Golpe de phishing com prejuízo financeiro",
      prompt: "Cliente recebeu e-mail falso do banco solicitando dados bancários, resultando em transferência fraudulenta de R$ 15.000. Elaborar queixa-crime fundamentada na Lei 12.737/2012 (Lei Carolina Dieckmann) e Lei 14.155/2021."
    },
    {
      titulo: "Uso Indevido de Cookies",
      descricao: "Website não solicita consentimento para cookies",
      prompt: "Site de notícias coleta dados de navegação sem consentimento expresso do usuário, violando LGPD e Marco Civil da Internet. Elaborar notificação extrajudicial exigindo adequação à legislação."
    }
  ],
  
  "Direito Internacional": [
    {
      titulo: "Arbitragem Comercial Internacional",
      descricao: "Disputa contratual entre empresas de países diferentes",
      prompt: "Empresa brasileira e fornecedor chinês possuem disputa sobre contrato de importação no valor de US$ 500.000. Contrato prevê arbitragem pela Convenção de Nova Iorque. Elaborar petição inicial de arbitragem."
    },
    {
      titulo: "Violação de Direitos Humanos",
      descricao: "Petição à Corte Interamericana de Direitos Humanos",
      prompt: "Cidadão brasileiro teve direitos violados por autoridades estatais sem acesso à justiça interna. Elaborar petição à CIDH fundamentada no Pacto de San José da Costa Rica (Decreto 678/1992)."
    },
    {
      titulo: "Conflito de Jurisdição",
      descricao: "Disputa sobre jurisdição aplicável em contrato internacional",
      prompt: "Contrato de prestação de serviços entre empresa brasileira e cliente europeu não especifica jurisdição aplicável. Cliente processou empresa na Europa. Elaborar exceção de incompetência fundamentada em princípios de Direito Internacional Privado."
    }
  ]
};
