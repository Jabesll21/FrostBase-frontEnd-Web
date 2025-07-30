import { createStore, getStoreById, updateStore } from '../services.js';

let currentStoreId = null;
let isEditMode = false;

export function init(params = {}) {
    console.log('Initializing store interface...', params);
    
    // Verificar si estamos en modo edición
    if (params.storeId) {
        currentStoreId = params.storeId;
        isEditMode = true;
        document.querySelector('.title').textContent = 'Edit Store';
        document.querySelector('.btn-save .btn-text').textContent = 'Update Store';
        loadStoreData(params.storeId);
    } else {
        isEditMode = false;
        document.querySelector('.title').textContent = 'Add New Store';
        document.querySelector('.btn-save .btn-text').textContent = 'Save Store';
    }
    
    setupEventListeners();
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

async function loadStoreData(storeId) {
    console.log('Loading store data for ID:', storeId);
    try {
        showLoadingForm();
        const store = await getStoreById(storeId);
        
        if (store) {
            console.log('Store data loaded:', store);
            
            // Llenar el formulario con los datos de la tienda
            document.getElementById('name').value = store.name || store.Name || '';
            document.getElementById('phone').value = store.phone || store.Phone || '';
            document.getElementById('address').value = store.location?.address || store.Location?.Address || '';
            document.getElementById('latitude').value = store.location?.latitude || store.Location?.Latitude || '';
            document.getElementById('longitude').value = store.location?.longitude || store.Location?.Longitude || '';
            
            hideLoadingForm();
        } else {
            throw new Error('Store not found');
        }
    } catch (error) {
        console.error('Error loading store data:', error);
        hideLoadingForm();
        alert('Error loading store data: ' + error.message);
        loadComponent('components/stores');
    }
}

function showLoadingForm() {
    const form = document.getElementById('store-form');
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'form-loading';
    loadingDiv.innerHTML = `
        <div style="text-align: center; padding: 50px; color: #6b7280;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #E5E7EB; border-top: 4px solid #000080; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 20px;">Loading store data...</p>
        </div>
    `;
    
    if (form) {
        form.style.display = 'none';
        form.parentNode.appendChild(loadingDiv);
    }
}

function hideLoadingForm() {
    const form = document.getElementById('store-form');
    const loadingDiv = document.getElementById('form-loading');
    
    if (form) form.style.display = 'block';
    if (loadingDiv) loadingDiv.remove();
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
        const value = formData.get(field);
        
        if (!value || value.trim() === '') {
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
    const originalText = saveButton.querySelector('.btn-text').textContent;
    saveButton.classList.add('loading');
    saveButton.disabled = true;
    saveButton.querySelector('.btn-text').style.display = 'none';
    saveButton.querySelector('.btn-loading').style.display = 'inline';

    const formData = new FormData(e.target);
    
    if (isEditMode) {
        const updateData = {
            Id: currentStoreId,
            Name: formData.get('name').trim(),
            Phone: formData.get('phone').trim(),
            Location: {
                Address: formData.get('address').trim(),
                Latitude: parseFloat(formData.get('latitude')),
                Longitude: parseFloat(formData.get('longitude'))
            },
            Active: true 
        };

        console.log('Updating store with data:', updateData);

        updateStore(currentStoreId, updateData)
            .then(result => {
                console.log('Store updated successfully:', result);
                showSuccessMessage('Store Updated Successfully!', 'The store information has been updated.');
            })
            .catch(error => {
                console.error('Error updating store:', error);
                alert('Error updating store: ' + error.message);
            })
            .finally(() => {
                saveButton.classList.remove('loading');
                saveButton.disabled = false;
                saveButton.querySelector('.btn-text').style.display = 'inline';
                saveButton.querySelector('.btn-loading').style.display = 'none';
            });
    } else {
        const storeData = {
            Name: formData.get('name').trim(),
            Phone: formData.get('phone').trim(),
            Location: {
                Address: formData.get('address').trim(),
                Latitude: parseFloat(formData.get('latitude')),
                Longitude: parseFloat(formData.get('longitude'))
            }
        };

        console.log('Creating store with data:', storeData);

        createStore(storeData)
            .then(result => {
                console.log('Store created successfully:', result);
                showSuccessMessage('Store Added Successfully!', 'The store has been registered and added to your network.');
            })
            .catch(error => {
                console.error('Error creating store:', error);
                alert('Error creating store: ' + error.message);
            })
            .finally(() => {
                saveButton.classList.remove('loading');
                saveButton.disabled = false;
                saveButton.querySelector('.btn-text').style.display = 'inline';
                saveButton.querySelector('.btn-loading').style.display = 'none';
            });
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
        let { init } = await import(moduleUrl + '?v=' + Date.now());
        init(params);
    } catch (error) {
        console.error('Error importing module:', error);
        alert('Error loading page. Please try again.');
    }
}