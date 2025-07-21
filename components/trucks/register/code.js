export function init() {
    console.log('Initializing add truck interface...');
    setupEventListeners();
    setupFormValidation();
}

function setupEventListeners() {
    // Back button
    document.getElementById('back-button').addEventListener('click', () => {
        // Usa el sistema de navegación de tu aplicación
        if (typeof loadComponent === 'function') {
            loadComponent('components/trucks');
        } else {
            window.history.back();
        }
    });

    // Cancel button
    document.getElementById('cancel-button').addEventListener('click', () => {
        if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
            clearForm();
            if (typeof loadComponent === 'function') {
                loadComponent('components/trucks');
            } else {
                window.history.back();
            }
        }
    });

    // Form submission
    document.getElementById('truck-form').addEventListener('submit', handleFormSubmit);

    document.getElementById('continue-button').addEventListener('click', () => {
        hideSuccessMessage();
        clearForm();
        if (typeof loadComponent === 'function') {
            loadComponent('components/trucks');
        } else {
            window.history.back();
        }
    });

    // Real-time license plate formatting
    const licensePlateInput = document.getElementById('license_plate');
    licensePlateInput.addEventListener('input', (e) => {
        let value = e.target.value.toUpperCase();
        value = value.replace(/[^A-Z0-9-]/g, '');
        e.target.value = value;
    });
}

function setupFormValidation() {
    // Temperature validation
    const minTempInput = document.getElementById('min_temperature');
    const maxTempInput = document.getElementById('max_temperature');
    
    minTempInput.addEventListener('input', validateTemperatureRange);
    maxTempInput.addEventListener('input', validateTemperatureRange);

    // Humidity validation
    const minHumidityInput = document.getElementById('min_humidity');
    const maxHumidityInput = document.getElementById('max_humidity');
    
    minHumidityInput.addEventListener('input', validateHumidityRange);
    maxHumidityInput.addEventListener('input', validateHumidityRange);
}

function validateTemperatureRange() {
    const minTemp = parseFloat(document.getElementById('min_temperature').value);
    const maxTemp = parseFloat(document.getElementById('max_temperature').value);
    
    if (!isNaN(minTemp) && !isNaN(maxTemp) && minTemp >= maxTemp) {
        showAlert('Max temperature must be higher than min temperature');
        return false;
    }
    
    return true;
}

function validateHumidityRange() {
    const minHumidity = parseFloat(document.getElementById('min_humidity').value);
    const maxHumidity = parseFloat(document.getElementById('max_humidity').value);
    
    if (!isNaN(minHumidity) && !isNaN(maxHumidity) && minHumidity >= maxHumidity) {
        showAlert('Max humidity must be higher than min humidity');
        return false;
    }
    
    return true;
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
    const requiredFields = ['brand', 'model', 'license_plate', 'state', 'max_temperature', 'min_temperature', 'max_humidity', 'min_humidity'];
    
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
    
    if (!validateTemperatureRange() || !validateHumidityRange()) {
        return false;
    }
    
    return true;
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    // Show loading state
    const saveButton = document.getElementById('save-button');
    saveButton.classList.add('loading');
    saveButton.disabled = true;
    
    // Collect form data
    const formData = collectFormData();
    
    setTimeout(() => {
        console.log('Truck data to save:', formData);
        
        // Hide loading state
        saveButton.classList.remove('loading');
        saveButton.disabled = false;
        
        showSuccessMessage();
        
    }, 2000);
}

function collectFormData() {
    const form = document.getElementById('truck-form');
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    data.state = data.state === 'true';
    data.max_temperature = parseFloat(data.max_temperature);
    data.min_temperature = parseFloat(data.min_temperature);
    data.max_humidity = parseInt(data.max_humidity);
    data.min_humidity = parseInt(data.min_humidity);
    
    data.created_at = new Date().toISOString();
    
    return data;
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


////////////////////////////////////////////////////////////
async function saveTruck(truckData) {
    try {
        const response = await fetch('/api/trucks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(truckData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save truck');
        }
        
        const result = await response.json();
        console.log('Truck saved successfully:', result);
        return result;
        
    } catch (error) {
        console.error('Error saving truck:', error);
        showAlert('Error saving truck. Please try again.');
        throw error;
    }
}
