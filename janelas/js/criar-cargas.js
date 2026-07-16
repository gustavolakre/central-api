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



const RESPONSAVEIS = [

    { id: "306443829", nome: "Adelar Schuh" },
    { id: "305728998", nome: "Ana Wust" },
    { id: "308039901", nome: "Bruna Jaine Anderson" },
    { id: "307550459", nome: "Bruno Panatta" },
    { id: "307046790", nome: "Enário dos Santos" },
    { id: "304564865", nome: "Henrique" },
    { id: "304569850", nome: "Jeferson A. Antunes" },
    { id: "307776597", nome: "Rafael de Lima" },
    { id: "307283950", nome: "Luiz Gustavo Deon" },
    { id: "305099902", nome: "Vânia Riva" },
    { id: "307046791", nome: "Mikael Silva Sousa" },
    { id: "305205639", nome: "Wanderson Agostinho" }

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



/** Monta etiqueta Pipefy: `2026/29,02-Segunda` */
function montarEtiqueta(semana, dia){

    const s = String(semana || "").trim();
    const d = String(dia || "").trim();

    if(!s || !d){
        return "";
    }

    return `${s},${d}`;

}


/** datetime-local (`2026-07-12T15:00`) -> formato Pipefy */
function formatarDatetimePipefy(value){

    const v = String(value || "").trim();

    if(!v){
        return "";
    }

    // 2026-07-12T15:00 ou 2026-07-12T15:00:00
    if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)){
        const comSegundos = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)
            ? v
            : `${v}:00`;

        return comSegundos.replace("T", " ");
    }

    return v;

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


function montarSelectResponsavel(){

    let html = `

    <select name="responsavel">

    <option value="">
        Selecione
    </option>

    `;

    RESPONSAVEIS.forEach(({ id, nome }) => {

        html += `
        <option value="${escapeHtmlAttr(id)}">
            ${escapeHtmlAttr(nome)}
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

<th>Responsável</th>

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

${montarSelectResponsavel()}

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

type="datetime-local"

name="embarque"

>


</td>






<td>


<input

type="datetime-local"

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





responsavelId:

tr.querySelector(
'[name="responsavel"]'
).value,





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

formatarDatetimePipefy(
tr.querySelector(
'[name="embarque"]'
).value
),





descarga:

formatarDatetimePipefy(
tr.querySelector(
'[name="descarga"]'
).value
),





etiquetaDia:

tr.querySelector(
'[name="dia"]'
).value,





etiquetaSemana:

tr.querySelector(
'[name="semana"]'
).value,




etiquetas:
montarEtiqueta(
tr.querySelector('[name="semana"]').value,
tr.querySelector('[name="dia"]').value
),





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
    c => !c.compradorId || !c.fornecedorId || !c.responsavelId
);

if(linhaInvalida){
    alert("Selecione comprador, fornecedor e responsável em todas as linhas.");
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