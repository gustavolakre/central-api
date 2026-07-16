document
.getElementById("btnGerar")
.addEventListener(
    "click",
    adicionarLinha
);


let parceirosBase = [];



function authHeaders(extra = {}){

    return {

        ...extra,

        Authorization:
        `Bearer ${localStorage.getItem("token")}`

    };

}


function tratarSessaoExpirada(){

    if(typeof logoutSessaoExpirada === "function"){
        logoutSessaoExpirada();
        return;
    }

    localStorage.setItem(
        "paginaDestino",
        window.location.pathname
    );

    localStorage.removeItem("token");

    window.location.href =
        "/janelas/login.html";

}


async function verificarAuthResponse(resposta){

    if(resposta.status === 401 || resposta.status === 403){
        tratarSessaoExpirada();
        throw new Error("Sessão expirada");
    }

    return resposta;

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

        await verificarAuthResponse(resposta);

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

        if(err.message === "Sessão expirada"){
            return;
        }

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



/** Monta etiqueta Pipefy: `2026/29,02-Segunda` */
function montarEtiqueta(semana, dia){

    const s = String(semana || "").trim();
    const d = String(dia || "").trim();

    if(!s || !d){
        return "";
    }

    return `${s},${d}`;

}


/** datetime-local (`2026-07-12T15:00`) -> Pipefy `DD/MM/YYYY HH:mm` */
function formatarDatetimePipefy(value){

    const v = String(value || "").trim();

    if(!v){
        return "";
    }

    // 2026-07-12T15:00 ou 2026-07-12T15:00:00
    const m = v.match(
        /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/
    );

    if(m){
        const [, yyyy, mm, dd, hh, min] = m;
        return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
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


function criarTabela(){

    const html = `
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
                    <th>Copiar</th>
                    <th>Excluir</th>
                </tr>
            </thead>

            <tbody id="tbodyCards"></tbody>
            

        </table>
    </div>
    `;

    document.getElementById("tabelaContainer").innerHTML = html;

    const tbody = document.getElementById("tbodyCards");

    tbody.addEventListener("input", atualizarResumo);
    tbody.addEventListener("change", atualizarResumo);

    tbody.addEventListener("click", e=>{

    if(e.target.classList.contains("copiarLinha")){
        copiarLinha(e.target);
        return;
    }

    if(e.target.classList.contains("excluirLinha")){
        excluirLinha(e.target);
        return;
    }

});
}



function adicionarLinha(){

    const tbody = document.getElementById("tbodyCards");

    const numero = tbody.rows.length + 1;

    tbody.insertAdjacentHTML("beforeend", `
<tr>

<td>${numero}</td>

<td>
<select name="Comprador">
<option value="">Selecione</option>
${montarOpcoesParceiros()}
</select>
</td>

<td>
<select name="Fornecedor">
<option value="">Selecione</option>
${montarOpcoesParceiros()}
</select>
</td>

<td>${montarSelect(FRETES,"frete")}</td>

<td>${montarSelect(TIPOS_SUINO,"tipo")}</td>

<td>
<input
type="number"
name="quantidade"
value="0">
</td>

<td>
<input
type="number"
step="0.01"
name="preco"
value="0">
</td>

<td>${montarSelect(PRAZOS,"prazo")}</td>

<td>
<input
type="datetime-local"
name="embarque">
</td>

<td>
<input
type="datetime-local"
name="descarga">
</td>

<td>${montarSelect(DIAS,"dia")}</td>

<td>${montarSelect(SEMANAS,"semana")}</td>

<td>
<input
type="number"
name="cards"
value="1"
min="1">
</td>

<td>
    <button
        type="button"
        class="copiarLinha"
    >
        📋
    </button>
</td>

<td>
    <button
        type="button"
        class="excluirLinha excluir"
        title="Excluir linha">
        🗑️
    </button>
</td>

</tr>
`);

    atualizarResumo();

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


function excluirLinha(botao){

    const tbody =
        document.getElementById("tbodyCards");

    if(tbody.rows.length == 1){

        alert("É necessário manter pelo menos uma linha.");

        return;

    }

    botao.closest("tr").remove();

    [...tbody.rows].forEach((tr,i)=>{

        tr.cells[0].textContent = i + 1;

    });

    atualizarResumo();

}



function copiarLinha(botao){

    const linha = botao.closest("tr");

    let proxima = linha.nextElementSibling;

    if(!proxima){

        adicionarLinha();

        proxima = linha.nextElementSibling;

    }

    proxima.querySelector('[name="Comprador"]').value =
        linha.querySelector('[name="Comprador"]').value;

    proxima.querySelector('[name="Fornecedor"]').value =
        linha.querySelector('[name="Fornecedor"]').value;

    proxima.querySelector('[name="frete"]').value =
        linha.querySelector('[name="frete"]').value;

    proxima.querySelector('[name="tipo"]').value =
        linha.querySelector('[name="tipo"]').value;

    proxima.querySelector('[name="quantidade"]').value =
        linha.querySelector('[name="quantidade"]').value;

    proxima.querySelector('[name="preco"]').value =
        linha.querySelector('[name="preco"]').value;

    proxima.querySelector('[name="prazo"]').value =
        linha.querySelector('[name="prazo"]').value;

    proxima.querySelector('[name="embarque"]').value =
        linha.querySelector('[name="embarque"]').value;

    proxima.querySelector('[name="descarga"]').value =
        linha.querySelector('[name="descarga"]').value;

    proxima.querySelector('[name="dia"]').value =
        linha.querySelector('[name="dia"]').value;

    proxima.querySelector('[name="semana"]').value =
        linha.querySelector('[name="semana"]').value;

    proxima.querySelector('[name="cards"]').value =
        linha.querySelector('[name="cards"]').value;

    atualizarResumo();

}



function atualizarResumo(){

    const resumo = {};

    document.querySelectorAll("#tabelaContainer tbody tr").forEach(tr=>{

        const compradorSelect = tr.querySelector('[name="Comprador"]');

        const comprador =
            nomeParceiroSelect(compradorSelect) || "Não informado";

        const suinos =
            Number(tr.querySelector('[name="quantidade"]').value || 0);

        const cards =
            Number(tr.querySelector('[name="cards"]').value || 1);

        if(!resumo[comprador]){
            resumo[comprador]={
                suinos:0,
                cards:0
            };
        }

        resumo[comprador].suinos += suinos;
        resumo[comprador].cards += cards;

    });

    let html="";

    let totalSuinos=0;
    let totalCards=0;

    Object.entries(resumo).forEach(([comprador,dados])=>{

        html += `
            <div class="resumo-item">
                <div><strong>COMPRADOR:</strong> ${comprador}</div>
                <div><strong>Total de Suínos:</strong> ${dados.suinos}</div>
                <div><strong>Cards:</strong> ${dados.cards}</div>
            </div>
        `;

        totalSuinos += dados.suinos;
        totalCards += dados.cards;

    });

    html += `
        <div class="resumo-total">
            <div>Total Geral de Suínos: ${totalSuinos}</div>
            <div>Total de Cards: ${totalCards}</div>
        </div>
    `;

    document.getElementById("resumoCompradores").innerHTML = html;

}


function removerLinhasComSucesso(indices){

    if(!Array.isArray(indices) || !indices.length){
        return;
    }

    const tbody = document.getElementById("tbodyCards");

    indices
        .sort((a,b)=>b-a)
        .forEach(i=>{

            if(tbody.rows[i]){
                tbody.rows[i].remove();
            }

        });

    [...tbody.rows].forEach((tr,i)=>{

        tr.cells[0].textContent = i + 1;

    });

    atualizarResumo();

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


await verificarAuthResponse(resposta);


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

if ((retorno.erros ?? 0) === 0) {

    alert(`${retorno.criados} card(s) criado(s) com sucesso!`);

    window.location.reload();

} else {

    alert(
        `${retorno.criados} card(s) criado(s) com sucesso.\n\n` +
        `${retorno.erros} card(s) apresentaram erro e permanecerão na tela.`
    );

    removerLinhasComSucesso(retorno.indicesSucesso);

    console.error(retorno.detalhesErros);

}

}
catch(err){

if(err.message === "Sessão expirada"){
    return;
}

console.error(err);

alert("Falha ao enviar cards. Veja o console.");

}



});




window.onload = async()=>{

    await carregarParceiros();

    criarTabela();

    adicionarLinha();

};