// /api/ranking-jogo.js - Vercel Serverless Function para buscar ranking do jogo

export default async function handler(req, res) {
  // Definir CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Só aceitar GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido. Use GET.' });
  }

  try {
    // Se você estiver usando Supabase, configure aqui:
    // const SUPABASE_URL = process.env.SUPABASE_URL;
    // const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    
    /*
    // Exemplo com Supabase:
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      
      const { data, error } = await supabase
        .from('ranking_cataventos')
        .select('*')
        .order('pontuacao', { ascending: false })
        .order('nivel', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Erro Supabase:', error);
        return res.status(500).json({ error: 'Erro ao buscar ranking' });
      }

      // Converter dados do Supabase para formato do frontend
      const rankings = data.map(item => ({
        nome: item.nome,
        pontuacao: item.pontuacao,
        nivel: item.nivel,
        data: new Date(item.data_jogo).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      }));

      return res.status(200).json({
        data: rankings,
        source: 'supabase',
        total: rankings.length
      });
    }
    */

    // Por enquanto, dados de exemplo (até configurar Supabase)
    const rankingExemplo = [
      {
        nome: "Exemplo Jogador",
        pontuacao: 150,
        nivel: 8,
        data: "09/09/25, 14:30"
      },
      {
        nome: "Demo Player",
        pontuacao: 100,
        nivel: 6,
        data: "09/09/25, 13:15"
      }
    ];

    console.log('📊 Ranking consultado via API');

    return res.status(200).json({
      data: rankingExemplo,
      source: 'simulated', // Será 'supabase' quando configurar
      total: rankingExemplo.length,
      note: 'Dados de exemplo. Configure Supabase para dados reais.'
    });

  } catch (error) {
    console.error('Erro na API ranking-jogo:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
}