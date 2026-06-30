const {
    API,
    getToken,
    mostrarUltimaAtualizacao,
    initSocketUltimaAtualizacao
} = window.UIComum;

const socket = io(API);

let dadosGlobais = [];
let chartPrincipal;
let periodoSelecionado = "52";
let perfilAtual = null;
let chartMediaPonderada;

initSocketUltimaAtualizacao(socket, async () => {

    const res = await fetch(`${API}/paineis-cargas-2`);
    dadosGlobais = await res.json();

    dadosGlobais = dadosGlobais.filter(
        item => item.fase !== "09-Cancelada"
    );

    atualizarGraficos();
});


async function carregar() {

    const res =
        await fetch(`${API}/paineis-cargas-2`);

    dadosGlobais = await res.json();

    dadosGlobais = dadosGlobais.filter(
        item => item.fase !== "09-Cancelada"
    );

    criarFiltrosCheckbox();

    atualizarGraficos();

    carregarPerfis();

}



function filtrarUF(lista, ufsFornecedor, ufsComprador) {

    if (!ufsFornecedor.length && !ufsComprador.length)
        return lista;

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


function criarFiltrosCheckbox() {

    criarFiltro(
        "filtroFornecedor",
        [...new Set(dadosGlobais.map(x => x.fornecedor))].sort()
    );

    criarFiltro(
        "filtroComprador",
        [...new Set(dadosGlobais.map(x => x.comprador))].sort()
    );

    criarFiltro(
        "filtroFrete",
        [...new Set(dadosGlobais.map(x => x.frete))]
            .filter(Boolean)
            .sort()
    );

    const ufsFornecedor = [
        ...new Set(dadosGlobais.map(x => x.estado_fornecedor))
    ]
        .filter(Boolean)
        .sort();

    const ufsComprador = [
        ...new Set(dadosGlobais.map(x => x.estado_comprador))
    ]
        .filter(Boolean)
        .sort();

    criarFiltro("filtroUFFornecedor", ufsFornecedor);
    criarFiltro("filtroUFComprador", ufsComprador);

    criarFiltro(
        "filtroTipo",
        [...new Set(dadosGlobais.map(x => x.tipo_suino))].sort()
    );

    const anos = [
        ...new Set(
            dadosGlobais.map(x => x.semana.substring(0, 4))
        )
    ].sort().reverse();

    criarFiltroPeriodo(anos);

    document
        .querySelectorAll("input[type=checkbox]")
        .forEach(c => {

            c.addEventListener(
                "change",
                atualizarGraficos
            );

        });

}


function criarFiltroPeriodo(anos) {

    const div = document.getElementById("filtroPeriodo");

    div.innerHTML = `
      <span class="titulo-periodo">Período:</span>

    <button class="btnPeriodo ativo" data-periodo="52">
       Últimas 52 semanas
    </button>

    <button class="btnPeriodo" data-periodo="all">
       Todo período
    </button>

    ${anos.map(ano => `
       <button class="btnPeriodo" data-periodo="${ano}">
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

            atualizarGraficos();

        };

    });

}


function criarFiltro(id, valores) {

    const el = document.getElementById(id);

    const itens = valores
        .filter(Boolean)
        .sort()
        .map(v => `
            <div class="filtro-item">

                <input
                    type="checkbox"
                    value="${v}"
                >

                <label>${v}</label>

            </div>
        `)
        .join("");

    el.innerHTML = `

          <button
              class="btn-limpar-filtro"
              onclick="limparFiltro('${id}')">
              Limpar Seleção
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

function valoresMarcados(id) {

    return [
        ...document.querySelectorAll(
            `#${id} input:checked`
        )
    ].map(x => x.value);
}

function filtrar(lista, campo, valores) {

    if (!valores.length)
        return lista;

    return lista.filter(x =>
        valores.includes(
            x[campo]
        )
    );
}


function limparFiltro(id) {

    document
        .querySelectorAll(
            `#${id} input[type=checkbox]`
        )
        .forEach(cb => {

            cb.checked = false;

        });

    atualizarGraficos();

}

function agruparPorSemana(lista, limite52 = true) {

    const mapa = {};

    lista.forEach(item => {

        if (!mapa[item.semana]) {
            mapa[item.semana] = 0;
        }

        mapa[item.semana] += Number(item.quantidade || 0);

    });

    let semanas = Object.keys(mapa).sort((a, b) => {
        const [anoA, semanaA] = a.split("/").map(Number);
        const [anoB, semanaB] = b.split("/").map(Number);

        if (anoA !== anoB) return anoA - anoB;
        return semanaA - semanaB;
    });

    if (limite52) {
        semanas = semanas.slice(-52);
    }

    return {
        labels: semanas,
        valores: semanas.map(s => mapa[s])
    };
}

function destruir(chart) {

    if (chart) {

        chart.destroy();

    }
}

function criarGrafico(canvasId, labels, data, cor = "#f97316", tipo = "bar") {

    return new Chart(
        document.getElementById(canvasId),
        {
            type: tipo,

            data: {
                labels,
                datasets: [{
                    label: "Suínos",
                    data,

                    backgroundColor: tipo === "line"
                        ? "rgba(37,99,235,0.15)"
                        : cor,

                    borderColor: cor,
                    borderWidth: 2,
                    borderRadius: 4,

                    fill: tipo === "line",
                    tension: 0.3,

                    pointRadius: tipo === "line" ? 2 : 3,
                    pointHoverRadius: tipo === "line" ? 8 : 5,
                    pointHitRadius: tipo === "line" ? 20 : 8,
                    pointBackgroundColor: cor,
                    pointBorderColor: cor,

                    barPercentage: 0.9,
                    categoryPercentage: 0.9
                }]
            },

            options: {

                devicePixelRatio: 2,

                barPercentage: 0.95,
                categoryPercentage: 0.95,

                borderWidth: tipo === "line" ? 4 : 2,

                responsive: true,
                maintainAspectRatio: false,

                layout: {
                    padding: {
                        top: 40,
                        right: 35,
                        left: 35,
                        bottom: 35
                    }
                },

                interaction: {
                    mode: "index",
                    intersect: false
                },

                scales: {

                    x: {

                        display: periodoSelecionado !== "all",

                        grid: {
                            display: false
                        },

                        ticks: {
                            color: "#e5e7eb",

                            font: {
                                family: "Oswald",
                                size: 16,
                                weight: "bold",
                                lineHeight: 1.8
                            },

                            autoSkip: false,
                            maxTicksLimit: 18,

                            maxRotation: 45,
                            minRotation: 45
                        }
                    },

                    y: {

                        beginAtZero: true,

                        grace: "25%",

                        grid: {
                            color: "rgba(255,255,255,.08)"
                        },

                        ticks: {
                            color: "#e5e7eb",

                            font: {
                                family: "Oswald",
                                size: 13,
                                weight: "600",
                                lineHeight: 1.8
                            },

                            callback: value =>
                                Number(value).toLocaleString("pt-BR")
                        }
                    }
                },

                plugins: {

                    legend: {
                        display: false
                    },

                    datalabels: {

                        display: (ctx) =>
                            ctx.dataset.data[ctx.dataIndex] !== null,

                        color: "#fff",
                        anchor: "end",
                        align: "top",
                        offset: 6,

                        font: {
                            family: "Source Sans 3",
                            size: 10,
                            weight: "600"
                        },

                        formatter: (value, context) => {

                            const id = context.chart.canvas.id;
                            const n = Number(value);

                            if (isNaN(n)) return "0";

                            if (id === "graficoMediaPonderada") {
                                return n.toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                });
                            }

                            return n.toLocaleString("pt-BR", {
                                maximumFractionDigits: 0
                            });
                        }
                    },

                    tooltip: {

                        backgroundColor: "rgba(17,24,39,0.95)",
                        borderColor: "#3b82f6",
                        borderWidth: 1,
                        cornerRadius: 10,
                        padding: 16,
                        displayColors: false,

                        titleFont: {
                            family: "Source Sans 3",
                            size: 16,
                            weight: "700"
                        },

                        bodyFont: {
                            family: "Source Sans 3",
                            size: 15,
                            weight: "600"
                        },

                        titleSpacing: 8,
                        bodySpacing: 8,
                        caretPadding: 8,

                        callbacks: {
                            title: (ctx) =>
                                `Semana: ${ctx[0].label}`,

                            label: (ctx) =>
                                `Quantidade: ${Number(ctx.raw).toLocaleString("pt-BR")}`
                        }
                    }
                }
            }
        }
    );
}



function atualizarGraficos() {

    let dados = [...dadosGlobais];

    // =========================
    // FILTROS
    // =========================
    dados = filtrar(dados, "fornecedor", valoresMarcados("filtroFornecedor"));
    dados = filtrar(dados, "comprador", valoresMarcados("filtroComprador"));

    dados = filtrarUF(
        dados,
        valoresMarcados("filtroUFFornecedor"),
        valoresMarcados("filtroUFComprador")
    );

    dados = filtrar(dados, "tipo_suino", valoresMarcados("filtroTipo"));
    dados = filtrar(dados, "frete", valoresMarcados("filtroFrete"));

    // =========================
    // PERÍODO
    // =========================
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

    const limite52 = periodoSelecionado === "52";

    // =========================
    // GRÁFICO 1 - QUANTIDADE
    // =========================
    const g = agruparPorSemana(dados, limite52);

    destruir(chartPrincipal);

    chartPrincipal = criarGrafico(
        "graficoPrincipal",
        g.labels,
        g.valores,
        "#3b82f6",
        periodoSelecionado === "all" ? "line" : "bar"
    );

    // =========================
    // MÉDIA PONDERADA
    // =========================
    const mapa = {};

    dados.forEach(item => {

        const semana = item.semana;

        const peso = Number(item.peso || 0);
        const precoKg = Number(item.preco_kg || 0);
        const valor = Number(item.valor || 0);

        if (!mapa[semana]) {

            mapa[semana] = {
                peso: 0,
                valor: 0
            };

        }

        // 2º gráfico (média ponderada): só cargas com peso e preço,
        // para não distorcer o preço com cargas ainda sem preço lançado
        if (peso > 0 && precoKg > 0) {

            mapa[semana].peso += peso;
            mapa[semana].valor += valor;

        }

    });

    const semanasMP = Object.keys(mapa)
        .sort((a, b) => {
            const [anoA, semA] = a.split("/").map(Number);
            const [anoB, semB] = b.split("/").map(Number);
            return anoA !== anoB ? anoA - anoB : semA - semB;
        });

    const labelsMP = semanasMP;

    const valoresMP = semanasMP.map(s => {
        const d = mapa[s];
        return d.peso > 0 ? (d.valor / d.peso) : 0;
    });

    destruir(chartMediaPonderada);

    chartMediaPonderada = criarGrafico(
        "graficoMediaPonderada",
        labelsMP,
        valoresMP,
        "#ef4444",
        periodoSelecionado === "all" ? "line" : "bar"
    );
}


async function salvarPerfil() {

    const filtros = {

        periodo: periodoSelecionado,

        fornecedor: valoresMarcados("filtroFornecedor"),

        comprador: valoresMarcados("filtroComprador"),

        ufFornecedor: valoresMarcados("filtroUFFornecedor"),

        ufComprador: valoresMarcados("filtroUFComprador"),

        tipo: valoresMarcados("filtroTipo"),

        frete: valoresMarcados("filtroFrete")

    };

    let nome;

    if (perfilAtual) {

        nome = document
            .getElementById("perfilGrafico")
            .selectedOptions[0].text;

    } else {

        nome = prompt("Nome do perfil:");

        if (!nome)
            return;

    }

    const metodo =
        perfilAtual
            ? "PUT"
            : "POST";

    const url =
        perfilAtual
            ? `${API}/paineis-cargas-2/perfis/${perfilAtual}`
            : `${API}/paineis-cargas-2/perfis`;

    await fetch(url, {
        method: metodo,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
            nome,
            filtros_json: filtros
        })
    });

    await carregarPerfis();

}


async function excluirPerfil() {

    if (!perfilAtual)
        return;

    if (!confirm("Excluir perfil?"))
        return;

    await fetch(
        `${API}/paineis-cargas-2/perfis/${perfilAtual}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );

    perfilAtual = null;

    carregarPerfis();

}


async function abrirPerfil(id) {

    if (!id) {

        document.getElementById("perfilGrafico").value = "";
        perfilAtual = null;

        return;
    }

    const res = await fetch(
        `${API}/paineis-cargas-2/perfis/${id}`,
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );

    const perfil = await res.json();

    perfilAtual = id;


    const f = perfil.filtros_json;

    document
        .querySelectorAll(
            ".lista-checkbox input[type=checkbox]"
        )
        .forEach(cb => cb.checked = false);

    marcarFiltro(
        "filtroFornecedor",
        f.fornecedor
    );

    marcarFiltro(
        "filtroComprador",
        f.comprador
    );

    marcarFiltro(
        "filtroUFFornecedor",
        f.ufFornecedor
    );

    marcarFiltro(
        "filtroUFComprador",
        f.ufComprador
    );

    marcarFiltro(
        "filtroTipo",
        f.tipo
    );

    marcarFiltro(
        "filtroFrete",
        f.frete
    );

    periodoSelecionado = f.periodo;

    document
        .querySelectorAll(".btnPeriodo")
        .forEach(btn => {

            btn.classList.toggle(
                "ativo",
                btn.dataset.periodo == periodoSelecionado
            );

        });

    document.querySelectorAll(".perfil-item").forEach(el => {
        el.classList.toggle(
            "ativo",
            el.dataset.id == id
        );
    });

    atualizarGraficos();

}


function marcarFiltro(id, valores) {

    if (!valores) return;

    const lista = document.querySelectorAll(`#${id} input[type=checkbox]`);

    lista.forEach(cb => {
        cb.checked = valores.includes(cb.value);
    });
}


function limparTodosFiltros() {

    document
        .querySelectorAll(".lista-checkbox input[type=checkbox]")
        .forEach(cb => cb.checked = false);

}


async function carregarPerfis() {

    const res = await fetch(`${API}/paineis-cargas-2/perfis`, {
        headers: {
            Authorization: `Bearer ${getToken()}`
        }
    });

    const perfis = await res.json();

    const div = document.getElementById("listaPerfis");

    div.innerHTML = `
          <div class="perfil-item" data-id="__TODOS__">
            👁️ Visualizar tudo (sem filtros)
        </div>
    `;

    perfis.forEach(p => {
        div.innerHTML += `
            <div class="perfil-item" data-id="${p.id}">
                ${p.nome}
            </div>
        `;
    });
}



mostrarUltimaAtualizacao();


document.fonts.ready.then(() => {
    carregar();
});



document.getElementById("btnSalvarPerfil")
    .onclick = salvarPerfil;

document.getElementById("btnExcluirPerfil")
    .onclick = excluirPerfil;


document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        mostrarUltimaAtualizacao();
    }
});


document.addEventListener("click", (e) => {

    const item = e.target.closest(".perfil-item");

    if (!item) return;

    const id = item.dataset.id;

    if (id === "__TODOS__" || id === "") {

        perfilAtual = null;
        limparTodosFiltros();
        periodoSelecionado = "52";

        document
            .querySelectorAll(".btnPeriodo")
            .forEach(b =>
                b.classList.toggle("ativo", b.dataset.periodo === "52")
            );

        atualizarGraficos();
        return;
    }

    abrirPerfil(id);
});


window.addEventListener("storage", (event) => {
    if (event.key === "ultimaAtualizacaoPipefy") {
        mostrarUltimaAtualizacao();
    }
});
