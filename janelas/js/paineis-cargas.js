const { API, getToken, mostrarUltimaAtualizacao, initSocketUltimaAtualizacao } = window.UIComum;
const socket = io(API);
initSocketUltimaAtualizacao(socket, carregarGraficos);


let compradores = [];
let fornecedores = [];
let negociacoes = [];

function normalizar(v) {
  return String(v)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function filtrar(item) {
  const texto = normalizar(JSON.stringify(item));

  return !texto.includes("lakre") &&
         !texto.includes("09cancelada");
}


async function carregarGraficos(){

    try{

           console.log(
            `${API}/paineis-cargas`
          );

       const resposta =
            await fetch(
                `${API}/paineis-cargas`,
                {
                  headers:{
                    Authorization:
                      `Bearer ${getToken()}`
                 }
             }
        );

        console.log(
    "STATUS:",
    resposta.status
);
        
        if(
         resposta.status === 401 ||
         resposta.status === 403
         ){
         logoutSessaoExpirada();
         return;
        }

        const resultado = await resposta.json();

        console.log(resultado.compradores[0]);
        console.log(resultado.fornecedores[0]);
        console.log(resultado.negociacoes[0]);

        const semanasDisponiveis = [
            ...new Set(
            (resultado.todasSemanas || [])
            .map(x => x.semana)
            .filter(s => !normalizar(s).includes("09cancelada"))
          )
        ].sort();

        const filtrar = (item) => {
            const texto = normalizar(JSON.stringify(item));

            return !texto.includes("lakre") &&
            !texto.includes("09cancelada");
         };

        const dadosCompletos =
            (resultado.semanas || []).filter(filtrar);
 
        const dados =
             dadosCompletos.slice(0,20).reverse();


        const dadosHistorico =
            [...dadosCompletos]
            .sort((a,b)=>
            a.semana.localeCompare(
            b.semana
            )
        );

        if(!dados || !dados.length){
             return;
        }

        dados.sort(
            (a,b)=>
            a.semana.localeCompare(
                b.semana
            )
        );

        const semanaAtual =
          dados[dados.length-2];

        const proximaSemana =
          dados[dados.length-1];

        document.getElementById("tituloSuinosAtual").innerText =
         `Suínos (${semanaAtual.semana})`;

        document.getElementById("tituloCargasAtual").innerText =
         `Cargas (${semanaAtual.semana})`;

        document.getElementById("tituloSuinosProxima").innerText =
         `Suínos (${proximaSemana.semana})`;

        document.getElementById("tituloCargasProxima").innerText =
         `Cargas (${proximaSemana.semana})`;

        document.getElementById("totalSuinosAtual").innerText =
          Number(semanaAtual.total_suinos)
               .toLocaleString("pt-BR");

        document.getElementById("totalCargasAtual").innerText =
          Number(semanaAtual.total_cargas)
                .toLocaleString("pt-BR");

        document.getElementById("totalSuinosProxima").innerText =
          Number(proximaSemana.total_suinos)
                .toLocaleString("pt-BR");

        document.getElementById("totalCargasProxima").innerText =
          Number(proximaSemana.total_cargas)
                .toLocaleString("pt-BR");


      new Chart(
    document.getElementById("graficoSuinos"),
    {
        type:"bar",
        data:{
            labels: dados.map(x=>x.semana),
            datasets:[{
                label:"Suínos",
                data: dados.map(x=>x.total_suinos),
                backgroundColor:"#2563eb"
            }]
        },
        plugins:[ChartDataLabels],
        options:{

            layout:{
              padding:{
              top:30,
              right:20,
              bottom:20,
              left:20
             }
           },
            responsive:true,
            maintainAspectRatio:false,
            plugins:{
                legend:{ display:false },
                datalabels:{
                 color:"#f9fafb",
                 anchor:"end",
                 align:"top",
                 offset:8,

               font:{
                  size:14,
                  weight:"bold"
               },

    textStrokeColor:"#111827",
    textStrokeWidth:3
}
            }
        }
    }
);

    new Chart(
    document.getElementById("graficoCargas"),
    {
        type:"line",
        data:{
            labels: dados.map(x=>x.semana),
            datasets:[{
                label:"Cargas",
                data: dados.map(x=>x.total_cargas),
                borderColor:"#dc2626",
                backgroundColor:"#dc2626",
                tension:0.3,
                fill:false
            }]
        },
        plugins:[ChartDataLabels],
        options:{

            layout:{
               padding:{
               top:30,
               right:20,
               bottom:20,
               left:20
               }
            },
            responsive:true,
            maintainAspectRatio:false,
             plugins:{
                datalabels:{
                color:"#f9fafb",
                anchor:"end",
                align:"top",
                offset:8,

             font:{
                size:14,
                weight:"bold"
             },

               textStrokeColor:"#111827",
               textStrokeWidth:3
            }
            }
        }
    }
);

compradores = (resultado.compradores || []).filter(filtrar);

fornecedores = (resultado.fornecedores || []).filter(filtrar);

negociacoes = (resultado.negociacoes || []).filter(filtrar);

const historicoAntigo = [
{ semana:"2021/43", total_suinos:222 },
{ semana:"2021/44", total_suinos:128 },
{ semana:"2021/45", total_suinos:668 },
{ semana:"2021/46", total_suinos:384 },
{ semana:"2021/47", total_suinos:384 },
{ semana:"2021/48", total_suinos:383 },
{ semana:"2021/49", total_suinos:256 },
{ semana:"2021/50", total_suinos:448 },
{ semana:"2021/51", total_suinos:749 },
{ semana:"2021/52", total_suinos:1284 },

{ semana:"2022/01", total_suinos:392 },
{ semana:"2022/02", total_suinos:376 },
{ semana:"2022/03", total_suinos:379 },
{ semana:"2022/04", total_suinos:384 },
{ semana:"2022/05", total_suinos:554 },
{ semana:"2022/06", total_suinos:654 },
{ semana:"2022/07", total_suinos:762 },
{ semana:"2022/08", total_suinos:504 },
{ semana:"2022/09", total_suinos:650 },
{ semana:"2022/10", total_suinos:590 },
{ semana:"2022/11", total_suinos:530 },
{ semana:"2022/12", total_suinos:626 },
{ semana:"2022/13", total_suinos:752 },
{ semana:"2022/14", total_suinos:640 },
{ semana:"2022/15", total_suinos:824 },
{ semana:"2022/16", total_suinos:682 },
{ semana:"2022/17", total_suinos:1263 },
{ semana:"2022/18", total_suinos:1158 },
{ semana:"2022/19", total_suinos:1518 },
{ semana:"2022/20", total_suinos:1044 },
{ semana:"2022/21", total_suinos:1144 },
{ semana:"2022/22", total_suinos:1477 },
{ semana:"2022/23", total_suinos:1662 },
{ semana:"2022/24", total_suinos:1061 },
{ semana:"2022/25", total_suinos:1355 },
{ semana:"2022/26", total_suinos:1036 },
{ semana:"2022/27", total_suinos:1281 },
{ semana:"2022/28", total_suinos:1418 },
{ semana:"2022/29", total_suinos:1734 },
{ semana:"2022/30", total_suinos:1088 },
{ semana:"2022/31", total_suinos:1138 },
{ semana:"2022/32", total_suinos:2334 },
{ semana:"2022/33", total_suinos:1562 },
{ semana:"2022/34", total_suinos:873 },
{ semana:"2022/35", total_suinos:1133 },
{ semana:"2022/36", total_suinos:1309 },
{ semana:"2022/37", total_suinos:1196 },
{ semana:"2022/38", total_suinos:1118 },
{ semana:"2022/39", total_suinos:1204 },
{ semana:"2022/40", total_suinos:1160 },
{ semana:"2022/41", total_suinos:959 },
{ semana:"2022/42", total_suinos:1599 },
{ semana:"2022/43", total_suinos:1033 },
{ semana:"2022/44", total_suinos:947 },
{ semana:"2022/45", total_suinos:1172 },
{ semana:"2022/46", total_suinos:1162 },
{ semana:"2022/47", total_suinos:1322 },
{ semana:"2022/48", total_suinos:1274 },
{ semana:"2022/49", total_suinos:1197 },
{ semana:"2022/50", total_suinos:3159 },
{ semana:"2022/51", total_suinos:2724 },
{ semana:"2022/52", total_suinos:3528 },

{ semana:"2023/01", total_suinos:1447 },
{ semana:"2023/02", total_suinos:2356 },
{ semana:"2023/03", total_suinos:1557 },
{ semana:"2023/04", total_suinos:1648 },
{ semana:"2023/05", total_suinos:1888 },
{ semana:"2023/06", total_suinos:4842 },
{ semana:"2023/07", total_suinos:5203 },
{ semana:"2023/08", total_suinos:2208 },
{ semana:"2023/09", total_suinos:4142 },
{ semana:"2023/10", total_suinos:5676 },
{ semana:"2023/11", total_suinos:5585 },
{ semana:"2023/12", total_suinos:5076 },
{ semana:"2023/13", total_suinos:6024 },
{ semana:"2023/14", total_suinos:4309 },
{ semana:"2023/15", total_suinos:4569 },
{ semana:"2023/16", total_suinos:4301 },
{ semana:"2023/17", total_suinos:5380 },
{ semana:"2023/18", total_suinos:5514 },
{ semana:"2023/19", total_suinos:7290 },
{ semana:"2023/20", total_suinos:6096 },
{ semana:"2023/21", total_suinos:5298 },
{ semana:"2023/22", total_suinos:5652 },
{ semana:"2023/23", total_suinos:5770 },
{ semana:"2023/24", total_suinos:6828 },
{ semana:"2023/25", total_suinos:5212 },
{ semana:"2023/26", total_suinos:5781 },
{ semana:"2023/27", total_suinos:7213 },
{ semana:"2023/28", total_suinos:6699 },
{ semana:"2023/29", total_suinos:7076 },
{ semana:"2023/30", total_suinos:5811 },
{ semana:"2023/31", total_suinos:9318 },
{ semana:"2023/32", total_suinos:8669 },
{ semana:"2023/33", total_suinos:8083 },
{ semana:"2023/34", total_suinos:6615 },
{ semana:"2023/35", total_suinos:6757 },
{ semana:"2023/36", total_suinos:6680 },
{ semana:"2023/37", total_suinos:7269 },
{ semana:"2023/38", total_suinos:7487 },
{ semana:"2023/39", total_suinos:7327 },
{ semana:"2023/40", total_suinos:8141 },
{ semana:"2023/41", total_suinos:5997 },
{ semana:"2023/42", total_suinos:10509 },
{ semana:"2023/43", total_suinos:7399 },
{ semana:"2023/44", total_suinos:6110 },
{ semana:"2023/45", total_suinos:6782 },
{ semana:"2023/46", total_suinos:6554 },
{ semana:"2023/47", total_suinos:8918 },
{ semana:"2023/48", total_suinos:11231 },
{ semana:"2023/49", total_suinos:8750 },
{ semana:"2023/50", total_suinos:9456 },
{ semana:"2023/51", total_suinos:11187 },
{ semana:"2023/52", total_suinos:6497 },
{ semana:"2024/01", total_suinos:4549 },
{ semana:"2024/02", total_suinos:10051 },
{ semana:"2024/03", total_suinos:8999 },
{ semana:"2024/04", total_suinos:9055 },
{ semana:"2024/05", total_suinos:13182 },
{ semana:"2024/06", total_suinos:10939 },
{ semana:"2024/07", total_suinos:11774 },
{ semana:"2024/08", total_suinos:11282 },
{ semana:"2024/09", total_suinos:12012 },
{ semana:"2024/10", total_suinos:11639 },
{ semana:"2024/11", total_suinos:12795 },
{ semana:"2024/12", total_suinos:13507 },
{ semana:"2024/13", total_suinos:7170 }
];

const dadosGrafico = [
  ...historicoAntigo,
  ...(resultado.semanasHistorico || [])
];

console.log(
    "ULTIMAS SEMANAS:",
    dadosGrafico.slice(-20)
);

console.log(
    "semanasHistorico",
    resultado.semanasHistorico
);

dadosGrafico.sort((a,b)=>{

    const [anoA, semanaA] =
        a.semana.split("/").map(Number);

    const [anoB, semanaB] =
        b.semana.split("/").map(Number);

    if(anoA !== anoB){
        return anoA - anoB;
    }

    return semanaA - semanaB;

});

criarGraficoAreaSuinos(dadosGrafico);


criarFiltroSemanas(
    "filtroSemanasComprador",
    semanasDisponiveis,
    atualizarListas
);

criarFiltroSemanas(
    "filtroSemanasFornecedor",
    semanasDisponiveis,
    atualizarListas
);

criarFiltroSemanas(
    "filtroSemanasNegociacoes",
    semanasDisponiveis,
    atualizarListas
);

atualizarListas();



    }catch(erro){

        console.error(erro);

    }

}


function criarGraficoAreaSuinos(semanas){


    new Chart(
        document.getElementById("graficoAreaSuinos"),
        {

        type:"line",

        data:{

            labels: semanas.map(x => x.semana),

            datasets:[{

                label:"Suínos",

                data:
                    semanas.map(x=>x.total_suinos),


                fill:true,

                tension:0.35,

                borderColor:"#2563eb",

                backgroundColor:"rgba(37,99,235,0.35)",


                pointRadius:4,

                pointHoverRadius:7

            }]

        },


        plugins:[],


        options: {
          responsive: true,
          maintainAspectRatio: false,

           plugins: {
             legend: {
               display: false
               }
           },

        scales: {
        x: {
            ticks: {
                color: "#f9fafb"
            },
            grid: {
                color: "rgba(255,255,255,0.06)" // mais suave
            }
        },

        y: {
            ticks: {
                color: "#f9fafb",
                stepSize: 2500 // 👈 AQUI força 2500
            },
            grid: {
                color: "rgba(255,255,255,0.08)" // 👈 quadriculado mais claro
            }
        }
    }
}


    });


}


function criarFiltroSemanas(id, semanas, callback){

    const container = document.getElementById(id);

    // garante ordem correta
    const ordenadas = [...semanas].sort();

    const ultimaSemana = ordenadas[ordenadas.length - 1];

    container.innerHTML = ordenadas.map(semana => `
        <label>
            <input type="checkbox"
                   value="${semana}"
                   ${semana === ultimaSemana ? "checked" : ""}>
            ${semana}
        </label>
    `).join("");

    container.querySelectorAll("input").forEach(cb => {
        cb.addEventListener("change", callback);
    });
}

function semanasSelecionadas(id){

    return Array.from(
        document.querySelectorAll(
            `#${id} input:checked`
        )
    ).map(x => x.value);

}

function selecionarTodas(idFiltro){

    document
        .querySelectorAll(`#${idFiltro} input[type="checkbox"]`)
        .forEach(cb => cb.checked = true);

    atualizarListas();
}

function limparFiltro(idFiltro){

    document
        .querySelectorAll(`#${idFiltro} input[type="checkbox"]`)
        .forEach(cb => cb.checked = false);

    atualizarListas();
}

function atualizarListas(){

    // ==========================
    // COMPRADORES
    // ==========================

    const semanasComprador =
        semanasSelecionadas("filtroSemanasComprador");

    const compradoresFiltrados =
        compradores.filter(x =>
            semanasComprador.includes(x.semana)
        );

    const compradoresAgrupados = {};

    compradoresFiltrados.forEach(item => {

        if(!compradoresAgrupados[item.comprador]){

            compradoresAgrupados[item.comprador] = {
                comprador: item.comprador,
                total_suinos: 0,
                total_cargas: 0
            };

        }

        compradoresAgrupados[item.comprador].total_suinos +=
            Number(item.total_suinos);

        compradoresAgrupados[item.comprador].total_cargas +=
            Number(item.total_cargas);

    });

    const listaCompradores =
        Object.values(compradoresAgrupados)
        .sort((a,b) => b.total_suinos - a.total_suinos);

    document.getElementById("listaComprador").innerHTML = `
        <div class="lista-container">

            <div class="lista-header">
                <span>Comprador</span>
                <span>Suínos | Cargas</span>
            </div>

            ${listaCompradores.map(x => `
                <div class="lista-item">
                    <strong>${x.comprador}</strong>
                    <span>
                        ${Number(x.total_suinos).toLocaleString("pt-BR")}
                        |
                        ${Number(x.total_cargas).toLocaleString("pt-BR")}
                    </span>
                </div>
            `).join("")}

        </div>
    `;


    // ==========================
    // FORNECEDORES
    // ==========================

    const semanasFornecedor =
        semanasSelecionadas("filtroSemanasFornecedor");

    const fornecedoresFiltrados =
        fornecedores.filter(x =>
            semanasFornecedor.includes(x.semana)
        );

    const fornecedoresAgrupados = {};

    fornecedoresFiltrados.forEach(item => {

        if(!fornecedoresAgrupados[item.fornecedor]){

            fornecedoresAgrupados[item.fornecedor] = {
                fornecedor: item.fornecedor,
                total_suinos: 0,
                total_cargas: 0
            };

        }

        fornecedoresAgrupados[item.fornecedor].total_suinos +=
            Number(item.total_suinos);

        fornecedoresAgrupados[item.fornecedor].total_cargas +=
            Number(item.total_cargas);

    });

    const listaFornecedores =
        Object.values(fornecedoresAgrupados)
        .sort((a,b) => b.total_suinos - a.total_suinos);

    document.getElementById("listaFornecedor").innerHTML = `
        <div class="lista-container">

            <div class="lista-header">
                <span>Fornecedor</span>
                <span>Suínos | Cargas</span>
            </div>

            ${listaFornecedores.map(x => `
                <div class="lista-item">
                    <strong>${x.fornecedor}</strong>
                    <span>
                        ${Number(x.total_suinos).toLocaleString("pt-BR")}
                        |
                        ${Number(x.total_cargas).toLocaleString("pt-BR")}
                    </span>
                </div>
            `).join("")}

        </div>
    `;


    // ==========================
    // NEGOCIAÇÕES
    // ==========================

    const semanasNegociacoes =
        semanasSelecionadas("filtroSemanasNegociacoes");

    const negociacoesFiltradas =
        negociacoes.filter(x =>
            semanasNegociacoes.includes(x.semana)
        );

    const negociacoesAgrupadas = {};

    negociacoesFiltradas.forEach(item => {

        const chave =
            `${item.comprador}|${item.fornecedor}`;

        if(!negociacoesAgrupadas[chave]){

            negociacoesAgrupadas[chave] = {
                comprador: item.comprador,
                fornecedor: item.fornecedor,
                total_suinos: 0,
                total_cargas: 0
            };

        }

        negociacoesAgrupadas[chave].total_suinos +=
            Number(item.total_suinos);

        negociacoesAgrupadas[chave].total_cargas +=
            Number(item.total_cargas);

    });

    const listaNegociacoes =
         Object.values(negociacoesAgrupadas)
           .sort((a,b) =>
            a.comprador.localeCompare(
            b.comprador,
            "pt-BR"
        )
    );

    document.getElementById("listaNegociacoes").innerHTML = `
        <div class="lista-container">
        

            <div class="lista-header">
                <span>Comprador → Fornecedor</span>
                <span>Suínos | Cargas</span>
            </div>

            ${listaNegociacoes.map(x => `
                <div class="lista-item">
                    <strong>
                        ${x.comprador}
                        →
                        ${x.fornecedor}
                    </strong>

                    <span>
                        ${Number(x.total_suinos).toLocaleString("pt-BR")}
                        |
                        ${Number(x.total_cargas).toLocaleString("pt-BR")}
                    </span>
                </div>
            `).join("")}

        </div>
    `;
}


mostrarUltimaAtualizacao();

carregarGraficos();
