// api/salvar.js - Função serverless para o Vercel
import { promises as fs } from 'fs';
import path from 'path';

// Simula um banco de dados em memória (para o Vercel)
let respostasData = [];

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const resposta = req.body;
      
      // Validar dados
      if (!resposta.nome || !resposta.mensagem) {
        return res.status(400).json({ error: 'Nome e mensagem são obrigatórios' });
      }

      // Adicionar timestamp se não existir
      if (!resposta.data) {
        resposta.data = new Date().toLocaleString('pt-BR');
      }

      // Simular salvamento (em produção, usar banco de dados real)
      respostasData.push(resposta);
      
      console.log('Resposta salva:', resposta);

      res.status(200).json({ 
        success: true, 
        message: 'Resposta salva com sucesso!',
        data: resposta
      });

    } catch (error) {
      console.error('Erro ao salvar resposta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}