export function init() {
    console.log('Initializing add truck interface...');
    setupEventListeners();
}

function setupEventListeners() {
    // Back button
    document.getElementById('back-button').addEventListener('click', () => {
        // Usa el sistema de navegación de tu aplicación
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
    licensePlateInput.addEventListener('input', (e) => {
        let value = e.target.value.toUpperCase();
        value = value.replace(/[^A-Z0-9-]/g, '');
        e.target.value = value;
    });
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
    const requiredFields = ['brand', 'model', 'license_plate', 'state'];
    
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
        
    }, 1000);
}

function collectFormData() {
    const form = document.getElementById('truck-form');
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    data.state = data.state === 'true';
    
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