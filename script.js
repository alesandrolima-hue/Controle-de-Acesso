// ==========================
// CONTROLE DE ACESSO - SCRIPT COMPLETO
// ==========================

// IMPORTANTE: Cole sua URL real do Apps Script aqui
const URL_API = "https://script.google.com/macros/s/AKfycbyKAQbYe4F8bkwKaUxhzOEsPfLnnhGl0DJXeknah3hKXXK79brf4F437NkmrlvrasZ_Uw/exec";

let canvasResp, canvasRespCtx;
let canvasSol, canvasSolCtx;
let fotoBase64 = "";

window.onload = function () {
    try {
        // 1. Gerar Número de Controle, Data e Hora
        gerarDadosControle();

        // 2. Ativar a barra de pesquisa das Salas (Choices.js)
        const selectSala = document.getElementById('sala');
        if(selectSala) {
            new Choices(selectSala, {
                removeItemButton: true,
                searchPlaceholderValue: '🔍 Digite para pesquisar a sala...',
                noResultsText: 'Nenhuma sala encontrada',
                itemSelectText: 'Toque para selecionar',
                placeholder: true,
                placeholderValue: 'Selecione uma ou mais salas'
            });
        }

        // 3. Configurar os dois Canvas de Assinatura
        const setupResp = setupCanvas("assinatura_responsavel");
        canvasResp = setupResp.canvas;
        canvasRespCtx = setupResp.ctx;

        const setupSol = setupCanvas("assinatura_solicitante");
        canvasSol = setupSol.canvas;
        canvasSolCtx = setupSol.ctx;

    } catch (erro) {
        console.error("Erro ao iniciar a página:", erro);
        alert("Erro ao carregar os recursos: " + erro.message);
    }
};

function gerarDadosControle() {
    const agora = new Date();
    
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const hora = String(agora.getHours()).padStart(2, '0');
    const minuto = String(agora.getMinutes()).padStart(2, '0');
    const segundo = String(agora.getSeconds()).padStart(2, '0');

    document.getElementById("data_atual").value = `${ano}-${mes}-${dia}`;
    document.getElementById("hora_atual").value = `${hora}:${minuto}`;
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
    if(ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// Garante que a variável seja global desde o início
window.fotoBase64 = "";

// === FOTO COM COMPRESSÃO (À PROVA DE FALHAS) ===
document.getElementById("foto").addEventListener("change", function(event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    // Trava o botão para o usuário não clicar antes da hora
    const btn = document.getElementById("btnEnviar");
    btn.disabled = true;
    btn.innerText = "Processando foto... Aguarde";

    const leitor = new FileReader();
    
    leitor.onload = function(e) {
        const rawBase64 = e.target.result; // A foto crua, original
        const img = new Image();
        
        img.onload = function() {
            try {
                const canvasImg = document.createElement("canvas");
                const MAX_WIDTH = 1200; 
                let scaleSize = 1;
                
                if (img.width > MAX_WIDTH) {
                    scaleSize = MAX_WIDTH / img.width;
                }
                
                canvasImg.width = img.width * scaleSize;
                canvasImg.height = img.height * scaleSize;

                const ctxImg = canvasImg.getContext("2d");
                ctxImg.drawImage(img, 0, 0, canvasImg.width, canvasImg.height);

                // Plano A: Salva a foto comprimida
                window.fotoBase64 = canvasImg.toDataURL("image/jpeg", 0.7);
                
            } catch (erroCanvas) {
                // Plano B: Se o celular falhar na compressão, usa a foto original
                console.warn("Falha na compressão, usando original.", erroCanvas);
                window.fotoBase64 = rawBase64;
                
            } finally {
                // Mostra a miniatura e libera o botão
                const preview = document.getElementById("previewFoto");
                preview.src = window.fotoBase64;
                preview.style.display = "block";
                
                btn.disabled = false;
                btn.innerText = "Enviar Registro";
            }
        };

        // Plano C: Se o objeto de imagem corromper
        img.onerror = function() {
             window.fotoBase64 = rawBase64;
             const preview = document.getElementById("previewFoto");
             preview.src = window.fotoBase64;
             preview.style.display = "block";
             
             btn.disabled = false;
             btn.innerText = "Enviar Registro";
        };

        img.src = rawBase64;
    };
    
    leitor.readAsDataURL(arquivo);
});
// === ENVIAR DADOS ===
async function enviar() {
    // Adicione esta linha de bloqueio:
    if (fotoBase64 === "") { alert("Por favor, tire a foto do ambiente antes de enviar!"); return; }
        const btn = document.getElementById("btnEnviar");
    btn.disabled = true;
    btn.innerText = "Enviando... Aguarde";

    try {
        const selectSala = document.getElementById("sala");
        const salasSelecionadas = Array.from(selectSala.selectedOptions).map(opt => opt.value).join(", ");

        const checkboxesSistema = document.querySelectorAll('#sistema_group input[type="checkbox"]:checked');
        const sistemasSelecionados = Array.from(checkboxesSistema).map(cb => cb.value).join(", ");

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

        const textoBruto = await resposta.text();

        try {
            const retorno = JSON.parse(textoBruto);
            if (retorno.sucesso) {
                alert("Registro " + dados.num_controle + " salvo com sucesso!");
                window.location.reload(); 
            } else {
                alert("Erro no servidor: " + retorno.erro);
            }
        } catch (erroParse) {
            console.error("Servidor retornou HTML: \n", textoBruto);
            const pedacoErro = textoBruto.substring(0, 150);
            alert("Bloqueio do Google (Provavelmente você não gerou uma nova URL Deploy). Resposta: \n\n" + pedacoErro);
        }

    } catch (erro) {
        console.error(erro);
        alert("Erro de conexão: " + erro);
    } finally {
        btn.disabled = false;
        btn.innerText = "Enviar Registro";
    }
}
