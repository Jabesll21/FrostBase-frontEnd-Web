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
            photo: getPhotoByBrand(truck.brand),
            rawTruck: truck 
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
        card.dataset.id = truck.id;
        
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
                <button class="action-btn btn-delete" onclick="deleteTruckConfirm('${truck.id}')">Delete</button>
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
            photo: getPhotoByBrand(truck.brand),
            rawTruck: truck
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

// Función global para editar truck
window.editTruck = function(id) {
    console.log('Editing truck:', id);
    
    if (!id) {
        showToast('Error: Truck ID not found', 'error');
        return;
    }
    
    // Mostrar mensaje de carga
    showToast('Loading truck data...', 'info');
    
    // Cargar el componente de registro en modo edición
    loadComponent('components/trucks/register', { truckId: id });
};

// Función global para eliminar truck
window.deleteTruckConfirm = async function(id) {
    if (confirm('¿Are you sure that you want to delete this truck? This will change the state to "Out of service".')) {
        try {
            showToast('Updating truck status...', 'info');
            const deletedTruck = await deleteTruck(id);
            console.log('Truck deleted:', deletedTruck);
            
            // Actualiza la lista de camiones
            await loadTrucks();
            
            // Muestra un mensaje de éxito
            showToast('Changed state to "Out of service" successfully.', 'success');
        } catch (error) {
            console.error('Error deleting truck:', error);
            showToast('Error trying to delete the truck. Try again later.', 'error');
        }
    }
};

// Función para mostrar toast notifications
function showToast(message, type = 'success') {
    // Remover toasts existentes
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = getToastIcon(type);
    
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${icon}" style="margin-right: 8px;"></i>
            <span>${message}</span>
        </div>
    `;
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getToastColor(type)};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        font-weight: 500;
        font-size: 14px;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove
    const duration = type === 'info' ? 2000 : 3000;
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

function getToastIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'info': return 'info-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

function getToastColor(type) {
    switch(type) {
        case 'success': return '#16a34a';
        case 'error': return '#dc2626';
        case 'info': return '#3b82f6';
        case 'warning': return '#d97706';
        default: return '#6b7280';
    }
}

// Función para cargar componentes
function loadComponent(component, params = {}) {
    console.log('Loading component:', component, params);
    var url = component + '/index.html';
    var urlCode = '../../' + component + '/code.js';
    
    fetch(url)
        .then((response) => { return response.text(); })
        .then((html) => { loadHtml(html) })
        .then(() => { importModule(urlCode, params) })
        .catch((error) => { 
            console.error('Invalid HTML file:', error);
            showToast('Error loading page', 'error');
        });
}

// Función para cargar HTML
async function loadHtml(html) {
    console.log('Loading HTML...')
    document.getElementById('content').innerHTML = html;
}

// Función para importar módulo
async function importModule(moduleUrl, params = {}) {
    console.log('Importing Module ' + moduleUrl);
    try {
        let { init } = await import(moduleUrl + '?v=' + Date.now());
        init(params);
    } catch (error) {
        console.error('Error importing module:', error);
        showToast('Error loading page', 'error');
    }
}

// Agregar estilos para las animaciones de toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .toast-content {
        display: flex;
        align-items: center;
    }
`;
document.head.appendChild(style);