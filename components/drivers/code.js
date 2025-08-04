import { getDrivers, deleteDriver } from './services.js';

export function init() {
    console.log('=== DRIVERS INIT ===');
    setupEventListeners();
    loadDrivers();
}

function setupEventListeners() {
    document.getElementById('add-button')?.addEventListener('click', () => {
        loadComponent('components/drivers/register');
    });
}

async function loadDrivers() {
    try {
        showLoading();
        const drivers = await getDrivers();
        printDrivers(drivers);
    } catch (error) {
        console.error('Error loading drivers:', error);
        showError(error.message);
    }
}

function showLoading() {
    const tableBody = document.getElementById('tableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-message">
                    <div class="spinner"></div>
                    Loading drivers...
                </td>
            </tr>
        `;
    }
}

function showError(message) {
    const tableBody = document.getElementById('tableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="error-message">
                    <div style="text-align: center; padding: 20px; color: #dc2626;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px;"></i>
                        <p>${message}</p>
                        <button onclick="window.reloadDrivers()" 
                                style="background: #000080; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                            Try Again
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
}

function printDrivers(drivers) {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;

    tableBody.innerHTML = drivers.length === 0 ? `
        <tr>
            <td colspan="7" class="no-data">
                <div style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p style="font-size: 18px; margin-bottom: 8px;">No drivers found</p>
                    <p style="font-size: 14px; opacity: 0.7;">Add your first driver to get started</p>
                </div>
            </td>
        </tr>
    ` : '';

    drivers.forEach((driver, index) => {
        const birthDate = driver.birthDate ? new Date(driver.birthDate) : null;
        const age = birthDate ? calculateAge(birthDate) : 'N/A';
        
        // Manejar diferentes formatos de nombres
        const firstName = driver.name?.firstName || driver.firstName || '';
        const lastName = driver.name?.lastName || driver.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim() || 'Unknown';
        
        const row = document.createElement('tr');
        row.className = 'driver-row';
        row.innerHTML = `
            <td style="padding: 15px; text-align: center; font-weight: 500;">${index + 1}</td>
            <td style="padding: 15px; font-weight: 500;">
                <div class="driver-name">${fullName}</div>
                <div class="driver-id" style="font-size: 12px; color: #6b7280;">#${(driver.id || '').slice(-8).toUpperCase()}</div>
            </td>
            <td style="padding: 15px; color: #666;">
                <div class="driver-email">${driver.email || 'N/A'}</div>
            </td>
            <td style="padding: 15px; color: #666;">
                <div class="driver-phone">${driver.phone || 'N/A'}</div>
            </td>
            <td style="padding: 15px; text-align: center; color: #666;">
                <div class="driver-age">${age}</div>
            </td>
            <td class="actions" style="padding: 15px; text-align: center;">
                <div class="action-buttons">
                    <button class="btn-edit" onclick="window.editDriver('${driver.id}', '${driver.truckDefault.id}')" title="Edit Driver">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-delete" onclick="window.confirmDelete('${driver.id}', '${fullName}')" title="Delete Driver">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        
        // Agregar efecto hover
        row.addEventListener('mouseenter', () => {
            row.style.backgroundColor = '#f8fafc';
        });
        
        row.addEventListener('mouseleave', () => {
            row.style.backgroundColor = '';
        });
        
        tableBody.appendChild(row);
    });
}

function calculateAge(birthDate) {
    const diff = Date.now() - birthDate.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

// Funciones globales
window.editDriver = async function(id, idTruck) {
    console.log('Editing driver:', id);
    
    if (!id) {
        showToast('Error: Driver ID not found', 'error');
        return;
    }
    
    // Mostrar mensaje de carga
    showToast('Loading driver data...', 'info');
    
    // Cargar el componente de registro en modo edición
    loadComponent('components/drivers/register', { driverId: id, truckId: idTruck });
}

window.confirmDelete = async function(id, driverName) {
    if (!id) {
        showToast('Error: Driver ID not found', 'error');
        return;
    }
    
    const confirmed = confirm(
        `Are you sure you want to delete driver "${driverName}"?\n\n` +
        `This action cannot be undone and will remove all driver information from the system.`
    );
    
    if (confirmed) {
        try {
            // Mostrar indicador de carga
            showToast('Deleting driver...', 'info');
            
            await deleteDriver(id);
            showToast('Driver deleted successfully', 'success');
            
            // Recargar la lista después de eliminar
            setTimeout(() => {
                loadDrivers();
            }, 1000);
            
        } catch (error) {
            console.error('Error deleting driver:', error);
            showToast('Error deleting driver: ' + error.message, 'error');
        }
    }
}

window.reloadDrivers = function() {
    console.log('Reloading drivers...');
    loadDrivers();
}

function showToast(message, type = 'success') {
    // Remover toasts existentes
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

// Agregar estilos para las animaciones de toast
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
    
    .driver-row {
        transition: background-color 0.2s ease;
    }
    
    .action-buttons {
        display: flex;
        gap: 8px;
        justify-content: center;
    }
    
    .btn-edit, .btn-delete {
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
    
    .btn-edit {
        background: #10B981;
        color: white;
    }
    
    .btn-edit:hover {
        background: #059669;
        transform: translateY(-1px);
    }
    
    .btn-delete {
        background: #EF4444;
        color: white;
    }
    
    .btn-delete:hover {
        background: #DC2626;
        transform: translateY(-1px);
    }
    
    .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #E5E7EB;
        border-top: 2px solid #000080;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        display: inline-block;
        margin-right: 10px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);