import { createOrder } from '../services.js';
import { getStores } from '../../stores/services.js';
import { config } from '../../../js/config.js';

export function init(params = {}) {
    console.log('Initializing add order interface...');
    setupEventListeners();
    loadFormData();
    
    // Set current date as default
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('orderDate').value = now.toISOString().slice(0, 16);
}

function setupEventListeners() {
    // Back button
    document.getElementById('back-button').addEventListener('click', () => {
        loadComponent('components/orders');
    });

    // Cancel button
    document.getElementById('cancel-button').addEventListener('click', () => {
        if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
            clearForm();
            loadComponent('components/orders');
        }
    });

    // Form submission
    document.getElementById('order-form').addEventListener('submit', handleFormSubmit);

    // Continue button
    document.getElementById('continue-button').addEventListener('click', () => {
        hideSuccessMessage();
        clearForm();
        loadComponent('components/orders');
    });

    // Store selection change
    document.getElementById('store').addEventListener('change', handleStoreChange);

    // Order date change for delivery calculation
    document.getElementById('orderDate').addEventListener('change', calculateDeliveryDate);
}

// Function to get admins from API
async function getAdmins() {
    const url = config.api.url + "user/admins";
    console.log('Fetching admins from:', url);
    
    try {
        const response = await fetch(url);
        const result = await response.json();
        console.log('Admins response:', result);
        return result.data || result || [];
    } catch (error) {
        console.error('Error fetching admins:', error);
        throw error;
    }
}

async function loadFormData() {
    try {
        // Load stores
        const storesResponse = await getStores();
        const stores = storesResponse.data || storesResponse || [];
        populateStores(stores);

        // Load admins from API
        const admins = await getAdmins();
        populateAdmins(admins);

    } catch (error) {
        console.error('Error loading form data:', error);
        alert('Error loading form data: ' + error.message);
    }
}

function populateStores(stores) {
    const storeSelect = document.getElementById('store');
    storeSelect.innerHTML = '<option value="">Select a store...</option>';
    
    stores.forEach(store => {
        const option = document.createElement('option');
        option.value = store.id || store._id;
        option.textContent = store.name;
        option.dataset.storeData = JSON.stringify(store);
        storeSelect.appendChild(option);
    });
}

function populateAdmins(admins) {
    const adminSelect = document.getElementById('createdBy');
    adminSelect.innerHTML = '<option value="">Select admin...</option>';
    
    admins.forEach(admin => {
        const option = document.createElement('option');
        option.value = admin.id || admin._id;
        
        // Handle different name formats
        let displayName = admin.name ? 
            `${admin.name.firstName} ${admin.name.lastName}` : 
            `${admin.first_name || admin.firstName} ${admin.last_name || admin.lastName}`;
            
        option.textContent = displayName;
        adminSelect.appendChild(option);
    });
}

function handleStoreChange(e) {
    const selectedOption = e.target.selectedOptions[0];
    const storePreview = document.getElementById('store-preview');
    
    if (selectedOption.value && selectedOption.dataset.storeData) {
        const store = JSON.parse(selectedOption.dataset.storeData);
        showStorePreview(store);
        calculateDeliveryDate();
    } else {
        storePreview.style.display = 'none';
    }
}

function showStorePreview(store) {
    const preview = document.getElementById('store-preview');
    
    // Update preview content
    document.getElementById('preview-store-name').textContent = store.name;
    document.getElementById('preview-phone').textContent = store.phone || 'No phone';
    
    const address = store.location?.address || store.location || 'No address';
    document.getElementById('preview-address').textContent = address;
    
    // Check if store has orders today (mock logic)
    const hasOrderToday = Math.random() > 0.7; // 30% chance of having order
    const statusElement = document.getElementById('preview-status');
    if (hasOrderToday) {
        statusElement.textContent = 'Has Order Today';
        statusElement.className = 'preview-status unavailable';
    } else {
        statusElement.textContent = 'Available';
        statusElement.className = 'preview-status available';
    }
    
    const routes = ['Ruta Norte', 'Ruta Sur', 'Ruta Este', 'Ruta Oeste'];
    const mockRoute = routes[Math.floor(Math.random() * routes.length)];
    document.getElementById('preview-route').textContent = `Assigned to ${mockRoute}`;
    
    preview.style.display = 'block';
}

function calculateDeliveryDate() {
    const orderDate = document.getElementById('orderDate').value;
    const storeSelect = document.getElementById('store');
    const deliveryInput = document.getElementById('deliveryDate');
    
    if (!orderDate || !storeSelect.value) {
        deliveryInput.value = '';
        return;
    }
    
  
    const orderDateTime = new Date(orderDate);
    const deliveryDate = new Date(orderDateTime);
    
    // Add 1-3 days based on mock route schedule
    const daysToAdd = Math.floor(Math.random() * 3) + 1;
    deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
    
    // Skip weekends (simple logic)
    if (deliveryDate.getDay() === 0) deliveryDate.setDate(deliveryDate.getDate() + 1); // Sunday -> Monday
    if (deliveryDate.getDay() === 6) deliveryDate.setDate(deliveryDate.getDate() + 2); // Saturday -> Monday
    
    deliveryInput.value = deliveryDate.toISOString().split('T')[0];
}

function validateForm() {
    const form = document.getElementById('order-form');
    const formData = new FormData(form);
    let isValid = true;
    
    const requiredFields = ['store', 'createdBy', 'orderDate'];
    
    requiredFields.forEach(field => {
        const input = document.getElementById(field);
        if (!formData.get(field) || formData.get(field).trim() === '') {
            showFieldError(input, 'This field is required');
            isValid = false;
        } else {
            hideFieldError(input);
        }
    });

    // Validate order date is not in the past
    const orderDate = new Date(formData.get('orderDate'));
    const now = new Date();
    now.setHours(0, 0, 0, 0); 
    
    if (orderDate < now) {
        showFieldError(document.getElementById('orderDate'), 'Order date cannot be in the past');
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
    document.getElementById('order-form').reset();
    document.getElementById('store-preview').style.display = 'none';
    document.getElementById('deliveryDate').value = '';
    
    document.querySelectorAll('.form-input, .form-select').forEach(input => {
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
    
    const orderData = {
        idCreatedByUser: formData.get('createdBy'),
        idStore: formData.get('store'),
        date: formData.get('orderDate') ? new Date(formData.get('orderDate')).toISOString() : new Date().toISOString()
    };

    console.log('Sending order data:', orderData);

    createOrder(orderData)
        .then(result => {
            console.log('Order created successfully:', result);
            showSuccessMessage(result, formData);
        })
        .catch(error => {
            console.error('Error creating order:', error);
            alert('Error creating order. Please try again.');
        })
        .finally(() => {
            saveButton.classList.remove('loading');
            saveButton.disabled = false;
        });
}

function showSuccessMessage(orderResult, formData) {
    const successMessage = document.getElementById('success-message');
    const orderSummary = document.getElementById('order-summary');
    
    // Get store and admin names from the form
    const storeSelect = document.getElementById('store');
    const adminSelect = document.getElementById('createdBy');
    const selectedStore = storeSelect.selectedOptions[0]?.textContent || 'Unknown Store';
    const selectedAdmin = adminSelect.selectedOptions[0]?.textContent || 'Unknown Admin';
    const orderDate = new Date(formData.get('orderDate')).toLocaleDateString();
    const deliveryDate = document.getElementById('deliveryDate').value ? 
        new Date(document.getElementById('deliveryDate').value).toLocaleDateString() : 'TBD';
    
    // Populate order summary
    orderSummary.innerHTML = `
        <div class="summary-row">
            <span class="summary-label">Order ID:</span>
            <span class="summary-value">#${(orderResult.id || orderResult._id || 'AUTO').slice(-8).toUpperCase()}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Store:</span>
            <span class="summary-value">${selectedStore}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Created By:</span>
            <span class="summary-value">${selectedAdmin}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Order Date:</span>
            <span class="summary-value">${orderDate}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Expected Delivery:</span>
            <span class="summary-value">${deliveryDate}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Status:</span>
            <span class="summary-value">Pending Order</span>
        </div>
    `;
    
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