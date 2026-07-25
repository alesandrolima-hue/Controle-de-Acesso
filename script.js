// ==========================
// CONTROLE DE ACESSO - SCRIPT FINAL E BLINDADO
// ==========================

// IMPORTANTE: Cole sua URL real do Apps Script aqui!
const URL_API = "https://script.google.com/macros/s/AKfycbx2EeYEjMfLxF0zH9FfMa66szpWgkSIO9z_8fL1ttV6_nOZaxpg-MhacrGywwZdAjN_2g/exec";

let canvasResp, canvasRespCtx;
let canvasSol, canvasSolCtx;

window.onload = function () {
    try {
        gerarDadosControle();

        const selectSala = document.getElementById('sala');
        if(selectSala) {
            new Choices(selectSala, {
                removeItemButton: true,
                searchPlaceholderValue: '🔍 Digite para pesquisar...',
                noResultsText: 'Nenhuma sala encontrada',
                itemSelectText: 'Toque para selecionar',
                placeholder: true,
                placeholderValue: 'Selecione uma ou mais salas'
            });
        }

        const setupResp = setupCanvas("assinatura_responsavel");
        canvasResp = setupResp.canvas;
        canvasRespCtx = setupResp.ctx;

        const setupSol = setupCanvas("assinatura_solicitante");
        canvasSol = setupSol.canvas;
        canvasSolCtx = setupSol.ctx;

    } catch (erro) {
        console.error(erro);
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
            return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
        }
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
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
    if(ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// === FOTO: METODO DIRETO DA TELA ===
document.getElementById("foto").addEventListener("change", function(event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    const btn = document.getElementById("btnEnviar");
    btn.disabled = true;
    btn.innerText = "Carregando foto...";

    const leitor = new FileReader();
    leitor.onload = function(e) {
        const preview = document.getElementById("previewFoto");
        // Joga o código da imagem DIRETO na tag HTML que você vê na tela
        preview.src = e.target.result;
        preview.style.display = "block";
        
        btn.disabled = false;
        btn.innerText = "Enviar Registro";
    };
    leitor.readAsDataURL(arquivo);
});

// === ENVIAR DADOS ===
async function enviar() {
    const preview = document.getElementById("previewFoto");
    const fotoData = preview.src;

    // VALIDAÇÃO SUPREMA: Ele checa se a miniatura realmente apareceu na tela
    if (!fotoData || !fotoData.startsWith("data:image")) { 
        alert("A foto ainda não apareceu na tela. Tire a foto e aguarde a miniatura aparecer!"); 
        return; 
    }

    const btn = document.getElementById("btnEnviar");
    btn.disabled = true;
    btn.innerText = "Enviando... Aguarde";

    try {
        const selectSala = document.getElementById("sala");
        const salasSelecionadas = selectSala ? Array.from(selectSala.selectedOptions).map(opt => opt.value).join(", ") : "";

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
            
            // Pega a foto diretamente da miniatura da tela!
            foto: fotoData, 
            
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
            const pedacoErro = textoBruto.substring(0, 150);
            alert("Bloqueio do Google. Resposta: \n\n" + pedacoErro);
        }
    } catch (erro) {
        alert("Erro de conexão: " + erro);
    } finally {
        btn.disabled = false;
        btn.innerText = "Enviar Registro";
    }
}
