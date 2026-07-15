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


        parceirosBase =
        await resposta.json();



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


    parceirosBase
    .sort(
        (a,b)=>
        a.nome_usual.localeCompare(
            b.nome_usual
        )
    )
    .forEach(p=>{


        html += `


        <option

            value="${p.pipefy_record_id}"

            data-nome="${p.nome_usual}"

        >

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



console.log(
"CARDS:",
cards
);




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



alert(
"Cards enviados!"
);



});







window.onload = async()=>{


await carregarParceiros();


};