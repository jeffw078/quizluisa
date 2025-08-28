export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responder OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
      id: Date.now(),
      nome: String(nome).trim(),
      pontuacao: parseInt(pontuacao) || 0,
      total: parseInt(total) || 20,
      mensagem: String(mensagem).trim(),
      data: data || new Date().toLocaleString('pt-BR'),
      timestamp: new Date().toISOString()
    };

    // URL do Supabase (você precisa configurar)
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

    if (SUPABASE_URL && SUPABASE_KEY) {
      // Salvar no Supabase
      const response = await fetch(`${SUPABASE_URL}/rest/v1/quiz_respostas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(novoResultado)
      });

      if (response.ok) {
        console.log('✅ Resposta salva no Supabase:', novoResultado.nome);
        return res.status(200).json({ 
          success: true, 
          message: 'Resposta salva com sucesso no banco de dados!',
          id: novoResultado.id
        });
      } else {
        const errorText = await response.text();
        console.error('❌ Erro do Supabase:', response.status, errorText);
        throw new Error(`Erro do Supabase: ${response.status}`);
      }
    } else {
      // Fallback: apenas log (versão atual)
      console.log('📝 Nova resposta recebida (sem Supabase):', {
        nome: novoResultado.nome,
        pontuacao: novoResultado.pontuacao,
        total: novoResultado.total,
        mensagem: novoResultado.mensagem.substring(0, 50) + '...'
      });

      return res.status(200).json({ 
        success: true, 
        message: 'Resposta registrada com sucesso!',
        id: novoResultado.id,
        note: 'Configure SUPABASE_URL e SUPABASE_ANON_KEY nas variáveis de ambiente para persistência real'
      });
    }

  } catch (error) {
    console.error('❌ Erro ao processar resultado:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}