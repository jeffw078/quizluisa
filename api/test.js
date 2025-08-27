// api/test.js - Função de teste completa
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  console.log('🧪 API de teste chamada');
  
  const testResults = {
    success: true,
    message: 'API funcionando!',
    timestamp: new Date().toISOString(),
    request: {
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent']?.substring(0, 100),
        'host': req.headers.host,
        'content-type': req.headers['content-type']
      }
    },
    environment: {
      node_version: process.version,
      platform: process.platform,
      memory_usage: process.memoryUsage(),
      env: process.env.NODE_ENV || 'unknown',
      vercel_region: process.env.VERCEL_REGION || 'unknown'
    },
    tests: {}
  };
  
  // Teste 1: Teste básico
  testResults.tests.basic = {
    status: 'PASS',
    message: 'API respondendo corretamente'
  };
  
  // Teste 2: Teste do SQLite
  try {
    const Database = await import('better-sqlite3');
    const db = new Database.default('/tmp/test.db');
    
    // Criar tabela de teste
    db.exec('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, data TEXT)');
    
    // Inserir dados de teste
    const stmt = db.prepare('INSERT INTO test (data) VALUES (?)');
    const result = stmt.run('test-data-' + Date.now());
    
    // Buscar dados
    const row = db.prepare('SELECT * FROM test WHERE id = ?').get(result.lastInsertRowid);
    
    db.close();
    
    testResults.tests.sqlite = {
      status: 'PASS',
      message: 'SQLite funcionando corretamente',
      details: {
        inserted_id: result.lastInsertRowid,
        retrieved_data: row?.data
      }
    };
    
  } catch (sqliteError) {
    testResults.tests.sqlite = {
      status: 'FAIL',
      message: 'SQLite não disponível',
      error: sqliteError.message
    };
  }
  
  // Teste 3: Teste de escrita de arquivo
  try {
    const fs = await import('fs/promises');
    const testFile = '/tmp/test-write.txt';
    await fs.writeFile(testFile, 'teste-' + Date.now());
    const content = await fs.readFile(testFile, 'utf8');
    await fs.unlink(testFile);
    
    testResults.tests.file_system = {
      status: 'PASS',
      message: 'Sistema de arquivos funcionando',
      details: { content_written: content.length > 0 }
    };
    
  } catch (fsError) {
    testResults.tests.file_system = {
      status: 'FAIL',
      message: 'Erro no sistema de arquivos',
      error: fsError.message
    };
  }
  
  // Teste 4: Teste de POST
  if (req.method === 'POST') {
    testResults.tests.post_data = {
      status: 'PASS',
      message: 'Dados POST recebidos',
      body: req.body
    };
  }
  
  // Resumo dos testes
  const passCount = Object.values(testResults.tests).filter(t => t.status === 'PASS').length;
  const totalTests = Object.keys(testResults.tests).length;
  
  testResults.summary = {
    total_tests: totalTests,
    passed: passCount,
    failed: totalTests - passCount,
    success_rate: `${Math.round((passCount / totalTests) * 100)}%`
  };
  
  console.log('✅ Testes completados:', testResults.summary);
  
  res.status(200).json(testResults);
}