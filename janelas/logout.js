// Botão "Sair" global.
// Injeta um botão flutuante em qualquer página que inclua este script
// e faz logout (remove o token e volta para a tela de login).

(function () {

    function logout() {

        localStorage.removeItem("token");
        localStorage.removeItem("paginaDestino");

        window.location.href = "/janelas/login.html";
    }

    // disponibiliza globalmente, caso queira chamar de outro lugar
    window.logout = logout;

    function injetarBotao() {

        if (document.getElementById("btnSairGlobal")) {
            return;
        }

        const btn = document.createElement("button");

        btn.id = "btnSairGlobal";
        btn.type = "button";
        btn.textContent = "Sair";
        btn.title = "Sair e fazer login novamente";
        btn.onclick = logout;

        Object.assign(btn.style, {
            position: "fixed",
            bottom: "18px",
            right: "18px",
            zIndex: "100000",
            background: "#dc2626",
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            padding: "10px 18px",
            fontSize: "13px",
            fontWeight: "700",
            fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif",
            cursor: "pointer",
            boxShadow: "0 6px 16px rgba(220,38,38,0.40)",
            transition: "0.15s"
        });

        btn.onmouseover = function () {
            btn.style.background = "#b91c1c";
            btn.style.transform = "translateY(-2px)";
        };

        btn.onmouseout = function () {
            btn.style.background = "#dc2626";
            btn.style.transform = "translateY(0)";
        };

        document.body.appendChild(btn);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", injetarBotao);
    } else {
        injetarBotao();
    }

})();
