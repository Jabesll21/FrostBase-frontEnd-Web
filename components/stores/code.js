import { getStores, deleteStore } from "./services.js"

export function init(){
    console.log('Initializing stores...')
    loadStores()
    setupEventListeners()
}

function setupEventListeners() {
    // Add button event listener
    const addButton = document.getElementById('add-button');
    if (addButton) {
        addButton.addEventListener('click', () => {
            loadComponent('components/stores/register');
        });
    }

    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterStores(searchTerm);
        });
    }

    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            e.target.classList.add('active');
            
            const filterType = e.target.dataset.filter;
            applyFilter(filterType);
        });
    });
}

let allStores = [];
let filteredStores = [];

function loadStores() {
    // Show loading state
    showLoading();
    
    getStores().then(response => {
        if (response && response.data) {
            allStores = response.data;
            filteredStores = [...allStores];
            updateStats();
            renderStores(filteredStores);
        } else {
            console.error('Error loading stores:', response);
            showError();
        }
    }).catch(error => {
        console.error('Error loading stores:', error);
        showError();
    });
}

function showLoading() {
    const grid = document.getElementById('stores-grid');
    grid.innerHTML = `
        <div class="loading" style="grid-column: 1/-1; text-align: center; padding: 40px;">
            <div class="spinner"></div>
            <p style="margin-top: 15px; color: #6b7280;">Loading stores...</p>
        </div>
    `;
}

function showError() {
    const grid = document.getElementById('stores-grid');
    grid.innerHTML = `
        <div class="error-state" style="grid-column: 1/-1; text-align: center; padding: 40px; color: #dc2626;">
            <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
            <p style="font-size: 18px; margin-bottom: 8px;">Error loading stores</p>
            <p style="font-size: 14px; opacity: 0.7;">Please try again later</p>
            <button onclick="window.reloadStores()" 
                    style="background: #000080; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">
                Try Again
            </button>
        </div>
    `;
}

function updateStats() {
    const total = allStores.length;
    const active = allStores.filter(store => store.active && store.location?.address && store.phone).length;
    const pending = total - active;

    // Verificar que los elementos existan antes de actualizar
    const totalElement = document.getElementById('total-stores');
    const activeElement = document.getElementById('active-stores');
    const pendingElement = document.getElementById('pending-stores');
    
    if (totalElement) totalElement.textContent = total;
    if (activeElement) activeElement.textContent = active;
    if (pendingElement) pendingElement.textContent = pending;
}

function renderStores(stores) {
    const grid = document.getElementById('stores-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (!grid) {
        console.error('stores-grid element not found');
        return;
    }
    
    grid.innerHTML = '';

    if (stores.length === 0) {
        showEmptyState();
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    stores.forEach(store => {
        const card = document.createElement('div');
        card.className = "store-card";
        card.dataset.id = store.id;
        
        const statusClass = (store.active && store.location?.address && store.phone) ? 'active' : 'inactive';
        const statusText = (store.active && store.location?.address && store.phone) ? 'Active' : 'inactive';
        
        card.innerHTML = `
            <div class="store-header">
                <div class="store-name">${store.name}</div>
            </div>
            <div class="store-info">
                <div class="info-item">
                    <i class="fas fa-phone"></i>
                    <span>${store.phone || 'No phone'}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span class="address">${store.location?.address || 'No address'}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-map"></i>
                    <span class="coordinates">
                        ${store.location?.latitude?.toFixed(4) || 'N/A'}, 
                        ${store.location?.longitude?.toFixed(4) || 'N/A'}
                    </span>
                </div>
            </div>
            <div class="store-actions">
                
                <button class="btn-action btn-edit" onclick="editStore('${store.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-action btn-delete" onclick="confirmDeleteStore('${store.id}', '${store.name}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        
        // Agregar efecto hover
        card.addEventListener('mouseenter', () => {
            card.style.backgroundColor = '#f8fafc';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.backgroundColor = '';
        });
        
        grid.appendChild(card);
    });
}

function filterStores(searchTerm) {
    filteredStores = allStores.filter(store => 
        store.name.toLowerCase().includes(searchTerm) ||
        (store.location?.address && store.location.address.toLowerCase().includes(searchTerm)) ||
        (store.phone && store.phone.includes(searchTerm))
    );
    
    renderStores(filteredStores);
}

function applyFilter(filterType) {
    switch(filterType) {
        case 'all':
            filteredStores = [...allStores];
            break;
        case 'active':
            filteredStores = allStores.filter(store => store.active && store.location?.address && store.phone);
            break;
        case 'inactive':
            filteredStores = allStores.filter(store => !store.active || !store.location?.address || !store.phone);
            break;
        default:
            filteredStores = [...allStores];
    }
    
    renderStores(filteredStores);
}

function showEmptyState() {
    const grid = document.getElementById('stores-grid');
    grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px; color: #6b7280;">
            <div class="empty-icon" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.5;">
                <i class="fas fa-store"></i>
            </div>
            <div class="empty-text" style="font-size: 1.5rem; font-weight: 600; margin-bottom: 10px; color: #374151;">No stores found</div>
            <div class="empty-subtext" style="font-size: 14px; opacity: 0.7;">Add your first store to get started</div>
        </div>
    `;
}

// Action functions
window.viewStore = function(storeId) {
    const store = allStores.find(s => s.id === storeId);
    if (store) {
        alert(`Store Details:\n\nName: ${store.name}\nPhone: ${store.phone || 'N/A'}\nAddress: ${store.location?.address || 'N/A'}\nCoordinates: ${store.location?.latitude || 'N/A'}, ${store.location?.longitude || 'N/A'}\nStatus: ${store.active ? 'Active' : 'Inactive'}`);
    }
};

window.editStore = function(storeId) {
    console.log('Editing store:', storeId);
    
    if (!storeId) {
        showToast('Error: Store ID not found', 'error');
        return;
    }
    
    // Mostrar mensaje de carga
    showToast('Loading store data...', 'info');
    
    // Cargar el componente de registro en modo edición
    loadComponent('components/stores/register', { storeId: storeId });
};

window.confirmDeleteStore = async function(storeId, storeName) {
    if (!storeId) {
        showToast('Error: Store ID not found', 'error');
        return;
    }
    
    const confirmed = confirm(
        `Are you sure you want to delete store "${storeName}"?\n\n` +
        `This action cannot be undone and will remove all store information from the system.`
    );
    
    if (confirmed) {
        try {
            // Mostrar indicador de carga
            showToast('Deleting store...', 'info');
            
            await deleteStore(storeId);
            showToast('Store deleted successfully', 'success');
            
            // Recargar la lista después de eliminar
            setTimeout(() => {
                loadStores();
            }, 1000);
            
        } catch (error) {
            console.error('Error deleting store:', error);
            showToast('Error deleting store: ' + error.message, 'error');
        }
    }
};

window.reloadStores = function() {
    console.log('Reloading stores...');
    loadStores();
};

function showToast(message, type = 'success') {
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

// Function to load components
function loadComponent(component, params = {}) {
    console.log('Loading component:', component, params);
    var url = component + '/index.html';
    var urlCode = '../../../' + component + '/code.js';
    
    fetch(url)
        .then((response) => { return response.text(); })
        .then((html) => { loadHtml(html) })
        .then(() => { importModule(urlCode, params) })
        .catch((error) => { 
            console.error('Invalid HTML file:', error);
            showToast('Error loading page', 'error');
        });
}

// Function to load HTML
async function loadHtml(html) {
    console.log('Loading HTML...')
    document.getElementById('content').innerHTML = html;
}

// Function to import module
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
    
    .store-card {
        transition: background-color 0.2s ease;
    }
    
    .store-actions {
        display: flex;
        gap: 8px;
        justify-content: center;
    }
    
    .btn-action {
        padding: 6px 12px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 4px;
    }
    
    .btn-view {
        background: #eff6ff;
        color: #2563eb;
        border: 1px solid #bfdbfe;
    }
    
    .btn-view:hover {
        background: #2563eb;
        color: white;
        transform: translateY(-1px);
    }
    
    .btn-edit {
        background: #f0fdf4;
        color: #16a34a;
        border: 1px solid #bbf7d0;
    }
    
    .btn-edit:hover {
        background: #16a34a;
        color: white;
        transform: translateY(-1px);
    }
    
    .btn-delete {
        background: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
    }
    
    .btn-delete:hover {
        background: #dc2626;
        color: white;
        transform: translateY(-1px);
    }
    
    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #E5E7EB;
        border-top: 4px solid #000080;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);