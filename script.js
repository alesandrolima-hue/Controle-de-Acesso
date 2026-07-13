async function enviar(){

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

const resposta=await fetch("https://script.google.com/macros/s/AKfycbzgQiAwIv_Yd4i5HO1vD81XfFeRcmuxLQoVhlLoK9Ygdz0mwMay6C8YTi3pDX72so9w7w/exec",{

method:"POST",

headers:{

"Content-Type":"text/plain;charset=utf-8"

},

body:JSON.stringify(dados)

});

const retorno=await resposta.json();

if(retorno.sucesso){

alert("Registro salvo com sucesso!");

document.querySelectorAll("input,textarea").forEach(c=>c.value="");

document.getElementById("sala").selectedIndex=0;

document.getElementById("tipo").selectedIndex=0;

}else{

alert(retorno.erro);

}

}
