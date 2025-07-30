import { createStore } from '../services.js';

export function init(params = {}) {
    console.log('Initializing add store interface...');
    setupEventListeners();
    
    if (params.storeId) {
        document.querySelector('.title').textContent = 'Edit Store';
    }
}

function setupEventListeners() {
    // Back button
    document.getElementById('back-button').addEventListener('click', () => {
        loadComponent('components/stores');
    });

    // Cancel button
    document.getElementById('cancel-button').addEventListener('click', () => {
        if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
            clearForm();
            loadComponent('components/stores');
        }
    });

    // Form submission
    document.getElementById('store-form').addEventListener('submit', handleFormSubmit);

    // Continue button
    document.getElementById('continue-button').addEventListener('click', () => {
        hideSuccessMessage();
        clearForm();
        loadComponent('components/stores');
    });

    // Phone number formatting
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 10) {
                value = value.slice(0, 10);
                e.target.value = `+52 ${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6)}`;
            } else {
                e.target.value = value;
            }
        });
    }

    // Coordinate validation
    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');
    
    if (latInput) {
        latInput.addEventListener('blur', validateCoordinates);
    }
    if (lngInput) {
        lngInput.addEventListener('blur', validateCoordinates);
    }
}

function validateCoordinates() {
    const lat = parseFloat(document.getElementById('latitude').value);
    const lng = parseFloat(document.getElementById('longitude').value);
    
    if (lat && (lat < -90 || lat > 90)) {
        showFieldError(document.getElementById('latitude'), 'Latitude must be between -90 and 90');
        return false;
    }
    
    if (lng && (lng < -180 || lng > 180)) {
        showFieldError(document.getElementById('longitude'), 'Longitude must be between -180 and 180');
        return false;
    }
    
    hideFieldError(document.getElementById('latitude'));
    hideFieldError(document.getElementById('longitude'));
    return true;
}

function validateForm() {
    const form = document.getElementById('store-form');
    const formData = new FormData(form);
    let isValid = true;
    
    const requiredFields = [
        'name', 'phone', 'address', 'latitude', 'longitude'
    ];
    
    requiredFields.forEach(field => {
        const input = document.getElementById(field);
        if (!formData.get(field) || formData.get(field).trim() === '') {
            showFieldError(input, 'This field is required');
            isValid = false;
        } else {
            hideFieldError(input);
        }
    });

    // Validate coordinates
    if (!validateCoordinates()) {
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
    document.getElementById('store-form').reset();
    
    document.querySelectorAll('.form-input, .form-textarea').forEach(input => {
        hideFieldError(input);
    });
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        alert('Please correct the errors before submitting.');
        return;
    }

    const saveButton = document.querySelector('.btn-save');
    saveButton.classList.add('loading');
    saveButton.disabled = true;

    const formData = new FormData(e.target);
    
    const storeData = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        location: {
            address: formData.get('address'),
            latitude: parseFloat(formData.get('latitude')),
            longitude: parseFloat(formData.get('longitude'))
        },
        active: true // Default to active
    };

    console.log('Sending store data:', storeData);

    createStore(storeData)
        .then(result => {
            console.log('Store created successfully:', result);
            showSuccessMessage();
        })
        .catch(error => {
            console.error('Error creating store:', error);
            alert('Error creating store. Please try again.');
        })
        .finally(() => {
            saveButton.classList.remove('loading');
            saveButton.disabled = false;
        });
}

function showSuccessMessage() {
    const successMessage = document.getElementById('success-message');
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

async function loadHtml(html) {
    console.log('Loading HTML...')
    document.getElementById('content').innerHTML = html;
}

async function importModule(moduleUrl, params = {}) {
    console.log('Importing Module ' + moduleUrl);
    try {
        let { init } = await import(moduleUrl);
        init(params);
    } catch (error) {
        console.error('Error importing module:', error);
        alert('Error loading page. Please try again.');
    }
}