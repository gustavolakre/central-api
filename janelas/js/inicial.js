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

function abrir(url) {
    window.location.href = url;
}

validarLogin();
