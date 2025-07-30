import { getTrucks, deleteTruck } from './services.js';

let allTrucks = [];
let filteredTrucks = [];
let currentFilter = 'all';

export function init() {
    console.log('Initializing trucks interface...');
    setupEventListeners();
    loadTrucks();
}

async function loadTrucks() {
    try {
        showLoading();
        
        allTrucks = await getTrucks();
        console.log('Loaded trucks:', allTrucks);
        
        const mappedTrucks = allTrucks.map((truck, index) => ({
            id: truck.id,
            brand: truck.brand || 'Unknown',
            model: truck.model || 'Unknown',
            status: getStatusText(truck.state?.id),
            licensePlate: truck.licensePlate || 'N/A',
            photo: getPhotoByBrand(truck.brand)
        }));
        
        filteredTrucks = [...mappedTrucks];
        updateStats();
        renderTrucks(filteredTrucks);
        
    } catch (error) {
        console.error('Error loading trucks:', error);
        showError();
    } finally {
        hideLoading();
    }
}

function getStatusText(stateId) {
    const statusMap = {
        'AV': 'Available',
        'IR': 'In use',
        'IM': 'In maintenance',
        'OS': 'Out of service'
    };
    return statusMap[stateId] || 'Unknown';
}

function getPhotoByBrand(brand) {
    if (!brand) return 'default.png';
    
    const brandLower = brand.toLowerCase();
    return `${brandLower}.png`;
}

function showLoading() {
    const grid = document.getElementById('trucks-grid');
    grid.innerHTML = '<div style="text-align: center; padding: 40px; grid-column: 1/-1;">Loading trucks...</div>';
}

function hideLoading() {
}

function showError() {
    const grid = document.getElementById('trucks-grid');
    grid.innerHTML = '<div style="text-align: center; padding: 40px; color: red; grid-column: 1/-1;">Error loading trucks. Please try again.</div>';
}

function updateStats() {
    const total = allTrucks.length;
    const available = allTrucks.filter(truck => truck.state?.id === 'AV').length;
    const inUse = allTrucks.filter(truck => truck.state?.id === 'IR').length;
    const inMaintenance = allTrucks.filter(truck => truck.state?.id === 'IM').length;
    const outOfService = allTrucks.filter(truck => truck.state?.id === 'OS').length;

    document.getElementById('total-trucks').textContent = total;
    document.getElementById('available-trucks').textContent = available;
    document.getElementById('in-use-trucks').textContent = inUse;
    document.getElementById('in-maintenance-trucks').textContent = inMaintenance;
    document.getElementById('out-of-service-trucks').textContent = outOfService;
}

function renderTrucks(trucksArray) {
    const grid = document.getElementById('trucks-grid');
    const emptyState = document.getElementById('empty-state');
    
    grid.innerHTML = '';

    if (trucksArray.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    trucksArray.forEach(truck => {
        const card = document.createElement('div');
        card.className = "truck-card";
        
        const statusClass = truck.status.toLowerCase().replace(' ', '-');

            card.innerHTML = `
                <div class="truck-header">
                    <div class="license-plate">${truck.licensePlate}</div>
                    <div class="truck-model">${truck.brand} ${truck.model}</div>
                </div>
                <div class="truck-image">
                    <img src="components/trucks/photos/${truck.photo}" alt="${truck.brand} ${truck.model}" 
                         onerror="this.src='components/trucks/photos/default.png'">
                </div>
                <div class="truck-status">
                    <span class="status-badge ${statusClass}">${truck.status}</span>
                </div>
                <div class="truck-actions">
                    <button class="action-btn btn-edit" onclick="editTruck('${truck.id}')">Edit</button>
                    <button class="action-btn btn-delete" onclick="deleteTruck('${truck.id}')">Delete</button>
                </div>
            `;
        
        grid.appendChild(card);
    });
}

function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filteredTrucks = allTrucks.map((truck, index) => ({
            id: truck.id,
            brand: truck.brand || 'Unknown',
            model: truck.model || 'Unknown',
            status: getStatusText(truck.state?.id),
            licensePlate: truck.licensePlate || 'N/A',
            photo: getPhotoByBrand(truck.brand)
        })).filter(truck => 
            truck.licensePlate.toLowerCase().includes(searchTerm) ||
            truck.brand.toLowerCase().includes(searchTerm) ||
            truck.model.toLowerCase().includes(searchTerm)
        );
        applyFilter();
    });

    document.getElementById('add-button').addEventListener('click', () => {
        loadComponent('components/trucks/register'); 
    });
}

function applyFilter() {
    let filtered = [...filteredTrucks];
    
    if (currentFilter !== 'all') {
        filtered = filtered.filter(truck => 
            truck.status.toLowerCase().replace(' ', '-') === currentFilter
        );
    }
    
    renderTrucks(filtered);
}

window.editTruck = function(id) {
    console.log('Edit truck ID:', id);
    alert(`Edit truck ID: ${id}`);
}

window.deleteTruck = async function(id) {
    if (confirm('¿Are you sure that you want to delete this truck? This will change the state to "Out of service".')) {
        try {
            showLoading();
            const deletedTruck = await deleteTruck(id);
            console.log('Truck deleted:', deletedTruck);
            
            // Actualiza la lista de camiones
            await loadTrucks();
            
            // Muestra un mensaje de éxito
            alert('Changed state to "Out of service" successfully.');
        } catch (error) {
            console.error('Error deleting truck:', error);
            alert('Error trying to delete the truck. Try again later.');
        } finally {
            hideLoading();
        }
    }
}

export function loadComponent(component){
    console.log(component);
    var url = component + '/index.html';
    var urlCode = '../../' + component + '/code.js'
    fetch(url)
        .then((response) => { return response.text(); })
        .then( (html) => { loadHtml(html) } )
        .then( () => { importModule(urlCode) })
        .catch( (error) => {console.error('Invalid HTML file'); })
}

async function loadHtml(html) {
    console.log('Loading HTML...')
    document.getElementById('content').innerHTML = html
}

async function importModule(moduleUrl) {
    console.log('Importing Module ' + moduleUrl)
    let { init } = await import(moduleUrl)
    init()
}