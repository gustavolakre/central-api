window.API =
    "https://api-production-6670.up.railway.app";

const token =
    localStorage.getItem("token");

if(!token){

    window.location.href =
        "/janelas/login.html";

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

        localStorage.removeItem("token");

        window.location.href =
            "/janelas/login.html";

    }

})
.catch(() => {

    localStorage.removeItem("token");

    window.location.href =
        "/janelas/login.html";

});