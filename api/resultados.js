export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responder OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Permitir apenas método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

    if (SUPABASE_URL && SUPABASE_KEY) {
      // Buscar dados do Supabase
      const response = await fetch(`${SUPABASE_URL}/rest/v1/quiz_respostas?select=*&order=timestamp.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });

      if (response.ok) {
        const resultados = await response.json();
        
        console.log(`✅ Encontrados ${resultados.length} resultados no Supabase`);
        
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

        return res.status(200).json({
          success: true,
          data: resultados,
          statistics: {
            total_participantes: totalParticipantes,
            media_acertos: parseFloat(mediaAcertos),
            melhor_pontuacao: melhorPontuacao,
            total_acertos: totalAcertos
          }
        });
      } else {
        const errorText = await response.text();
        console.error('❌ Erro do Supabase:', response.status, errorText);
        throw new Error(`Erro do Supabase: ${response.status}`);
      }
    } else {
      // Fallback: dados de exemplo se não tiver Supabase configurado
      console.log('⚠️ Supabase não configurado, retornando dados de exemplo');
      
      const resultadosExemplo = [
        {
          id: 1,
          nome: "Exemplo - Configure o Supabase",
          pontuacao: 15,
          total: 20,
          mensagem: "Configure SUPABASE_URL e SUPABASE_ANON_KEY nas variáveis de ambiente do Vercel para ver as mensagens reais! 🎉",
          data: new Date().toLocaleString('pt-BR'),
          timestamp: new Date().toISOString()
        }
      ];

      return res.status(200).json({
        success: true,
        data: resultadosExemplo,
        statistics: {
          total_participantes: 1,
          media_acertos: 15,
          melhor_pontuacao: 15,
          total_acertos: 15
        },
        note: "Configure as variáveis SUPABASE_URL e SUPABASE_ANON_KEY para persistência real"
      });
    }

  } catch (error) {
    console.error('❌ Erro ao buscar resultados:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}