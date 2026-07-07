const API = UIComum.API;

let dadosGlobais = [];
let googlePronto = false;
let periodoSelecionado = "52";


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

function criarFiltroPeriodo(anos) {

    const div = document.getElementById("filtroPeriodo");

    div.innerHTML = `
        <span class="titulo-periodo">Per&iacute;odo:</span>
        <button type="button" class="btnPeriodo ativo" data-periodo="52">
            &Uacute;ltimas 52 semanas
        </button>
        <button type="button" class="btnPeriodo" data-periodo="all">
            Todo per&iacute;odo
        </button>
        ${anos.map(ano => `
            <button type="button" class="btnPeriodo" data-periodo="${ano}">
                ${ano}
            </button>
        `).join("")}
    `;

    document.querySelectorAll(".btnPeriodo").forEach(btn => {

        btn.onclick = () => {

            document
                .querySelectorAll(".btnPeriodo")
                .forEach(b => b.classList.remove("ativo"));

            btn.classList.add("ativo");

            periodoSelecionado = btn.dataset.periodo;

            renderizar();
        };
    });
}

function criarFiltrosCheckbox() {

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

    const anos = [
        ...new Set(
            dadosGlobais.map(x => x.semana.substring(0, 4))
        )
    ].sort().reverse();

    criarFiltroPeriodo(anos);

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

    const is52 = periodoSelecionado === "52";
    const isAll = periodoSelecionado === "all";

    if (is52) {

        const semanasOrdenadas = [...new Set(dados.map(x => x.semana))]
            .sort((a, b) => {
                const [anoA, semanaA] = a.split("/").map(Number);
                const [anoB, semanaB] = b.split("/").map(Number);

                if (anoA !== anoB) return anoA - anoB;
                return semanaA - semanaB;
            });

        const ultimas52 = semanasOrdenadas.slice(-52);

        dados = dados.filter(item =>
            ultimas52.includes(item.semana)
        );

    } else if (!isAll) {

        dados = dados.filter(item =>
            item.semana.startsWith(periodoSelecionado)
        );
    }

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
   RENDERIZAR SANKEY
============================ */

function renderizar() {

    if (!googlePronto) {
        return;
    }

    const { origem, destino } = camposDoTipo();
    const linhas = aplicarFiltros(dadosGlobais);

    const fluxos = {};
    let totalExibido = 0;

    linhas.forEach(d => {

        const o = (d[origem] || "").trim();
        const dst = (d[destino] || "").trim();

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

window.limparFiltro = limparFiltro;
window.filtrarListaCheckbox = filtrarListaCheckbox;
window.aoMudarModoFluxo = aoMudarModoFluxo;

carregarDados();
