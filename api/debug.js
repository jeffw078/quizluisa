// api/debug.js - Debug completo do sistema
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  const debug = {
    timestamp: new Date().toISOString(),
    request: {
      method: req.method,
      url: req.url,
      headers: Object.keys(req.headers),
      body: req.body
    },
    environment: {
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: process.memoryUsage(),
      env_vars: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_REGION: process.env.VERCEL_REGION,
        PWD: process.env.PWD
      }
    },
    file_system: {},
    database: {},
    quiz_test: {},
    logs: []
  };
  
  function log(message) {
    debug.logs.push(`${new Date().toISOString()}: ${message}`);
    console.log(message);
  }
  
  log('🚀 Iniciando debug completo');
  
  // Teste do sistema de arquivos
  try {
    const fs = await import('fs/promises');
    
    // Verificar pasta /tmp
    const tmpFiles = await fs.readdir('/tmp').catch(() => []);
    debug.file_system.tmp_directory = {
      exists: true,
      files: tmpFiles.slice(0, 10), // Só os primeiros 10
      total_files: tmpFiles.length
    };
    
    log(`📁 /tmp tem ${tmpFiles.length} arquivos`);
    
    // Teste de escrita
    const testFile = '/tmp/debug-test.txt';
    await fs.writeFile(testFile, 'Debug test: ' + Date.now());
    const content = await fs.readFile(testFile, 'utf8');
    await fs.unlink(testFile);
    
    debug.file_system.write_test = {
      success: true,
      content_length: content.length
    };
    
    log('✅ Escrita em /tmp funcionando');
    
  } catch (fsError) {
    debug.file_system.error = fsError.message;
    log('❌ Erro no sistema de arquivos: ' + fsError.message);
  }
  
  // Teste do banco de dados
  try {
    log('🗄️ Testando better-sqlite3...');
    
    const Database = await import('better-sqlite3');
    const dbPath = '/tmp/debug.db';
    const db = new Database.default(dbPath);
    
    // Criar tabela
    db.exec(`
      CREATE TABLE IF NOT EXISTS debug_test (
        id INTEGER PRIMARY KEY,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Inserir dados
    const stmt = db.prepare('INSERT INTO debug_test (message) VALUES (?)');
    const result = stmt.run('Debug test: ' + new Date().toISOString());
    
    // Buscar dados
    const rows = db.prepare('SELECT * FROM debug_test ORDER BY id DESC LIMIT 5').all();
    
    db.close();
    
    debug.database = {
      success: true,
      last_insert_id: result.lastInsertRowid,
      total_rows: rows.length,
      sample_rows: rows
    };
    
    log('✅ SQLite funcionando - ID inserido: ' + result.lastInsertRowid);
    
  } catch (dbError) {
    debug.database = {
      success: false,
      error: dbError.message,
      stack: dbError.stack?.substring(0, 500)
    };
    log('❌ Erro no SQLite: ' + dbError.message);
  }
  
  // Teste específico do quiz
  try {
    log('🎯 Testando sistema do quiz...');
    
    const testData = {
      nome: 'Debug Test User',
      pontuacao: 4,
      total: 5,
      mensagem: 'Esta é uma mensagem de teste do sistema de debug'
    };
    
    // Testar salvamento
    const Database = await import('better-sqlite3');
    const quizDb = new Database.default('/tmp/quiz-debug.db');
    
    // Criar tabela do quiz
    quizDb.exec(`
      CREATE TABLE IF NOT EXISTS respostas (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        pontuacao INTEGER NOT NULL,
        total INTEGER NOT NULL,
        mensagem TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);
    
    // Inserir dados de teste
    const registro = {
      id: 'debug-' + Date.now(),
      nome: testData.nome,
      pontuacao: testData.pontuacao,
      total: testData.total,
      mensagem: testData.mensagem,
      data: new Date().toLocaleString('pt-BR'),
      timestamp: new Date().toISOString()
    };
    
    const insertStmt = quizDb.prepare(`
      INSERT INTO respostas (id, nome, pontuacao, total, mensagem, data, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertResult = insertStmt.run(
      registro.id,
      registro.nome,
      registro.pontuacao,
      registro.total,
      registro.mensagem,
      registro.data,
      registro.timestamp
    );
    
    // Buscar dados inseridos
    const selectStmt = quizDb.prepare('SELECT * FROM respostas WHERE id = ?');
    const retrievedData = selectStmt.get(registro.id);
    
    // Contar total de registros
    const countStmt = quizDb.prepare('SELECT COUNT(*) as total FROM respostas');
    const totalCount = countStmt.get();
    
    quizDb.close();
    
    debug.quiz_test = {
      success: true,
      insert_result: {
        changes: insertResult.changes,
        last_insert_rowid: insertResult.lastInsertRowid
      },
      retrieved_data: retrievedData,
      total_records: totalCount.total,
      test_data_matches: retrievedData?.nome === testData.nome
    };
    
    log(`✅ Quiz DB funcionando - Total de registros: ${totalCount.total}`);
    
  } catch (quizError) {
    debug.quiz_test = {
      success: false,
      error: quizError.message,
      stack: quizError.stack?.substring(0, 300)
    };
    log('❌ Erro no sistema do quiz: ' + quizError.message);
  }
  
  // Resumo final
  const summary = {
    file_system_ok: !debug.file_system.error,
    database_ok: debug.database.success,
    quiz_system_ok: debug.quiz_test.success,
    overall_status: (!debug.file_system.error && debug.database.success && debug.quiz_test.success) ? 'HEALTHY' : 'ISSUES_DETECTED'
  };
  
  debug.summary = summary;
  log(`🎯 Status geral: ${summary.overall_status}`);
  
  // Status HTTP baseado no resultado
  const statusCode = summary.overall_status === 'HEALTHY' ? 200 : 500;
  
  res.status(statusCode).json(debug);
}