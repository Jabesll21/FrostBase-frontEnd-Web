import { getTruckLocations, getTruckReadings } from "./services.js";

var map;
var markers = new L.MarkerClusterGroup();
var selectedTruck = null;
var truckLayer;
var updateInterval;
var truckIcons = {
    'AV': L.divIcon({
        className: 'truck-marker available',
        html: '<i class="fas fa-truck"></i>',
        iconSize: [30, 30]
    }),
    'IR': L.divIcon({
        className: 'truck-marker in-route',
        html: '<i class="fas fa-truck-moving"></i>',
        iconSize: [30, 30]
    }),
    'IM': L.divIcon({
        className: 'truck-marker maintenance',
        html: '<i class="fas fa-truck-pickup"></i>',
        iconSize: [30, 30]
    }),
    'OS': L.divIcon({
        className: 'truck-marker out-of-service',
        html: '<i class="fas fa-truck-monster"></i>',
        iconSize: [30, 30]
    })
};

export function init(){
    console.log('Initializing truck map with Leaflet...');
    initializeMap();
}

function initializeMap() {
    // Centro del mapa en Tijuana
    const tijuana = [32.5027, -117.0382];
    
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return;
    
    // Limpiar contenedor
    mapContainer.innerHTML = '';
    
    // Crear mapa Leaflet
    map = L.map('map-container', {
        center: tijuana,
        zoom: 12,
        zoomControl: false
    });
    
    // Añadir control de zoom con posición personalizada
    L.control.zoom({
        position: 'topright'
    }).addTo(map);
    
    // Añadir capa CartoDB Positron
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
    
    // Crear capa para agrupar marcadores
    map.addLayer(markers);
    
    // Cargar ubicaciones de camiones
    loadTruckLocations();
    
    // Auto-actualización cada 30 segundos
    updateInterval = setInterval(loadTruckLocations, 20000);
}

async function loadTruckLocations() {
    try {
        // Obtener lecturas más recientes de cada camión
        const readings = await getTruckReadings();
        const latestReadings = getLatestReadings(readings.data);
        
        // Obtener información de los camiones
        const trucks = await getTruckLocations();
        
        // Combinar datos
        const enrichedTrucks = trucks.map(truck => {
            const reading = latestReadings.find(r => r.idTruck === truck.id);
            return {
                ...truck,
                lastReading: reading || null
            };
        });
        
        updateTruckMarkers(enrichedTrucks);
        updateStats(enrichedTrucks);
        updateTruckList(enrichedTrucks);
    } catch (error) {
        console.error('Error loading truck locations:', error);
    }
}

function getLatestReadings(readings) {
    // Agrupar por idTruck y obtener la lectura más reciente de cada uno
    const grouped = readings.reduce((acc, reading) => {
        if (!acc[reading.idTruck] || new Date(reading.date) > new Date(acc[reading.idTruck].date)) {
            acc[reading.idTruck] = reading;
        }
        return acc;
    }, {});
    
    return Object.values(grouped);
}

function updateTruckMarkers(trucks) {
    // Limpiar marcadores anteriores
    markers.clearLayers();
    
    trucks.forEach(truck => {
        if (!truck.lastReading) return;
        
        const { latitude, longitude } = truck.lastReading;
        if (!latitude || !longitude) return;
        
        const marker = L.marker([latitude, longitude], {
            icon: truckIcons[truck.state?.id] || truckIcons['AV'],
            truckId: truck.id
        });
        
        // Tooltip con información básica
        marker.bindTooltip(`
            <div class="tooltip-header">${truck.licensePlate}</div>
            <div class="tooltip-content">
                <p><strong>Status:</strong> ${truck.state?.message}</p>
                <p><strong>Last Update:</strong> ${new Date(truck.lastReading.date).toLocaleTimeString()}</p>
            </div>
        `);
        
        // Popup con información detallada
        marker.bindPopup(`
            <div class="popup-header">${truck.licensePlate}</div>
            <div class="popup-content">
                <p><strong>Vehicle:</strong> ${truck.brand} ${truck.model}</p>
                <p><strong>Status:</strong> ${truck.state?.message}</p>
                <p><strong>Temperature:</strong> ${truck.lastReading.temperature}°C</p>
                <p><strong>Humidity:</strong> ${truck.lastReading.humidity}%</p>
                <p><strong>Door State:</strong> ${truck.lastReading.doorState ? 'Open' : 'Closed'}</p>
                <p><strong>Last Update:</strong> ${new Date(truck.lastReading.date).toLocaleString()}</p>
            </div>
        `);
        
        // Evento click
        marker.on('click', () => {
            selectTruck(truck.id);
        });
        
        markers.addLayer(marker);
    });
    
    // Asegurarse de que los marcadores estén visibles
    if (trucks.length > 0 && trucks.some(t => t.lastReading)) {
        const locations = trucks
            .filter(t => t.lastReading)
            .map(t => [t.lastReading.latitude, t.lastReading.longitude]);
        
        map.fitBounds(locations);
    }
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
    
    // Agregar nueva selección
    const truckItem = document.getElementById(`truck-${truckId}`);
    if (truckItem) truckItem.classList.add('selected');
    
    // Resaltar marcador en el mapa
    markers.eachLayer(layer => {
        if (layer.options.truckId === truckId) {
            map.setView(layer.getLatLng(), 15);
            layer.openPopup();
        }
    });
    
    selectedTruck = truckId;
}

function focusOnTruck(truckId) {
    markers.eachLayer(layer => {
        if (layer.options.truckId === truckId) {
            map.setView(layer.getLatLng(), 15);
            layer.openPopup();
        }
    });
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