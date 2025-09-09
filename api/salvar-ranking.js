// /api/salvar-ranking.js - Vercel Serverless Function para salvar ranking do jogo

export default async function handler(req, res) {
  // Definir CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Só aceitar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const { nome, pontuacao, nivel, timestamp, data } = req.body;

    // Validar dados obrigatórios
    if (!nome || pontuacao === undefined || nivel === undefined) {
      return res.status(400).json({ 
        error: 'Dados obrigatórios: nome, pontuacao, nivel' 
      });
    }

    // Se você estiver usando Supabase, configure aqui:
    // const SUPABASE_URL = process.env.SUPABASE_URL;
    // const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    
    // Por enquanto, vamos simular salvamento bem-sucedido
    // Em produção, você conectaria ao Supabase aqui
    
    /*
    // Exemplo com Supabase:
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      
      const { data: result, error } = await supabase
        .from('ranking_cataventos')
        .insert([{
          nome: nome.trim(),
          pontuacao: parseInt(pontuacao),
          nivel: parseInt(nivel),
          data_jogo: timestamp || new Date().toISOString()
        }]);

      if (error) {
        console.error('Erro Supabase:', error);
        return res.status(500).json({ error: 'Erro ao salvar no banco de dados' });
      }

      return res.status(200).json({ 
        success: true, 
        source: 'supabase',
        data: result 
      });
    }
    */

    // Log para debug (visível no Vercel Dashboard → Functions → Logs)
    console.log(`📊 Novo ranking: ${nome} - ${pontuacao} pts (nível ${nivel})`);

    // Resposta de sucesso (temporária até configurar Supabase)
    return res.status(200).json({
      success: true,
      source: 'simulated', // Será 'supabase' quando configurar
      message: 'Ranking salvo com sucesso!',
      data: {
        nome: nome.trim(),
        pontuacao: parseInt(pontuacao),
        nivel: parseInt(nivel),
        data_jogo: timestamp || new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erro na API salvar-ranking:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
}