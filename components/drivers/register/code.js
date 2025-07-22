export function init(params = {}) {
    console.log('Initializing add driver interface...');
    setupEventListeners();
    
    // Si se pasa un driverId, cargar los datos para editar
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
    licensePlateInput.addEventListener('input', (e) => {
        let value = e.target.value.toUpperCase();
        value = value.replace(/[^A-Z0-9-]/g, '');
        
        // Formatear como ABC-123-D
        if (value.length <= 3) {
            e.target.value = value;
        } else if (value.length <= 6) {
            e.target.value = value.slice(0, 3) + '-' + value.slice(3);
        } else {
            e.target.value = value.slice(0, 3) + '-' + value.slice(3, 6) + '-' + value.slice(6, 7);
        }
    });

    // Phone number formatting
    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 10) {
            value = value.slice(0, 10);
            e.target.value = `+52 ${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6)}`;
        } else {
            e.target.value = value;
        }
    });

    // Email validation
    const emailInput = document.getElementById('email');
    emailInput.addEventListener('blur', validateEmail);

    // Set minimum dates
    setMinimumDates();
}

function setMinimumDates() {
    const today = new Date().toISOString().split('T')[0];
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    // License expiry should be at least one year from now
    document.getElementById('licenseExpiry').min = oneYearFromNow.toISOString().split('T')[0];
    
    // Hire date can be today or in the future
    document.getElementById('hireDate').max = today;
}

function loadDriverData(driverId) {
    // En una aplicación real, esto haría una petición a la API
    console.log('Loading driver data for ID:', driverId);
    // Aquí cargarías los datos del conductor y llenarías el formulario
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

function validateLicensePlate(value) {
    // Validate format: ABC-123-D
    const pattern = /^[A-Z0-9]{3}-[0-9]{3}-[A-Z]$/;
    return pattern.test(value);
}

function validateDriverLicense(value) {
    // Validate driver's license format
    const pattern = /^[A-Z]{2}[0-9]{9}$/;
    return pattern.test(value.replace(/\s/g, ''));
}

function validateForm() {
    const form = document.getElementById('driver-form');
    const formData = new FormData(form);
    let isValid = true;
    
    // Required fields validation
    const requiredFields = [
        'firstName', 'lastName', 'email', 'phone', 'licenseNumber', 
        'licenseExpiry', 'route', 'truck', 'licensePlate', 'status', 
        'hireDate', 'experience'
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

    // Email validation
    if (!validateEmail()) {
        isValid = false;
    }

    // License plate validation
    const licensePlate = formData.get('licensePlate');
    if (licensePlate && !validateLicensePlate(licensePlate)) {
        const input = document.getElementById('licensePlate');
        showFieldError(input, 'Please enter a valid license plate format (ABC-123-D)');
        isValid = false;
    }

    // Driver's license validation
    const licenseNumber = formData.get('licenseNumber');
    if (licenseNumber && !validateDriverLicense(licenseNumber)) {
        const input = document.getElementById('licenseNumber');
        showFieldError(input, 'Please enter a valid driver\'s license number');
        isValid = false;
    }

    // Experience validation
    const experience = parseInt(formData.get('experience'));
    if (experience < 0 || experience > 50) {
        const input = document.getElementById('experience');
        showFieldError(input, 'Experience must be between 0 and 50 years');
        isValid = false;
    }

    // License expiry validation
    const licenseExpiry = new Date(formData.get('licenseExpiry'));
    const today = new Date();
    if (licenseExpiry <= today) {
        const input = document.getElementById('licenseExpiry');
        showFieldError(input, 'License expiry date must be in the future');
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
    
    // Clear all error states
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

    // Simulate API call
    setTimeout(() => {
        const formData = new FormData(e.target);
        const driverData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            name: `${formData.get('firstName')} ${formData.get('lastName')}`,
            email: formData.get('email'),
            phone: formData.get('phone'),
            licenseNumber: formData.get('licenseNumber'),
            licenseExpiry: formData.get('licenseExpiry'),
            route: formData.get('route'),
            truck: formData.get('truck'),
            licensePlate: formData.get('licensePlate'),
            status: formData.get('status'),
            hireDate: formData.get('hireDate'),
            experience: formData.get('experience'),
            notes: formData.get('notes')
        };

        console.log('Driver data to save:', driverData);
        
        // En una aplicación real, aquí harías la petición a la API
        // saveDriverToAPI(driverData);
        
        saveButton.classList.remove('loading');
        saveButton.disabled = false;
        showSuccessMessage();
        
    }, 2000); // Simular delay de red
}

function showSuccessMessage() {
    document.getElementById('success-message').style.display = 'flex';
}

function hideSuccessMessage() {
    document.getElementById('success-message').style.display = 'none';
}

function showAlert(message) {
    // En una aplicación real, podrías usar un modal más sofisticado
    alert(message);
}

// Funciones de navegación (deben estar disponibles globalmente)
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