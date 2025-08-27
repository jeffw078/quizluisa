// api/resultados.js - Função serverless com SQLite
import { getDatabase } from '../lib/db.js';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      // Conectar ao banco
      const db = await getDatabase();
      
      // Buscar todas as respostas ordenadas por data
      const respostas = await db.all(`
        SELECT 
          id,
          nome,
          pontuacao,
          total,
          mensagem,
          data_resposta,
          created_at
        FROM respostas 
        ORDER BY data_resposta DESC
        LIMIT 100
      `);

      // Formatar dados para o frontend
      const resultadosFormatados = respostas.map(resposta => ({
        id: resposta.id,
        nome: resposta.nome,
        pontuacao: resposta.pontuacao,
        total: resposta.total,
        mensagem: resposta.mensagem,
        data: new Date(resposta.data_resposta).toLocaleString('pt-BR'),
        timestamp: resposta.data_resposta
      }));

      // Estatísticas
      const stats = await db.get(`
        SELECT 
          COUNT(*) as total_participantes,
          AVG(pontuacao) as media_acertos,
          MAX(pontuacao) as melhor_pontuacao,
          COUNT(DISTINCT DATE(data_resposta)) as dias_ativos
        FROM respostas
      `);

      console.log('Resultados carregados do SQLite:', {
        total: resultadosFormatados.length,
        stats: stats
      });

      res.status(200).json({
        success: true,
        count: resultadosFormatados.length,
        data: resultadosFormatados,
        statistics: {
          total_participantes: stats.total_participantes || 0,
          media_acertos: parseFloat((stats.media_acertos || 0).toFixed(1)),
          melhor_pontuacao: stats.melhor_pontuacao || 0,
          dias_ativos: stats.dias_ativos || 0
        },
        source: 'SQLite Database',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao buscar resultados do SQLite:', error);
      
      // Fallback com dados de exemplo se SQLite falhar
      const fallbackData = [
        {
          id: 'demo1',
          nome: 'Visitante',
          pontuacao: 4,
          total: 5,
          mensagem: 'Que a Luísa tenha um aniversário muito especial! 🎉',
          data: new Date().toLocaleString('pt-BR'),
          timestamp: new Date().toISOString()
        }
      ];

      res.status(200).json({
        success: true,
        count: fallbackData.length,
        data: fallbackData,
        statistics: {
          total_participantes: 1,
          media_acertos: 4.0,
          melhor_pontuacao: 4,
          dias_ativos: 1
        },
        source: 'Fallback Data',
        warning: 'SQLite indisponível, usando dados de exemplo',
        error_details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  } else {
    res.status(405).json({ 
      error: 'Método não permitido',
      allowedMethods: ['GET'],
      receivedMethod: req.method
    });
  }
}