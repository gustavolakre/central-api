document
.getElementById("btnGerar")
.addEventListener(
    "click",
    gerarLinhas
);


let parceirosBase = [];



function authHeaders(extra = {}){

    return {

        ...extra,

        Authorization:
        `Bearer ${localStorage.getItem("token")}`

    };

}


function escapeHtmlAttr(value){

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;");

}


function nomeParceiroSelect(select){

    if(!select || select.selectedIndex < 0){
        return "";
    }

    const opt = select.options[select.selectedIndex];

    return (
        opt.dataset.nome ||
        opt.textContent ||
        ""
    ).trim();

}




async function carregarParceiros(){

    try{


        const resposta =
        await fetch(
            "/buscarParceiros",
            {
                headers:
                authHeaders()
            }
        );

        if(!resposta.ok){
            throw new Error(`HTTP ${resposta.status}`);
        }

        const dados = await resposta.json();

        parceirosBase = Array.isArray(dados) ? dados : [];



        console.log(
            "PARCEIROS:",
            parceirosBase.length
        );


    }
    catch(err){

        console.error(
            "Erro ao carregar parceiros",
            err
        );

    }

}






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
        {
            length:30
        },
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
new Date()
.getFullYear();



for(let i=1;i<=53;i++){

    SEMANAS.push(

        `${ano}/${String(i).padStart(2,"0")}`

    );

}







function montarOpcoesParceiros(){


let html="";


parceirosBase.forEach(p=>{

    const id = escapeHtmlAttr(p.pipefy_record_id);
    const nome = escapeHtmlAttr(p.nome_usual);

html += `
<option value="${id}" data-nome="${nome}">
${p.nome_usual}
</option>
`;


});


return html;


}






function montarSelect(
    lista,
    nome
){


    let html = `


    <select name="${nome}">


    <option value="">
        Selecione
    </option>


    `;



    lista.forEach(item=>{


        html += `

        <option value="${item}">
            ${item}
        </option>

        `;


    });



    html += `

    </select>

    `;


    return html;


}









function gerarLinhas(){


const total =
Number(
document
.getElementById(
"totalCards"
)
.value
);

if(!Number.isFinite(total) || total < 1){
    alert("Informe um total de cards válido (mínimo 1).");
    return;
}



let html = `


<div class="tabela-wrapper">

<table>


<thead>

<tr>

<th>#</th>

<th>Comprador</th>

<th>Fornecedor</th>

<th>Frete</th>

<th>Tipo Suíno</th>

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






for(
let i=1;
i<=total;
i++
){



html += `


<tr>


<td>

${i}

</td>



<td>


<select

name="Comprador"

>


<option value="">

Selecione

</option>


${montarOpcoesParceiros()}


</select>



</td>






<td>


<select

name="Fornecedor"

>


<option value="">

Selecione

</option>


${montarOpcoesParceiros()}


</select>



</td>






<td>

${montarSelect(
FRETES,
"frete"
)}

</td>





<td>

${montarSelect(
TIPOS_SUINO,
"tipo"
)}

</td>






<td>


<input

type="number"

name="quantidade"

value="0"

>


</td>







<td>


<input

type="number"

name="preco"

step="0.01"

value="0"

>


</td>






<td>

${montarSelect(
PRAZOS,
"prazo"
)}

</td>






<td>


<input

type="date"

name="embarque"

>


</td>






<td>


<input

type="date"

name="descarga"

>


</td>







<td>

${montarSelect(
DIAS,
"dia"
)}

</td>






<td>

${montarSelect(
SEMANAS,
"semana"
)}

</td>







<td>


<input

type="number"

name="cards"

class="quantidadeCards"

value="1"

min="1"


>


</td>





</tr>


`;



}





html += `


</tbody>


</table>


</div>


`;




document
.getElementById(
"tabelaContainer"
)
.innerHTML = html;



}









function obterLinhas(){



let linhas=[];




document
.querySelectorAll(
"#tabelaContainer tbody tr"
)
.forEach(tr=>{





const comprador =
tr.querySelector(
'[name="Comprador"]'
);



const fornecedor =
tr.querySelector(
'[name="Fornecedor"]'
);





const dados = {


compradorId:
String(comprador.value),



compradorNome:
nomeParceiroSelect(comprador),



fornecedorId:
String(fornecedor.value),



fornecedorNome:
nomeParceiroSelect(fornecedor),





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





};



const qtdCards =

Number(

tr.querySelector(
'[name="cards"]'
).value

||1

);





for(
let i=0;
i<qtdCards;
i++
){


linhas.push({

...dados


});


}



});




return linhas;



}









document
.getElementById(
"btnCriar"
)
.addEventListener(
"click",
async()=>{



const cards =
obterLinhas();

if(!cards.length){
    alert("Gere as linhas antes de criar os cards.");
    return;
}

const linhaInvalida = cards.find(
    c => !c.compradorId || !c.fornecedorId
);

if(linhaInvalida){
    alert("Selecione comprador e fornecedor em todas as linhas.");
    return;
}

console.log(
    "CARDS:",
    cards
);

try{

const resposta =
await fetch(

"/criar-cards-cargas",

{


method:"POST",


headers:

{

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



const retorno =
await resposta.json();



console.log(
retorno
);

if(!resposta.ok){
    alert(
        retorno.erro ||
        "Erro ao criar cards."
    );
    return;
}

const msg = [
    `${retorno.criados ?? 0} card(s) criado(s).`,
    retorno.erros ? `${retorno.erros} erro(s).` : null
].filter(Boolean).join(" ");

alert(msg);

if(retorno.detalhesErros?.length){
    console.error("Detalhes:", retorno.detalhesErros);
}

}
catch(err){

console.error(err);

alert("Falha ao enviar cards. Veja o console.");

}



});







window.onload = async()=>{


await carregarParceiros();


};