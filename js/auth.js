const button = document.getElementById('button')

button.addEventListener('click', () =>{
    login()
})

function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if(email && password)
        window.location.href = "main.html";
    else
        alert("Credentials are missing");
}