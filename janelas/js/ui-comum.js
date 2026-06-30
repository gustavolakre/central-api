(function () {

    const API =
        "https://api-production-6670.up.railway.app";

    const CORES = {
        "01-Negociado": "#f97316",
        "02-Planejamento": "#dc2626",
        "03-Programado": "#2563eb",
        "04-Fechamento Fiscal": "#e7ad30",
        "05-Verificação": "#16a34a",
        "06-Doc. Pendentes": "#9333ea",
        "07-Pagamento": "#e87bf7"
    };

    function corFase(fase) {
        return CORES[fase] || "#6b7280";
    }

    function voltarInicio(destino) {
        window.location.href =
            destino || "/janelas/inicial.html";
    }

    function getToken() {
        return localStorage.getItem("token");
    }

    function mostrarUltimaAtualizacao(
        campoId = "ultimaAtualizacao"
    ) {

        const campo =
            document.getElementById(campoId);

        if (!campo) {
            return;
        }

        const ultima = localStorage.getItem(
            "ultimaAtualizacaoPipefy"
        );

        campo.innerHTML = ultima
            ? `🕒 Última atualização: ${ultima}`
            : "🕒 Ainda não atualizado";
    }

    function htmlSegmentoBarra(
        fase,
        qtd,
        total,
        opcoes = {}
    ) {

        const largura = (qtd / total) * 100;
        const compacta = opcoes.compacta === true;
        const classeTamanho = compacta
            ? "fase--compacta"
            : "fase--padrao";

        return `
            <div
                class="fase ${classeTamanho}"
                style="width:${largura}%;background-color:${corFase(fase)};"
                title="${fase}: ${qtd}"
            >
                ${qtd}
            </div>
        `;
    }

    async function atualizarCargasPipefy(
        opcoes = {}
    ) {

        const statusId =
            opcoes.statusId || "status";

        const recarregar =
            opcoes.recarregar !== false;

        const status =
            document.getElementById(statusId);

        if (status) {
            status.innerHTML =
                "Gerando relatório no Pipefy...";
        }

        try {

            const resposta = await fetch(
                "/importar-cargas-relatorio",
                {
                    method: "POST",
                    headers: {
                        Authorization:
                            `Bearer ${getToken()}`
                    }
                }
            );

            const dados =
                await resposta.json();

            if (dados.sucesso) {

                if (status) {
                    status.innerHTML =
                        `✅ ${dados.importados} cargas importadas`;
                }

                mostrarUltimaAtualizacao();

                if (recarregar) {
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                }

                return dados;
            }

            if (status) {
                status.innerHTML =
                    `❌ ${dados.erro}`;
            }

            return dados;

        } catch (err) {

            console.error(err);

            if (status) {
                status.innerHTML =
                    "❌ Erro ao atualizar cargas.";
            }

            throw err;
        }
    }

    function initSocketUltimaAtualizacao(
        socket
    ) {

        socket.on(
            "ultimaAtualizacaoPipefy",
            (data) => {

                localStorage.setItem(
                    "ultimaAtualizacaoPipefy",
                    data.data
                );

                mostrarUltimaAtualizacao();
            }
        );
    }

    window.UIComum = {
        API,
        CORES,
        corFase,
        voltarInicio,
        getToken,
        mostrarUltimaAtualizacao,
        htmlSegmentoBarra,
        atualizarCargasPipefy,
        initSocketUltimaAtualizacao
    };

    window.voltarInicio = voltarInicio;
    window.atualizarCargasPipefy =
        atualizarCargasPipefy;

})();
