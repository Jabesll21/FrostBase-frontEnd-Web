import { getTruckReadings, getDrivers } from "./services.js";

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
    const tijuana = [32.5027, -117.0382];
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return;
    
    mapContainer.innerHTML = '';
    
    map = L.map('map-container', {
        center: tijuana,
        zoom: 12,
        zoomControl: false
    });
    
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
    updateInterval = setInterval(loadTruckLocations, 30000);
}

async function loadTruckLocations() {
    try {
        // Obtener lecturas y conductores en paralelo
        const [readingsResponse, drivers] = await Promise.all([
            getTruckReadings(),
            getDrivers()
        ]);
        
        const latestReadings = getLatestReadings(readingsResponse.data);        
        const trucks = latestReadings.map(reading => ({
            id: reading.truck.id,
            licensePlate: reading.truck.licensePlate,
            brand: reading.truck.brand,
            model: reading.truck.model,
            state: { 
                id: reading.truck.state.id,
                message: reading.truck.state.description
            },
            lastReading: {
                temperature: reading.temp,
                humidity: reading.percHumidity,
                date: reading.date,
                latitude: reading.location.latitude,
                longitude: reading.location.longitude,
                doorState: reading.doorState
            },
            // Añadir información del conductor si existe
            driver: drivers.find(d => d.truckDefault?.id === reading.truck.id)
        }));

        updateTruckMarkers(trucks);
        updateStats(trucks);
        updateTruckList(trucks);
    } catch (error) {
        console.error('Error loading truck locations:', error);
    }
}

function getLatestReadings(readings) {
    // Agrupar por idTruck y obtener la lectura más reciente de cada uno
    const grouped = readings.reduce((acc, reading) => {
        if (!acc[reading.truck.id] || new Date(reading.date) > new Date(acc[reading.truck.id].date)) {
            acc[reading.truck.id] = reading;
        }
        return acc;
    }, {});
    
    return Object.values(grouped);
}

async function updateTruckMarkers(trucks) {
    // Limpiar marcadores anteriores
    markers.clearLayers();
    
    // Obtener lista de conductores
    const drivers = await getDrivers();
    
    trucks.forEach(truck => {
        if (!truck.lastReading) return;
        
        const { latitude, longitude } = truck.lastReading;
        if (!latitude || !longitude) return;
        
        // Encontrar el conductor asignado a este camión
        const driver = drivers.find(d => d.truckDefault?.id === truck.id);
        const firstName = driver?.name?.firstName || 'Unknown';
        
        // Crear marcador
        const marker = L.marker([latitude, longitude], {
            icon: truckIcons[truck.state?.id] || truckIcons['AV'],
            truckId: truck.id
        });
        
        // URL de avatar aleatorio basado en el ID del conductor para consistencia
        const avatarUrl = driver 
            ? `https://avatar.iran.liara.run/public?seed=${driver.id}`
            : 'https://avatar.iran.liara.run/public';
        
        // Tooltip con información básica
        marker.bindTooltip(`
            <div class="tooltip-header">${truck.licensePlate}</div>
            <div class="tooltip-content">
                <p><strong>Driver:</strong> ${firstName}</p>
                <p><strong>Status:</strong> ${truck.state?.message}</p>
            </div>
        `);
        
        // Popup con información detallada
        marker.bindPopup(`
            <div class="popup-header">
                <div class="driver-profile">
                    <img src="${avatarUrl}" alt="${firstName}" class="driver-avatar">
                    <span class="driver-name">${firstName}</span>
                </div>
                <div class="truck-plate">${truck.licensePlate}</div>
            </div>
            <div class="popup-content">
                <div class="truck-info">
                    <p><strong>Vehicle:</strong> ${truck.brand} ${truck.model}</p>
                    <p><strong>Status:</strong> ${truck.state?.message}</p>
                </div>
                <div class="sensor-readings">
                    <div class="reading">
                        <i class="fas fa-temperature-low"></i>
                        <span>${truck.lastReading.temperature}°C</span>
                    </div>
                    <div class="reading">
                        <i class="fas fa-tint"></i>
                        <span>${truck.lastReading.humidity}%</span>
                    </div>
                    <div class="reading">
                        <i class="fas fa-door-${truck.lastReading.doorState ? 'open' : 'closed'}"></i>
                        <span>Door ${truck.lastReading.doorState ? 'Open' : 'Closed'}</span>
                    </div>
                </div>
                <div class="last-update">
                    <i class="fas fa-clock"></i>
                    <span>${new Date(truck.lastReading.date).toLocaleString()}</span>
                </div>
            </div>
        `);
        
        marker.on('click', () => {
            selectTruck(truck.id);
        });
        
        markers.addLayer(marker);
    });
    
    // Ajustar vista del mapa
    if (trucks.length > 0) {
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


// Cleanup function
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});