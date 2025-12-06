# Pesquisa de APIs Especializadas para Novas Áreas Jurídicas

## Resumo Executivo

Pesquisa realizada em dezembro de 2025 para identificar APIs públicas disponíveis para integração com o PromptJur nas áreas de Direito Médico, Direito Digital e Direito Internacional.

---

## 1. CFM - Conselho Federal de Medicina

**Status:** ❌ API pública não disponível

**Pesquisa realizada:**
- Buscas por "CFM API", "API pública CFM médicos Brasil", "CFM web service consulta médicos"
- Nenhuma API pública documentada encontrada

**Alternativas identificadas:**
- **Portal CFM**: https://portal.cfm.org.br/ - Consulta manual de médicos
- **Scraping** (não recomendado): Extração de dados via web scraping pode violar termos de uso
- **Integração futura**: Aguardar disponibilização oficial de API pelo CFM

**Recomendação:**
Manter validação local baseada em cache de legislação médica (Código de Ética Médica, leis específicas) sem integração externa por enquanto.

---

## 2. ANPD - Autoridade Nacional de Proteção de Dados

**Status:** ❌ API pública não disponível

**Pesquisa realizada:**
- Buscas por "ANPD API proteção de dados", "ANPD web service LGPD", "API pública ANPD Brasil"
- Nenhuma API pública documentada encontrada

**Recursos disponíveis:**
- **Portal ANPD**: https://www.gov.br/anpd/pt-br - Informações institucionais
- **Relatórios públicos**: Decisões e sanções publicadas em PDF
- **Legislação**: LGPD (Lei 13.709/2018) e decretos regulamentadores

**Alternativas identificadas:**
- **Scraping de decisões** (complexo): Extrair decisões publicadas no portal
- **Base local**: Manter referências à LGPD e jurisprudência relevante no cache

**Recomendação:**
Utilizar sistema de cache local com LGPD, Marco Civil e legislação relacionada. Monitorar futuras iniciativas de dados abertos da ANPD.

---

## 3. CIJ - Corte Internacional de Justiça

**Status:** ❌ API pública estruturada não disponível

**Pesquisa realizada:**
- Buscas por "International Court of Justice API", "ICJ API jurisprudence", "CIJ API dados jurídicos"
- Nenhuma API REST/GraphQL documentada encontrada

**Recursos disponíveis:**
- **Website oficial**: https://www.icj-cij.org/ - Decisões e documentos em PDF
- **Base de dados**: Jurisprudência disponível para consulta manual
- **RSS Feeds**: Atualizações de casos (formato XML, não estruturado)

**Alternativas identificadas:**
- **Scraping** (complexo): Extrair decisões do site oficial
- **Integração com outras cortes**: CIDH (Corte Interamericana) pode ter recursos similares
- **Base local**: Manter tratados e convenções principais no cache

**Recomendação:**
Focar em cache local com tratados internacionais principais (Pacto de San José, Convenção de Viena, Estatuto de Roma). Considerar scraping apenas se houver demanda específica.

---

## Conclusão e Próximos Passos

**Situação atual:**
Nenhuma das três instituições (CFM, ANPD, CIJ) disponibiliza APIs públicas estruturadas para integração programática.

**Estratégia recomendada:**

1. ✅ **Manter abordagem de cache local** - Sistema atual com 55 leis pré-populadas é adequado
2. ✅ **Expandir referências legais** - Adicionar mais legislação específica das novas áreas
3. ⚠️ **Monitorar iniciativas futuras** - Acompanhar possível disponibilização de APIs governamentais
4. 🔄 **Considerar web scraping seletivo** - Apenas se houver demanda específica e respeitando termos de uso

**Fontes alternativas viáveis:**

- **Planalto**: http://www4.planalto.gov.br/legislacao/ - Legislação federal (sem API, mas scraping viável)
- **Jusbrasil API**: https://www.jusbrasil.com.br/ - API comercial com jurisprudência (paga)
- **LexML**: https://www.lexml.gov.br/ - Rede de informação legislativa (XML disponível)

**Implementação futura:**
Se APIs se tornarem disponíveis, criar helpers em `server/_core/` seguindo padrão similar a `llm.ts` e `imageGeneration.ts`.

---

**Data da pesquisa:** Dezembro 2025  
**Próxima revisão sugerida:** Junho 2026
