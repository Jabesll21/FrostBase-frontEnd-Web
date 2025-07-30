import { getOrders } from "./services.js"

export function init() {
    console.log('Initializing orders...');
    loadOrders();
    setupEventListeners();
}

function setupEventListeners() {
    // Add button event listener
    const addButton = document.getElementById('add-button');
    if (addButton) {
        addButton.addEventListener('click', () => {
            loadComponent('components/orders/add');
        });
    }

    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterOrders(searchTerm);
        });
    }

    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const filterType = e.target.dataset.filter;
            applyFilter(filterType);
        });
    });
}

let allOrders = [];
let filteredOrders = [];


function loadOrders() {
    // Show loading state
    const ordersGrid = document.getElementById('orders-grid');
    if (ordersGrid) {
        ordersGrid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    }
    
    // Try to get orders from API, fallback to mock data
    getOrders().then(response => {
        if (response && response.data) {
            allOrders = response.data;
            filteredOrders = [...allOrders];
            updateStats();
            renderOrders(filteredOrders);
        } else {
            console.log('Using mock data');
            allOrders = [...mockOrders];
            filteredOrders = [...allOrders];
            updateStats();
            renderOrders(filteredOrders);
        }
    }).catch(error => {
        console.error('Error loading orders:', error);
        // Use mock data on error
        allOrders = [...mockOrders];
        filteredOrders = [...allOrders];
        updateStats();
        renderOrders(filteredOrders);
    });
}

function updateStats() {
    const stats = {
        total: allOrders.length,
        pending: allOrders.filter(order => order.state?.id === 'PO' || order.IDStateOrder === 'PO').length,
        delivered: allOrders.filter(order => order.state?.id === 'DO' || order.IDStateOrder === 'DO').length,
        cancelled: allOrders.filter(order => order.state?.id === 'CO' || order.IDStateOrder === 'CO').length,
        late: allOrders.filter(order => order.state?.id === 'LO' || order.IDStateOrder === 'LO').length
    };

    document.getElementById('total-orders').textContent = stats.total;
    document.getElementById('pending-orders').textContent = stats.pending;
    document.getElementById('delivered-orders').textContent = stats.delivered;
    document.getElementById('cancelled-orders').textContent = stats.cancelled;
}

function renderOrders(orders) {
    const grid = document.getElementById('orders-grid');
    
    if (orders.length === 0) {
        showEmptyState();
        return;
    }

    grid.innerHTML = orders.map(order => createOrderCard(order)).join('');
}

function createOrderCard(order) {
    const statusClass = getStatusClass(order.state?.id);
    const statusText = getStatusDisplayName(order.state?.id);
    const orderId = order.id || order._id;
    const storeName = order.store?.name || order.storeName;
    const createdBy = order.createdBy?.name ? 
        `${order.createdBy.name.firstName} ${order.createdBy.name.lastName}` :
        order.IDCreatedByUser;
    
    return `
        <div class="order-card" data-order-id="${orderId}">
            <div class="order-header">
                <div class="order-id">#${orderId.slice(-8).toUpperCase()}</div>
                <div class="order-status ${statusClass}">${statusText}</div>
            </div>
            <div class="order-store">${storeName}</div>
            <div class="order-info">
                <div class="info-item">
                    <i class="fas fa-calendar-plus"></i>
                    <span class="info-label">Created:</span>
                    <span>${formatDate(order.date)}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-calendar-check"></i>
                    <span class="info-label">Delivery:</span>
                    <span>${formatDate(order.deliverDate || order.delivered)}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-user"></i>
                    <span class="info-label">Created by:</span>
                    <span>${createdBy}</span>
                </div>
            </div>
            <div class="order-actions">
                <button class="btn-action btn-view" onclick="viewOrder('${orderId}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn-action btn-edit" onclick="editOrder('${orderId}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-action btn-status" onclick="changeStatus('${orderId}')">
                    <i class="fas fa-exchange-alt"></i> Status
                </button>
                <button class="btn-action btn-delete" onclick="confirmDeleteOrder('${orderId}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
}

function getStatusClass(stateId) {
    switch(stateId) {
        case 'PO': return 'pending';
        case 'DO': return 'delivered';
        case 'CO': return 'cancelled';
        case 'LO': return 'late';
        default: return 'unknown';
    }
}

function getStatusDisplayName(stateId) {
    switch(stateId) {
        case 'PO': return 'Pending';
        case 'DO': return 'Delivered';
        case 'CO': return 'Cancelled';
        case 'LO': return 'Late';
        default: return 'Unknown';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function filterOrders(searchTerm) {
    filteredOrders = allOrders.filter(order => {
        const storeName = order.store?.name || order.storeName || '';
        const orderId = order.id || order._id || '';
        const stateMessage = order.state?.description || order.stateMessage || '';
        
        return storeName.toLowerCase().includes(searchTerm) ||
               orderId.toLowerCase().includes(searchTerm) ||
               stateMessage.toLowerCase().includes(searchTerm);
    });
    
    renderOrders(filteredOrders);
}

function applyFilter(filterType) {
    switch(filterType) {
        case 'all':
            filteredOrders = [...allOrders];
            break;
        case 'pending':
            filteredOrders = allOrders.filter(order => 
                (order.state?.id === 'PO') || (order.IDStateOrder === 'PO'));
            break;
        case 'delivered':
            filteredOrders = allOrders.filter(order => 
                (order.state?.id === 'DO') || (order.IDStateOrder === 'DO'));
            break;
        case 'cancelled':
            filteredOrders = allOrders.filter(order => 
                (order.state?.id === 'CO') || (order.IDStateOrder === 'CO'));
            break;
        case 'late':
            filteredOrders = allOrders.filter(order => 
                (order.state?.id === 'LO') || (order.IDStateOrder === 'LO'));
            break;
        default:
            filteredOrders = [...allOrders];
    }
    
    renderOrders(filteredOrders);
}

function showEmptyState() {
    document.getElementById('orders-grid').innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">
                <i class="fas fa-shopping-bag"></i>
            </div>
            <div class="empty-text">No orders found</div>
            <div class="empty-subtext">Add your first order to get started</div>
        </div>
    `;
}

// Action functions
function addNewOrder() {
    console.log('Adding new order...');
    loadComponent('components/orders/add');
}

function viewOrder(orderId) {
    const order = allOrders.find(o => o._id === orderId);
    if (order) {
        alert(`Order Details:\n\nID: #${order._id.slice(-8).toUpperCase()}\nStore: ${order.storeName}\nStatus: ${order.stateMessage}\nCreated: ${formatDate(order.date)}\nDelivery: ${formatDate(order.delivered)}\nCreated by: ${order.IDCreatedByUser}`);
    }
}

function editOrder(orderId) {
    console.log('Editing order:', orderId);
    alert(`Editing order: #${orderId.slice(-8).toUpperCase()}\n\nThis would open an edit form.`);
}

function changeStatus(orderId) {
    const order = allOrders.find(o => o._id === orderId);
    if (order) {
        const statuses = [
            { id: 'PO', name: 'Pending order' },
            { id: 'DO', name: 'Delivered order' },
            { id: 'CO', name: 'Cancelled order' },
            { id: 'LO', name: 'Late order' }
        ];
        
        const statusOptions = statuses.map(s => `${s.id}: ${s.name}`).join('\n');
        const newStatus = prompt(`Change status for order #${orderId.slice(-8).toUpperCase()}\n\nAvailable statuses:\n${statusOptions}\n\nEnter status ID (PO, DO, CO, LO):`);
        
        if (newStatus && statuses.find(s => s.id === newStatus.toUpperCase())) {
            // Update the order status in mock data
            const statusData = statuses.find(s => s.id === newStatus.toUpperCase());
            order.IDStateOrder = statusData.id;
            order.stateMessage = statusData.name;
            
            updateStats();
            renderOrders(filteredOrders);
            showToast('Order status updated successfully');
        }
    }
}

async function confirmDeleteOrder(orderId) {
    const order = allOrders.find(o => o._id === orderId);
    if (order && confirm(`Are you sure you want to delete order #${orderId.slice(-8).toUpperCase()} for ${order.storeName}?`)) {
        try {
            const index = allOrders.findIndex(o => o._id === orderId);
            if (index > -1) {
                allOrders.splice(index, 1);
                filteredOrders = filteredOrders.filter(o => o._id !== orderId);
                updateStats();
                renderOrders(filteredOrders);
                showToast('Order deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            alert('Error deleting order: ' + error.message);
        }
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#16a34a' : '#dc2626'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        font-weight: 500;
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Make functions global for onclick handlers
window.addNewOrder = addNewOrder;
window.viewOrder = viewOrder;
window.editOrder = editOrder;
window.changeStatus = changeStatus;
window.confirmDeleteOrder = confirmDeleteOrder;

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