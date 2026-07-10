const {
    API,
    getToken,
    mostrarUltimaAtualizacao,
    htmlSegmentoBarra,
    initSocketUltimaAtualizacao
} = window.UIComum;

const socket = io(API);

initSocketUltimaAtualizacao(socket);

const FOTOS = {
    "Adelar Schuh":
        "imagens/usuarios/adelar.jpeg",
    "Enário dos Santos":
        "imagens/usuarios/enario.jpeg",
    "Maicon Roberto":
        "imagens/usuarios/maicon.jpg",
    "Rafael de Lima":
        "imagens/usuarios/rafael.jpeg",
    "Vânia Riva":
        "imagens/usuarios/vania.jpg"
};

function salvarDestinoEIrLogin() {

    localStorage.setItem(
        "paginaDestino",
        window.location.pathname +
            window.location.search
    );

    window.location.href = "login.html";
}

const token = getToken();

if (!token) {
    salvarDestinoEIrLogin();
}

async function carregarPipeline() {

    if (!getToken()) {
        alert(
            "Sessão expirada. Faça login novamente."
        );
        return;
    }

    try {

        const resposta = await fetch(
            "/dashboard/pipeline",
            {
                headers: {
                    Authorization:
                        `Bearer ${getToken()}`
                }
            }
        );

        if (resposta.status === 401) {

            localStorage.clear();

            document.cookie
                .split(";")
                .forEach((cookie) => {

                    const nome = cookie
                        .split("=")[0]
                        .trim();

                    document.cookie =
                        nome +
                        "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
                });

            salvarDestinoEIrLogin();
            return;
        }

        if (!resposta.ok) {
            throw new Error(
                `Erro HTTP ${resposta.status}`
            );
        }

        const dados =
            await resposta.json();

        montarPipeline(dados);
        montarPainelDireito(dados);

    } catch (erro) {
        console.error(erro);
    }
}

function montarPipeline(linhas) {

    const responsaveis = {};

    linhas.forEach((item) => {

        if (
            item.semana &&
            item.semana.includes("2025")
        ) {
            return;
        }

        const fasesPainelEsquerdo = [
            "01-Negociado",
            "02-Planejamento",
            "03-Programado",
            "04-Fechamento Fiscal",
            "05-Verificação",
            "06-Doc. Pendentes"
        ];

        if (
            !fasesPainelEsquerdo.includes(
                item.fase
            )
        ) {
            return;
        }

        const nome =
            item.responsavel_dashboard;

        if (!responsaveis[nome]) {
            responsaveis[nome] = {};
        }

        if (
            !responsaveis[nome][item.semana]
        ) {
            responsaveis[nome][item.semana] = {
                fases: {}
            };
        }

        if (
            !responsaveis[nome][item.semana]
                .fases[item.fase]
        ) {
            responsaveis[nome][item.semana]
                .fases[item.fase] = 0;
        }

        responsaveis[nome][item.semana]
            .fases[item.fase] +=
            Number(item.quantidade);
    });

    const container =
        document.getElementById("listaPipeline");

    container.innerHTML = "";

    Object.entries(responsaveis)
        .forEach(([nome, semanas]) => {

            let htmlSemanas = "";

            Object.entries(semanas)
                .sort((a, b) =>
                    b[0].localeCompare(a[0])
                )
                .forEach(([semana, dados]) => {

                    const total =
                        Object.values(
                            dados.fases || {}
                        ).reduce(
                            (a, b) => a + b,
                            0
                        );

                    let barra = "";

                    Object.entries(dados.fases)
                        .sort((a, b) =>
                            a[0].localeCompare(b[0])
                        )
                        .forEach(([fase, qtd]) => {

                            barra +=
                                htmlSegmentoBarra(
                                    fase,
                                    qtd,
                                    total
                                );
                        });

                    htmlSemanas += `
                        <div class="linha-semana">
                            <div class="semana">
                                ${semana}
                            </div>
                            <div class="pipeline-barra">
                                ${barra}
                            </div>
                            <div class="total">
                                ${total}
                            </div>
                        </div>
                    `;
                });

            container.innerHTML += `
                <div class="grupo-responsavel">
                    <div class="info-responsavel">
                        <img
                            class="foto-usuario"
                            src="${FOTOS[nome] || ""}"
                            alt="${nome}"
                        >
                        <div class="nome-responsavel">
                            ${nome}
                        </div>
                    </div>
                    <div class="lista-semanas">
                        ${htmlSemanas}
                    </div>
                </div>
            `;
        });
}

function montarBarraFases(
    fases,
    opcoes = {}
) {

    const total = Object.values(fases)
        .reduce((a, b) => a + b, 0);

    let barra = "";

    Object.entries(fases)
        .sort((a, b) =>
            a[0].localeCompare(b[0])
        )
        .forEach(([fase, qtd]) => {

            barra += htmlSegmentoBarra(
                fase,
                qtd,
                total,
                opcoes
            );
        });

    return { barra, total };
}

function montarPainelDireito(linhas) {

    const semanas = {};

    linhas.forEach((item) => {

        const semana = item.semana;
        const diaRaw =
            item.etiquetas || item.dia || "";
        const fase = item.fase;
        const qtd =
            Number(item.quantidade || 0);

        const diaLower = diaRaw
            .toString()
            .trim()
            .toLowerCase();

        if (
            !semana ||
            semana.includes("2025") ||
            diaLower.includes(
                "semana sem data definida"
            )
        ) {
            return;
        }

        let dia = diaLower.split(",")[0].trim();

        dia = dia
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace("-feira", "")
            .replace("feira", "")
            .trim();

        if (dia.includes("sem data definida")) {
            dia = "sem definição";
        }

        if (!semanas[semana]) {
            semanas[semana] = {
                _semDia: {}
            };
        }

        if (dia && dia !== semana) {

            if (!semanas[semana][dia]) {
                semanas[semana][dia] = {
                    fases: {}
                };
            }

            if (
                !semanas[semana][dia].fases[fase]
            ) {
                semanas[semana][dia].fases[fase] =
                    0;
            }

            semanas[semana][dia].fases[fase] +=
                qtd;

        } else {

            if (
                !semanas[semana]._semDia.fases
            ) {
                semanas[semana]._semDia.fases =
                    {};
            }

            if (
                !semanas[semana]._semDia
                    .fases[fase]
            ) {
                semanas[semana]._semDia
                    .fases[fase] = 0;
            }

            semanas[semana]._semDia
                .fases[fase] += qtd;
        }
    });

    const diasOrdem = [
        "domingo",
        "segunda",
        "terca",
        "quarta",
        "quinta",
        "sexta",
        "sabado",
        "sem definição"
    ];

    const container = document
        .querySelectorAll(
            ".dashboard-painel"
        )[1]
        .querySelector(".dashboard-conteudo");

    let html = "";

    Object.entries(semanas)
        .sort((a, b) =>
            b[0].localeCompare(a[0])
        )
        .forEach(([semana, dias]) => {

            let linhasDias = "";

            diasOrdem.forEach((dia) => {

                const dadosDia = dias[dia];

                if (!dadosDia) {
                    return;
                }

                const { barra, total } =
                    montarBarraFases(
                        dadosDia.fases
                    );

                linhasDias += `
                    <div class="linha-semana">
                        <div class="semana">
                            ${dia}
                        </div>
                        <div class="pipeline-barra">
                            ${barra}
                        </div>
                        <div class="total">
                            ${total}
                        </div>
                    </div>
                `;
            });

            if (
                dias._semDia &&
                dias._semDia.fases &&
                Object.keys(
                    dias._semDia.fases
                ).length
            ) {

                const { barra, total } =
                    montarBarraFases(
                        dias._semDia.fases,
                        { compacta: true }
                    );

                linhasDias += `
                    <div class="linha-semana">
                        <div class="semana">
                            Sem dia
                        </div>
                        <div class="pipeline-barra">
                            ${barra}
                        </div>
                        <div class="total">
                            ${total}
                        </div>
                    </div>
                `;
            }

            html += `
                <div class="grupo-responsavel">
                    <div class="info-responsavel">
                        <div class="nome-responsavel">
                            Semana ${semana}
                        </div>
                    </div>
                    <div class="lista-semanas">
                        ${linhasDias}
                    </div>
                </div>
            `;
        });

    container.innerHTML = html;
}

window.addEventListener("load", () => {

    carregarPipeline();
    mostrarUltimaAtualizacao();

    socket.on("connect", () => {
        console.log("socket conectado");
    });
});
