// api/resultados.js - Função serverless para listar resultados
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
      // Em um ambiente real, você buscaria do banco de dados
      // Por enquanto, retorna dados de exemplo
      const resultados = [
        {
          nome: "Exemplo",
          pontuacao: 3,
          total: 5,
          mensagem: "Mensagem de exemplo para a Luísa!",
          data: new Date().toLocaleString('pt-BR')
        }
      ];

      res.status(200).json(resultados);
    } catch (error) {
      console.error('Erro ao buscar resultados:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}