import { config } from './config.js';

const button = document.getElementById('button');

button.addEventListener('click', async () => {
    await login();
});

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        alert("Por favor complete todos los campos");
        return;
    }

    try {
        const response = await fetch(`${config.api.url}User/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (data.status === 0 && data.type === "Success") {
            // Guardar datos del usuario en sessionStorage
            sessionStorage.setItem('userData', JSON.stringify(data.data));
            // Redirigir a la página principal
            window.location.href = "main.html";
        } else {
            alert(data.error || "Credenciales incorrectas");
        }
    } catch (error) {
        console.error("Error al conectar con la API:", error);
        alert("Error al conectar con el servidor");
    }
}