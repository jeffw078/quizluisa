// ranking-jogo.js
// Configuração do Supabase (deve ser a mesma do salvar-ranking.js)
const SUPABASE_URL = 'https://wnzdcucbveynkwgoskwg.supabase.co' // Substitua pela sua URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduemRjdWNidmV5bmt3Z29za3dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzgyODUsImV4cCI6MjA3MTkxNDI4NX0.2QeIFlwn4NLPWeMS_Ul8cauultfwUaHiGHY1XVyEcp0'; // Substitua pela sua chave anônima

// Inicializar cliente Supabase (verificar se já foi inicializado)
let supabaseClient;
if (typeof window.supabaseClient !== 'undefined') {
    supabaseClient = window.supabaseClient;
} else {
    const { createClient } = supabase;
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = supabaseClient;
}

/**
 * Função para buscar ranking dos jogadores
 * @param {number} limite - Número máximo de jogadores a retornar (padrão: 10)
 * @param {string} ordenarPor - Campo para ordenação (padrão: 'pontuacao')
 * @returns {Promise<Array>} Lista dos melhores jogadores
 */
async function buscarRanking(limite = 10, ordenarPor = 'pontuacao') {
    try {
        console.log(`Buscando ranking - limite: ${limite}, ordenar por: ${ordenarPor}`);

        const { data, error } = await supabaseClient
            .from('ranking')
            .select(`
                nome_jogador,
                pontuacao,
                tempo_segundos,
                total_perguntas,
                acertos,
                percentual_acerto,
                data_jogo
            `)
            .order(ordenarPor, { ascending: false })
            .order('tempo_segundos', { ascending: true }) // Em caso de empate, menor tempo ganha
            .limit(limite);

        if (error) {
            console.error('Erro ao buscar ranking:', error);
            throw error;
        }

        console.log('Ranking encontrado:', data);
        return data || [];

    } catch (error) {
        console.error('Erro ao buscar ranking:', error);
        mostrarMensagemErro('Erro ao carregar ranking: ' + error.message);
        return [];
    }
}

/**
 * Função para exibir ranking na página
 * @param {string} containerId - ID do container onde exibir o ranking
 * @param {number} limite - Número de jogadores a exibir
 */
async function exibirRanking(containerId = 'ranking-container', limite = 10) {
    try {
        // Mostrar loading
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} não encontrado`);
            return;
        }

        container.innerHTML = '<div class="loading">🏆 Carregando ranking...</div>';

        // Buscar dados
        const rankingData = await buscarRanking(limite);

        // Gerar HTML do ranking
        if (rankingData.length === 0) {
            container.innerHTML = `
                <div class="ranking-vazio">
                    <h3>🏆 Ranking</h3>
                    <p>Nenhum jogador encontrado ainda. Seja o primeiro!</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="ranking-header">
                <h3>🏆 Ranking dos Melhores Jogadores</h3>
                <p>Top ${rankingData.length} jogadores</p>
            </div>
            <div class="ranking-lista">
        `;

        rankingData.forEach((jogador, index) => {
            const posicao = index + 1;
            const emoji = obterEmojiPosicao(posicao);
            const dataFormatada = formatarData(jogador.data_jogo);
            const tempoFormatado = formatarTempo(jogador.tempo_segundos);

            html += `
                <div class="ranking-item ${posicao <= 3 ? 'top-3' : ''}" data-posicao="${posicao}">
                    <div class="posicao">
                        <span class="numero">${posicao}</span>
                        <span class="emoji">${emoji}</span>
                    </div>
                    <div class="jogador-info">
                        <div class="nome">${escapeHtml(jogador.nome_jogador)}</div>
                        <div class="stats">
                            <span class="pontuacao">🎯 ${jogador.pontuacao} pts</span>
                            <span class="acertos">✅ ${jogador.acertos}/${jogador.total_perguntas} (${jogador.percentual_acerto}%)</span>
                            <span class="tempo">⏱️ ${tempoFormatado}</span>
                            <span class="data">📅 ${dataFormatada}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
            </div>
            <div class="ranking-footer">
                <button onclick="atualizarRanking('${containerId}', ${limite})" class="btn-atualizar">
                    🔄 Atualizar Ranking
                </button>
            </div>
        `;

        container.innerHTML = html;

        // Aplicar estilos
        aplicarEstilosRanking();

    } catch (error) {
        console.error('Erro ao exibir ranking:', error);
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="ranking-erro">
                    <h3>❌ Erro ao Carregar Ranking</h3>
                    <p>Não foi possível carregar o ranking. Tente novamente.</p>
                    <button onclick="exibirRanking('${containerId}', ${limite})" class="btn-tentar-novamente">
                        Tentar Novamente
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Função para atualizar ranking (recarregar)
 */
async function atualizarRanking(containerId = 'ranking-container', limite = 10) {
    await exibirRanking(containerId, limite);
}

/**
 * Função para buscar posição de um jogador específico
 * @param {string} nomeJogador - Nome do jogador
 */
async function buscarPosicaoJogador(nomeJogador) {
    try {
        const { data, error } = await supabaseClient
            .from('ranking')
            .select('nome_jogador, pontuacao')
            .order('pontuacao', { ascending: false })
            .order('tempo_segundos', { ascending: true });

        if (error) {
            throw error;
        }

        const posicao = data.findIndex(jogador => 
            jogador.nome_jogador.toLowerCase() === nomeJogador.toLowerCase()
        ) + 1;

        return {
            posicao: posicao,
            total: data.length,
            encontrado: posicao > 0
        };

    } catch (error) {
        console.error('Erro ao buscar posição do jogador:', error);
        return { posicao: 0, total: 0, encontrado: false };
    }
}

/**
 * Função para obter emoji da posição
 */
function obterEmojiPosicao(posicao) {
    switch (posicao) {
        case 1: return '🥇';
        case 2: return '🥈';
        case 3: return '🥉';
        default: return '🏅';
    }
}

/**
 * Função para formatar data
 */
function formatarData(dataISO) {
    if (!dataISO) return 'N/A';
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Função para formatar tempo em segundos
 */
function formatarTempo(segundos) {
    if (!segundos || segundos <= 0) return 'N/A';
    
    const minutos = Math.floor(segundos / 60);
    const segsRestantes = segundos % 60;
    
    if (minutos > 0) {
        return `${minutos}m ${segsRestantes}s`;
    }
    return `${segsRestantes}s`;
}

/**
 * Função para escapar HTML
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Função para aplicar estilos CSS do ranking
 */
function aplicarEstilosRanking() {
    // Verificar se os estilos já foram aplicados
    if (document.getElementById('ranking-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'ranking-styles';
    style.textContent = `
        .ranking-header {
            text-align: center;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
        }

        .ranking-header h3 {
            margin: 0 0 10px 0;
            font-size: 24px;
        }

        .ranking-header p {
            margin: 0;
            opacity: 0.9;
        }

        .ranking-lista {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .ranking-item {
            display: flex;
            align-items: center;
            background: white;
            border-radius: 10px;
            padding: 15px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .ranking-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }

        .ranking-item.top-3 {
            border-left: 5px solid #ffd700;
        }

        .posicao {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-right: 20px;
            min-width: 60px;
        }

        .posicao .numero {
            font-size: 18px;
            font-weight: bold;
            color: #333;
        }

        .posicao .emoji {
            font-size: 24px;
            margin-top: 5px;
        }

        .jogador-info {
            flex: 1;
        }

        .nome {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
        }

        .stats {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            font-size: 14px;
            color: #666;
        }

        .stats span {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .pontuacao {
            font-weight: bold;
            color: #e74c3c !important;
        }

        .ranking-footer {
            text-align: center;
            margin-top: 20px;
        }

        .btn-atualizar, .btn-tentar-novamente {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s;
        }

        .btn-atualizar:hover, .btn-tentar-novamente:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .loading {
            text-align: center;
            padding: 40px;
            font-size: 18px;
            color: #666;
        }

        .ranking-vazio, .ranking-erro {
            text-align: center;
            padding: 40px;
            background: #f8f9fa;
            border-radius: 10px;
        }

        .ranking-erro {
            background: #f8d7da;
            color: #721c24;
        }

        @media (max-width: 768px) {
            .stats {
                flex-direction: column;
                gap: 8px;
            }
            
            .ranking-item {
                padding: 12px;
            }
            
            .posicao {
                margin-right: 15px;
                min-width: 50px;
            }
        }
    `;

    document.head.appendChild(style);
}

/**
 * Função para mostrar mensagem de erro (reutilizada do salvar-ranking.js)
 */
function mostrarMensagemErro(mensagem) {
    const div = document.createElement('div');
    div.className = 'mensagem-erro';
    div.innerHTML = `
        <div style="background: #f8d7da; color: #721c24; padding: 15px; margin: 10px 0; border-radius: 5px; border: 1px solid #f5c6cb;">
            <strong>❌ Erro!</strong> ${mensagem}
        </div>
    `;
    
    const container = document.getElementById('mensagens') || document.body;
    container.insertBefore(div, container.firstChild);
    
    setTimeout(() => {
        div.remove();
    }, 8000);
}

// Função de inicialização automática (executar quando o DOM estiver pronto)
document.addEventListener('DOMContentLoaded', function() {
    // Se existir um container de ranking na página, carregar automaticamente
    const rankingContainer = document.getElementById('ranking-container');
    if (rankingContainer) {
        exibirRanking('ranking-container');
    }
});

// Exportar funções para uso global
window.buscarRanking = buscarRanking;
window.exibirRanking = exibirRanking;
window.atualizarRanking = atualizarRanking;
window.buscarPosicaoJogador = buscarPosicaoJogador;