import { getDrivers } from './services.js';

export function init(){
    console.log('=== DRIVERS INIT ===');
    try {
        setupEventListeners();
        loadDrivers();
    } catch (error) {
        console.error('Error in drivers init:', error);
    }
}

function setupEventListeners() {
    try {
        const addButton = document.getElementById('add-button');
        if (addButton) {
            addButton.addEventListener('click', () => {
                console.log('Add button clicked');
                loadComponent('components/drivers/register');
            });
        } else {
            console.warn('Add button not found');
        }
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

async function loadDrivers() {
    try {
        console.log('=== LOADING DRIVERS ===');
        
        // Mostrar loading
        showLoading();
        
        // Obtener conductores del backend
        const drivers = await getDrivers();
        
        console.log('Drivers received:', drivers);
        console.log('Number of drivers:', drivers ? drivers.length : 0);
        
        if (drivers && drivers.length > 0) {
            console.log('Sample driver:', drivers[0]);
        }
        
        // Renderizar conductores
        printDrivers(drivers);
        
    } catch (error) {
        console.error('Error loading drivers:', error);
        showError('Error loading drivers: ' + error.message);
    }
}

function showLoading() {
    try {
        const tableBody = document.getElementById('tableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 20px; color: #666;">
                         Loading drivers...
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error showing loading:', error);
    }
}

function showError(message) {
    try {
        const tableBody = document.getElementById('tableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 20px; color: red;">
                         ${message}
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error showing error message:', error);
    }
}

function printDrivers(drivers) {
    try {
        
        const tableBody = document.getElementById('tableBody');
        if (!tableBody) {
            console.error('tableBody element not found!');
            return;
        }
        
        // Limpiar tabla
        tableBody.innerHTML = '';
        
        if (!drivers || !Array.isArray(drivers) || drivers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 20px; color: #888;">
                         No drivers found
                    </td>
                </tr>
            `;
            return;
        }
        
        console.log(`Rendering ${drivers.length} drivers...`);
        
        drivers.forEach((driver, index) => {
            try {
                console.log(`Processing driver ${index + 1}:`, driver);
                
                // Extraer datos de forma segura
                const firstName = driver.name?.firstName || driver.firstName || 'Unknown';
                const lastName = driver.name?.lastName || driver.lastName || '';
                const email = driver.email || 'No email';
                const phone = driver.phone || 'No phone';
                const driverId = driver.id || driver._id || `temp_${index}`;
                
                // Crear fila
                const row = document.createElement('tr');
                row.style.borderBottom = '1px solid #eee';
                
                row.innerHTML = `
                    <td style="padding: 15px; text-align: center; font-weight: 500;">${index + 1}</td>
                    <td style="padding: 15px; font-weight: 500;">${firstName} ${lastName}</td>
                    <td style="padding: 15px; color: #666;">${email}</td>
                    <td style="padding: 15px; text-align: center; color: #888;">Not assigned</td>
                    <td style="padding: 15px; text-align: center; color: #888;">Not assigned</td>
                    <td style="padding: 15px; text-align: center; color: #888;">Not assigned</td>
                    <td style="padding: 15px; text-align: center;">
                        <button onclick="window.editDriver('${driverId}')" 
                                style="margin-right: 8px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
                            Edit
                        </button>
                        <button onclick="window.deleteDriver('${driverId}')" 
                                style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
                            Delete
                        </button>
                    </td>
                `;
                
                tableBody.appendChild(row);
                console.log(`✓ Driver ${index + 1} rendered successfully`);
                
            } catch (error) {
                console.error(`Error processing driver ${index + 1}:`, error);
            }
        });
        
        
    } catch (error) {
        console.error('Error in printDrivers:', error);
    }
}

// Funciones globales
window.editDriver = function(id) {
    try {
        console.log('Editing driver:', id);
        loadComponent('components/drivers/register', { driverId: id });
    } catch (error) {
        console.error('Error editing driver:', error);
        alert('Error loading edit form');
    }
}

window.deleteDriver = function(id) {
    try {
        if (confirm('Are you sure you want to delete this driver?')) {
            console.log('Delete confirmed for driver:', id);
            alert('Delete functionality not implemented yet');
        }
    } catch (error) {
        console.error('Error deleting driver:', error);
    }
}

window.reloadDrivers = function() {
    try {
        console.log('Reloading drivers...');
        loadDrivers();
    } catch (error) {
        console.error('Error reloading drivers:', error);
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
                alert('Error loading page: ' + error.message);
            });
    } catch (error) {
        console.error('Error in loadComponent:', error);
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
