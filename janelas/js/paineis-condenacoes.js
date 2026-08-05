
const { API } = window.UIComum;

let dadosGlobais = [];
let graficoPerdas;
let graficoPercentual;
let graficoTop;
let graficoWaterfall;
let periodoSelecionado = "52";

async function carregar() {
    const res = await fetch(`${API}/paineis-condenacoes`);
    dadosGlobais = await res.json();

    criarFiltrosCheckbox();
    atualizarGraficos();
}

function moeda(v) {
    return Number(v || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function destruir(chart) {
    if (chart) chart.destroy();
}

function atualizarKPIs(dados) {
    const bruto = dados.reduce((s, x) => s + Number(x.valor_total_bruto || 0), 0);
    const condenacoes = dados.reduce((s, x) => s + Number(x.valor_condenacoes || 0), 0);
    const mortos = dados.reduce((s, x) => s + Number(x.valor_mortos_transporte || 0), 0);
    const liquido = dados.reduce((s, x) => s + Number(x.valor_total_liquido || 0), 0);

    const percentual = bruto ? ((condenacoes + mortos) / bruto) * 100 : 0;

    document.getElementById("kpiBruto").textContent = moeda(bruto);
    document.getElementById("kpiCondenacoes").textContent = moeda(condenacoes);
    document.getElementById("kpiMortos").textContent = moeda(mortos);
    document.getElementById("kpiLiquido").textContent = moeda(liquido);
    document.getElementById("kpiPercentual").textContent =
        percentual.toFixed(2).replace(".", ",") + "%";
}

function criarFiltro(id, valores) {
    const el = document.getElementById(id);

    el.innerHTML = valores.map(v => `
        <div class="filtro-item">
            <input type="checkbox" value="${v}">
            <label>${v}</label>
        </div>
    `).join("");

    el.querySelectorAll("input").forEach(cb => {
        cb.addEventListener("change", atualizarGraficos);
    });
}

function valoresMarcados(id) {
    return [...document.querySelectorAll(`#${id} input:checked`)].map(x => x.value);
}

function criarFiltrosCheckbox() {
    criarFiltro(
        "filtroFornecedor",
        [...new Set(dadosGlobais.map(x => x.fornecedor))].filter(Boolean).sort()
    );

    criarFiltro(
        "filtroComprador",
        [...new Set(dadosGlobais.map(x => x.comprador))].filter(Boolean).sort()
    );

    criarFiltro(
        "filtroTipo",
        [...new Set(dadosGlobais.map(x => x.tipo_suino))].filter(Boolean).sort()
    );

    const anos = [...new Set(
        dadosGlobais.map(x => String(x.semana || "").substring(0, 4))
    )].filter(Boolean).sort().reverse();

    criarFiltroPeriodo(anos);
}

function criarFiltroPeriodo(anos) {
    const div = document.getElementById("filtroPeriodo");

    div.innerHTML = `
        <span class="titulo-periodo">Período:</span>
        <button class="btnPeriodo ativo" data-periodo="52">Últimas 52 semanas</button>
        <button class="btnPeriodo" data-periodo="all">Todo período</button>
        ${anos.map(ano => `
            <button class="btnPeriodo" data-periodo="${ano}">${ano}</button>
        `).join("")}
    `;

    div.querySelectorAll(".btnPeriodo").forEach(btn => {
        btn.addEventListener("click", () => {
            div.querySelectorAll(".btnPeriodo")
                .forEach(b => b.classList.remove("ativo"));

            btn.classList.add("ativo");
            periodoSelecionado = btn.dataset.periodo;

            atualizarGraficos();
        });
    });
}

function filtrar(lista, campo, valores) {
    if (!valores.length) return lista;
    return lista.filter(x => valores.includes(x[campo]));
}

function atualizarGraficos() {
    let dados = [...dadosGlobais];

    dados = filtrar(dados, "fornecedor", valoresMarcados("filtroFornecedor"));
    dados = filtrar(dados, "comprador", valoresMarcados("filtroComprador"));
    dados = filtrar(dados, "tipo_suino", valoresMarcados("filtroTipo"));

    if (periodoSelecionado !== "all") {
        if (periodoSelecionado === "52") {
            const semanas = [...new Set(dados.map(x => x.semana))].sort();
            const ultimas = semanas.slice(-52);
            dados = dados.filter(x => ultimas.includes(x.semana));
        } else {
            dados = dados.filter(x =>
                String(x.semana || "").startsWith(periodoSelecionado)
            );
        }
    }

    atualizarKPIs(dados);

    const mapa = {};

    dados.forEach(item => {
        const semana = item.semana || "Sem semana";

        if (!mapa[semana]) {
            mapa[semana] = {
                condenacoes: 0,
                mortos: 0,
                bruto: 0
            };
        }

        mapa[semana].condenacoes += Number(item.valor_condenacoes || 0);
        mapa[semana].mortos += Number(item.valor_mortos_transporte || 0);
        mapa[semana].bruto += Number(item.valor_total_bruto || 0);
    });

    const semanas = Object.keys(mapa).sort();

    destruir(graficoPerdas);

    graficoPerdas = new Chart(
        document.getElementById("graficoPerdasSemana"),
        {
            type: "bar",
            data: {
                labels: semanas,
                datasets: [
                    {
                        label: "Mortos em Transporte",
                        data: semanas.map(s => mapa[s].mortos),
                        backgroundColor: "#f59e0b"
                    },
                    {
                        label: "Condenações",
                        data: semanas.map(s => mapa[s].condenacoes),
                        backgroundColor: "#ef4444"
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                }
            }
        }
    );

    destruir(graficoPercentual);

    graficoPercentual = new Chart(
        document.getElementById("graficoPercentual"),
        {
            type: "line",
            data: {
                labels: semanas,
                datasets: [{
                    label: "% Perda",
                    data: semanas.map(s => {
                        const d = mapa[s];
                        return d.bruto
                            ? ((d.condenacoes + d.mortos) / d.bruto) * 100
                            : 0;
                    }),
                    borderColor: "#3b82f6",
                    backgroundColor: "rgba(59,130,246,.15)",
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        }
    );

    const fornecedores = {};

    dados.forEach(item => {
        const nome = item.fornecedor || "Sem fornecedor";

        if (!fornecedores[nome]) fornecedores[nome] = 0;

        fornecedores[nome] +=
            Number(item.valor_condenacoes || 0) +
            Number(item.valor_mortos_transporte || 0);
    });

    const top = Object.entries(fornecedores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    destruir(graficoTop);

    graficoTop = new Chart(
        document.getElementById("graficoTopFornecedores"),
        {
            type: "bar",
            data: {
                labels: top.map(x => x[0]),
                datasets: [{
                    data: top.map(x => x[1]),
                    backgroundColor: "#8b5cf6"
                }]
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        }
    );

    const bruto = dados.reduce((s, x) => s + Number(x.valor_total_bruto || 0), 0);
    const condenacoes = dados.reduce((s, x) => s + Number(x.valor_condenacoes || 0), 0);
    const mortos = dados.reduce((s, x) => s + Number(x.valor_mortos_transporte || 0), 0);
    const liquido = dados.reduce((s, x) => s + Number(x.valor_total_liquido || 0), 0);

    destruir(graficoWaterfall);

    graficoWaterfall = new Chart(
        document.getElementById("graficoWaterfall"),
        {
            type: "bar",
            data: {
                labels: ["Bruto", "Mortos", "Condenações", "Líquido"],
                datasets: [{
                    data: [bruto, -mortos, -condenacoes, liquido],
                    backgroundColor: [
                        "#2563eb",
                        "#f59e0b",
                        "#ef4444",
                        "#22c55e"
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        }
    );
}

carregar();

