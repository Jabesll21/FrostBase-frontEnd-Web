import { getRoutes, getTodayRoutes, getRoutesByDay, deleteRoute, getDrivers, getStores } from './services.js';

let map;
let allRoutes = [];
let filteredRoutes = [];
let routeLayers = {};
let selectedRouteId = null;
let currentDay = -1; 

const ROUTE_COLORS = [
    '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#db2777',
    '#0891b2', '#ea580c', '#7c2d12', '#1e40af', '#059669'
];

const DAYS_MAP = {
    0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
    4: 'Thursday', 5: 'Friday', 6: 'Saturday'
};

export function init() {
    console.log('Initializing routes interface...');
    setupEventListeners();
    initializeMap();
    loadRoutesData();
    setTodayButton();
}

function setTodayButton() {
    const today = new Date().getDay();
    const todayBtn = document.getElementById('today-btn');
    if (todayBtn) {
        todayBtn.dataset.day = today;
        todayBtn.textContent = DAYS_MAP[today];
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
        console.error('Leaflet library not loaded. Please include Leaflet CSS and JS files.');
        loadLeaflet().then(() => {
            initializeMapAfterLeaflet();
        });
        return;
    }

    initializeMapAfterLeaflet();
}

function initializeMapAfterLeaflet() {
    const tijuana = [32.5027, -117.0382];
    
    try {
        map = L.map('routes-map', {
            center: tijuana,
            zoom: 11,
            zoomControl: true
        });

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);

        console.log('Map initialized successfully');
        
        addMapControls();
        
    } catch (error) {
        console.error('Error initializing map:', error);
        showMapError();
    }
}

async function loadLeaflet() {
    return new Promise((resolve, reject) => {
        if (!document.querySelector('link[href*="leaflet"]')) {
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(cssLink);
        }

        // Load Leaflet JS
        if (!document.querySelector('script[src*="leaflet"]')) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => {
                console.log('Leaflet loaded successfully');
                resolve();
            };
            script.onerror = () => {
                console.error('Failed to load Leaflet');
                reject();
            };
            document.head.appendChild(script);
        } else {
            resolve();
        }
    });
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
    // Check if map is initialized
    if (!map) {
        console.warn('Map not initialized, skipping controls');
        return;
    }

    try {
        const routeControl = L.control({ position: 'topright' });
        
        routeControl.onAdd = function(map) {
            const div = L.DomUtil.create('div', 'leaflet-control-routes');
            div.innerHTML = `
                <div class="route-control-panel" style="background: white; padding: 10px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                    <h4 style="margin: 0 0 10px 0; font-size: 14px;">Route Controls</h4>
                    <div class="route-toggle-buttons">
                        <button id="show-all-routes" class="control-btn" style="padding: 5px 10px; margin: 2px; border: 1px solid #ccc; background: white; cursor: pointer; border-radius: 3px;">Show All</button>
                        <button id="hide-all-routes" class="control-btn" style="padding: 5px 10px; margin: 2px; border: 1px solid #ccc; background: white; cursor: pointer; border-radius: 3px;">Hide All</button>
                    </div>
                </div>
            `;
            
            L.DomEvent.disableClickPropagation(div);
            
            return div;
        };
        
        routeControl.addTo(map);
        
        setTimeout(() => {
            document.getElementById('show-all-routes')?.addEventListener('click', showAllRoutes);
            document.getElementById('hide-all-routes')?.addEventListener('click', hideAllRoutes);
        }, 100);
        
    } catch (error) {
        console.error('Error adding map controls:', error);
    }
}

async function loadRoutesData() {
    showLoading(true);
    
    try {
        console.log('Loading routes data for day:', currentDay);
        
        let routes;
        if (currentDay === -1) {
            routes = await getRoutes();
        } else {
            routes = await getRoutesByDay(currentDay);
        }
        
        console.log('Routes API response:', routes);
        
        allRoutes = routes.data || routes || [];
        filteredRoutes = [...allRoutes];
        
        console.log('Loaded routes:', allRoutes.length);
        
        updateStats();
        renderRoutesList();
        
        if (map) {
            renderRoutesOnMap();
        } else {
            console.warn('Map not initialized, skipping map rendering');
        }
        
    } catch (error) {
        console.error('Error loading routes:', error);
        showError('Failed to load routes data: ' + error.message);
    } finally {
        showLoading(false);
    }
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
    
    document.getElementById('total-routes').textContent = totalRoutes;
    document.getElementById('active-routes').textContent = todayRoutes;
    document.getElementById('total-stores').textContent = storesSet.size;
    document.getElementById('assigned-drivers').textContent = driversSet.size;
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
    
    div.innerHTML = `
        <div class="route-header">
            <div class="route-name">${route.name || 'Unnamed Route'}</div>
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
    
    filteredRoutes.forEach((route, index) => {
        const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
        addRouteToMap(route, color);
    });
}

function addRouteToMap(route, color) {
    if (!map) {
        console.warn('Map not initialized, cannot add route');
        return;
    }
    
    if (!route.stores || route.stores.length === 0) {
        console.log('Route has no stores:', route.name);
        return;
    }
    
    console.log('Adding route to map:', route.name, 'with', route.stores.length, 'stores');
    
    const routeGroup = L.layerGroup();
    const storeMarkers = [];
    const routeCoordinates = [];
    
    // Add store markers
    route.stores.forEach((storeData, index) => {
        const store = storeData.store;
        if (store && store.location && store.location.latitude && store.location.longitude) {
            const lat = parseFloat(store.location.latitude);
            const lng = parseFloat(store.location.longitude);
            
            // Validate coordinates
            if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                console.warn('Invalid coordinates for store:', store.name, lat, lng);
                return;
            }
            
            console.log('Adding store marker:', store.name, lat, lng);
            
            try {
                const marker = L.circleMarker([lat, lng], {
                    radius: 8,
                    fillColor: color,
                    color: '#ffffff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                });
                
                // Add popup
                marker.bindPopup(`
                    <div class="store-popup">
                        <h4>${store.name}</h4>
                        <p><strong>Sequence:</strong> ${storeData.sequence}</p>
                        <p><strong>Phone:</strong> ${store.phone || 'N/A'}</p>
                        <p><strong>Address:</strong> ${store.location.address || 'N/A'}</p>
                    </div>
                `);
                
                routeGroup.addLayer(marker);
                storeMarkers.push(marker);
                routeCoordinates.push([lat, lng]);
                
            } catch (error) {
                console.error('Error creating marker for store:', store.name, error);
            }
        } else {
            console.warn('Store missing location data:', store ? store.name : 'Unknown store');
        }
    });
    
    if (routeCoordinates.length > 1) {
        try {
            const routeLine = L.polyline(routeCoordinates, {
                color: color,
                weight: 3,
                opacity: 0.7,
                dashArray: '10, 5'
            });
            
            routeGroup.addLayer(routeLine);
            console.log('Added route line with', routeCoordinates.length, 'points');
        } catch (error) {
            console.error('Error creating route line:', error);
        }
    }
    
    if (routeGroup.getLayers().length > 0) {
        routeLayers[route.id] = routeGroup;
        routeGroup.addTo(map);
        console.log('Route added successfully:', route.name);
    } else {
        console.warn('No valid markers created for route:', route.name);
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
    const hasVisibleRoutes = Object.keys(routeLayers).length > 0;
    
    if (hasVisibleRoutes) {
        hideAllRoutes();
    } else {
        showAllRoutes();
    }
}

function showAllRoutes() {
    renderRoutesOnMap();
}

function hideAllRoutes() {
    Object.values(routeLayers).forEach(layer => {
        map.removeLayer(layer);
    });
    routeLayers = {};
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
    alert('Error: ' + message);
}

function showSuccess(message) {
    alert('Success: ' + message);
}

//

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

// Export functions that might be needed externally
export {
    loadRoutesData,
    selectRoute,
    showRouteDetails,
    filterRoutes
};