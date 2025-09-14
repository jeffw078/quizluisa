// salvar-ranking.js
// Configuração do Supabase
const SUPABASE_URL = 'https://wnzdcucbveynkwgoskwg.supabase.co'; // Substitua pela sua URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduemRjdWNidmV5bmt3Z29za3dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzgyODUsImV4cCI6MjA3MTkxNDI4NX0.2QeIFlwn4NLPWeMS_Ul8cauultfwUaHiGHY1XVyEcp0'; // Substitua pela sua chave anônima

// Inicializar cliente Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Função para salvar ou atualizar ranking do jogador
 * @param {string} nomeJogador - Nome do jogador
 * @param {number} pontuacao - Pontuação obtida
 * @param {number} tempoSegundos - Tempo gasto em segundos
 * @param {number} totalPerguntas - Total de perguntas do quiz
 * @param {number} acertos - Número de acertos
 */
async function salvarRanking(nomeJogador, pontuacao, tempoSegundos, totalPerguntas, acertos) {
    try {
        // Validar dados de entrada
        if (!nomeJogador || nomeJogador.trim() === '') {
            throw new Error('Nome do jogador é obrigatório');
        }
        
        if (typeof pontuacao !== 'number' || pontuacao < 0) {
            throw new Error('Pontuação deve ser um número válido');
        }

        // Preparar dados para salvar
        const dadosRanking = {
            nome_jogador: nomeJogador.trim(),
            pontuacao: pontuacao,
            tempo_segundos: tempoSegundos || 0,
            total_perguntas: totalPerguntas || 0,
            acertos: acertos || 0,
            percentual_acerto: totalPerguntas > 0 ? Math.round((acertos / totalPerguntas) * 100) : 0,
            data_jogo: new Date().toISOString()
        };

        console.log('Salvando ranking:', dadosRanking);

        // Tentar fazer upsert (inserir ou atualizar)
        // Se o jogador já existir, atualiza apenas se a nova pontuação for maior
        const { data: existingData, error: searchError } = await supabaseClient
            .from('ranking')
            .select('*')
            .eq('nome_jogador', nomeJogador.trim())
            .maybeSingle();

        if (searchError && searchError.code !== 'PGRST116') {
            console.error('Erro ao buscar jogador existente:', searchError);
            throw searchError;
        }

        let result;
        
        if (existingData) {
            // Jogador existe - atualizar apenas se a pontuação for maior
            if (pontuacao > existingData.pontuacao) {
                const { data, error } = await supabaseClient
                    .from('ranking')
                    .update({
                        pontuacao: pontuacao,
                        tempo_segundos: tempoSegundos,
                        total_perguntas: totalPerguntas,
                        acertos: acertos,
                        percentual_acerto: dadosRanking.percentual_acerto,
                        data_jogo: dadosRanking.data_jogo
                    })
                    .eq('nome_jogador', nomeJogador.trim())
                    .select();

                result = { data, error };
                
                if (!error) {
                    console.log('Ranking atualizado com sucesso!', data);
                    mostrarMensagemSucesso('Novo recorde! Ranking atualizado com sucesso!');
                } else {
                    console.error('Erro ao atualizar ranking:', error);
                    throw error;
                }
            } else {
                console.log('Pontuação atual não supera o recorde anterior');
                mostrarMensagemInfo(`Sua pontuação: ${pontuacao}. Recorde atual: ${existingData.pontuacao}`);
                return { success: true, message: 'Pontuação registrada, mas não supera o recorde' };
            }
        } else {
            // Novo jogador - inserir
            const { data, error } = await supabaseClient
                .from('ranking')
                .insert(dadosRanking)
                .select();

            result = { data, error };
            
            if (!error) {
                console.log('Ranking salvo com sucesso!', data);
                mostrarMensagemSucesso('Ranking salvo com sucesso!');
            } else {
                console.error('Erro ao salvar ranking:', error);
                throw error;
            }
        }

        // Verificar se houve erro
        if (result.error) {
            console.error('Erro detalhado:', result.error);
            mostrarMensagemErro('Erro ao salvar ranking: ' + result.error.message);
            return { success: false, error: result.error };
        }

        return { success: true, data: result.data };

    } catch (error) {
        console.error('Erro ao salvar ranking:', error);
        mostrarMensagemErro('Erro ao salvar ranking: ' + error.message);
        return { success: false, error: error };
    }
}

/**
 * Função para salvar resultado do quiz (versão simplificada)
 * @param {Object} resultadoQuiz - Objeto com os resultados do quiz
 */
async function salvarResultadoQuiz(resultadoQuiz) {
    const {
        nomeJogador,
        pontuacao,
        tempo,
        totalPerguntas,
        acertos
    } = resultadoQuiz;

    return await salvarRanking(nomeJogador, pontuacao, tempo, totalPerguntas, acertos);
}

/**
 * Função para mostrar mensagem de sucesso
 */
function mostrarMensagemSucesso(mensagem) {
    const div = document.createElement('div');
    div.className = 'mensagem-sucesso';
    div.innerHTML = `
        <div style="background: #d4edda; color: #155724; padding: 15px; margin: 10px 0; border-radius: 5px; border: 1px solid #c3e6cb;">
            <strong>✅ Sucesso!</strong> ${mensagem}
        </div>
    `;
    
    // Inserir a mensagem no topo da página ou em um container específico
    const container = document.getElementById('mensagens') || document.body;
    container.insertBefore(div, container.firstChild);
    
    // Remover mensagem após 5 segundos
    setTimeout(() => {
        div.remove();
    }, 5000);
}

/**
 * Função para mostrar mensagem de erro
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

/**
 * Função para mostrar mensagem informativa
 */
function mostrarMensagemInfo(mensagem) {
    const div = document.createElement('div');
    div.className = 'mensagem-info';
    div.innerHTML = `
        <div style="background: #d1ecf1; color: #0c5460; padding: 15px; margin: 10px 0; border-radius: 5px; border: 1px solid #bee5eb;">
            <strong>ℹ️ Info:</strong> ${mensagem}
        </div>
    `;
    
    const container = document.getElementById('mensagens') || document.body;
    container.insertBefore(div, container.firstChild);
    
    setTimeout(() => {
        div.remove();
    }, 6000);
}

// Função de exemplo para testar a conexão
async function testarConexao() {
    try {
        const { data, error } = await supabaseClient
            .from('ranking')
            .select('count(*)')
            .single();
            
        if (error) {
            console.error('Erro na conexão:', error);
            return false;
        }
        
        console.log('Conexão com Supabase OK!');
        return true;
    } catch (error) {
        console.error('Erro ao testar conexão:', error);
        return false;
    }
}

// Exportar funções para uso global
window.salvarRanking = salvarRanking;
window.salvarResultadoQuiz = salvarResultadoQuiz;
window.testarConexao = testarConexao;