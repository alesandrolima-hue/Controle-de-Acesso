async function enviar(){

try{

let dados={

nome:document.getElementById("nome").value,
matricula:document.getElementById("matricula").value,
empresa:document.getElementById("empresa").value,
sala:document.getElementById("sala").value,
tipo:document.getElementById("tipo").value,
motivo:document.getElementById("motivo").value,
assinatura:"",
latitude:"",
longitude:"",
dispositivo:navigator.userAgent

};

const resposta = await fetch("https://script.google.com/macros/s/AKfycbzgQiAwIv_Yd4i5HO1vD81XfFeRcmuxLQoVhlLoK9Ygdz0mwMay6C8YTi3pDX72so9w7w/exec",{

method:"POST",

headers:{
"Content-Type":"text/plain;charset=utf-8"
},

body:JSON.stringify(dados)

});

console.log("Status:", resposta.status);

const texto = await resposta.text();

console.log("Resposta:", texto);

alert(texto);

}catch(erro){

console.error(erro);

alert(erro);

}

}
