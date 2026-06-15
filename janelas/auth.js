window.API =
    "https://api-production-6670.up.railway.app";

function logoutSessaoExpirada(){

    localStorage.setItem(
        "paginaDestino",
        window.location.pathname
    );

    localStorage.removeItem("token");

    window.location.href =
        "/janelas/login.html";
}

const token =
    localStorage.getItem("token");

if(!token){

    logoutSessaoExpirada();

}

fetch(
    `${API}/validar-token`,
    {
        headers:{
            Authorization:
                "Bearer " + token
        }
    }
)
.then(r => {

    if(!r.ok){

        logoutSessaoExpirada();

    }

})
.catch(() => {

    logoutSessaoExpirada();

    
});