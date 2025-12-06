import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

interface OnboardingTourProps {
  autoStart?: boolean;
}

export function OnboardingTour({ autoStart = false }: OnboardingTourProps) {
  useEffect(() => {
    // Verificar se já viu o tour
    const hasSeenTour = localStorage.getItem('promptjur-tour-completed');
    
    if (autoStart && !hasSeenTour) {
      setTimeout(() => startTour(), 1000); // Delay para garantir que elementos estejam renderizados
    }
  }, [autoStart]);

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Próximo',
      prevBtnText: 'Anterior',
      doneBtnText: 'Concluir',
      progressText: '{{current}} de {{total}}',
      onDestroyStarted: () => {
        // Marcar tour como concluído
        localStorage.setItem('promptjur-tour-completed', 'true');
        driverObj.destroy();
      },
      steps: [
        {
          element: 'body',
          popover: {
            title: '👋 Bem-vindo ao PromptJur!',
            description: 'Vamos fazer um tour rápido pelas principais funcionalidades do sistema de engenharia de prompts jurídicos.',
            side: 'center',
            align: 'center'
          }
        },
        {
          element: '[data-tour="modo-assistido"]',
          popover: {
            title: '🎯 Modo Assistido',
            description: 'Clique aqui para ativar o assistente passo-a-passo. Ideal para iniciantes! O wizard guia você na criação de prompts profissionais.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '[data-tour="exemplos-praticos"]',
          popover: {
            title: '📚 Exemplos Práticos',
            description: 'Ao selecionar uma área jurídica no Modo Assistido, você verá exemplos práticos prontos para usar (erro médico, vazamento de dados, arbitragem internacional, etc).',
            side: 'left',
            align: 'start'
          }
        },
        {
          element: '[data-tour="validacao-visual"]',
          popover: {
            title: '✅ Validação Visual em Tempo Real',
            description: 'Enquanto você digita, citações legais são destacadas automaticamente com badges de confiabilidade (✓ Alta, ⚠️ Média, ✗ Baixa). Passe o mouse para ver detalhes.',
            side: 'top',
            align: 'start'
          }
        },
        {
          element: '[data-tour="testar-prompt"]',
            popover: {
            title: '🚀 Testar em Plataformas de IA',
            description: 'Após gerar seu prompt, use este dropdown para testá-lo instantaneamente no Manus, ChatGPT, Claude, Gemini ou Perplexity. O prompt é copiado automaticamente!',
            side: 'left',
            align: 'start'
          }
        },
        {
          element: '[data-tour="quick-actions"]',
          popover: {
            title: '⚡ Quick Actions',
            description: 'No histórico, use ações rápidas inline: copiar, favoritar, reutilizar ou excluir prompts com apenas 1 clique.',
            side: 'top',
            align: 'start'
          }
        },
        {
          element: '[data-tour="cache-stats"]',
          popover: {
            title: '📊 Estatísticas de Cache',
            description: 'Veja métricas em tempo real: 55 leis no cache, taxa de acerto de 95%, economia de tempo. O sistema valida citações instantaneamente!',
            side: 'left',
            align: 'start'
          }
        },
        {
          element: 'body',
          popover: {
            title: '🎉 Pronto para começar!',
            description: 'Você agora conhece os principais recursos do PromptJur. Experimente o Modo Assistido para criar seu primeiro prompt jurídico profissional!',
            side: 'center',
            align: 'center'
          }
        }
      ]
    });

    driverObj.drive();
  };

  return null; // Componente sem UI, apenas lógica
}

// Hook para iniciar tour manualmente
export function useOnboardingTour() {
  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Próximo',
      prevBtnText: 'Anterior',
      doneBtnText: 'Concluir',
      progressText: '{{current}} de {{total}}',
      steps: [
        {
          element: 'body',
          popover: {
            title: '👋 Tour do PromptJur',
            description: 'Vamos revisar as principais funcionalidades do sistema.',
            side: 'center',
            align: 'center'
          }
        },
        {
          element: '[data-tour="modo-assistido"]',
          popover: {
            title: '🎯 Modo Assistido',
            description: 'Assistente passo-a-passo para criar prompts profissionais.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '[data-tour="validacao-visual"]',
          popover: {
            title: '✅ Validação Visual',
            description: 'Citações legais destacadas automaticamente com badges de confiabilidade.',
            side: 'top',
            align: 'start'
          }
        },
        {
          element: '[data-tour="testar-prompt"]',
          popover: {
            title: '🚀 Testar em IAs',
            description: 'Teste prompts instantaneamente em Manus, ChatGPT, Claude, Gemini ou Perplexity.',
            side: 'left',
            align: 'start'
          }
        }
      ]
    });

    driverObj.drive();
  };

  const resetTour = () => {
    localStorage.removeItem('promptjur-tour-completed');
  };

  return { startTour, resetTour };
}
