// ==========================
// CONTROLE DE ACESSO - SCRIPT
// ==========================

// URL do Apps Script
const URL_API = "https://script.google.com/macros/s/AKfycbzgQiAwIv_Yd4i5HO1vD81XfFeRcmuxLQoVhlLoK9Ygdz0mwMay6C8YTi3pDX72so9w7w/exec";

// Canvas
let canvas;
let ctx;
let desenhando = false;

// Inicializa a página
window.onload = function () {

    canvas = document.getElementById("assinatura");
    ctx = canvas.getContext("2d");

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000000";

    // Mouse
    canvas.addEventListener("mousedown", iniciarDesenho);
    canvas.addEventListener("mousemove", desenhar);
    canvas.addEventListener("mouseup", pararDesenho);
    canvas.addEventListener("mouseleave", pararDesenho);

    // Celular
    canvas.addEventListener("touchstart", iniciarDesenho);
    canvas.addEventListener("touchmove", desenhar);
    canvas.addEventListener("touchend", pararDesenho);
};

function getPosicao(e){

    const rect = canvas.getBoundingClientRect();

    if(e.touches){

        return{
            x:e.touches[0].clientX-rect.left,
            y:e.touches[0].clientY-rect.top
        };

    }

    return{
        x:e.offsetX,
        y:e.offsetY
    };

}

function iniciarDesenho(e){

    desenhando = true;

    const p = getPosicao(e);

    ctx.beginPath();
    ctx.moveTo(p.x,p.y);

}

function desenhar(e){

    if(!desenhando) return;

    e.preventDefault();

    const p = getPosicao(e);

    ctx.lineTo(p.x,p.y);

    ctx.stroke();

}

function pararDesenho(){

    desenhando = false;

}

function limparAssinatura(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

}

async function enviar(){

try{

const assinatura = canvas.toDataURL("image/png");

let dados={

nome:document.getElementById("nome").value,
matricula:document.getElementById("matricula").value,
empresa:document.getElementById("empresa").value,
sala:document.getElementById("sala").value,
tipo:document.getElementById("tipo").value,
motivo:document.getElementById("motivo").value,
assinatura:assinatura,
latitude:"",
longitude:"",
dispositivo:navigator.userAgent

};

const resposta = await fetch(URL_API,{

method:"POST",

headers:{
"Content-Type":"text/plain;charset=utf-8"
},

body:JSON.stringify(dados)

});

const retorno = await resposta.json();

if(retorno.sucesso){

alert("Registro salvo com sucesso!");

document.getElementById("nome").value="";
document.getElementById("matricula").value="";
document.getElementById("empresa").value="";
document.getElementById("motivo").value="";
document.getElementById("sala").selectedIndex=0;
document.getElementById("tipo").selectedIndex=0;

limparAssinatura();

}else{

alert(retorno.erro);

}

}catch(erro){

console.error(erro);

alert("Erro: " + erro);

}

}
