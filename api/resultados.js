import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // Permitir apenas método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Caminho para o arquivo de resultados
    const resultadosPath = path.join(process.cwd(), 'data', 'resultados.json');
    
    let resultados = [];
    
    try {
      const data = await fs.readFile(resultadosPath, 'utf8');
      resultados = JSON.parse(data);
    } catch (error) {
      // Arquivo não existe ainda ou está vazio
      console.log('Arquivo de resultados não encontrado ou vazio');
    }

    // Calcular estatísticas
    const totalParticipantes = resultados.length;
    let mediaAcertos = 0;
    let melhorPontuacao = 0;
    let totalAcertos = 0;

    if (totalParticipantes > 0) {
      totalAcertos = resultados.reduce((sum, r) => sum + (parseInt(r.pontuacao) || 0), 0);
      mediaAcertos = (totalAcertos / totalParticipantes).toFixed(1);
      melhorPontuacao = Math.max(...resultados.map(r => parseInt(r.pontuacao) || 0));
    }

    // Resposta com dados e estatísticas
    res.status(200).json({
      success: true,
      data: resultados,
      statistics: {
        total_participantes: totalParticipantes,
        media_acertos: parseFloat(mediaAcertos),
        melhor_pontuacao: melhorPontuacao,
        total_acertos: totalAcertos
      }
    });

  } catch (error) {
    console.error('Erro ao buscar resultados:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}