export function init() {
    fetch('http://localhost:5125/api/parameter')
        .then(res => res.json())
        .then(data => {
            const param = data.data || {};
            document.getElementById('maxTemp').value = param.maxTemperature ?? 2;
            document.getElementById('minTemp').value = param.minTemperature ?? 8;
            document.getElementById('maxHum').value = param.maxHumidity ?? 50;
            document.getElementById('minHum').value = param.minHumidity ?? 30;
        })
        .catch(() => {
            document.getElementById('maxTemp').value = 2;
            document.getElementById('minTemp').value = 8;
            document.getElementById('maxHum').value = 50;
            document.getElementById('minHum').value = 30;
        });

    document.getElementById('saveSettings').onclick = function() {
        const settings = {
            maxTemperature: parseFloat(document.getElementById('maxTemp').value),
            minTemperature: parseFloat(document.getElementById('minTemp').value),
            maxHumidity: parseInt(document.getElementById('maxHum').value),
            minHumidity: parseInt(document.getElementById('minHum').value)
        };
        fetch('http://localhost:5125/api/parameter', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        })
        .then(res => res.ok ? "¡Configuración guardada!" : "Error al guardar")
        .then(msg => {
            document.getElementById('settingsMsg').textContent = msg;
            setTimeout(() => document.getElementById('settingsMsg').textContent = "", 2000);
        })
        .catch(() => {
            document.getElementById('settingsMsg').textContent = "Error al guardar";
            setTimeout(() => document.getElementById('settingsMsg').textContent = "", 2000);
        });
    }
}