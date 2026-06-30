const API = UIComum.API;

let dadosGlobais = [];
let googlePronto = false;


google.charts.load("current", { packages: ["sankey"] });

google.charts.setOnLoadCallback(() => {
    googlePronto = true;
    renderizar();
});


/* ============================
   ORIGEM / DESTINO conforme tipo
============================ */

function camposDoTipo() {

    const tipo =
        document.getElementById("filtroTipo").value;

    if (tipo === "estado") {
        return {
            origem: "estado_fornecedor",
            destino: "estado_comprador"
        };
    }

    return {
        origem: "fornecedor",
        destino: "comprador"
    };

}


/* ============================
   CARREGAR DADOS
============================ */

async function carregarDados() {

    try {

        const res = await fetch(`${API}/paineis-cargas-2`);

        dadosGlobais = await res.json();

        montarFiltroSemana();
        montarFiltroOrigem();
        montarFiltroDestino();
        renderizar();

    } catch (err) {

        console.error(err);

    }

}


function montarFiltroSemana() {

    const semanas = [
        ...new Set(
            dadosGlobais
                .map(d => d.semana)
                .filter(Boolean)
        )
    ];

    semanas.sort().reverse();

    const select =
        document.getElementById("filtroSemana");

    let html = `<option value="">Todas as semanas</option>`;

    semanas.forEach(s => {
        html += `<option value="${s}">${s}</option>`;
    });

    select.innerHTML = html;

}


function linhasFiltradasPorSemana() {

    const semana =
        document.getElementById("filtroSemana").value;

    if (!semana) {
        return dadosGlobais;
    }

    return dadosGlobais.filter(d => d.semana === semana);

}


function montarFiltroOrigem() {

    const { origem } = camposDoTipo();

    const linhas = linhasFiltradasPorSemana();

    const valorAtual =
        document.getElementById("filtroOrigem").value;

    const origens = [
        ...new Set(
            linhas
                .map(d => (d[origem] || "").trim())
                .filter(Boolean)
        )
    ];

    origens.sort((a, b) => a.localeCompare(b, "pt-BR"));

    const select =
        document.getElementById("filtroOrigem");

    let html = `<option value="">Todas</option>`;

    origens.forEach(o => {
        html += `<option value="${o}">${o}</option>`;
    });

    select.innerHTML = html;

    // mantém a seleção se ainda existir
    if (origens.includes(valorAtual)) {
        select.value = valorAtual;
    }

}


function montarFiltroDestino() {

    const { destino } = camposDoTipo();

    const linhas = linhasFiltradasPorSemana();

    const valorAtual =
        document.getElementById("filtroDestino").value;

    const destinos = [
        ...new Set(
            linhas
                .map(d => (d[destino] || "").trim())
                .filter(Boolean)
        )
    ];

    destinos.sort((a, b) => a.localeCompare(b, "pt-BR"));

    const select =
        document.getElementById("filtroDestino");

    let html = `<option value="">Todos</option>`;

    destinos.forEach(d => {
        html += `<option value="${d}">${d}</option>`;
    });

    select.innerHTML = html;

    // mantém a seleção se ainda existir
    if (destinos.includes(valorAtual)) {
        select.value = valorAtual;
    }

}


function aoMudarTipo() {
    montarFiltroOrigem();
    montarFiltroDestino();
    renderizar();
}


function aoMudarSemana() {
    montarFiltroOrigem();
    montarFiltroDestino();
    renderizar();
}


/* ============================
   RENDERIZAR SANKEY
============================ */

function renderizar() {

    if (!googlePronto) {
        return;
    }

    const { origem, destino } = camposDoTipo();

    const origemSelecionada =
        document.getElementById("filtroOrigem").value;

    const destinoSelecionado =
        document.getElementById("filtroDestino").value;

    const linhas = linhasFiltradasPorSemana();


    // agrega: origem -> destino => soma de quantidade
    const fluxos = {};
    let totalExibido = 0;

    linhas.forEach(d => {

        const o = (d[origem] || "").trim();
        const dst = (d[destino] || "").trim();

        if (!o || !dst) {
            return;
        }

        if (
            origemSelecionada &&
            o !== origemSelecionada
        ) {
            return;
        }

        if (
            destinoSelecionado &&
            dst !== destinoSelecionado
        ) {
            return;
        }

        const qtd = Number(d.quantidade || 0);

        if (qtd <= 0) {
            return;
        }

        const chave = o + " ||| " + dst;

        fluxos[chave] = (fluxos[chave] || 0) + qtd;

        totalExibido += qtd;

    });


    document.getElementById("totalExibido")
        .textContent =
        totalExibido.toLocaleString("pt-BR");


    const chaves = Object.keys(fluxos);

    const elVazio = document.getElementById("vazio");
    const elSankey = document.getElementById("sankey");


    if (!chaves.length) {
        elSankey.innerHTML = "";
        elVazio.style.display = "block";
        return;
    }

    elVazio.style.display = "none";


    /* monta linhas do Sankey
       sufixo invisível no destino evita
       ciclos quando o mesmo nome aparece
       como origem e destino */

    const SUFixoDestino = "\u200B";

    const data = new google.visualization.DataTable();
    data.addColumn("string", "Origem");
    data.addColumn("string", "Destino");
    data.addColumn("number", "Suínos");

    const nosUnicos = new Set();

    // total por nó (para exibir abaixo do nome)
    const totalPorNo = {};

    chaves.forEach(chave => {

        const [o, dst] = chave.split(" ||| ");

        const destinoLabel = dst + SUFixoDestino;

        nosUnicos.add(o);
        nosUnicos.add(destinoLabel);

        totalPorNo[o] =
            (totalPorNo[o] || 0) + fluxos[chave];

        totalPorNo[destinoLabel] =
            (totalPorNo[destinoLabel] || 0) + fluxos[chave];

        data.addRow([
            o,
            destinoLabel,
            fluxos[chave]
        ]);

    });


    // altura dinâmica conforme número de nós
    const altura = Math.max(
        420,
        nosUnicos.size * 26
    );

    elSankey.style.height = altura + "px";


    const options = {
        sankey: {
            node: {
                label: {
                    color: "#f9fafb",
                    fontName: "Segoe UI",
                    fontSize: 14,
                    bold: true
                },
                labelPadding: 8,
                nodePadding: 18,
                width: 14
            },
            link: {
                colorMode: "gradient"
            }
        },
        tooltip: {
            textStyle: { color: "#111827" }
        }
    };


    const chart = new google.visualization.Sankey(
        elSankey
    );

    // após desenhar, injeta a quantidade
    // numa segunda linha abaixo do nome do nó
    google.visualization.events.addListener(
        chart,
        "ready",
        () => {
            adicionarQuantidadeNosNos(totalPorNo);
            observarSankey(totalPorNo);
        }
    );

    chart.draw(data, options);

}


let observerSankey = null;

function observarSankey(totalPorNo) {

    const alvo = document.getElementById("sankey");

    if (!alvo) {
        return;
    }

    if (observerSankey) {
        observerSankey.disconnect();
    }

    observerSankey = new MutationObserver(() => {

        // evita laço: pausa, reinjeta e religa
        observerSankey.disconnect();

        adicionarQuantidadeNosNos(totalPorNo);

        observerSankey.observe(alvo, {
            childList: true,
            subtree: true
        });

    });

    observerSankey.observe(alvo, {
        childList: true,
        subtree: true
    });

}


function adicionarQuantidadeNosNos(totalPorNo) {

    const svg =
        document.querySelector("#sankey svg");

    if (!svg) {
        return;
    }

    svg.querySelectorAll("text").forEach(texto => {

        const label = texto.textContent;

        if (
            totalPorNo[label] == null ||
            texto.dataset.qtdAdicionada
        ) {
            return;
        }

        const x = texto.getAttribute("x");

        const tspan = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "tspan"
        );

        if (x !== null) {
            tspan.setAttribute("x", x);
        }

        tspan.setAttribute("dy", "1.35em");
        tspan.setAttribute("fill", "#9ca3af");
        tspan.setAttribute("font-size", "12");
        tspan.setAttribute("font-weight", "600");

        tspan.textContent =
            totalPorNo[label].toLocaleString("pt-BR");

        texto.appendChild(tspan);

        texto.dataset.qtdAdicionada = "1";

    });

}


window.addEventListener("resize", () => {
    renderizar();
});


carregarDados();
