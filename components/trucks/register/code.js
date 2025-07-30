import { createTruck, getTruckById, updateTruck } from '../services.js';

let currentTruckId = null;
let isEditMode = false;

export function init(params = {}) {
    console.log('Initializing truck interface...', params);
    
    // Verificar si estamos en modo edición
    if (params.truckId) {
        currentTruckId = params.truckId;
        isEditMode = true;
        document.querySelector('.title').textContent = 'Edit Truck';
        document.querySelector('.btn-save .btn-text').textContent = 'Update Truck';
        loadTruckData(params.truckId);
    } else {
        isEditMode = false;
        document.querySelector('.title').textContent = 'Add New Truck';
        document.querySelector('.btn-save .btn-text').textContent = 'Save Truck';
    }
    
    setupEventListeners();
}

function setupEventListeners() {
    // Back button
    document.getElementById('back-button').addEventListener('click', () => {
        loadComponent('components/trucks');
    });

    // Cancel button
    document.getElementById('cancel-button').addEventListener('click', () => {
        if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
            clearForm();
            loadComponent('components/trucks');
        }
    });

    // Form submission
    document.getElementById('truck-form').addEventListener('submit', handleFormSubmit);

    // Continue button
    document.getElementById('continue-button').addEventListener('click', () => {
        hideSuccessMessage();
        clearForm();
        loadComponent('components/trucks');
    });

    // Real-time license plate formatting
    const licensePlateInput = document.getElementById('license_plate');
    if (licensePlateInput) {
        licensePlateInput.addEventListener('input', (e) => {
            let value = e.target.value.toUpperCase();
            value = value.replace(/[^A-Z0-9-]/g, '');
            e.target.value = value;
        });
    }
}

async function loadTruckData(truckId) {
    console.log('Loading truck data for ID:', truckId);
    try {
        showLoadingForm();
        const truck = await getTruckById(truckId);
        
        if (truck) {
            console.log('Truck data loaded:', truck);
            
            // Llenar el formulario con los datos del camión
            document.getElementById('brand').value = truck.brand || '';
            document.getElementById('model').value = truck.model || '';
            document.getElementById('license_plate').value = truck.licensePlate || '';
            document.getElementById('state').value = truck.state?.id || 'AV';
            
            hideLoadingForm();
        } else {
            throw new Error('Truck not found');
        }
    } catch (error) {
        console.error('Error loading truck data:', error);
        hideLoadingForm();
        alert('Error loading truck data: ' + error.message);
        loadComponent('components/trucks');
    }
}

function showLoadingForm() {
    const form = document.getElementById('truck-form');
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'form-loading';
    loadingDiv.innerHTML = `
        <div style="text-align: center; padding: 50px; color: #6b7280;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #E5E7EB; border-top: 4px solid #000080; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 20px;">Loading truck data...</p>
        </div>
    `;
    
    if (form) {
        form.style.display = 'none';
        form.parentNode.appendChild(loadingDiv);
    }
}

function hideLoadingForm() {
    const form = document.getElementById('truck-form');
    const loadingDiv = document.getElementById('form-loading');
    
    if (form) form.style.display = 'block';
    if (loadingDiv) loadingDiv.remove();
}

function validateLicensePlate(value) {
    // Validate format: ABC-123-D
    const pattern = /^[A-Z0-9]{3}-[0-9]{3}-[A-Z]$/;
    return pattern.test(value);
}

function validateForm() {
    const form = document.getElementById('truck-form');
    const formData = new FormData(form);
    let isValid = true;
    
    // Check required fields
    const requiredFields = ['brand', 'model', 'license_plate'];
    
    for (const field of requiredFields) {
        const input = document.getElementById(field);
        const value = formData.get(field);
        
        if (!value || value.trim() === '') {
            showFieldError(input, 'This field is required');
            isValid = false;
        } else {
            hideFieldError(input);
        }
    }
    
    // Validate license plate format
    const licensePlate = formData.get('license_plate');
    if (licensePlate && !validateLicensePlate(licensePlate)) {
        showFieldError(document.getElementById('license_plate'), 'Please use the correct license plate format: ABC-123-D');
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
    const form = document.getElementById('truck-form');
    form.reset();
    
    document.querySelectorAll('.form-input').forEach(input => {
        hideFieldError(input);
    });
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        alert('Please correct the errors before submitting.');
        return;
    }
    
    // Show loading state
    const saveButton = document.getElementById('save-button');
    const originalText = saveButton.querySelector('.btn-text').textContent;
    saveButton.classList.add('loading');
    saveButton.disabled = true;
    saveButton.querySelector('.btn-text').style.display = 'none';
    saveButton.querySelector('.btn-loading').style.display = 'inline';
    
    try {
        const formData = new FormData(e.target);
        
        if (isEditMode) {
            // Modo edición
            const truckData = {
                id: currentTruckId,
                brand: formData.get('brand'),
                model: formData.get('model'),
                licensePlate: formData.get('license_plate'),
                idStateTruck: formData.get('state')
            };
            
            console.log('Updating truck with data:', truckData);
            const response = await updateTruck(truckData);
            
            if (response) {
                showSuccessMessage('Truck Updated Successfully!', 'The truck information has been updated.');
            } else {
                throw new Error('Failed to update truck');
            }
        } else {
            // Modo creación
            const truckData = {
                Brand: formData.get('brand'),
                Model: formData.get('model'),
                LicensePlate: formData.get('license_plate')
            };
            
            console.log('Creating truck with data:', truckData);
            const response = await createTruck(truckData);
            
            if (response.status === 0) {
                showSuccessMessage('Truck Added Successfully!', 'The truck has been registered and added to your fleet.');
            } else {
                throw new Error('Failed to create truck');
            }
        }
        
    } catch (error) {
        console.error('Error saving truck:', error);
        alert('Error saving truck. Please try again.');
    } finally {
        // Hide loading state
        saveButton.classList.remove('loading');
        saveButton.disabled = false;
        saveButton.querySelector('.btn-text').style.display = 'inline';
        saveButton.querySelector('.btn-loading').style.display = 'none';
    }
}

function showSuccessMessage(title = 'Success!', message = 'Operation completed successfully.') {
    const successMessage = document.getElementById('success-message');
    const titleElement = successMessage.querySelector('h3');
    const messageElement = successMessage.querySelector('p');
    
    if (titleElement) titleElement.textContent = title;
    if (messageElement) messageElement.textContent = message;
    
    if (successMessage) {
        successMessage.style.display = 'flex';
    }
}

function hideSuccessMessage() {
    const successMessage = document.getElementById('success-message');
    if (successMessage) {
        successMessage.style.display = 'none';
    }
}

// Función para cargar componentes
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
            alert('Error loading page. Please try again.');
        });
}

// Función para cargar HTML
async function loadHtml(html) {
    console.log('Loading HTML...')
    document.getElementById('content').innerHTML = html;
}

// Función para importar módulo
async function importModule(moduleUrl, params = {}) {
    console.log('Importing Module ' + moduleUrl);
    try {
        let { init } = await import(moduleUrl + '?v=' + Date.now());
        init(params);
    } catch (error) {
        console.error('Error importing module:', error);
        alert('Error loading page. Please try again.');
    }
}