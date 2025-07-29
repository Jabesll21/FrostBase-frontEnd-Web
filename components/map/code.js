import { getTruckLocations } from "./services.js"

var map;
var markers = [];
var selectedTruck = null;
var infoWindow;
var updateInterval;

export function init(){
    console.log('Initializing truck map...');
    setupEventListeners();
    initializeMap();
}

function setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refresh-button');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshMap);
    }
    
    // Filter button
    const filterBtn = document.getElementById('filter-button');
    if (filterBtn) {
        filterBtn.addEventListener('click', toggleFilters);
    }
}

function initializeMap() {
    // Centro del mapa en Tijuana
    const tijuana = { lat: 32.5027, lng: -117.0382 };
    
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return;
    
    mapContainer.innerHTML = `
        <iframe 
            id="google-map"
            src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d6732.861784273942!2d-116.82623629894279!3d32.46116479319702!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1ses!2smx!4v1752565078007!5m2!1ses!2smx" 
            width="100%" 
            height="100%" 
            style="border:0;" 
            allowfullscreen="" 
            loading="lazy" 
            referrerpolicy="no-referrer-when-downgrade">
        </iframe>
        <div class="map-overlay" id="mapOverlay">
            <div class="truck-markers" id="truckMarkers"></div>
        </div>
    `;
    
    // Cargar ubicaciones de camiones
    loadTruckLocations();
    
    // Auto-actualización cada 30 segundos
    updateInterval = setInterval(loadTruckLocations, 30000);
}

async function loadTruckLocations() {
    try {
        const trucks = await getTruckLocations();
        updateTruckMarkers(trucks);
        updateStats(trucks);
        updateTruckList(trucks);
    } catch (error) {
        console.error('Error loading truck locations:', error);
    }
}

function updateTruckMarkers(trucks) {
    const markersContainer = document.getElementById('truckMarkers');
    if (!markersContainer) return;
    
    markersContainer.innerHTML = '';
    
    trucks.forEach((truck, index) => {
        if (!truck.lastReading) return;
        
        const marker = document.createElement('div');
        marker.className = `truck-marker truck-marker-${getStatusClass(truck.state?.id)}`;
        marker.id = `marker-${truck.id}`;
        marker.innerHTML = `
            <div class="marker-icon">
                <i class="fas fa-truck"></i>
            </div>
            <div class="marker-tooltip" id="tooltip-${truck.id}">
                <div class="tooltip-header">${truck.licensePlate}</div>
                <div class="tooltip-content">
                    <p><strong>Vehicle:</strong> ${truck.brand} ${truck.model}</p>
                    <p><strong>Status:</strong> ${truck.state?.message}</p>
                    <p><strong>Temperature:</strong> ${truck.lastReading.temperature}°C</p>
                    <p><strong>Humidity:</strong> ${truck.lastReading.humidity}%</p>
                    <p><strong>Last Update:</strong> ${new Date(truck.lastReading.date).toLocaleTimeString()}</p>
                </div>
            </div>
        `;
        
        const top = 20 + (index * 60);
        const left = 20 + (index * 80);
        marker.style.position = 'absolute';
        marker.style.top = `${Math.min(top, 400)}px`;
        marker.style.left = `${Math.min(left, 600)}px`;
        
        marker.addEventListener('click', () => selectTruck(truck.id));
        markersContainer.appendChild(marker);
    });
}

function updateStats(trucks) {
    const stats = {
        total: trucks.length,
        active: trucks.filter(t => t.state?.id === 'IR').length,
        available: trucks.filter(t => t.state?.id === 'AV').length,
        maintenance: trucks.filter(t => t.state?.id === 'IM').length
    };
    
    document.getElementById('total-trucks').textContent = stats.total;
    document.getElementById('active-trucks').textContent = stats.active;
    document.getElementById('available-trucks').textContent = stats.available;
    document.getElementById('maintenance-trucks').textContent = stats.maintenance;
}

function updateTruckList(trucks) {
    const listContainer = document.getElementById('truck-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    trucks.forEach(truck => {
        const truckItem = document.createElement('div');
        truckItem.className = 'truck-item';
        truckItem.id = `truck-${truck.id}`;
        
        const statusClass = getStatusClass(truck.state?.id);
        const lastUpdate = truck.lastReading ? 
            new Date(truck.lastReading.date).toLocaleTimeString() : 
            'No data';
            
        truckItem.innerHTML = `
            <div class="truck-header">
                <div class="truck-plate">${truck.licensePlate}</div>
                <div class="truck-status status-${statusClass}">${truck.state?.message || 'Unknown'}</div>
            </div>
            <div class="truck-info">${truck.brand} ${truck.model}</div>
            ${truck.lastReading ? `
                <div class="truck-readings">
                    <span> ${truck.lastReading.temperature}°C</span>
                    <span> ${truck.lastReading.humidity}%</span>
                </div>
            ` : ''}
            <div class="truck-time">Last update: ${lastUpdate}</div>
        `;
        
        truckItem.addEventListener('click', () => {
            selectTruck(truck.id);
            focusOnTruck(truck.id);
        });
        
        listContainer.appendChild(truckItem);
    });
}

function getStatusClass(stateId) {
    switch(stateId) {
        case 'AV': return 'available';
        case 'IR': return 'in-route';
        case 'IM': return 'maintenance';
        case 'OS': return 'out-of-service';
        default: return 'unknown';
    }
}

function selectTruck(truckId) {
    // Remover selección anterior
    document.querySelectorAll('.truck-item.selected').forEach(item => {
        item.classList.remove('selected');
    });
    document.querySelectorAll('.truck-marker.selected').forEach(marker => {
        marker.classList.remove('selected');
    });
    
    // Agregar nueva selección
    const truckItem = document.getElementById(`truck-${truckId}`);
    const truckMarker = document.getElementById(`marker-${truckId}`);
    
    if (truckItem) truckItem.classList.add('selected');
    if (truckMarker) truckMarker.classList.add('selected');
    
    selectedTruck = truckId;
}

function focusOnTruck(truckId) {
    const marker = document.getElementById(`marker-${truckId}`);
    if (marker) {
        marker.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function refreshMap() {
    console.log('Refreshing truck locations...');
    const refreshBtn = document.getElementById('refresh-button');
    
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = 'Updating...';
    }
    
    loadTruckLocations().finally(() => {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = 'Refresh';
        }
    });
}

function toggleFilters() {
    alert('Filter options:\n• By Status\n• By Route\n• By Driver\n• Temperature Range\n• Time Range');
}

// Cleanup function
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});