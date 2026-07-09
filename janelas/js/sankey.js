const API = UIComum.API;

let dadosGlobais = [];
let googlePronto = false;


google.charts.load("current", { packages: ["sankey"] });

google.charts.setOnLoadCallback(() => {
    googlePronto = true;
    renderizar();
});


/* ============================
   ORIGEM / DESTINO conforme modo
============================ */

function camposDoTipo() {

    const modo =
        document.getElementById("filtroModoFluxo").value;

    if (modo === "estado") {
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
   FILTROS (mesmo padrão painéis-cargas-2)
============================ */

function filtrarUF(lista, ufsFornecedor, ufsComprador) {

    if (!ufsFornecedor.length && !ufsComprador.length) {
        return lista;
    }

    return lista.filter(item => {

        const okFornecedor =
            !ufsFornecedor.length ||
            ufsFornecedor.includes(item.estado_fornecedor);

        const okComprador =
            !ufsComprador.length ||
            ufsComprador.includes(item.estado_comprador);

        return okFornecedor && okComprador;
    });
}

function filtrar(lista, campo, valores) {

    if (!valores.length) {
        return lista;
    }

    return lista.filter(x =>
        valores.includes(x[campo])
    );
}

function valoresMarcados(id) {

    return [
        ...document.querySelectorAll(
            `#${id} input:checked`
        )
    ].map(x => x.value);
}

function criarFiltro(id, valores) {

    const el = document.getElementById(id);

    const itens = valores
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "pt-BR"))
        .map(v => `
            <div class="filtro-item">
                <input type="checkbox" value="${escaparHtml(v)}">
                <label>${escaparHtml(v)}</label>
            </div>
        `)
        .join("");

    el.innerHTML = `
        <button
            type="button"
            class="btn-limpar-filtro"
            onclick="limparFiltro('${id}')">
            Limpar Sele&ccedil;&atilde;o
        </button>
        <input
            type="text"
            class="filtro-pesquisa"
            placeholder="Pesquisar..."
            oninput="filtrarListaCheckbox('${id}', this.value)"
        >
        <div class="lista-checkbox">
            ${itens}
        </div>
    `;
}

function escaparHtml(texto) {

    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function ordenarSemanas(semanas) {

    return semanas.sort((a, b) => {
        const [anoA, semanaA] = a.split("/").map(Number);
        const [anoB, semanaB] = b.split("/").map(Number);

        if (anoA !== anoB) {
            return anoB - anoA;
        }

        return semanaB - semanaA;
    });
}

function criarFiltrosCheckbox() {

    const semanasOrdenadas = ordenarSemanas(
        [...new Set(dadosGlobais.map(x => x.semana))]
            .filter(Boolean)
    );

    criarFiltro("filtroSemanas", semanasOrdenadas);

    const ultimaSemana =
        document.querySelector("#filtroSemanas input[type=checkbox]");

    if (ultimaSemana) {
        ultimaSemana.checked = true;
    }

    criarFiltro(
        "filtroFornecedor",
        [...new Set(dadosGlobais.map(x => x.fornecedor))]
    );

    criarFiltro(
        "filtroComprador",
        [...new Set(dadosGlobais.map(x => x.comprador))]
    );

    criarFiltro(
        "filtroFrete",
        [...new Set(dadosGlobais.map(x => x.frete))]
            .filter(Boolean)
    );

    criarFiltro(
        "filtroUFFornecedor",
        [...new Set(dadosGlobais.map(x => x.estado_fornecedor))]
            .filter(Boolean)
    );

    criarFiltro(
        "filtroUFComprador",
        [...new Set(dadosGlobais.map(x => x.estado_comprador))]
            .filter(Boolean)
    );

    criarFiltro(
        "filtroTipoSuino",
        [...new Set(dadosGlobais.map(x => x.tipo_suino))]
    );

    document
        .querySelectorAll(".filtros-box input[type=checkbox]")
        .forEach(c => {
            c.addEventListener("change", renderizar);
        });
}

function filtrarListaCheckbox(id, texto) {

    const busca = texto.toLowerCase();

    document
        .querySelectorAll(`#${id} .filtro-item`)
        .forEach(item => {

            const nome = item
                .querySelector("label")
                .textContent
                .toLowerCase();

            item.style.display =
                nome.includes(busca)
                    ? "flex"
                    : "none";
        });
}

function limparFiltro(id) {

    document
        .querySelectorAll(
            `#${id} input[type=checkbox]`
        )
        .forEach(cb => {
            cb.checked = false;
        });

    renderizar();
}

function aplicarFiltros(lista) {

    let dados = [...lista];

    dados = filtrar(
        dados,
        "fornecedor",
        valoresMarcados("filtroFornecedor")
    );

    dados = filtrar(
        dados,
        "comprador",
        valoresMarcados("filtroComprador")
    );

    dados = filtrarUF(
        dados,
        valoresMarcados("filtroUFFornecedor"),
        valoresMarcados("filtroUFComprador")
    );

    dados = filtrar(
        dados,
        "tipo_suino",
        valoresMarcados("filtroTipoSuino")
    );

    dados = filtrar(
        dados,
        "frete",
        valoresMarcados("filtroFrete")
    );

    dados = filtrar(
        dados,
        "semana",
        valoresMarcados("filtroSemanas")
    );

    return dados;
}


/* ============================
   CARREGAR DADOS
============================ */

async function carregarDados() {

    try {

        const res = await fetch(`${API}/paineis-cargas-2`);

        dadosGlobais = await res.json();

        dadosGlobais = dadosGlobais.filter(
            item => item.fase !== "09-Cancelada"
        );

        criarFiltrosCheckbox();
        renderizar();

    } catch (err) {

        console.error(err);

    }

}

function aoMudarModoFluxo() {
    renderizar();
}


/* ============================
   AGREGAÇÃO NO GRÁFICO
   (2+ selecionados no mesmo filtro → um nó)
============================ */

function configAgregacaoGrafico() {

    const modo =
        document.getElementById("filtroModoFluxo").value;

    if (modo === "estado") {
        return {
            selOrigem: valoresMarcados("filtroUFFornecedor"),
            selDestino: valoresMarcados("filtroUFComprador")
        };
    }

    return {
        selOrigem: valoresMarcados("filtroFornecedor"),
        selDestino: valoresMarcados("filtroComprador")
    };
}

function formatarNomesSelecionados(selecionados) {

    const ordenados = [...selecionados]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "pt-BR"));

    const maxVisiveis = 4;

    if (ordenados.length <= maxVisiveis) {
        return ordenados.join(" · ");
    }

    return (
        ordenados.slice(0, maxVisiveis).join(" · ") +
        ` · +${ordenados.length - maxVisiveis}`
    );
}

function rotuloAgregado(valor, selecionados) {

    if (
        selecionados.length > 1 &&
        selecionados.includes(valor)
    ) {
        return formatarNomesSelecionados(selecionados);
    }

    return valor;
}

function contarLinhasLabel(label) {

    return String(label)
        .replace(/\u200B/g, "")
        .split("\n")
        .length;
}


/* ============================
   RENDERIZAR SANKEY
============================ */

function renderizar() {

    if (!googlePronto) {
        return;
    }

    const { origem, destino } = camposDoTipo();
    const linhas = aplicarFiltros(dadosGlobais);
    const ag = configAgregacaoGrafico();

    const fluxos = {};
    let totalExibido = 0;

    linhas.forEach(d => {

        let o = rotuloAgregado(
            (d[origem] || "").trim(),
            ag.selOrigem
        );

        let dst = rotuloAgregado(
            (d[destino] || "").trim(),
            ag.selDestino
        );

        if (!o || !dst) {
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

    const SUFixoDestino = "\u200B";

    const data = new google.visualization.DataTable();
    data.addColumn("string", "Origem");
    data.addColumn("string", "Destino");
    data.addColumn("number", "Suínos");

    const nosUnicos = new Set();
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

    let maxLinhasNo = 1;

    Object.keys(totalPorNo).forEach(chave => {
        maxLinhasNo = Math.max(
            maxLinhasNo,
            contarLinhasLabel(chave)
        );
    });

    const alturaPorNo = 24 + maxLinhasNo * 14;
    const paddingExtra = 56;

    const altura = Math.max(
        480,
        nosUnicos.size * alturaPorNo + paddingExtra
    );

    elSankey.style.height = altura + "px";
    elSankey.style.minHeight = altura + "px";

    const options = {
        chartArea: {
            left: 12,
            top: 16,
            width: "92%",
            height: "88%"
        },
        sankey: {
            node: {
                label: {
                    color: "#f9fafb",
                    fontName: "Segoe UI",
                    fontSize: 13,
                    bold: true
                },
                labelPadding: 10,
                nodePadding: 20,
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

function buscarTotalNo(label, totalPorNo) {

    if (totalPorNo[label] != null) {
        return totalPorNo[label];
    }

    const semZwsp = label.replace(/\u200B/g, "");

    if (totalPorNo[semZwsp] != null) {
        return totalPorNo[semZwsp];
    }

    if (totalPorNo[semZwsp + "\u200B"] != null) {
        return totalPorNo[semZwsp + "\u200B"];
    }

    return null;
}

function adicionarQuantidadeNosNos(totalPorNo) {

    const svg =
        document.querySelector("#sankey svg");

    if (!svg) {
        return;
    }

    svg.style.overflow = "visible";

    svg.querySelectorAll("text").forEach(texto => {

        if (texto.dataset.qtdAdicionada) {
            return;
        }

        const label = texto.textContent;
        const total = buscarTotalNo(label, totalPorNo);

        if (total == null) {
            return;
        }

        const x = texto.getAttribute("x");
        const linhas = contarLinhasLabel(label);
        const dyExtra = 1.1 + (linhas - 1) * 0.55;

        const tspan = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "tspan"
        );

        if (x !== null) {
            tspan.setAttribute("x", x);
        }

        tspan.setAttribute("dy", `${dyExtra}em`);
        tspan.setAttribute("fill", "#9ca3af");
        tspan.setAttribute("font-size", "12");
        tspan.setAttribute("font-weight", "600");

        tspan.textContent =
            total.toLocaleString("pt-BR");

        texto.appendChild(tspan);

        texto.dataset.qtdAdicionada = "1";

    });

}

window.addEventListener("resize", () => {
    renderizar();
});

window.limparFiltro = limparFiltro;
window.filtrarListaCheckbox = filtrarListaCheckbox;
window.aoMudarModoFluxo = aoMudarModoFluxo;

carregarDados();
