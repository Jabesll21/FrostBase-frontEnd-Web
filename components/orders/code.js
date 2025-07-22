
export function init() {
    console.log('Initializing orders...');
    loadOrders();
}

// Mock data for demonstration
const mockOrders = [
    {
        _id: "674a1b2c3d4e5f6789012345",
        date: "2024-01-15T08:30:00Z",
        delivered: "2024-01-18T14:00:00Z",
        IDCreatedByUser: "user001",
        IDStore: "store001",
        storeName: "SuperMart Downtown",
        IDStateOrder: "pending",
        stateMessage: "Pending assignment"
    },
    {
        _id: "674a1b2c3d4e5f6789012346",
        date: "2024-01-16T09:15:00Z",
        delivered: "2024-01-19T16:30:00Z",
        IDCreatedByUser: "user002",
        IDStore: "store002",
        storeName: "Fresh Market North",
        IDStateOrder: "assigned",
        stateMessage: "Assigned to driver"
    },
    {
        _id: "674a1b2c3d4e5f6789012347",
        date: "2024-01-14T10:00:00Z",
        delivered: "2024-01-17T12:00:00Z",
        IDCreatedByUser: "user003",
        IDStore: "store003",
        storeName: "MegaStore South",
        IDStateOrder: "delivered",
        stateMessage: "Successfully delivered"
    },
    {
        _id: "674a1b2c3d4e5f6789012348",
        date: "2024-01-17T11:45:00Z",
        delivered: "2024-01-20T13:00:00Z",
        IDCreatedByUser: "user004",
        IDStore: "store004",
        storeName: "QuickShop East",
        IDStateOrder: "pending",
        stateMessage: "Pending review"
    },
    {
        _id: "674a1b2c3d4e5f6789012349",
        date: "2024-01-13T07:20:00Z",
        delivered: "2024-01-16T15:45:00Z",
        IDCreatedByUser: "user005",
        IDStore: "store005",
        storeName: "FoodLand West",
        IDStateOrder: "delivered",
        stateMessage: "Delivered and confirmed"
    },
    {
        _id: "674a1b2c3d4e5f6789012350",
        date: "2024-01-18T14:30:00Z",
        delivered: "2024-01-21T11:00:00Z",
        IDCreatedByUser: "user006",
        IDStore: "store006",
        storeName: "Express Market",
        IDStateOrder: "assigned",
        stateMessage: "In delivery process"
    }
];

// State to column mapping
const stateToColumn = {
    'pending': 'backlog',
    'assigned': 'process',
    'delivered': 'completed',
    'cancelled': 'backlog'
};

// Format date function
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

// Get status display name
function getStatusDisplayName(status) {
    const statusNames = {
        'pending': 'Pending',
        'assigned': 'Assigned',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled'
    };
    return statusNames[status] || status;
}

// Create order card HTML
function createOrderCard(order) {
    const statusClass = `status-${order.IDStateOrder}`;
    
    return `
        <div class="order-card" data-order-id="${order._id}">
            <div class="order-id">#${order._id.slice(-8).toUpperCase()}</div>
            <div class="order-store">${order.storeName}</div>
            <div class="order-dates">
                <div class="order-date">
                    <strong>Created:</strong> ${formatDate(order.date)}
                </div>
                <div class="order-date">
                    <strong>Delivery:</strong> ${formatDate(order.delivered)}
                </div>
            </div>
            <div class="order-status ${statusClass}">
                ${getStatusDisplayName(order.IDStateOrder)}
            </div>
            <div class="order-actions">
                <button class="btn-action btn-edit" onclick="editOrder('${order._id}')">
                    Edit
                </button>
                <button class="btn-action btn-move" onclick="moveOrder('${order._id}')">
                    Move
                </button>
                <button class="btn-action btn-delete" onclick="deleteOrder('${order._id}')">
                    Delete
                </button>
            </div>
        </div>
    `;
}

// Create empty state HTML
function createEmptyState(columnType) {
    const emptyStates = {
        'backlog': {
            text: 'No pending orders',
            subtext: 'New orders will appear here'
        },
        'process': {
            text: 'No orders in process',
            subtext: 'Assigned orders will appear here'
        },
        'completed': {
            text: 'No completed orders',
            subtext: 'Delivered orders will appear here'
        }
    };
    
    const state = emptyStates[columnType];
    return `
        <div class="empty-column">
            <div class="empty-icon">${state.icon}</div>
            <div class="empty-text">${state.text}</div>
            <div class="empty-subtext">${state.subtext}</div>
        </div>
    `;
}

// Render orders in columns
function renderOrders() {
    const columns = {
        'backlog': document.getElementById('backlog-orders'),
        'process': document.getElementById('process-orders'),
        'completed': document.getElementById('completed-orders')
    };

    const counts = {
        'backlog': 0,
        'process': 0,
        'completed': 0
    };

    // Clear columns
    Object.keys(columns).forEach(key => {
        columns[key].innerHTML = '';
    });

    // Group orders by column
    const ordersByColumn = {
        'backlog': [],
        'process': [],
        'completed': []
    };

    mockOrders.forEach(order => {
        const column = stateToColumn[order.IDStateOrder] || 'backlog';
        ordersByColumn[column].push(order);
        counts[column]++;
    });

    // Render orders in each column
    Object.keys(ordersByColumn).forEach(columnKey => {
        const orders = ordersByColumn[columnKey];
        const columnElement = columns[columnKey];

        if (orders.length === 0) {
            columnElement.innerHTML = createEmptyState(columnKey);
        } else {
            columnElement.innerHTML = orders.map(order => createOrderCard(order)).join('');
        }

        // Update counter
        const countElement = document.getElementById(`${columnKey}-count`);
        if (countElement) {
            countElement.textContent = counts[columnKey];
        }
    });
}

// Load orders with simulated delay
function loadOrders() {
    setTimeout(() => {
        renderOrders();
    }, 1000);
}

// Action functions
function addNewOrder() {
    console.log('Adding new order...');
    alert('Add New Order functionality\n\nThis would open a modal or form to create a new order.');
}

function editOrder(orderId) {
    console.log('Editing order:', orderId);
    alert(`Editing order: #${orderId.slice(-8).toUpperCase()}\n\nThis would open an edit form.`);
}

function moveOrder(orderId) {
    console.log('Moving order:', orderId);
    alert(`Moving order: #${orderId.slice(-8).toUpperCase()}\n\nThis would allow changing the order state.`);
}

function deleteOrder(orderId) {
    console.log('Deleting order:', orderId);
    if (confirm(`Are you sure you want to delete order #${orderId.slice(-8).toUpperCase()}?`)) {
        alert('Order deleted successfully');
        renderOrders();
    }
}

function filterOrders() {
    console.log('Opening filters...');
    alert('Filter functionality\n\nThis would implement filters by:\n- State\n- Date\n- Store\n- Driver\n- Date range');
}

// Make functions global for onclick handlers
window.addNewOrder = addNewOrder;
window.editOrder = editOrder;
window.moveOrder = moveOrder;
window.deleteOrder = deleteOrder;
window.filterOrders = filterOrders;