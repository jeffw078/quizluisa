// salvar-ranking.js
// Configuração do Supabase
const SUPABASE_URL = 'https://wnzdcucbveynkwgoskwg.supabase.co'; // URL corrigida (sem ponto e vírgula)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduemRjdWNidmV5bmt3Z29za3dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzgyODUsImV4cCI6MjA3MTkxNDI4NX0.2QeIFlwn4NLPWeMS_Ul8cauultfwUaHiGHY1XVyEcp0';

// Aguardar o Supabase estar disponível
let supabaseClient;

function inicializarSupabase() {
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabaseClient = supabaseClient;
        console.log('✅ Supabase inicializado com sucesso!');
        return true;
    } else {
        console.log('⚠️ Supabase ainda não está disponível');
        return false;
    }
}

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
        console.log('🎮 Iniciando salvamento do ranking...');
        console.log('Dados recebidos:', { nomeJogador, pontuacao, tempoSegundos, totalPerguntas, acertos });

        // Inicializar Supabase se necessário
        if (!supabaseClient) {
            if (!inicializarSupabase()) {
                throw new Error('Supabase não está disponível');
            }
        }

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
            total_perguntas: totalPerguntas || Math.floor(pontuacao / 10), // Estimativa baseada na pontuação
            acertos: acertos || Math.floor(pontuacao / 10), // Estimativa baseada na pontuação
            percentual_acerto: totalPerguntas > 0 ? Math.round((acertos / totalPerguntas) * 100) : 100,
            data_jogo: new Date().toISOString()
        };

        console.log('💾 Salvando ranking:', dadosRanking);

        // Verificar se o jogador já existe
        const { data: existingData, error: searchError } = await supabaseClient
            .from('ranking')
            .select('*')
            .eq('nome_jogador', nomeJogador.trim())
            .maybeSingle();

        if (searchError && searchError.code !== 'PGRST116') {
            console.error('❌ Erro ao buscar jogador existente:', searchError);
            throw searchError;
        }

        let result;
        
        if (existingData) {
            console.log('👤 Jogador existente encontrado:', existingData);
            // Jogador existe - atualizar apenas se a pontuação for maior
            if (pontuacao > existingData.pontuacao) {
                console.log('🏆 Nova pontuação é maior! Atualizando...');
                const { data, error } = await supabaseClient
                    .from('ranking')
                    .update({
                        pontuacao: pontuacao,
                        tempo_segundos: tempoSegundos,
                        total_perguntas: dadosRanking.total_perguntas,
                        acertos: dadosRanking.acertos,
                        percentual_acerto: dadosRanking.percentual_acerto,
                        data_jogo: dadosRanking.data_jogo
                    })
                    .eq('nome_jogador', nomeJogador.trim())
                    .select();

                result = { data, error };
                
                if (!error) {
                    console.log('✅ Ranking atualizado com sucesso!', data);
                    mostrarMensagemSucesso('Novo recorde! Ranking atualizado com sucesso!');
                } else {
                    console.error('❌ Erro ao atualizar ranking:', error);
                    throw error;
                }
            } else {
                console.log('📊 Pontuação atual não supera o recorde anterior');
                mostrarMensagemInfo(`Sua pontuação: ${pontuacao}. Recorde atual: ${existingData.pontuacao}`);
                return { success: true, message: 'Pontuação registrada, mas não supera o recorde' };
            }
        } else {
            console.log('🆕 Novo jogador! Inserindo...');
            // Novo jogador - inserir
            const { data, error } = await supabaseClient
                .from('ranking')
                .insert(dadosRanking)
                .select();

            result = { data, error };
            
            if (!error) {
                console.log('✅ Ranking salvo com sucesso!', data);
                mostrarMensagemSucesso('Ranking salvo com sucesso!');
            } else {
                console.error('❌ Erro ao salvar ranking:', error);
                throw error;
            }
        }

        // Verificar se houve erro
        if (result.error) {
            console.error('❌ Erro detalhado:', result.error);
            mostrarMensagemErro('Erro ao salvar ranking: ' + result.error.message);
            return { success: false, error: result.error };
        }

        console.log('🎉 Operação concluída com sucesso!');
        return { success: true, data: result.data };

    } catch (error) {
        console.error('💥 Erro geral ao salvar ranking:', error);
        mostrarMensagemErro('Erro ao salvar ranking: ' + error.message);
        
        // Fallback: salvar no localStorage
        try {
            console.log('🔄 Tentando salvar no localStorage como backup...');
            salvarNoLocalStorage(nomeJogador, pontuacao, tempoSegundos);
        } catch (localError) {
            console.error('❌ Erro também no localStorage:', localError);
        }
        
        return { success: false, error: error };
    }
}

/**
 * Função de backup para salvar no localStorage
 */
function salvarNoLocalStorage(nomeJogador, pontuacao, tempoSegundos) {
    try {
        const rankings = JSON.parse(localStorage.getItem('pinwheelRankings') || '[]');
        
        const novoRanking = {
            nome: nomeJogador,
            pontuacao: pontuacao,
            tempo: tempoSegundos,
            data: new Date().toLocaleString('pt-BR')
        };
        
        // Verificar se jogador já existe
        const indexExistente = rankings.findIndex(r => r.nome.toLowerCase() === nomeJogador.toLowerCase());
        
        if (indexExistente >= 0) {
            // Atualizar apenas se pontuação for maior
            if (pontuacao > rankings[indexExistente].pontuacao) {
                rankings[indexExistente] = novoRanking;
                console.log('📱 Ranking atualizado no localStorage');
            }
        } else {
            // Adicionar novo
            rankings.push(novoRanking);
            console.log('📱 Novo ranking salvo no localStorage');
        }
        
        // Ordenar e manter apenas top 10
        rankings.sort((a, b) => b.pontuacao - a.pontuacao);
        rankings.splice(10);
        
        localStorage.setItem('pinwheelRankings', JSON.stringify(rankings));
        
    } catch (error) {
        console.error('❌ Erro ao salvar no localStorage:', error);
    }
}

/**
 * Função para testar a conexão
 */
async function testarConexao() {
    try {
        if (!supabaseClient) {
            if (!inicializarSupabase()) {
                return false;
            }
        }

        console.log('🔍 Testando conexão com Supabase...');
        
        const { data, error } = await supabaseClient
            .from('ranking')
            .select('count(*)')
            .single();
            
        if (error) {
            console.error('❌ Erro na conexão:', error);
            return false;
        }
        
        console.log('✅ Conexão com Supabase OK!', data);
        return true;
    } catch (error) {
        console.error('💥 Erro ao testar conexão:', error);
        return false;
    }
}

/**
 * Função para mostrar mensagem de sucesso
 */
function mostrarMensagemSucesso(mensagem) {
    console.log('✅', mensagem);
    // Criar elemento visual se estiver em uma página web
    if (typeof document !== 'undefined') {
        const div = document.createElement('div');
        div.className = 'mensagem-sucesso';
        div.innerHTML = `
            <div style="background: #d4edda; color: #155724; padding: 15px; margin: 10px 0; border-radius: 5px; border: 1px solid #c3e6cb; position: fixed; top: 20px; right: 20px; z-index: 10000; max-width: 400px;">
                <strong>✅ Sucesso!</strong> ${mensagem}
            </div>
        `;
        
        document.body.appendChild(div);
        
        setTimeout(() => {
            div.remove();
        }, 5000);
    }
}

/**
 * Função para mostrar mensagem de erro
 */
function mostrarMensagemErro(mensagem) {
    console.error('❌', mensagem);
    if (typeof document !== 'undefined') {
        const div = document.createElement('div');
        div.className = 'mensagem-erro';
        div.innerHTML = `
            <div style="background: #f8d7da; color: #721c24; padding: 15px; margin: 10px 0; border-radius: 5px; border: 1px solid #f5c6cb; position: fixed; top: 20px; right: 20px; z-index: 10000; max-width: 400px;">
                <strong>❌ Erro!</strong> ${mensagem}
            </div>
        `;
        
        document.body.appendChild(div);
        
        setTimeout(() => {
            div.remove();
        }, 8000);
    }
}

/**
 * Função para mostrar mensagem informativa
 */
function mostrarMensagemInfo(mensagem) {
    console.log('ℹ️', mensagem);
    if (typeof document !== 'undefined') {
        const div = document.createElement('div');
        div.className = 'mensagem-info';
        div.innerHTML = `
            <div style="background: #d1ecf1; color: #0c5460; padding: 15px; margin: 10px 0; border-radius: 5px; border: 1px solid #bee5eb; position: fixed; top: 20px; right: 20px; z-index: 10000; max-width: 400px;">
                <strong>ℹ️ Info:</strong> ${mensagem}
            </div>
        `;
        
        document.body.appendChild(div);
        
        setTimeout(() => {
            div.remove();
        }, 6000);
    }
}

// Inicializar quando o script carregar
if (typeof document !== 'undefined') {
    // Se o DOM já estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(inicializarSupabase, 1000); // Aguardar 1 segundo para garantir que o Supabase carregou
        });
    } else {
        setTimeout(inicializarSupabase, 1000);
    }
}

// Exportar funções para uso global
window.salvarRanking = salvarRanking;
window.testarConexao = testarConexao;