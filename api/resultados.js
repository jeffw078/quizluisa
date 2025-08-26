// api/resultados.js - Função serverless corrigida
export default function handler(req, res) {
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
      // Em ambiente serverless demo, retornar dados de exemplo
      const resultadosDemo = [
        {
          id: "demo1",
          nome: "Maria",
          pontuacao: 4,
          total: 5,
          mensagem: "Muito divertido! A Luísa vai amar esse quiz! 💖",
          data: new Date(Date.now() - 86400000).toLocaleString('pt-BR'),
          timestamp: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: "demo2", 
          nome: "João",
          pontuacao: 3,
          total: 5,
          mensagem: "Parabéns Luísa pelo seu aniversário! 🎉",
          data: new Date(Date.now() - 43200000).toLocaleString('pt-BR'),
          timestamp: new Date(Date.now() - 43200000).toISOString()
        },
        {
          id: "demo3",
          nome: "Ana",
          pontuacao: 5,
          total: 5,
          mensagem: "Que cresça sempre feliz e saudável! ✨",
          data: new Date().toLocaleString('pt-BR'),
          timestamp: new Date().toISOString()
        }
      ];

      console.log('Resultados solicitados:', resultadosDemo.length + ' registros');

      res.status(200).json({
        success: true,
        count: resultadosDemo.length,
        data: resultadosDemo,
        note: 'Dados de exemplo (ambiente serverless demo)',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro ao buscar resultados:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error.message,
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