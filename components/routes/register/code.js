import { createRoute, getDrivers, getStores } from '../services.js';

let allStores = [];
let selectedStores = [];
let filteredStores = [];

export function init() {
    console.log('Initializing register route interface...');
    setupEventListeners();
    loadFormData();
}

function setupEventListeners() {
    // Back button
    document.getElementById('back-button').addEventListener('click', () => {
        loadComponent('components/routes');
    });

    // Cancel button
    document.getElementById('cancel-button').addEventListener('click', () => {
        if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
            clearForm();
            loadComponent('components/routes');
        }
    });

    // Form submission
    document.getElementById('route-form').addEventListener('submit', handleFormSubmit);

    // Continue button
    document.getElementById('continue-button').addEventListener('click', () => {
        hideSuccessMessage();
        clearForm();
        loadComponent('components/routes');
    });

    // Store search
    document.getElementById('store-search').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterStores(searchTerm);
    });

    // Setup drag and drop for reordering
    setupDragAndDrop();
}

async function loadFormData() {
    try {
        showLoading(true);
        
        // Load drivers
        console.log('Loading drivers...');
        const driversResponse = await getDrivers();
        const drivers = driversResponse.data || driversResponse || [];
        console.log('Drivers loaded:', drivers);
        populateDrivers(drivers);

        // Load stores
        console.log('Loading stores...');
        const storesResponse = await getStores();
        allStores = storesResponse.data || storesResponse || [];
        filteredStores = [...allStores];
        console.log('Stores loaded:', allStores);
        renderAvailableStores();

        showLoading(false);
    } catch (error) {
        console.error('Error loading form data:', error);
        showLoading(false);
        showToast('Error loading form data: ' + error.message, 'error');
    }
}

function showLoading(show) {
    const container = document.querySelector('.form-container');
    if (show) {
        container.style.opacity = '0.5';
        container.style.pointerEvents = 'none';
    } else {
        container.style.opacity = '1';
        container.style.pointerEvents = 'auto';
    }
}

function populateDrivers(drivers) {
    const driverSelect = document.getElementById('assignedDriver');
    driverSelect.innerHTML = '<option value="">Select a driver...</option>';
    
    drivers.forEach(driver => {
        const option = document.createElement('option');
        option.value = driver.id || driver._id;
        
        // Handle different name formats
        let displayName = '';
        if (driver.name) {
            displayName = `${driver.name.firstName || ''} ${driver.name.lastName || ''}`.trim();
        } else {
            displayName = `${driver.firstName || ''} ${driver.lastName || ''}`.trim();
        }
        
        if (!displayName) {
            displayName = driver.email || 'Unknown Driver';
        }
            
        option.textContent = displayName;
        driverSelect.appendChild(option);
    });
}

function renderAvailableStores() {
    const container = document.getElementById('available-stores-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    const availableStores = filteredStores.filter(store => 
        !selectedStores.find(selected => selected.id === store.id)
    );
    
    if (availableStores.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>No stores found</p>
                <small>Try a different search term</small>
            </div>
        `;
        return;
    }
    
    availableStores.forEach(store => {
        const storeElement = createAvailableStoreItem(store);
        container.appendChild(storeElement);
    });
}

function createAvailableStoreItem(store) {
    const div = document.createElement('div');
    div.className = 'store-item';
    div.dataset.storeId = store.id;
    
    // Handle different location formats
    let address = 'No address';
    if (store.location) {
        if (typeof store.location === 'string') {
            address = store.location;
        } else if (store.location.address) {
            address = store.location.address;
        }
    }
    
    div.innerHTML = `
        <div class="store-info">
            <h4>${store.name || 'Unknown Store'}</h4>
            <p><i class="fas fa-phone"></i> ${store.phone || 'No phone'}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${address}</p>
        </div>
        <div class="store-actions">
            <button class="btn-add" onclick="addStoreToRoute('${store.id}')">
                <i class="fas fa-plus"></i> Add
            </button>
        </div>
    `;
    
    return div;
}

function renderSelectedStores() {
    const container = document.getElementById('selected-stores-list');
    const countElement = document.getElementById('selected-count');
    
    if (!container || !countElement) return;
    
    countElement.textContent = `(${selectedStores.length})`;
    
    if (selectedStores.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-store"></i>
                <p>No stores selected</p>
                <small>Select stores from the left panel</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    selectedStores.forEach((store, index) => {
        const storeElement = createSelectedStoreItem(store, index + 1);
        container.appendChild(storeElement);
    });
}

function createSelectedStoreItem(store, sequence) {
    const div = document.createElement('div');
    div.className = 'selected-store-item';
    div.dataset.storeId = store.id;
    div.draggable = true;
    
    // Handle different location formats
    let address = 'No address';
    if (store.location) {
        if (typeof store.location === 'string') {
            address = store.location;
        } else if (store.location.address) {
            address = store.location.address;
        }
    }
    
    div.innerHTML = `
        <div class="sequence-number">${sequence}</div>
        <div class="store-info">
            <h4>${store.name || 'Unknown Store'}</h4>
            <p><i class="fas fa-phone"></i> ${store.phone || 'No phone'}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${address}</p>
        </div>
        <div class="store-actions">
            <button class="btn-remove" onclick="removeStoreFromRoute('${store.id}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    return div;
}

function filterStores(searchTerm) {
    if (!searchTerm) {
        filteredStores = [...allStores];
    } else {
        filteredStores = allStores.filter(store => {
            const name = (store.name || '').toLowerCase();
            const phone = (store.phone || '').toLowerCase();
            let address = '';
            
            if (store.location) {
                if (typeof store.location === 'string') {
                    address = store.location.toLowerCase();
                } else if (store.location.address) {
                    address = store.location.address.toLowerCase();
                }
            }
            
            return name.includes(searchTerm) || 
                   phone.includes(searchTerm) || 
                   address.includes(searchTerm);
        });
    }
    renderAvailableStores();
}

function setupDragAndDrop() {
    const selectedStoresList = document.getElementById('selected-stores-list');
    if (!selectedStoresList) return;
    
    selectedStoresList.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('selected-store-item')) {
            e.target.classList.add('dragging');
            e.dataTransfer.setData('text/plain', e.target.dataset.storeId);
        }
    });
    
    selectedStoresList.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('selected-store-item')) {
            e.target.classList.remove('dragging');
        }
    });
    
    selectedStoresList.addEventListener('dragover', (e) => {
        e.preventDefault();
        const draggingElement = selectedStoresList.querySelector('.dragging');
        const afterElement = getDragAfterElement(selectedStoresList, e.clientY);
        
        if (afterElement == null) {
            selectedStoresList.appendChild(draggingElement);
        } else {
            selectedStoresList.insertBefore(draggingElement, afterElement);
        }
    });
    
    selectedStoresList.addEventListener('drop', (e) => {
        e.preventDefault();
        updateStoreSequences();
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.selected-store-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateStoreSequences() {
    const storeElements = document.querySelectorAll('.selected-store-item');
    const newOrder = [];
    
    storeElements.forEach((element, index) => {
        const storeId = element.dataset.storeId;
        const store = selectedStores.find(s => s.id === storeId);
        if (store) {
            newOrder.push(store);
            // Update sequence number display
            const sequenceElement = element.querySelector('.sequence-number');
            if (sequenceElement) {
                sequenceElement.textContent = index + 1;
            }
        }
    });
    
    selectedStores = newOrder;
}

// Global functions for onclick handlers
window.addStoreToRoute = function(storeId) {
    const store = allStores.find(s => s.id === storeId);
    if (store && !selectedStores.find(s => s.id === storeId)) {
        selectedStores.push(store);
        renderAvailableStores();
        renderSelectedStores();
    }
}

window.removeStoreFromRoute = function(storeId) {
    selectedStores = selectedStores.filter(s => s.id !== storeId);
    renderAvailableStores();
    renderSelectedStores();
}

function validateForm() {
    const form = document.getElementById('route-form');
    const formData = new FormData(form);
    let isValid = true;
    
    // Validate route name
    const routeName = formData.get('routeName');
    if (!routeName || routeName.trim() === '') {
        showFieldError(document.getElementById('routeName'), 'Route name is required');
        isValid = false;
    } else {
        hideFieldError(document.getElementById('routeName'));
    }
    
    // Validate assigned driver
    const assignedDriver = formData.get('assignedDriver');
    if (!assignedDriver) {
        showFieldError(document.getElementById('assignedDriver'), 'Please select a driver');
        isValid = false;
    } else {
        hideFieldError(document.getElementById('assignedDriver'));
    }
    
    // Validate delivery days
    const deliverDays = formData.getAll('deliverDays');
    if (deliverDays.length === 0) {
        showToast('Please select at least one delivery day', 'error');
        isValid = false;
    }
    
    // Validate selected stores
    if (selectedStores.length === 0) {
        showToast('Please select at least one store for the route', 'error');
        isValid = false;
    }
    
    return isValid;
}

function showFieldError(input, message) {
    input.classList.add('error');
    
    let errorElement = input.parentNode.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        input.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

function hideFieldError(input) {
    input.classList.remove('error');
    const errorElement = input.parentNode.querySelector('.error-message');
    if (errorElement) {
        errorElement.classList.remove('show');
    }
}

function clearForm() {
    document.getElementById('route-form').reset();
    selectedStores = [];
    filteredStores = [...allStores];
    renderAvailableStores();
    renderSelectedStores();
    
    document.querySelectorAll('.form-input, .form-select').forEach(input => {
        hideFieldError(input);
    });
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }

    const saveButton = document.querySelector('.btn-save');
    const textSpan = saveButton.querySelector('.btn-text');
    const loadingSpan = saveButton.querySelector('.btn-loading');
    
    saveButton.classList.add('loading');
    saveButton.disabled = true;
    textSpan.style.display = 'none';
    loadingSpan.style.display = 'inline';

    const formData = new FormData(e.target);
    
    // Prepare route data according to backend DTO structure
    const routeData = {
        name: formData.get('routeName').trim(),
        IDCreatedBy: formData.get('assignedDriver'),
        deliverDays: formData.getAll('deliverDays').map(day => parseInt(day)),
        stores: selectedStores.map((store, index) => ({
            IDStore: store.id,
            sequence: index + 1
        }))
    };

    console.log('Creating route with data:', routeData);

    createRoute(routeData)
        .then(result => {
            console.log('Route created successfully:', result);
            showSuccessMessage(result, formData);
        })
        .catch(error => {
            console.error('Error creating route:', error);
            showToast('Error creating route: ' + error.message, 'error');
        })
        .finally(() => {
            saveButton.classList.remove('loading');
            saveButton.disabled = false;
            textSpan.style.display = 'inline';
            loadingSpan.style.display = 'none';
        });
}

function showSuccessMessage(routeResult, formData) {
    const successMessage = document.getElementById('success-message');
    const routeSummary = document.getElementById('route-summary');
    
    if (!successMessage || !routeSummary) return;
    
    // Get driver and store names from the form
    const driverSelect = document.getElementById('assignedDriver');
    const selectedDriver = driverSelect.selectedOptions[0]?.textContent || 'Unknown Driver';
    const routeName = formData.get('routeName');
    const deliverDays = formData.getAll('deliverDays').map(day => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[parseInt(day)];
    }).join(', ');
    
    // Populate route summary
    routeSummary.innerHTML = `
        <div class="summary-row">
            <span class="summary-label">Route ID:</span>
            <span class="summary-value">#${(routeResult.id || routeResult._id || 'AUTO').slice(-8).toUpperCase()}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Route Name:</span>
            <span class="summary-value">${routeName}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Assigned Driver:</span>
            <span class="summary-value">${selectedDriver}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Delivery Days:</span>
            <span class="summary-value">${deliverDays}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Total Stores:</span>
            <span class="summary-value">${selectedStores.length}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Status:</span>
            <span class="summary-value">Active</span>
        </div>
    `;
    
    successMessage.style.display = 'flex';
}

function hideSuccessMessage() {
    const successMessage = document.getElementById('success-message');
    if (successMessage) {
        successMessage.style.display = 'none';
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

// Component loading function
function loadComponent(component, params = {}) {
    console.log('Loading component:', component);
    const url = component + '/index.html';
    const urlCode = '../../../' + component + '/code.js';
    
    fetch(url)
        .then((response) => { return response.text(); })
        .then((html) => { loadHtml(html) })
        .then(() => { importModule(urlCode, params) })
        .catch((error) => { 
            console.error('Invalid HTML file:', error);
            showToast('Error loading page. Please try again.', 'error');
        });
}

async function loadHtml(html) {
    console.log('Loading HTML...')
    document.getElementById('content').innerHTML = html;
}

async function importModule(moduleUrl, params = {}) {
    console.log('Importing Module ' + moduleUrl);
    try {
        let { init } = await import(moduleUrl + '?v=' + Date.now());
        init(params);
    } catch (error) {
        console.error('Error importing module:', error);
        throw error;
    }
}