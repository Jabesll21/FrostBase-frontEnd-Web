import { createTruck } from '../services.js';

export function init() {
    console.log('Initializing add truck interface...');
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

function validateLicensePlate(value) {
    // Validate format: ABC-123-D
    const pattern = /^[A-Z0-9]{3}-[0-9]{3}-[A-Z]$/;
    return pattern.test(value);
}

function validateForm() {
    const form = document.getElementById('truck-form');
    const formData = new FormData(form);
    
    // Check required fields
    const requiredFields = ['brand', 'model', 'license_plate'];
    
    for (const field of requiredFields) {
        if (!formData.get(field)) {
            showAlert(`Please fill in the ${field.replace('_', ' ')} field`);
            return false;
        }
    }
    
    // Validate license plate format
    const licensePlate = formData.get('license_plate');
    if (!validateLicensePlate(licensePlate)) {
        showAlert('Please use the correct license plate format: ABC-123-D');
        return false;
    }
    
    return true;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    // Show loading state
    const saveButton = document.getElementById('save-button');
    saveButton.classList.add('loading');
    saveButton.disabled = true;
    
    try {
        // Collect form data
        const formData = collectFormData();
        
        console.log('Truck data to save:', formData);
        
        const response = await createTruck(formData);
        
        if (response.status === 0) {
            showSuccessMessage();
        } else {
            throw new Error('Failed to create truck');
        }
        
    } catch (error) {
        console.error('Error saving truck:', error);
        showAlert('Error saving truck. Please try again.');
    } finally {
        // Hide loading state
        saveButton.classList.remove('loading');
        saveButton.disabled = false;
    }
}

function collectFormData() {
    const form = document.getElementById('truck-form');
    const formData = new FormData(form);
    
    const truckData = {
        Brand: formData.get('brand'),
        Model: formData.get('model'),
        LicensePlate: formData.get('license_plate')
    };
    
    return truckData;
}

function showSuccessMessage() {
    document.getElementById('success-message').style.display = 'flex';
}

function hideSuccessMessage() {
    document.getElementById('success-message').style.display = 'none';
}

function clearForm() {
    const form = document.getElementById('truck-form');
    form.reset();
}

function showAlert(message) {
    alert(message);
}

//load component
export function loadComponent(component){
    console.log(component);
    var url = component + '/index.html';
    var urlCode = '../../../' + component + '/code.js'
    fetch(url)
        .then((response) => { return response.text(); })
        .then( (html) => { loadHtml(html) } )
        .then( () => { importModule(urlCode) })
        .catch( (error) => {console.error('Invalid HTML file'); })
}

//loading html
async function loadHtml(html) {
    console.log('Loading HTML...')
    document.getElementById('content').innerHTML = html
}

//import module
async function importModule(moduleUrl) {
    console.log('Importing Module ' + moduleUrl)
    let { init } = await import(moduleUrl)
    init()
}