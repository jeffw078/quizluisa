// api/resultados.js - Versão simplificada e robusta
let respostasMemoria = []; // Mesma referência da API salvar

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
      console.log('📊 Buscando resultados...');
      
      let resultados = [];
      let fonte = 'unknown';

      // Tentar buscar do SQLite primeiro
      try {
        const Database = await import('better-sqlite3');
        const db = new Database.default('/tmp/quiz.db');
        
        // Verificar se tabela existe
        const tableExists = db.prepare(`
          SELECT name FROM sqlite_master WHERE type='table' AND name='respostas'
        `).get();

        if (tableExists) {
          const rows = db.prepare(`
            SELECT * FROM respostas ORDER BY timestamp DESC LIMIT 50
          `).all();
          
          resultados = rows;
          fonte = 'SQLite';
          console.log('💾 Carregado do SQLite:', rows.length, 'registros');
        }
        
        db.close();
        
      } catch (dbError) {
        console.log('⚠️ SQLite não disponível:', dbError.message);
        
        // Fallback: usar dados em memória
        resultados = [...respostasMemoria];
        fonte = 'Memory';
        console.log('💭 Carregado da memória:', resultados.length, 'registros');
      }

      // Se não tiver dados, usar exemplos
      if (resultados.length === 0) {
        resultados = [
          {
            id: 'demo-1',
            nome: 'Visitante Exemplo',
            pontuacao: 4,
            total: 5,
            mensagem: 'Parabéns Luísa! Que seu aniversário seja maravilhoso! 🎉✨',
            data: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
            timestamp: new Date().toISOString()
          },
          {
            id: 'demo-2',
            nome: 'Amigo da Família',
            pontuacao: 3,
            total: 5,
            mensagem: 'Muito fofo este quiz! A Luísa é uma princesa! 👑💖',
            data: new Date(Date.now() - 3600000).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
            timestamp: new Date(Date.now() - 3600000).toISOString()
          }
        ];
        fonte = 'Demo';
        console.log('🎭 Usando dados de demonstração');
      }

      // Calcular estatísticas
      const stats = {
        total_participantes: resultados.length,
        media_acertos: resultados.length > 0 
          ? (resultados.reduce((sum, r) => sum + (r.pontuacao || 0), 0) / resultados.length).toFixed(1)
          : 0,
        melhor_pontuacao: resultados.length > 0 
          ? Math.max(...resultados.map(r => r.pontuacao || 0))
          : 0
      };

      console.log('📈 Estatísticas:', stats);

      res.status(200).json({
        success: true,
        count: resultados.length,
        data: resultados,
        statistics: stats,
        source: fonte,
        timestamp: new Date().toISOString(),
        note: fonte === 'Demo' 
          ? 'Dados de demonstração - Responda o quiz para ver dados reais!'
          : `Dados carregados de ${fonte}`
      });

    } catch (error) {
      console.error('💥 Erro ao buscar resultados:', error);
      
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar resultados',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  } else {
    res.status(405).json({
      success: false,
      error: 'Método não permitido. Use GET.'
    });
  }
}