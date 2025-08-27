// api/stats.js - Estatísticas detalhadas do quiz
import { getDatabase } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const db = await getDatabase();
      
      // Estatísticas detalhadas
      const stats = await db.get(`
        SELECT 
          COUNT(*) as total_participantes,
          AVG(pontuacao) as media_acertos,
          MAX(pontuacao) as melhor_pontuacao,
          MIN(pontuacao) as pior_pontuacao,
          COUNT(DISTINCT DATE(data_resposta)) as dias_ativos,
          COUNT(CASE WHEN pontuacao = total THEN 1 END) as pontuacao_maxima_count,
          AVG(LENGTH(mensagem)) as tamanho_medio_mensagem
        FROM respostas
      `);

      // Top 5 participantes
      const topParticipantes = await db.all(`
        SELECT nome, pontuacao, total, 
               ROUND((pontuacao * 100.0 / total), 1) as porcentagem,
               data_resposta
        FROM respostas 
        ORDER BY pontuacao DESC, data_resposta ASC
        LIMIT 5
      `);

      // Distribuição de pontuações
      const distribuicao = await db.all(`
        SELECT 
          pontuacao,
          COUNT(*) as quantidade,
          ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM respostas)), 1) as porcentagem
        FROM respostas 
        GROUP BY pontuacao 
        ORDER BY pontuacao DESC
      `);

      // Atividade por dia
      const atividadeDiaria = await db.all(`
        SELECT 
          DATE(data_resposta) as data,
          COUNT(*) as participantes
        FROM respostas 
        GROUP BY DATE(data_resposta)
        ORDER BY DATE(data_resposta) DESC
        LIMIT 7
      `);

      res.status(200).json({
        success: true,
        statistics: {
          geral: {
            total_participantes: stats.total_participantes || 0,
            media_acertos: parseFloat((stats.media_acertos || 0).toFixed(1)),
            melhor_pontuacao: stats.melhor_pontuacao || 0,
            pior_pontuacao: stats.pior_pontuacao || 0,
            dias_ativos: stats.dias_ativos || 0,
            pontuacao_maxima_count: stats.pontuacao_maxima_count || 0,
            tamanho_medio_mensagem: parseInt(stats.tamanho_medio_mensagem || 0)
          },
          top_participantes: topParticipantes.map(p => ({
            nome: p.nome,
            pontuacao: p.pontuacao,
            total: p.total,
            porcentagem: p.porcentagem,
            data: new Date(p.data_resposta).toLocaleString('pt-BR')
          })),
          distribuicao_pontuacoes: distribuicao,
          atividade_diaria: atividadeDiaria.map(a => ({
            data: a.data,
            participantes: a.participantes
          }))
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao gerar estatísticas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao gerar estatísticas',
        details: error.message
      });
    }
  } else {
    res.status(405).json({
      error: 'Método não permitido',
      allowedMethods: ['GET']
    });
  }
}