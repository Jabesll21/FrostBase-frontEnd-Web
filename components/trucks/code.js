import { getTrucks, deleteTruck, updateTruck } from './services.js';

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
        card.dataset.id = truck.id;
        
        const statusClass = truck.status.toLowerCase().replace(' ', '-');
        
        if (truck.isEditing) {
            // Modo edición
            card.innerHTML = `
                <div class="truck-header">
                    <input type="text" class="edit-input" value="${truck.licensePlate}" placeholder="License Plate" id="edit-license-${truck.id}">
                    <input type="text" class="edit-input" value="${truck.model}" placeholder="Model" id="edit-model-${truck.id}">
                </div>
                <div class="truck-status">
                    <select class="edit-select" id="edit-brand-${truck.id}">
                        <option value="Volvo" ${truck.brand === 'Volvo' ? 'selected' : ''}>Volvo</option>
                        <option value="Mercedes" ${truck.brand === 'Mercedes' ? 'selected' : ''}>Mercedes</option>
                        <option value="Scania" ${truck.brand === 'Scania' ? 'selected' : ''}>Scania</option>
                        <option value="Peterbilt" ${truck.brand === 'Peterbilt' ? 'selected' : ''}>Peterbilt</option>
                        <option value="Mack" ${truck.brand === 'Mack' ? 'selected' : ''}>Mack</option>
                        <option value="Kenworth" ${truck.brand === 'Kenworth' ? 'selected' : ''}>Kenworth</option>
                        <option value="International" ${truck.brand === 'International' ? 'selected' : ''}>International</option>
                        <option value="Freightliner" ${truck.brand === 'Freightliner' ? 'selected' : ''}>Freightliner</option>
                    </select>
                </div>
                <div class="truck-status">
                    <select class="edit-select" id="edit-status-${truck.id}">
                        <option value="AV" ${truck.status === 'Available' ? 'selected' : ''}>Available</option>
                        <option value="IR" ${truck.status === 'In use' ? 'selected' : ''}>In use</option>
                        <option value="IM" ${truck.status === 'In maintenance' ? 'selected' : ''}>In maintenance</option>
                        <option value="OS" ${truck.status === 'Out of service' ? 'selected' : ''}>Out of service</option>
                    </select>
                </div>
                <div class="truck-edit-actions">
                    <button class="action-btn btn-save" onclick="saveTruck('${truck.id}')">Save</button>
                    <button class="action-btn btn-cancel" onclick="cancelEdit('${truck.id}')">Cancel</button>
                </div>
            `;
        } else {
            // Modo visualización normal
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
        }
        
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
    filteredTrucks = filteredTrucks.map(truck => {
        if (truck.id === id) {
            return {...truck, isEditing: true};
        }
        return truck;
    });
    renderTrucks(filteredTrucks);
};

window.cancelEdit = function(id) {
    filteredTrucks = filteredTrucks.map(truck => {
        if (truck.id === id) {
            const originalTruck = allTrucks.find(t => t.id === id);
            return {
                ...originalTruck,
                status: getStatusText(originalTruck.state?.id),
                photo: getPhotoByBrand(originalTruck.brand),
                isEditing: false
            };
        }
        return truck;
    });
    renderTrucks(filteredTrucks);
};

window.saveTruck = async function(id) {
    try {
        showLoading();
        console.log(id)
        
        const brand = document.getElementById(`edit-brand-${id}`).value;
        const model = document.getElementById(`edit-model-${id}`).value;
        const licensePlate = document.getElementById(`edit-license-${id}`).value;
        const idStateTruck = document.getElementById(`edit-status-${id}`).value;
        
        const updatedData = {
            id: id,
            brand: brand,
            model: model,
            licensePlate: licensePlate,
            idStateTruck: idStateTruck
        };

        const updatedTruck = await updateTruck(updatedData);
        console.log('Truck updated:', updatedTruck);
        
        // Actualizar la lista
        await loadTrucks();
        
        alert('Truck updated successfully');
    } catch (error) {
        console.error('Error updating truck:', error);
        alert('Error updating truck. Please try again.');
    } finally {
        hideLoading();
    }
};

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