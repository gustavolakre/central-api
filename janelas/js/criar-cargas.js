document
    .getElementById("btnGerar")
    .addEventListener("click", gerarLinhas);


let compradores = [];
let fornecedores = [];


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
    ...Array.from({ length: 30 }, (_, i) => String(i + 1)),
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


const SEMANAS = [];

const ano = new Date().getFullYear();

for(let i=1;i<=53;i++){

    SEMANAS.push(
        `${ano}/${String(i).padStart(2,"0")}`
    );

}



/*
CARREGA PARCEIROS DO BANCO
*/

async function carregarParceiros() {


    try {


        const token =
            localStorage.getItem("token");


        const response = await fetch(
            "/buscarParceiros",
            {
                headers:{
                    Authorization:
                    `Bearer ${token}`
                }
            }
        );


        const dados = await response.json();



        compradores = dados

            .filter(p => p.tipo === "Comprador")

            .sort((a,b)=>
                a.nome_usual.localeCompare(
                    b.nome_usual
                )
            );



        fornecedores = dados

            .filter(p => p.tipo === "Fornecedor")

            .sort((a,b)=>
                a.nome_usual.localeCompare(
                    b.nome_usual
                )
            );



    }catch(err){

        console.error(
            "Erro carregar parceiros:",
            err
        );

    }

}



/*
SELECTS NORMAIS
*/

function montarSelect(lista,nome){


    let html =
    `<select name="${nome}">`;


    html += `<option value=""></option>`;


    lista.forEach(item=>{


        html += `

        <option value="${item}">
            ${item}
        </option>

        `;


    });


    html += `</select>`;


    return html;

}



/*
SELECT COMPRADOR
*/

function montarSelectComprador(){


    let html =
    `<select name="comprador">`;


    html +=
    `<option value=""></option>`;


    compradores.forEach(c=>{


        html += `

        <option

            value="${c.pipefy_record_id}"

            data-nome="${c.nome_usual}"

        >

            ${c.nome_usual}

        </option>

        `;


    });


    html += "</select>";


    return html;

}



/*
SELECT FORNECEDOR
*/

function montarSelectFornecedor(){


    let html =
    `<select name="fornecedor">`;


    html +=
    `<option value=""></option>`;


    fornecedores.forEach(f=>{


        html += `

        <option

            value="${f.pipefy_record_id}"

            data-nome="${f.nome_usual}"

        >

            ${f.nome_usual}

        </option>

        `;


    });


    html += "</select>";


    return html;

}



/*
CAPTURA LINHAS
*/

function obterLinhas(){


    const linhas=[];



    document
    .querySelectorAll("tbody tr")
    .forEach(tr=>{


        const comprador =
        tr.querySelector('[name="comprador"]');


        const fornecedor =
        tr.querySelector('[name="fornecedor"]');



        linhas.push({


            compradorId:
            comprador.value,


            compradorNome:
            comprador
            .options[
                comprador.selectedIndex
            ]
            ?.dataset.nome || "",



            fornecedorId:
            fornecedor.value,


            fornecedorNome:
            fornecedor
            .options[
                fornecedor.selectedIndex
            ]
            ?.dataset.nome || "",



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
                ).value || 0
            ),



            preco:
            Number(
                tr.querySelector(
                    '[name="preco"]'
                ).value || 0
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
            ).value


        });


    });


    return linhas;

}



/*
COPIAR PARA BAIXO
*/

function copiarParaBaixo(e){


    const coluna =
    Number(e.target.dataset.col);



    const linhas =
    document.querySelectorAll(
        "tbody tr"
    );



    if(linhas.length < 2)
        return;



    const origem =
    linhas[0]
    .children[coluna]
    .querySelector(
        "select,input"
    );



    if(!origem)
        return;



    linhas.forEach((linha,index)=>{


        if(index===0)
            return;



        const campo =
        linha
        .children[coluna]
        .querySelector(
            "select,input"
        );



        if(campo){

            campo.value =
            origem.value;

        }


    });


}



/*
GERA TABELA
*/

function gerarLinhas(){


    const total =
    Number(
        document
        .getElementById("totalCards")
        .value
    );



    let html = `

<table>

<thead>

<tr>

<th>#</th>

<th>Comprador <button class="copiar" data-col="1">↓</button></th>

<th>Fornecedor <button class="copiar" data-col="2">↓</button></th>

<th>Frete <button class="copiar" data-col="3">↓</button></th>

<th>Tipo <button class="copiar" data-col="4">↓</button></th>

<th>Qtd.</th>

<th>Preço</th>

<th>Prazo <button class="copiar" data-col="7">↓</button></th>

<th>Embarque <button class="copiar" data-col="8">↓</button></th>

<th>Descarga <button class="copiar" data-col="9">↓</button></th>

<th>Dia <button class="copiar" data-col="10">↓</button></th>

<th>Semana <button class="copiar" data-col="11">↓</button></th>

</tr>

</thead>


<tbody>

`;



for(let i=1;i<=total;i++){


html += `

<tr>

<td>${i}</td>


<td>${montarSelectComprador()}</td>


<td>${montarSelectFornecedor()}</td>


<td>${montarSelect(FRETES,"frete")}</td>


<td>${montarSelect(TIPOS_SUINO,"tipo")}</td>


<td>
<input name="quantidade" type="number">
</td>


<td>
<input name="preco" type="number" step="0.01">
</td>


<td>${montarSelect(PRAZOS,"prazo")}</td>


<td>
<input name="embarque" type="datetime-local">
</td>


<td>
<input name="descarga" type="datetime-local">
</td>


<td>${montarSelect(DIAS,"dia")}</td>


<td>${montarSelect(SEMANAS,"semana")}</td>


</tr>

`;


}



html += `

</tbody>

</table>

`;



document
.getElementById("tabelaContainer")
.innerHTML = html;



document
.querySelectorAll(".copiar")
.forEach(btn=>{

    btn.onclick =
    copiarParaBaixo;

});


}



/*
CRIAR CARDS
*/

document
.getElementById("btnCriar")
.addEventListener(
"click",
async()=>{


    const linhas =
    obterLinhas();



    console.table(linhas);



    const token =
    localStorage.getItem("token");



    const resposta =
    await fetch(
        "/criar-cards-cargas",
        {

            method:"POST",

            headers:{

                "Content-Type":
                "application/json",

                Authorization:
                `Bearer ${token}`

            },


            body:
            JSON.stringify({

                cards:linhas

            })

        }
    );



    const retorno =
    await resposta.json();



    console.log(
        "RETORNO:",
        retorno
    );


    alert(
        `Criados: ${retorno.criados || 0}
Erros: ${retorno.erros || 0}`
    );


});



/*
INICIALIZA
*/

(async()=>{

    await carregarParceiros();

})();