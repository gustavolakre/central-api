function salvarDestinoEIrLogin() {
    localStorage.setItem(
        "paginaDestino",
        window.location.pathname + window.location.search
    );
    localStorage.removeItem("token");
    window.location.href = "/login";
}

async function validarLogin() {
    const token = localStorage.getItem("token");

    if (!token) {
        salvarDestinoEIrLogin();
        return;
    }

    try {
        const resposta = await fetch("/validar-token", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!resposta.ok) {
            salvarDestinoEIrLogin();
        }
    } catch {
        salvarDestinoEIrLogin();
    }
}

validarLogin();

async function carregarSessoesAtivas() {
    try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const resp = await fetch("/faturamento-sessao", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!resp.ok) return;

        const data = await resp.json();
        const container = document.getElementById("avisoSessoes");
        if (!container) return;

        container.innerHTML = "";

        const mapa = {
            FATURAMENTO_CARGAS: {
                titulo: "Faturamento de Cargas",
                url: "/janelas/faturamento-cargas.html"
            },
            FATURAMENTO_FRETES: {
                titulo: "Faturamento de Fretes",
                url: "/janelas/fatura-fretes.html"
            }
        };

        (data.sessoes || []).forEach(sessao => {
            const info = mapa[sessao.processo];
            if (!info) return;

            const dataFmt = sessao.atualizado_em
                ? new Date(sessao.atualizado_em).toLocaleString("pt-BR")
                : "";

            container.innerHTML += `
                <div class="avisoSessao">
                    <span>
                        <strong>${info.titulo}</strong>
                        em andamento por
                        <strong>${sessao.iniciado_por}</strong>
                        ${dataFmt ? ` — salvo ${dataFmt}` : ""}
                    </span>
                    <button onclick="window.location.href='${info.url}'">
                        Retomar
                    </button>
                </div>
            `;
        });
    } catch (err) {
        console.error(err);
    }
}

carregarSessoesAtivas();

function mostrarUltima(elementoId, valor) {
    const campo = document.getElementById(elementoId);
    if (!campo) return;

    campo.innerHTML = valor
        ? `🕒 Última atualização: ${valor}`
        : "🕒 Ainda não atualizado";
}

function aplicarUltima(chave, elementoId, valor) {
    if (valor) {
        localStorage.setItem(chave, valor);
    }

    mostrarUltima(
        elementoId,
        valor || localStorage.getItem(chave)
    );
}

const socket = io(UIComum.API);

UIComum.initSocketUltimaAtualizacao(socket, (data) => {
    aplicarUltima(
        "ultimaAtualizacaoPipefy",
        "ultimaCargas",
        data.data
    );
});

socket.on("ultimaAtualizacaoParceiros", (data) => {
    aplicarUltima(
        "ultimaAtualizacaoParceiros",
        "ultimaParceiros",
        data.data
    );
});

socket.on("ultimaAtualizacaoFretes", (data) => {
    aplicarUltima(
        "ultimaAtualizacaoFretes",
        "ultimaFretes",
        data.data
    );
});

mostrarUltima(
    "ultimaCargas",
    localStorage.getItem("ultimaAtualizacaoPipefy")
);

mostrarUltima(
    "ultimaParceiros",
    localStorage.getItem("ultimaAtualizacaoParceiros")
);

mostrarUltima(
    "ultimaFretes",
    localStorage.getItem("ultimaAtualizacaoFretes")
);

function abrirCargas() {
    window.location.href = "/janelas/faturamento-cargas.html";
}

function abrirFretes() {
    window.location.href = "/janelas/fatura-fretes.html";
}

async function importarCargas() {
    const status = document.getElementById("status");
    const botao = document.getElementById("btnImportarCargas");
    const arquivo = document.getElementById("arquivoCargas").files[0];

    if (!arquivo) {
        alert("Selecione uma planilha.");
        return;
    }

    try {
        status.innerHTML = "Enviando arquivo...";

        const formData = new FormData();
        formData.append("arquivo", arquivo);

        const resposta = await fetch("/importar-cargas", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            body: formData
        });

        if (!resposta.ok) {
            throw new Error("Erro na resposta do servidor");
        }

        const dados = await resposta.json();

        if (dados.sucesso) {
            status.innerHTML = `
       ✅ Importação concluída com sucesso.

         <br><br>

        <b>${dados.importados}</b>
        registros importados.
        `;
        } else {
            status.innerHTML = "Erro na importação.";
        }
    } catch (err) {
        console.error(err);
        status.innerHTML = "Erro ao importar planilha.";
    } finally {
        botao.disabled = false;
        botao.innerHTML = "Importar por Planilha";
    }
}

async function importarFretes() {
    const status = document.getElementById("status");
    const botao = document.getElementById("btnImportarFretesPlanilha");
    const arquivo = document.getElementById("arquivoFretes").files[0];

    if (!arquivo) {
        alert("Selecione uma planilha.");
        return;
    }

    try {
        botao.disabled = true;
        status.innerHTML = "Enviando arquivo...";

        const formData = new FormData();
        formData.append("arquivo", arquivo);

        const resposta = await fetch("/importar-fretes", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            body: formData
        });

        if (!resposta.ok) {
            throw new Error("Erro na resposta do servidor");
        }

        const dados = await resposta.json();

        if (dados.sucesso) {
            status.innerHTML = `
       ✅ Importação concluída com sucesso.

         <br><br>

        <b>${dados.importados}</b>
        registros importados.
        `;
        } else {
            status.innerHTML = "Erro na importação.";
        }
    } catch (err) {
        console.error(err);
        status.innerHTML = "Erro ao importar planilha.";
    } finally {
        botao.disabled = false;
        botao.innerHTML = "Importar por Planilha";
    }
}

async function importarParceiros() {
    const arquivo = document.getElementById("arquivoParceiros").files[0];

    if (!arquivo) {
        alert("Selecione a planilha de parceiros.");
        return;
    }

    const formData = new FormData();
    formData.append("arquivo", arquivo);

    const resposta = await fetch("/importar-parceiros-excel", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: formData
    });

    const dados = await resposta.json();

    document.getElementById("status").innerHTML =
        `✅ ${dados.importados} parceiros importados`;
}

async function importarParceirosPipefy() {
    const status = document.getElementById("status");
    status.innerHTML = "Atualizando parceiros via Pipefy...";

    try {
        const resposta = await fetch("/importar-parceiros", {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!resposta.ok) {
            status.innerHTML =
                `❌ Erro ${resposta.status} ao importar parceiros.`;
            return;
        }

        const dados = await resposta.json();

        if (dados.success) {
            status.innerHTML =
                `✅ ${dados.total} parceiros importados`;
        } else {
            status.innerHTML =
                `❌ ${dados.error || "Erro ao importar parceiros."}`;
        }
    } catch (err) {
        console.error(err);
        status.innerHTML = "❌ Erro ao importar parceiros.";
    }
}

async function importarFretesPipefy() {
    const status = document.getElementById("status");
    status.innerHTML =
        "Atualizando contratação de fretes via Pipefy...";

    try {
        const resposta = await fetch("/importar-fretes-relatorio", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });

        const dados = await resposta.json();

        if (dados.sucesso) {
            status.innerHTML =
                `✅ ${dados.importados} fretes importados`;
        } else {
            status.innerHTML = `❌ ${dados.erro}`;
        }
    } catch (err) {
        console.error(err);
        status.innerHTML = "❌ Erro ao importar fretes.";
    }
}
