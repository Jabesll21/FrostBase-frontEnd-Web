import { getStores } from "./services.js"

export function init(){
    console.log('Initializing stores...')
    loadStores()
    setupEventListeners()
}

function setupEventListeners() {
    // Add button event listener
    document.getElementById('add-button').addEventListener('click', () => {
        loadComponent('components/stores/register');
    });

    // Search functionality
    document.getElementById('search-input').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterStores(searchTerm);
    });

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
    document.getElementById('stores-grid').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    getStores().then(response => {
        if (response && response.data) {
            allStores = response.data;
            filteredStores = [...allStores];
            updateStats();
            renderStores(filteredStores);
        } else {
            console.error('Error loading stores:', response);
            showEmptyState();
        }
    }).catch(error => {
        console.error('Error loading stores:', error);
        showEmptyState();
    });
}

function updateStats() {
    const total = allStores.length;
    const active = allStores.filter(store => store.location.address && store.phone).length;
    const pending = total - active;

    document.getElementById('total-stores').textContent = total;
    document.getElementById('active-stores').textContent = active;
    document.getElementById('pending-stores').textContent = pending;
}

function renderStores(stores) {
    const grid = document.getElementById('stores-grid');
    
    if (stores.length === 0) {
        showEmptyState();
        return;
    }

    grid.innerHTML = stores.map(store => createStoreCard(store)).join('');
}

function createStoreCard(store) {
    const statusClass = store.location.address && store.phone ? 'active' : 'inactive';
    const statusText = store.location.address && store.phone ? 'Active' : 'Incomplete';
    
    return `
        <div class="store-card" data-store-id="${store.id}">
            <div class="store-header">
                <div class="store-name">${store.name}</div>
                <div class="store-status ${statusClass}">${statusText}</div>
            </div>
            <div class="store-info">
                <div class="info-item">
                    <i class="fas fa-phone"></i>
                    <span>${store.phone || 'No phone'}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span class="address">${store.location.address || 'No address'}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-map"></i>
                    <span class="coordinates">
                        ${store.location.latitude?.toFixed(4) || 'N/A'}, 
                        ${store.location.longitude?.toFixed(4) || 'N/A'}
                    </span>
                </div>
            </div>
            <div class="store-actions">
                <button class="btn-action btn-view" onclick="viewStore('${store.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn-action btn-edit" onclick="editStore('${store.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-action btn-delete" onclick="deleteStore('${store.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
}

function filterStores(searchTerm) {
    filteredStores = allStores.filter(store => 
        store.name.toLowerCase().includes(searchTerm) ||
        (store.location.address && store.location.address.toLowerCase().includes(searchTerm)) ||
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
            filteredStores = allStores.filter(store => store.location.address && store.phone);
            break;
        case 'incomplete':
            filteredStores = allStores.filter(store => !store.location.address || !store.phone);
            break;
        default:
            filteredStores = [...allStores];
    }
    
    renderStores(filteredStores);
}

function showEmptyState() {
    document.getElementById('stores-grid').innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">
                <i class="fas fa-store"></i>
            </div>
            <div class="empty-text">No stores found</div>
            <div class="empty-subtext">Add your first store to get started</div>
        </div>
    `;
}

// Action functions
function viewStore(storeId) {
    const store = allStores.find(s => s.id === storeId);
    if (store) {
        alert(`Store Details:\n\nName: ${store.name}\nPhone: ${store.phone || 'N/A'}\nAddress: ${store.location.address || 'N/A'}\nCoordinates: ${store.location.latitude}, ${store.location.longitude}`);
    }
}

function editStore(storeId) {
    console.log('Editing store:', storeId);
    loadComponent('components/stores/register', { storeId: storeId });
}

function deleteStore(storeId) {
    const store = allStores.find(s => s.id === storeId);
    if (store && confirm(`Are you sure you want to delete "${store.name}"?`)) {
        console.log('Deleting store:', storeId);
        // Here you would implement the delete functionality
        alert('Store deleted successfully (demo)');
        loadStores(); // Reload the stores
    }
}

// Make functions global for onclick handlers
window.viewStore = viewStore;
window.editStore = editStore;
window.deleteStore = deleteStore;

// Function to load components (should be available globally)
function loadComponent(component, params = {}) {
    console.log('Loading component:', component, params);
    var url = component + '/index.html';
    var urlCode = '../../../' + component + '/code.js';
    
    fetch(url)
        .then((response) => { return response.text(); })
        .then((html) => { loadHtml(html) })
        .then(() => { importModule(urlCode, params) })
        .catch((error) => { console.error('Invalid HTML file:', error); });
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
        let { init } = await import(moduleUrl);
        init(params);
    } catch (error) {
        console.error('Error importing module:', error);
        showAlert('Error loading page. Please try again.');
    }
}

function showAlert(message) {
    alert(message);
}