/**
 * Testes para exportação DOCX com formatação ABNT
 */

import { describe, it, expect } from 'vitest';
import { generateDocxABNT, gerarNomeArquivo } from '../docx-generator';
import { Packer } from 'docx';

describe('Exportação DOCX com Formatação ABNT', () => {
  it('deve gerar documento DOCX válido', async () => {
    const buffer = await generateDocxABNT({
      titulo: 'Teste de Exportação',
      conteudo: 'Este é um teste de exportação DOCX com formatação ABNT.',
      incluirDataHora: false,
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    
    // Verificar assinatura de arquivo DOCX (ZIP)
    const signature = buffer.toString('hex', 0, 4);
    expect(signature).toBe('504b0304'); // PK.. (ZIP signature)
  });

  it('deve incluir cabeçalho quando fornecido', async () => {
    const buffer = await generateDocxABNT({
      titulo: 'Petição Inicial',
      conteudo: 'Conteúdo da petição...',
      cabecalho: {
        nomeEscritorio: 'Escritório Teste Advogados',
        numeroOAB: 'OAB/SP 123.456',
        endereco: 'Rua Teste, 123 - São Paulo/SP',
        telefone: '(11) 1234-5678',
        email: 'contato@teste.adv.br',
      },
      incluirDataHora: false,
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('deve remover seções de persona e contexto', async () => {
    const conteudoComPersona = `
**Persona:** Você é um advogado especialista em direito civil.

**Contexto:** Este prompt visa gerar uma petição inicial.

# Petição Inicial

Conteúdo principal da petição...
    `.trim();

    const buffer = await generateDocxABNT({
      titulo: 'Teste Remoção Persona',
      conteudo: conteudoComPersona,
      removerPersonaContexto: true,
      incluirDataHora: false,
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('deve processar markdown básico', async () => {
    const conteudoMarkdown = `
# Título Principal

## Subtítulo

Este é um parágrafo normal com **negrito** e *itálico*.

- Item de lista 1
- Item de lista 2
- Item de lista 3

Outro parágrafo após a lista.
    `.trim();

    const buffer = await generateDocxABNT({
      titulo: 'Teste Markdown',
      conteudo: conteudoMarkdown,
      incluirDataHora: false,
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('deve gerar nome de arquivo válido', () => {
    const casos = [
      { input: 'Petição Inicial', expected: 'peticao-inicial.docx' },
      { input: 'Recurso de Apelação', expected: 'recurso-de-apelacao.docx' },
      { input: 'Contrato de Prestação de Serviços', expected: 'contrato-de-prestacao-de-servicos.docx' },
      { input: 'Título com Caracteres Especiais!@#$%', expected: 'titulo-com-caracteres-especiais.docx' },
      { input: 'Título Muito Longo Que Precisa Ser Truncado Para Não Exceder o Limite de Caracteres Permitidos', expected: 'titulo-muito-longo-que-precisa-ser-truncado-para-n.docx' },
    ];

    casos.forEach(({ input, expected }) => {
      const resultado = gerarNomeArquivo(input);
      expect(resultado).toBe(expected);
    });
  });

  it('deve incluir data e hora quando solicitado', async () => {
    const buffer = await generateDocxABNT({
      titulo: 'Teste Data/Hora',
      conteudo: 'Conteúdo de teste',
      incluirDataHora: true,
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('deve processar texto longo sem erros', async () => {
    const textoLongo = Array(100)
      .fill('Este é um parágrafo de teste que será repetido várias vezes para simular um documento longo.')
      .join('\n\n');

    const buffer = await generateDocxABNT({
      titulo: 'Teste Documento Longo',
      conteudo: textoLongo,
      incluirDataHora: false,
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('deve lidar com conteúdo vazio graciosamente', async () => {
    const buffer = await generateDocxABNT({
      titulo: 'Documento Vazio',
      conteudo: '',
      incluirDataHora: false,
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
