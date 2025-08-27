// lib/db.js - Configuração do banco SQLite
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join } from 'path';

let db = null;

export async function getDatabase() {
  if (db) {
    return db;
  }

  try {
    // Caminho para o banco de dados
    const dbPath = process.env.NODE_ENV === 'production' 
      ? '/tmp/quiz.db' // No Vercel, usar /tmp para arquivos temporários
      : join(process.cwd(), 'quiz.db'); // Local para desenvolvimento

    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Criar tabelas se não existirem
    await db.exec(`
      CREATE TABLE IF NOT EXISTS respostas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        pontuacao INTEGER NOT NULL,
        total INTEGER NOT NULL,
        mensagem TEXT NOT NULL,
        data_resposta DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_respostas_data ON respostas(data_resposta DESC);
      CREATE INDEX IF NOT EXISTS idx_respostas_nome ON respostas(nome);
    `);

    console.log('Banco de dados SQLite inicializado com sucesso!');
    return db;

  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

export async function closeDatabase() {
  if (db) {
    await db.close();
    db = null;
  }
}