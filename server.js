const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(express.json());

const dbPath = path.join(__dirname, 'respostas.json');

app.post('/salvar', (req, res) => {
  const resposta = req.body;
  let data = [];

  try {
    data = JSON.parse(fs.readFileSync(dbPath));
  } catch (e) {}

  data.push(resposta);
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  res.status(200).send({ ok: true });
});

app.get('/mensagens', (req, res) => {
  const dados = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath)) : [];
  const mensagens = dados.filter(d => d.mensagem && d.mensagem.trim() !== '');
  res.json(mensagens);
});

app.get('/resultados', (req, res) => {
  const dados = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath)) : [];
  res.json(dados);
});

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
