export function init(){
    console.log('Initializing drivers...')

    const drivers = [
        {
            id: 1,
            name: "Andres Cuevas",
            email: "cuevas@frost.com",
            route: "Otay",
            truck: "Mercedes",
            licensePlate: "ABC-123-D",
            status: "active"
        },
        {
            id: 2,
            name: "Jabes Llamas",
            email: "llamas@frost.com",
            route: "El Refugio",
            truck: "Mercedes",
            licensePlate: "EFG-456-H",
            status: "on-route"
        },
        {
            id: 3,
            name: "Neyzer Toledo",
            email: "toledo@frost.com",
            route: "Zona Río",
            truck: "Volvo",
            licensePlate: "IJK-789-L",
            status: "active"
        },
        {
            id: 4,
            name: "Genesis Brito",
            email: "brito@frost.com",
            route: "Villa del Real",
            truck: "Volvo",
            licensePlate: "MNO-123-P",
            status: "inactive"
        },
        {
            id: 5,
            name: "Daniel Diaz",
            email: "diaz@frost.com",
            route: "El Nido",
            truck: "Mercedes",
            licensePlate: "QRS-456-T",
            status: "on-route"
        },
    ];

    setupEventListeners();
    printDrivers(drivers);
}

function setupEventListeners() {
    // Add button event listener
    document.getElementById('add-button').addEventListener('click', () => {
        loadComponent('components/drivers/register');
    });
}

function printDrivers(drivers) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    drivers.forEach(driver => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${driver.id}</td>
            <td>${driver.name}</td>
            <td>${driver.email}</td>
            <td>${driver.route}</td>
            <td>${driver.truck}</td>
            <td>${driver.licensePlate}</td>
            <td class="actions">
                <button class="btn-edit" onclick="editDriver(${driver.id})">Edit</button>
                <button class="btn-delete" onclick="deleteDriver(${driver.id})">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function editDriver(id) {
    console.log('Editing driver:', id);
    // Aquí puedes implementar la funcionalidad de editar
    // Por ejemplo, cargar el componente register con los datos del driver
    loadComponent('components/drivers/register', { driverId: id });
}

function deleteDriver(id) {
    if (confirm('¿Are you sure you want to delete this driver?')) {
        console.log('Deleting driver:', id);
        // Aquí implementarías la lógica para eliminar el driver
        // Por ejemplo, hacer una petición a la API y recargar la tabla
    }
}

// Función para cargar componentes (debe estar disponible globalmente)
function loadComponent(component, params = {}) {
    console.log('Loading component:', component, params);
    var url = component + '/index.html';
    var urlCode = '../../../' + component + '/code.js';
    
    fetch(url)
        .then((response) => { return response.text(); })
        .then((html) => { loadHtml(html) })
        .then(() => { importModule(urlCode, params) })
        .catch((error) => { console.error('Invalid HTML file:', error); });
}

// Función para cargar HTML
async function loadHtml(html) {
    console.log('Loading HTML...')
    document.getElementById('content').innerHTML = html;
}

// Función para importar módulo
async function importModule(moduleUrl, params = {}) {
    console.log('Importing Module ' + moduleUrl);
    let { init } = await import(moduleUrl);
    init(params);
}