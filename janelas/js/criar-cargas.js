document
.getElementById("btnGerar")
.addEventListener("click", gerarLinhas);


let parceiros = [];



const FRETES = [
    "Granja",
    "Posto"
];


const TIPOS_SUINO = [
    "Padrão",
    "Plus",
    "Prime",
    "Matriz",
    "Matriz Macho",
    "Marrã",
    "Leitoa",
    "Leitão"
];


const PRAZOS = [
    ...Array.from(
        {length:30},
        (_,i)=>String(i+1)
    ),
    "32",
    "35",
    "40",
    "45",
    "Antecipado"
];


const DIAS = [
    "00-Sem data definida",
    "01-Domingo",
    "02-Segunda",
    "03-Terça",
    "04-Quarta",
    "05-Quinta",
    "06-Sexta",
    "07-Sábado"
];


const SEMANAS=[];


const ano =
new Date().getFullYear();


for(let i=1;i<=53;i++){

    SEMANAS.push(
        `${ano}/${String(i).padStart(2,"0")}`
    );

}



function authHeaders(){

return {

Authorization:
`Bearer ${localStorage.getItem("token")}`

};

}





async function carregarParceiros(){


try{


const resposta =
await fetch(
"/buscarParceiros",
{
headers:authHeaders()
}
);


parceiros =
await resposta.json();


console.log(
"PARCEIROS:",
parceiros
);


}

catch(err){

console.error(err);

}


}





function montarParceiro(tipo){


let lista =
parceiros
.filter(p=>p.tipo===tipo)
.sort(
(a,b)=>
a.nome_usual.localeCompare(
b.nome_usual
)
);



let html =
`
<select name="${tipo}">
<option value=""></option>
`;



lista.forEach(p=>{


html += `

<option
value="${p.pipefy_record_id}"
data-nome="${p.nome_usual}"
>

${p.nome_usual}

</option>

`;


});


html+="</select>";

return html;


}





function montarSelect(lista,nome){


let html =
`
<select name="${nome}">
<option></option>
`;


lista.forEach(x=>{


html+=`

<option value="${x}">
${x}
</option>

`;


});


html+="</select>";


return html;


}







function gerarLinhas(){


const total =
Number(
document.getElementById(
"totalCards"
).value
);



let html=`

<table>

<thead>

<tr>

<th>#</th>

<th>Comprador</th>

<th>Fornecedor</th>

<th>Frete</th>

<th>Tipo</th>

<th>Quantidade</th>

<th>Preço</th>

<th>Prazo</th>

<th>Embarque</th>

<th>Descarga</th>

<th>Dia</th>

<th>Semana</th>

<th>Qtd Cards</th>


</tr>

</thead>


<tbody>

`;




for(let i=1;i<=total;i++){


html+=`

<tr>


<td>${i}</td>


<td>
${montarParceiro("Comprador")}
</td>


<td>
${montarParceiro("Fornecedor")}
</td>


<td>
${montarSelect(FRETES,"frete")}
</td>


<td>
${montarSelect(TIPOS_SUINO,"tipo")}
</td>


<td>

<input
name="quantidade"
type="number"
>

</td>


<td>

<input
name="preco"
type="number"
step="0.01"
>

</td>


<td>
${montarSelect(PRAZOS,"prazo")}
</td>



<td>

<input
name="embarque"
type="datetime-local"
>

</td>



<td>

<input
name="descarga"
type="datetime-local"
>

</td>



<td>
${montarSelect(DIAS,"dia")}
</td>



<td>
${montarSelect(SEMANAS,"semana")}
</td>



<td>

<input
name="cards"
type="number"
value="1"
min="1"
>

</td>



</tr>


`;

}



html+=`

</tbody>

</table>

`;



document
.getElementById(
"tabelaContainer"
)
.innerHTML=html;



}








function obterLinhas(){


let linhas=[];


document
.querySelectorAll("tbody tr")
.forEach(tr=>{


const comprador =
tr.querySelector(
'[name="Comprador"]'
);



const fornecedor =
tr.querySelector(
'[name="Fornecedor"]'
);



let dados={


compradorId:
comprador.value,


compradorNome:
comprador
.options[
comprador.selectedIndex
]
.dataset.nome,



fornecedorId:
fornecedor.value,


fornecedorNome:
fornecedor
.options[
fornecedor.selectedIndex
]
.dataset.nome,



frete:
tr.querySelector(
'[name="frete"]'
).value,



tipoSuino:
tr.querySelector(
'[name="tipo"]'
).value,



quantidade:
Number(
tr.querySelector(
'[name="quantidade"]'
).value
),



preco:
Number(
tr.querySelector(
'[name="preco"]'
).value
),



prazo:
tr.querySelector(
'[name="prazo"]'
).value,



embarque:
tr.querySelector(
'[name="embarque"]'
).value,



descarga:
tr.querySelector(
'[name="descarga"]'
).value,



etiquetaDia:
tr.querySelector(
'[name="dia"]'
).value,



etiquetaSemana:
tr.querySelector(
'[name="semana"]'
).value,



cards:
Number(
tr.querySelector(
'[name="cards"]'
).value
||1
)


};



for(
let i=0;
i<dados.cards;
i++
){

linhas.push(dados);

}



});


return linhas;


}







document
.getElementById("btnCriar")
.addEventListener(
"click",
async()=>{


const cards =
obterLinhas();



const resposta =
await fetch(
"/criar-cards-cargas",
{

method:"POST",

headers:{

...authHeaders(),

"Content-Type":
"application/json"

},

body:
JSON.stringify({
cards
})

}


);



console.log(
await resposta.json()
);


alert(
"Cards enviados!"
);


});






(async()=>{

await carregarParceiros();

})();