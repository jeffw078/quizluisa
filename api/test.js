// api/test.js - Função de teste para verificar se as APIs estão funcionando
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  const testInfo = {
    success: true,
    message: 'API funcionando corretamente!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: {
      'user-agent': req.headers['user-agent'],
      'host': req.headers.host
    },
    vercel: {
      region: process.env.VERCEL_REGION || 'unknown',
      env: process.env.NODE_ENV || 'unknown'
    }
  };
  
  console.log('API Test chamada:', testInfo);
  
  res.status(200).json(testInfo);
}