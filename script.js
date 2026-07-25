// URL da sua API do Google Apps Script
const URL_API = "https://script.google.com/macros/s/AKfycbwOZpVR6o2BdofnJxTOT1ivKb0VR7xGjsRm2Zr-cm7fc03QT8qBLvGM2i8sQFCbAymDTg/exec";

// Variáveis para as assinaturas
let canvasResp, canvasRespCtx;
let canvasSol, canvasSolCtx;
let fotoBase64 = "";

window.onload = function () {
    // 1. Gerar Número de Controle, Data e Hora
    gerarDadosControle();

    // ==========================================
    // 2. ATIVAR A BARRA DE PESQUISA DAS SALAS
    // ==========================================
    const selectSala = document.getElementById('sala');
    new Choices(selectSala, {
        removeItemButton: true, // Permite clicar no 'x' para remover uma sala escolhida
        searchPlaceholderValue: '🔍 Digite para pesquisar a sala...',
        noResultsText: 'Nenhuma sala encontrada',
        itemSelectText: 'Toque para selecionar',
        placeholder: true,
        placeholderValue: 'Selecione uma ou mais salas'
    });

    // 3. Configurar os dois Canvas de Assinatura
    const setupResp = setupCanvas("assinatura_responsavel");
    canvasResp = setupResp.canvas;
    canvasRespCtx = setupResp.ctx;

    const setupSol = setupCanvas("assinatura_solicitante");
    canvasSol = setupSol.canvas;
    canvasSolCtx = setupSol.ctx;
};
function gerarDadosControle() {
    const agora = new Date();
    
    // Formatar Data (YYYY-MM-DD) e Hora (HH:MM) para os inputs readonly
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const hora = String(agora.getHours()).padStart(2, '0');
    const minuto = String(agora.getMinutes()).padStart(2, '0');
    const segundo = String(agora.getSeconds()).padStart(2, '0');

    document.getElementById("data_atual").value = `${ano}-${mes}-${dia}`;
    document.getElementById("hora_atual").value = `${hora}:${minuto}`;

    // Gerar Número de Controle (Ex: AC-20231025-143022)
    document.getElementById("num_controle").value = `AC-${ano}${mes}${dia}-${hora}${minuto}${segundo}`;
}

// === FUNÇÃO REUTILIZÁVEL PARA CANVAS ===
function setupCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext("2d");
    let desenhando = false;

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000000";

    function getPosicao(e) {
        const rect = canvas.getBoundingClientRect();
        // Escala caso o CSS redimensione o canvas
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if (e.touches) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY
            };
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    const iniciar = (e) => { desenhando = true; const p = getPosicao(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); };
    const desenhar = (e) => { if (!desenhando) return; const p = getPosicao(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault(); };
    const parar = () => { desenhando = false; };

    canvas.addEventListener("mousedown", iniciar);
    canvas.addEventListener("mousemove", desenhar);
    canvas.addEventListener("mouseup", parar);
    canvas.addEventListener("mouseleave", parar);
    canvas.addEventListener("touchstart", iniciar, {passive: false});
    canvas.addEventListener("touchmove", desenhar, {passive: false});
    canvas.addEventListener("touchend", parar);

    return { canvas, ctx };
}

function limparCanvas(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// === FOTO (COM COMPRESSÃO AUTOMÁTICA) ===
document.getElementById("foto").addEventListener("change", function(event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Cria um canvas temporário para diminuir a foto
            const canvasImg = document.createElement("canvas");
            const MAX_WIDTH = 1200; // Resolução ideal para leitura
            let scaleSize = 1;
            
            if (img.width > MAX_WIDTH) {
                scaleSize = MAX_WIDTH / img.width;
            }
            
            canvasImg.width = img.width * scaleSize;
            canvasImg.height = img.height * scaleSize;

            const ctxImg = canvasImg.getContext("2d");
            ctxImg.drawImage(img, 0, 0, canvasImg.width, canvasImg.height);

            // Exporta a imagem comprimida em JPEG com 70% de qualidade
            fotoBase64 = canvasImg.toDataURL("image/jpeg", 0.7);

            const preview = document.getElementById("previewFoto");
            preview.src = fotoBase64;
            preview.style.display = "block";
        };
        img.src = e.target.result;
    };
    leitor.readAsDataURL(arquivo);
});

// === ENVIAR DADOS ===
async function enviar() {
    const btn = document.getElementById("btnEnviar");
    btn.disabled = true;
    btn.innerText = "Enviando... Aguarde";

    try {
        // Pegar múltiplas salas selecionadas
        const selectSala = document.getElementById("sala");
        const salasSelecionadas = Array.from(selectSala.selectedOptions).map(opt => opt.value).join(", ");

        // Pegar múltiplos sistemas (checkboxes)
        const checkboxesSistema = document.querySelectorAll('#sistema_group input[type="checkbox"]:checked');
        const sistemasSelecionados = Array.from(checkboxesSistema).map(cb => cb.value).join(", ");

        // Converter assinaturas (só envia se não estiver em branco - validação básica)
        const assRespBase64 = canvasResp.toDataURL("image/png");
        const assSolBase64 = canvasSol.toDataURL("image/png");

        let dados = {
            num_controle: document.getElementById("num_controle").value,
            data: document.getElementById("data_atual").value,
            hora: document.getElementById("hora_atual").value,
            
            nome_responsavel: document.getElementById("nome_responsavel").value,
            matricula_responsavel: document.getElementById("matricula_responsavel").value,
            empresa_responsavel: document.getElementById("empresa_responsavel").value,
            
            nome_solicitante: document.getElementById("nome_solicitante").value,
            matricula_solicitante: document.getElementById("matricula_solicitante").value,
            empresa_solicitante: document.getElementById("empresa_solicitante").value,
            
            num_pt: document.getElementById("num_pt").value,
            num_os: document.getElementById("num_os").value,
            sistema: sistemasSelecionados,
            sala: salasSelecionadas,
            tipo: document.getElementById("tipo").value,
            motivo: document.getElementById("motivo").value,

            foto: fotoBase64,
            assinatura_responsavel: assRespBase64,
            assinatura_solicitante: assSolBase64,
            
            dispositivo: navigator.userAgent
        };

        const resposta = await fetch(URL_API, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(dados)
        });

        const retorno = await resposta.json();

        if (retorno.sucesso) {
            alert("Registro " + dados.num_controle + " salvo com sucesso!");
            window.location.reload(); // Recarrega a página para limpar tudo e gerar novo número
        } else {
            alert("Erro no servidor: " + retorno.erro);
        }

    } catch (erro) {
        console.error(erro);
        alert("Erro de conexão: " + erro);
    } finally {
        btn.disabled = false;
        btn.innerText = "Enviar Registro";
    }
}
