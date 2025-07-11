let currentQuestion = 0;
let questions = [];

fetch('questions.json')
  .then(res => res.json())
  .then(data => {
    questions = data;
    showQuestion();
  });

function showQuestion() {
  const q = questions[currentQuestion];
  const container = document.getElementById('quiz-container');
  const nextBtn = document.getElementById('next-button');

  container.innerHTML = `
    <div class="question">${q.pergunta}</div>
    ${q.respostas.map((r, i) => `<button class="answer" data-index="${i}">${r}</button>`).join('')}
  `;

  nextBtn.disabled = true;

  document.querySelectorAll('.answer').forEach(btn => {
    btn.addEventListener('click', e => {
      const index = parseInt(e.target.dataset.index);
      const correct = index === q.correta;

      btn.classList.add(correct ? 'correct' : 'incorrect');
      saveAnswer(q.pergunta, q.respostas[index], correct);

      document.querySelectorAll('.answer').forEach(b => b.disabled = true);
      nextBtn.disabled = false;
    });
  });

  nextBtn.onclick = () => {
    currentQuestion++;
    if (currentQuestion < questions.length) {
      showQuestion();
    } else {
      container.innerHTML = "<h2>Obrigada por participar do quiz da Luísa! 💕</h2>";
      nextBtn.style.display = "none";
    }
  };
}

function saveAnswer(pergunta, resposta, correta) {
  fetch('/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pergunta, resposta, correta, timestamp: new Date() })
  });
}
