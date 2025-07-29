import { createUser } from '../services.js';

export function init(params = {}) {
    console.log('Initializing add driver interface...');
    setupEventListeners();
    
    if (params.driverId) {
        loadDriverData(params.driverId);
        document.querySelector('.title').textContent = 'Edit Driver';
    }
}

function setupEventListeners() {
    // Back button
    document.getElementById('back-button').addEventListener('click', () => {
        loadComponent('components/drivers');
    });

    // Cancel button
    document.getElementById('cancel-button').addEventListener('click', () => {
        if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
            clearForm();
            loadComponent('components/drivers');
        }
    });

    // Form submission
    document.getElementById('driver-form').addEventListener('submit', handleFormSubmit);

    // Continue button
    document.getElementById('continue-button').addEventListener('click', () => {
        hideSuccessMessage();
        clearForm();
        loadComponent('components/drivers');
    });

    // Real-time license plate formatting
    const licensePlateInput = document.getElementById('licensePlate');
    if (licensePlateInput) {
        licensePlateInput.addEventListener('input', (e) => {
            let value = e.target.value.toUpperCase();
            value = value.replace(/[^A-Z0-9-]/g, '');
            
            if (value.length <= 3) {
                e.target.value = value;
            } else if (value.length <= 6) {
                e.target.value = value.slice(0, 3) + '-' + value.slice(3);
            } else {
                e.target.value = value.slice(0, 3) + '-' + value.slice(3, 6) + '-' + value.slice(6, 7);
            }
        });
    }

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

    // Email validation
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', validateEmail);
    }

    // Set minimum dates
    setMinimumDates();
}

function setMinimumDates() {
    const today = new Date().toISOString().split('T')[0];
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    // License expiry should be at least one year from now
    const licenseExpiryInput = document.getElementById('licenseExpiry');
    if (licenseExpiryInput) {
        licenseExpiryInput.min = oneYearFromNow.toISOString().split('T')[0];
    }
    
    // Hire date can be today or in the future
    const hireDateInput = document.getElementById('hireDate');
    if (hireDateInput) {
        hireDateInput.max = today;
    }
}

async function loadDriverData(driverId) {
    console.log('Loading driver data for ID:', driverId);
    try {
        const drivers = await getDrivers();
        const driver = drivers.find(d => d.id === driverId);
        
        if (driver) {
            // Llenar el formulario con los datos del conductor
            document.getElementById('firstName').value = driver.name.firstName || '';
            document.getElementById('lastName').value = driver.name.lastName || '';
            document.getElementById('email').value = driver.email || '';
            document.getElementById('phone').value = driver.phone || '';
        }
    } catch (error) {
        console.error('Error loading driver data:', error);
        showAlert('Error loading driver data. Please try again.');
    }
}

function validateEmail() {
    const emailInput = document.getElementById('email');
    const email = emailInput.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailRegex.test(email)) {
        showFieldError(emailInput, 'Please enter a valid email address');
        return false;
    } else {
        hideFieldError(emailInput);
        return true;
    }
}

function validateForm() {
    const form = document.getElementById('driver-form');
    const formData = new FormData(form);
    let isValid = true;
    
    const requiredFields = [
        'firstName', 'lastName', 'email', 'phone'
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

    if (!validateEmail()) {
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
    document.getElementById('driver-form').reset();
    
    document.querySelectorAll('.form-input, .form-textarea').forEach(input => {
        hideFieldError(input);
    });
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        showAlert('Please correct the errors before submitting.');
        return;
    }

    const saveButton = document.querySelector('.btn-save');
    saveButton.classList.add('loading');
    saveButton.disabled = true;

    const formData = new FormData(e.target);
    
    const userData = {
        name: formData.get('firstName'),           
        lastName: formData.get('lastName'),        
        middleName: formData.get('middleName') || '', 
        email: formData.get('email'),              
        phone: formData.get('phone'),             
        birthDate: new Date(formData.get('birthDate') || '1990-01-01'), 
        password: formData.get('password') || 'defaultPassword123', 
        isAdmin: false 
    };

    console.log('Sending user data:', userData);

    createUser(userData)
        .then(result => {
            console.log('User created successfully:', result);
            showSuccessMessage();
        })
        .catch(error => {
            console.error('Error creating user:', error);
            showAlert('Error creating driver. Please try again.');
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

function showAlert(message) {
    alert(message);
}

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
        showAlert('Error loading page. Please try again.');
    }
}