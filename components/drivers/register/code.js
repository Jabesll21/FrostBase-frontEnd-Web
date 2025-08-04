import { createUser, getDriverById, updateDriver, getUnassignedTruck } from '../services.js';

let currentDriverId = null;
let currentDriverTruckId = null;
let isEditMode = false;

export function init(params = {}) {
    console.log('Initializing driver interface...', params);
    
    // Verificar si estamos en modo edición
    if (params.driverId) {
        currentDriverId = params.driverId;
        currentDriverTruckId = params.truckId;
        isEditMode = true;
        document.querySelector('.title').textContent = 'Edit Driver';
        document.querySelector('.btn-save').textContent = 'Update Driver';
        loadDriverData(params.driverId);
    } else {
        isEditMode = false;
        document.querySelector('.title').textContent = 'Add New Driver';
        document.querySelector('.btn-save').textContent = 'Save Driver';
    }
    
    setupEventListeners();
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
}

async function loadDriverData(driverId) {
    console.log('Loading driver data for ID:', driverId);
    try {
        showLoadingForm();
        const driver = await getDriverById(driverId);
        
        if (driver) {
            console.log('Driver data loaded:', driver);
            
            // Llenar el formulario con los datos del conductor
            document.getElementById('firstName').value = driver.name?.firstName || driver.firstName || '';
            document.getElementById('lastName').value = driver.name?.lastName || driver.lastName || '';
            document.getElementById('middleName').value = driver.name?.middleName || driver.middleName || '';
            document.getElementById('email').value = driver.email || '';
            document.getElementById('phone').value = driver.phone || '';
            
            // Para la fecha de nacimiento, manejar DateOnly del backend
            if (driver.birthDate) {
                let birthDateString;
                if (typeof driver.birthDate === 'string') {
                    // Si ya es string, usar tal como está
                    birthDateString = driver.birthDate.split('T')[0]; // Solo la parte de fecha
                } else {
                    // Si es objeto Date
                    const birthDate = new Date(driver.birthDate);
                    birthDateString = birthDate.toISOString().split('T')[0];
                }
                document.getElementById('birth').value = birthDateString;
            }
            
            // En modo edición, hacer el password opcional
            const passwordField = document.getElementById('password');
            if (passwordField) {
                passwordField.required = false;
                passwordField.placeholder = 'Enter new password (leave blank to keep current)';
                
                // Mostrar el texto de ayuda
                const helpText = document.getElementById('password-help');
                if (helpText) {
                    helpText.style.display = 'block';
                }
            }
            
            hideLoadingForm();
        } else {
            throw new Error('Driver not found');
        }
    } catch (error) {
        console.error('Error loading driver data:', error);
        hideLoadingForm();
        showAlert('Error loading driver data: ' + error.message);
        loadComponent('components/drivers');
    }
}

function showLoadingForm() {
    const form = document.getElementById('driver-form');
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'form-loading';
    loadingDiv.innerHTML = `
        <div style="text-align: center; padding: 50px; color: #6b7280;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #E5E7EB; border-top: 4px solid #000080; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 20px;">Loading driver data...</p>
        </div>
    `;
    
    if (form) {
        form.style.display = 'none';
        form.parentNode.appendChild(loadingDiv);
    }
}

function hideLoadingForm() {
    const form = document.getElementById('driver-form');
    const loadingDiv = document.getElementById('form-loading');
    
    if (form) form.style.display = 'block';
    if (loadingDiv) loadingDiv.remove();
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
    
    // Campos requeridos básicos incluyendo fecha de nacimiento
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'birth'];
    
    // En modo creación, password es requerido
    if (!isEditMode) {
        requiredFields.push('password');
    }
    
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

    // Validar email siempre
    if (!validateEmail()) {
        isValid = false;
    }

    if (isEditMode) {
        const password = formData.get('password');
        if (password && password.length < 8) {
            showFieldError(document.getElementById('password'), 'Password must be at least 8 characters long');
            isValid = false;
        }
    }

    const birthDate = formData.get('birth');
    if (birthDate) {
        const dateValue = new Date(birthDate);
        const today = new Date();
        const minDate = new Date('1900-01-01');
        
        if (dateValue > today) {
            showFieldError(document.getElementById('birth'), 'Birth date cannot be in the future');
            isValid = false;
        } else if (dateValue < minDate) {
            showFieldError(document.getElementById('birth'), 'Please enter a valid birth date');
            isValid = false;
        } else {
            hideFieldError(document.getElementById('birth'));
        }
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
    const originalText = saveButton.textContent;
    saveButton.classList.add('loading');
    saveButton.disabled = true;
    saveButton.textContent = isEditMode ? 'Updating...' : 'Saving...';

    const formData = new FormData(e.target);
    
    if (isEditMode) {
        const birthDateValue = formData.get('birth');
        
        if (!birthDateValue) {
            showFieldError(document.getElementById('birth'), 'Birth date is required');
            saveButton.classList.remove('loading');
            saveButton.disabled = false;
            saveButton.textContent = originalText;
            return;
        }

        const updateData = {
            id: currentDriverId,
            name: {
                firstName: formData.get('firstName').trim(),
                lastName: formData.get('lastName').trim(),
                middleName: formData.get('middleName')?.trim() || ""
            },
            email: formData.get('email').trim(),
            phone: formData.get('phone').trim(),
            birthDate: birthDateValue, // Formato "YYYY-MM-DD" como string
            idTruckDefault: currentDriverTruckId
        };

        console.log('Final update data (matching Swagger):', JSON.stringify(updateData, null, 2));
        console.log('Data types:', {
            id: typeof updateData.id,
            firstName: typeof updateData.name.firstName,
            lastName: typeof updateData.name.lastName,
            middleName: typeof updateData.name.middleName,
            email: typeof updateData.email,
            phone: typeof updateData.phone,
            birthDate: typeof updateData.birthDate,
            idTruckDefault: typeof updateData.idTruckDefault
        });

        updateDriver(currentDriverId, updateData)
            .then(result => {
                console.log('Driver updated successfully:', result);
                showSuccessMessage('Driver Updated Successfully!', 'The driver information has been updated.');
            })
            .catch(error => {
                console.error('Error updating driver:', error);
                showAlert('Error updating driver: ' + error.message);
            })
            .finally(() => {
                saveButton.classList.remove('loading');
                saveButton.disabled = false;
                saveButton.textContent = originalText;
            });
    } else {
        // Modo creación
        getUnassignedTruck()
            .then(unassignedTruck => {
                if (!unassignedTruck) {
                    throw new Error('There is no trucks available to asign');
                }

                const userData = {
                    name: formData.get('firstName').trim(),
                    lastName: formData.get('lastName').trim(),
                    middleName: formData.get('middleName')?.trim() || "",
                    email: formData.get('email').trim(),
                    phone: formData.get('phone').trim(),
                    birthDate: formData.get('birth'), // Formato "YYYY-MM-DD"
                    password: formData.get('password'),
                    isAdmin: false,
                    idTruckDefault: unassignedTruck.id // Añadimos el ID del camión asignado
                };

                console.log('Creating driver with data:', userData);
                console.log('Assigned truck:', unassignedTruck);

                return createUser(userData)
                    .then(result => {
                        console.log('Driver created successfully:', result);
                        showSuccessMessage(
                            'Driver Added Successfully!', 
                            `The new driver has been registered and assigned to truck ${unassignedTruck.licensePlate}`
                        );
                        return result;
                    });
            })
            .catch(error => {
                console.error('Error in driver creation process:', error);
                showAlert('Error creating driver: ' + error.message);
                throw error; // Re-lanzamos el error para el finally
            })
            .finally(() => {
                saveButton.classList.remove('loading');
                saveButton.disabled = false;
                saveButton.textContent = originalText;
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
        .catch((error) => { 
            console.error('Invalid HTML file:', error);
            showAlert('Error loading page. Please try again.');
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
        showAlert('Error loading page. Please try again.');
    }
}