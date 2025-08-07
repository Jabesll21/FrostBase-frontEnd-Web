import { getRoutes, getRoutesByDay, deleteRoute } from './services.js';

let map;
let allRoutes = [];
let filteredRoutes = [];
let routeLayers = {};
let truckMarkers = L.layerGroup();
let selectedRouteId = null;
let currentDay = -1; 
let trucksVisible = true;
let routesVisible = true;
let trucksData = []; // Cache de camiones
let driversData = []; // Cache de conductores
let updateInterval = null; // Intervalo para actualizar los datos de camiones

const ROUTE_COLORS = [
    '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#db2777',
    '#0891b2', '#ea580c', '#7c2d12', '#1e40af', '#059669'
];

const DAYS_MAP = {
    0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
    4: 'Thursday', 5: 'Friday', 6: 'Saturday'
};
const baseIcon = L.divIcon({
    className: 'truck-marker base',
    html: '<i class="fas fa-warehouse"></i>',
    iconSize: [30, 30]
});

// Iconos para camiones según su estado
const truckIcons = {
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

// Función para generar avatar consistente basado en ID
function getDriverAvatar(driverId, driverName = '') {
    if (!driverId) {
        return 'photos/drivers/default.jpg';
    }
    
    // Primero intentar buscar foto local basada en el ID
    const localPhotoUrl = `photos/drivers/${driverId}.jpg`;
    
    // Si no existe la foto local, usar foto generada consistente
    const hash = hashCode(driverId);
    const photoNumber = (hash % 100) + 1;
    const gender = hash % 2 === 0 ? 'men' : 'women';
    const fallbackUrl = `https://randomuser.me/api/portraits/${gender}/${photoNumber}.jpg`;
    
    return localPhotoUrl;
}

// Función para generar hash consistente del ID
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; 
    }
    return Math.abs(hash);
}

export function init() {
    console.log('Initializing integrated routes and map interface...');
    setupEventListeners();
    initializeMap();
    loadInitialData(); // Cambio aquí para optimizar la carga
    setTodayButton();

    // Limpiar el intervalo cuando se descarga la página
    window.addEventListener('unload', function() {
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    });
}

function setTodayButton() {
    const today = new Date().getDay();
    const todayBtn = document.querySelector(`[data-day="${today}"]`);
    if (todayBtn) {
        todayBtn.classList.add('active');
        currentDay = today;
    }
}

function setupEventListeners() {
    document.getElementById('add-button').addEventListener('click', () => {
        loadComponent('components/routes/register');
    });

    // Day filter buttons
    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const day = parseInt(e.target.dataset.day);
            selectDay(day);
        });
    });

    // Map controls
    document.getElementById('toggle-all-routes').addEventListener('click', toggleAllRoutes);
    document.getElementById('toggle-trucks').addEventListener('click', toggleTrucks);
    document.getElementById('center-map').addEventListener('click', centerMap);

    // Search
    document.getElementById('search-routes').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterRoutes(searchTerm);
    });

    // Modal
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('edit-route-btn').addEventListener('click', editSelectedRoute);
    document.getElementById('delete-route-btn').addEventListener('click', deleteSelectedRoute);

    window.addEventListener('click', (e) => {
        const modal = document.getElementById('route-details-modal');
        if (e.target === modal) {
            closeModal();
        }
    });
}

function initializeMap() {
    const mapContainer = document.getElementById('routes-map');
    if (!mapContainer) {
        console.error('Map container not found');
        return;
    }

    if (typeof L === 'undefined') {
        console.error('Leaflet library not loaded');
        return;
    }

    const tijuana = [32.5027, -117.0382];
    
    try {
        map = L.map('routes-map', {
            center: tijuana,
            zoom: 11,
            zoomControl: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);

        // Agregar layer de camiones al mapa
        map.addLayer(truckMarkers);

        console.log('Map initialized successfully');
        addMapControls();
        
    } catch (error) {
        console.error('Error initializing map:', error);
        showMapError();
    }
}

function showMapError() {
    const mapContainer = document.getElementById('routes-map');
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f8fafc; color: #6b7280; text-align: center; padding: 20px;">
                <div>
                    <h3>Map Not Available</h3>
                    <p>Unable to load the map. Please check your internet connection.</p>
                    <button onclick="location.reload()" style="padding: 8px 16px; background: #000080; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            </div>
        `;
    }
}

function addMapControls() {
    if (!map) return;

    try {
        const routeControl = L.control({ position: 'topright' });
        
        routeControl.onAdd = function(map) {
            const div = L.DomUtil.create('div', 'leaflet-control-routes');
            div.innerHTML = `
                <div class="route-control-panel" style="background: white; padding: 10px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px;">Map Controls</h4>
                    <div class="route-toggle-buttons" style="display: flex; flex-wrap: wrap; gap: 5px;">
                        <button id="show-all-routes" class="control-btn" style="padding: 4px 8px; margin: 1px; border: 1px solid #ccc; background: white; cursor: pointer; border-radius: 3px; font-size: 11px;">Routes</button>
                        <button id="show-trucks" class="control-btn" style="padding: 4px 8px; margin: 1px; border: 1px solid #ccc; background: white; cursor: pointer; border-radius: 3px; font-size: 11px;">Trucks</button>
                    </div>
                </div>
            `;
            
            L.DomEvent.disableClickPropagation(div);
            return div;
        };
        
        routeControl.addTo(map);
        
        setTimeout(() => {
            document.getElementById('show-all-routes')?.addEventListener('click', toggleAllRoutes);
            document.getElementById('show-trucks')?.addEventListener('click', toggleTrucks);
        }, 100);
        
    } catch (error) {
        console.error('Error adding map controls:', error);
    }
}

// Función optimizada para cargar datos iniciales
async function loadInitialData() {
    showLoading(true);
    
    try {
        console.log('Loading initial data...');
        
        // Cargar solo las rutas primero
        await loadRoutesData();
        
        // Cargar camiones de forma asíncrona sin bloquear
        setTimeout(() => {
            loadTrucksDataAsync();
        }, 500);
        
    } catch (error) {
        console.error('Error loading initial data:', error);
        showError('Failed to load data: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function loadRoutesData() {
    try {
        console.log('Loading routes data for day:', currentDay);
        
        let routes;
        if (currentDay === -1) {
            routes = await getRoutes();
        } else {
            routes = await getRoutesByDay(currentDay);
        }
        
        allRoutes = routes.data || routes || [];
        filteredRoutes = [...allRoutes];
        
        console.log('Loaded routes:', allRoutes.length);
        
        updateStats();
        renderRoutesList();
        
        if (map && routesVisible) {
            renderRoutesOnMap();
        }
        
    } catch (error) {
        console.error('Error loading routes:', error);
        throw error;
    }
}

// Función asíncrona para cargar camiones sin bloquear
async function loadTrucksDataAsync() {
    try {
        console.log('Loading truck data asynchronously...');
        
        // Importar dinámicamente las funciones del mapa
        const { getLatestTruckReadings, getDrivers: getMapDrivers } = await import('../map/services.js');
        
        const [latestReadings, drivers] = await Promise.all([
            getLatestTruckReadings(),
            getMapDrivers()
        ]);
        
        // Guardar datos en cache
        driversData = drivers;
        
        // Procesar las últimas lecturas
        trucksData = latestReadings.data.map(reading => ({
            id: reading.truck.id,
            licensePlate: reading.truck.licensePlate,
            brand: reading.truck.brand,
            model: reading.truck.model,
            state: { 
                id: reading.truck.state.id,
                message: reading.truck.state.description
            },
            lastReading: {
                temperature: reading.reading.temp,
                humidity: reading.reading.percHumidity,
                date: reading.reading.date,
                latitude: reading.reading.location.latitude,
                longitude: reading.reading.location.longitude,
                doorState: reading.reading.doorState
            },
            driver: drivers.find(d => d.truckDefault?.id === reading.truck.id)
        }));

        console.log('Trucks loaded:', trucksData.length);
        
        if (map && trucksVisible) {
            renderTrucksOnMap();
        }
        
    } catch (error) {
        console.error('Error loading truck data:', error);
        // No mostrar error aquí porque es carga asíncrona
    }
}

// function getLatestReadings(readings) {
//     const grouped = readings.reduce((acc, reading) => {
//         if (!acc[reading.truck.id] || new Date(reading.date) > new Date(acc[reading.truck.id].date)) {
//             acc[reading.truck.id] = reading;
//         }
//         return acc;
//     }, {});
    
//     return Object.values(grouped);
// }

function renderTrucksOnMap() {
    if (!map || !trucksData.length) return;
    
    // Limpiar marcadores de camiones anteriores
    truckMarkers.clearLayers();
    
    trucksData.forEach(truck => {
        if (!truck.lastReading) return;
        
        const { latitude, longitude } = truck.lastReading;
        if (!latitude || !longitude) return;
        
        // Encontrar la ruta asignada a este camión/conductor
        const assignedRoute = findRouteForTruck(truck);
        
        const marker = L.marker([latitude, longitude], {
            icon: truckIcons[truck.state?.id] || truckIcons['AV'],
            truckId: truck.id
        });
        
        const firstName = truck.driver?.name?.firstName || 'Unknown';
        const routeName = assignedRoute ? assignedRoute.name : 'No Route Assigned';
        const routeColor = assignedRoute ? getRouteColor(assignedRoute.id) : '#6b7280';
        
        // URL de avatar consistente basado en el ID del conductor
        const avatarUrl = getDriverAvatar(truck.driver?.id, firstName);
        
        // Generar URL de fallback
        const hash = truck.driver?.id ? hashCode(truck.driver.id) : 0;
        const photoNumber = (hash % 100) + 1;
        const gender = hash % 2 === 0 ? 'men' : 'women';
        const fallbackUrl = `https://randomuser.me/api/portraits/${gender}/${photoNumber}.jpg`;
        
        // Popup con información del camión y ruta
        marker.bindPopup(`
            <div class="truck-popup">
                <div class="popup-header">
                    <div class="driver-profile">
                        <img src="${avatarUrl}" 
                             alt="${firstName}" 
                             class="driver-avatar"
                             onerror="this.src='${fallbackUrl}'">
                        <div class="driver-info">
                            <h4>${truck.licensePlate}</h4>
                            <p><strong>Driver:</strong> ${firstName}</p>
                        </div>
                    </div>
                    <p><strong>Route:</strong> <span style="color: ${routeColor};">${routeName}</span></p>
                    <p><strong>Status:</strong> ${truck.state?.message}</p>
                </div>
                <div class="popup-content">
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
            </div>
        `);
        
        marker.on('click', () => {
            if (assignedRoute) {
                selectRoute(assignedRoute.id);
                highlightRouteOnMap(assignedRoute.id);
            }
        });
        
        truckMarkers.addLayer(marker);
    });
    
    console.log('Trucks rendered on map:', trucksData.length);
}

function findRouteForTruck(truck) {
    if (!truck.driver) return null;
    
    return allRoutes.find(route => {
        return route.driver && route.driver.id === truck.driver.id;
    });
}

function getRouteColor(routeId) {
    const routeIndex = allRoutes.findIndex(route => route.id === routeId);
    return routeIndex >= 0 ? ROUTE_COLORS[routeIndex % ROUTE_COLORS.length] : '#6b7280';
}

function updateStats() {
    const totalRoutes = allRoutes.length;
    const todayRoutes = allRoutes.filter(route => 
        route.deliverDays && route.deliverDays.includes(new Date().getDay())
    ).length;
    
    const storesSet = new Set();
    const driversSet = new Set();
    
    allRoutes.forEach(route => {
        if (route.stores) {
            route.stores.forEach(store => storesSet.add(store.store?.id || store.store?.Id));
        }
        if (route.driver && route.driver.id) {
            driversSet.add(route.driver.id);
        }
    });
    
    // Verificar que los elementos existen antes de actualizar
    const totalRoutesEl = document.getElementById('total-routes');
    const activeRoutesEl = document.getElementById('active-routes');
    const totalStoresEl = document.getElementById('total-stores');
    const assignedDriversEl = document.getElementById('assigned-drivers');
    
    if (totalRoutesEl) totalRoutesEl.textContent = totalRoutes;
    if (activeRoutesEl) activeRoutesEl.textContent = todayRoutes;
    if (totalStoresEl) totalStoresEl.textContent = storesSet.size;
    if (assignedDriversEl) assignedDriversEl.textContent = driversSet.size;
}

function renderRoutesList() {
    const container = document.getElementById('routes-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (filteredRoutes.length === 0) {
        container.innerHTML = `
            <div class="no-routes">
                <p>No routes found for the selected criteria.</p>
            </div>
        `;
        return;
    }
    
    filteredRoutes.forEach(route => {
        const routeElement = createRouteListItem(route);
        container.appendChild(routeElement);
    });
}

function createRouteListItem(route) {
    const div = document.createElement('div');
    div.className = 'route-item';
    div.dataset.routeId = route.id;
    
    const today = new Date().getDay();
    const isActiveToday = route.deliverDays && route.deliverDays.includes(today);
    
    const daysHtml = route.deliverDays ? route.deliverDays.map(day => {
        const isToday = day === today;
        return `<span class="day-tag ${isToday ? 'active-day' : ''}">${DAYS_MAP[day].substring(0, 3)}</span>`;
    }).join('') : '';
    
    const routeColor = getRouteColor(route.id);
    
    div.innerHTML = `
        <div class="route-header">
            <div class="route-name" style="border-left: 4px solid ${routeColor}; padding-left: 8px;">${route.name || 'Unnamed Route'}</div>
            <div class="route-status ${isActiveToday ? 'active' : 'inactive'}">
                ${isActiveToday ? 'Active' : 'Inactive'}
            </div>
        </div>
        
        <div class="route-info">
            <div class="route-driver">
                <strong>Driver:</strong> ${route.driver ? route.driver.name?.fullName || `${route.driver.name?.firstName || ''} ${route.driver.name?.lastName || ''}` : 'Unassigned'}
            </div>
            
            <div class="route-stores-count">
                <strong>Stores:</strong> ${route.stores ? route.stores.length : 0} locations
            </div>
            
            <div class="route-days">
                <strong>Days:</strong> ${daysHtml}
            </div>
        </div>
    `;
    
    div.addEventListener('click', () => {
        selectRoute(route.id);
        showRouteDetails(route);
    });
    
    return div;
}

function renderRoutesOnMap() {
    if (!map) return;
    
    Object.values(routeLayers).forEach(layer => {
        map.removeLayer(layer);
    });
    routeLayers = {};
    
    // Agregar el marcador con el baseIcon
    const baseMarker = L.marker([32.45900929216648, -116.97966765227373], {
        icon: baseIcon
    }).addTo(map);
    
    // Agregar un popup al marcador base
    baseMarker.bindPopup(`
        <div class="base-popup">
            <h4>Grupo Lala - Pacifico</h4>
            <p>Centro de distribución principal</p>
        </div>
    `);

    filteredRoutes.forEach((route, index) => {
        const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
        addRouteToMap(route, color);
    });
}

function addRouteToMap(route, color) {
    if (!map || !route.stores || route.stores.length === 0) return;
    
    const routeGroup = L.layerGroup();
    
    // Add store markers
    route.stores.forEach((storeData, index) => {
        const store = storeData.store;
        if (store && store.location && store.location.latitude && store.location.longitude) {
            const lat = parseFloat(store.location.latitude);
            const lng = parseFloat(store.location.longitude);
            
            if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                return;
            }
            
            try {
                const marker = L.circleMarker([lat, lng], {
                    radius: 8,
                    fillColor: color,
                    color: '#ffffff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                });
                
                marker.bindPopup(`
                    <div class="store-popup">
                        <h4>${store.name}</h4>
                        <p><strong>Route:</strong> <span style="color: ${color};">${route.name}</span></p>
                        <p><strong>Sequence:</strong> ${storeData.sequence}</p>
                        <p><strong>Phone:</strong> ${store.phone || 'N/A'}</p>
                        <p><strong>Address:</strong> ${store.location.address || 'N/A'}</p>
                    </div>
                `);
                
                routeGroup.addLayer(marker);
            } catch (error) {
                console.error('Error creating marker for store:', store.name, error);
            }
        }
    });
    
    // Add route line using waypoints
    if (route.waypoints && route.waypoints.length > 1) {
        try {
            const waypointCoordinates = route.waypoints.map(point => [
                parseFloat(point.latitude),
                parseFloat(point.longitude)
            ]).filter(coord => 
                !isNaN(coord[0]) && !isNaN(coord[1]) &&
                coord[0] >= -90 && coord[0] <= 90 &&
                coord[1] >= -180 && coord[1] <= 180
            );
            
            if (waypointCoordinates.length > 1) {
                const routeLine = L.polyline(waypointCoordinates, {
                    color: color,
                    weight: 3,
                    opacity: 0.7,
                    dashArray: '10, 5'
                });
                
                routeGroup.addLayer(routeLine);
            }
        } catch (error) {
            console.error('Error creating route line from waypoints:', error);
        }
    }
    
    if (routeGroup.getLayers().length > 0) {
        routeLayers[route.id] = routeGroup;
        if (routesVisible) {
            routeGroup.addTo(map);
        }
    }
}

function selectDay(day) {
    currentDay = day;
    
    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelector(`[data-day="${day}"]`).classList.add('active');
    
    loadRoutesData();
}

function selectRoute(routeId) {
    selectedRouteId = routeId;
    
    document.querySelectorAll('.route-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    document.querySelector(`[data-route-id="${routeId}"]`)?.classList.add('selected');
    
    highlightRouteOnMap(routeId);
}

function highlightRouteOnMap(routeId) {
    Object.entries(routeLayers).forEach(([id, layer]) => {
        layer.eachLayer(sublayer => {
            if (sublayer instanceof L.CircleMarker) {
                sublayer.setStyle({ weight: 2, radius: 8 });
            } else if (sublayer instanceof L.Polyline) {
                sublayer.setStyle({ weight: 3, opacity: 0.7 });
            }
        });
    });
    
    if (routeLayers[routeId]) {
        routeLayers[routeId].eachLayer(sublayer => {
            if (sublayer instanceof L.CircleMarker) {
                sublayer.setStyle({ weight: 4, radius: 12 });
            } else if (sublayer instanceof L.Polyline) {
                sublayer.setStyle({ weight: 5, opacity: 1 });
            }
        });
        
        const group = new L.featureGroup([routeLayers[routeId]]);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

function showRouteDetails(route) {
    const modal = document.getElementById('route-details-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-route-name');
    
    if (!modal || !modalBody || !modalTitle) return;
    
    modalTitle.textContent = route.name || 'Route Details';
    
    const daysText = route.deliverDays ? 
        route.deliverDays.map(day => DAYS_MAP[day]).join(', ') : 'Not assigned';
    
    const storesHtml = route.stores ? route.stores
        .sort((a, b) => a.sequence - b.sequence)
        .map(storeData => `
            <tr>
                <td>${storeData.sequence}</td>
                <td>${storeData.store?.name || 'N/A'}</td>
                <td>${storeData.store?.phone || 'N/A'}</td>
                <td>${storeData.store?.location?.address || 'N/A'}</td>
            </tr>
        `).join('') : '<tr><td colspan="4">No stores assigned</td></tr>';
    
    modalBody.innerHTML = `
        <div class="route-details">
            <div class="detail-section">
                <h4>General Information</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Route ID:</label>
                        <span>${route.id}</span>
                    </div>
                    <div class="detail-item">
                        <label>Driver:</label>
                        <span>${route.driver ? route.driver.name?.fullName || `${route.driver.name?.firstName || ''} ${route.driver.name?.lastName || ''}` : 'Unassigned'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Delivery Days:</label>
                        <span>${daysText}</span>
                    </div>
                    <div class="detail-item">
                        <label>Total Stores:</label>
                        <span>${route.stores ? route.stores.length : 0}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4>Stores in Route</h4>
                <div class="stores-table-container">
                    <table class="stores-table">
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Store Name</th>
                                <th>Phone</th>
                                <th>Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${storesHtml}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('route-details-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    selectedRouteId = null;
}

function editSelectedRoute() {
    if (selectedRouteId) {
        closeModal();
        loadComponent('components/routes/edit', { routeId: selectedRouteId });
    }
}

async function deleteSelectedRoute() {
    if (!selectedRouteId) return;
    
    const confirmed = confirm('Are you sure you want to delete this route? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
        showLoading(true);
        await deleteRoute(selectedRouteId);
        
        closeModal();
        await loadRoutesData();
        
        showSuccess('Route deleted successfully');
    } catch (error) {
        console.error('Error deleting route:', error);
        showError('Failed to delete route');
    } finally {
        showLoading(false);
    }
}

function filterRoutes(searchTerm) {
    if (!searchTerm) {
        filteredRoutes = [...allRoutes];
    } else {
        filteredRoutes = allRoutes.filter(route => {
            const matchesName = route.name?.toLowerCase().includes(searchTerm);
            const matchesDriver = route.driver?.name?.fullName?.toLowerCase().includes(searchTerm) ||
                                route.driver?.name?.firstName?.toLowerCase().includes(searchTerm) ||
                                route.driver?.name?.lastName?.toLowerCase().includes(searchTerm);
            const matchesStore = route.stores?.some(storeData => 
                storeData.store?.name?.toLowerCase().includes(searchTerm)
            );
            
            return matchesName || matchesDriver || matchesStore;
        });
    }
    
    renderRoutesList();
    renderRoutesOnMap();
}

function toggleAllRoutes() {
    routesVisible = !routesVisible;
    
    Object.values(routeLayers).forEach(layer => {
        if (routesVisible) {
            map.addLayer(layer);
        } else {
            map.removeLayer(layer);
        }
    });
    
    const btn = document.getElementById('show-trucks');
    if (btn) {
        btn.textContent = trucksVisible ? 'Hide Trucks' : 'Show Trucks';
        btn.style.background = trucksVisible ? '#000080' : 'white';
        btn.style.color = trucksVisible ? 'white' : '#374151';
    }
}

function centerMap() {
    if (!map) return;
    
    // Center on Tijuana
    const tijuana = [32.5027, -117.0382];
    map.setView(tijuana, 11);
}

function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

function showError(message) {
    showToast(message, 'error');
}

function showSuccess(message) {
    showToast(message, 'success');
}

// Component loading function
function loadComponent(component, params = {}) {
    try {
        console.log('Loading component:', component);
        const url = component + '/index.html';
        const urlCode = '../../../' + component + '/code.js';
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                const contentElement = document.getElementById('content');
                if (contentElement) {
                    contentElement.innerHTML = html;
                    return importModule(urlCode, params);
                } else {
                    throw new Error('Content element not found');
                }
            })
            .catch(error => {
                console.error('Error loading component:', error);
                showToast('Error loading page: ' + error.message, 'error');
            });
    } catch (error) {
        console.error('Error in loadComponent:', error);
        showToast('Error loading page', 'error');
    }
}

async function importModule(moduleUrl, params = {}) {
    try {
        const module = await import(moduleUrl + '?v=' + Date.now());
        if (module.init) {
            module.init(params);
        } else {
            console.error('Module does not export init function');
        }
    } catch (error) {
        console.error('Error importing module:', error);
        throw error;
    }
}

function showToast(message, type = 'success') {
    // Remove existing toasts
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

// Export functions that might be needed externally
export {
    loadRoutesData,
    selectRoute,
    showRouteDetails,
    filterRoutes,
    toggleTrucks,
    toggleAllRoutes,
    loadInitialData,
    renderTrucksOnMap
}


// Mover la función toggleTrucks fuera de la exportación:
function toggleTrucks() {
    trucksVisible = !trucksVisible;
    
    if (trucksVisible) {
        map.addLayer(truckMarkers);
        // Cargar datos inmediatamente
        loadTrucksDataAsync();
        // Iniciar el intervalo de actualización
        updateInterval = setInterval(loadTrucksDataAsync, 5000);
    } else {
        map.removeLayer(truckMarkers);
        // Detener el intervalo cuando se ocultan los camiones
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }
    
    const btn = document.getElementById('show-trucks');
    if (btn) {
        btn.textContent = trucksVisible ? 'Hide Trucks' : 'Show Trucks';
        btn.style.background = trucksVisible ? '#000080' : 'white';
        btn.style.color = trucksVisible ? 'white' : '#374151';
    }
}