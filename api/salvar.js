import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // Permitir apenas método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { nome, pontuacao, total, mensagem, data } = req.body;

    // Validar dados obrigatórios
    if (!nome || pontuacao === undefined || !mensagem) {
      return res.status(400).json({ 
        error: 'Dados obrigatórios: nome, pontuacao e mensagem' 
      });
    }

    // Criar objeto do resultado
    const novoResultado = {
      id: Date.now(), // ID simples baseado em timestamp
      nome: nome.trim(),
      pontuacao: parseInt(pontuacao) || 0,
      total: parseInt(total) || 20,
      mensagem: mensagem.trim(),
      data: data || new Date().toLocaleString('pt-BR'),
      timestamp: new Date().toISOString()
    };

    // Caminho para o arquivo de resultados
    const resultadosPath = path.join(process.cwd(), 'data', 'resultados.json');
    
    // Garantir que o diretório existe
    const dataDir = path.dirname(resultadosPath);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }

    // Ler resultados existentes ou criar array vazio
    let resultados = [];
    try {
      const data = await fs.readFile(resultadosPath, 'utf8');
      resultados = JSON.parse(data);
    } catch (error) {
      // Arquivo não existe ainda, criar array vazio
      console.log('Arquivo de resultados não existe, criando novo...');
    }

    // Adicionar novo resultado
    resultados.push(novoResultado);

    // Salvar de volta no arquivo
    await fs.writeFile(resultadosPath, JSON.stringify(resultados, null, 2), 'utf8');

    console.log(`Nova resposta salva: ${nome} - ${pontuacao}/${total}`);

    // Resposta de sucesso
    res.status(200).json({ 
      success: true, 
      message: 'Resposta salva com sucesso!',
      id: novoResultado.id
    });

  } catch (error) {
    console.error('Erro ao salvar resultado:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}