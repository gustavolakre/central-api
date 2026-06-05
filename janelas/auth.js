const token =
    localStorage.getItem("token");

if(!token){

    window.location.href =
        "/janelas/login.html";

}

fetch(
    "/validar-token",
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