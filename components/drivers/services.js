import { config } from '../../js/config.js'

export async function getDrivers() {
    try {
        const url = config.api.url + "User/Drivers";
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        return Array.isArray(result) ? result : (result.data || []);
        
    } catch (error) {
        console.error('Error fetching drivers:', error);
        throw error; 
    }
}

export async function getDriverById(driverId) {
    try {
        const url = `${config.api.url}User/${driverId}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to get driver`);
        }
        
        const result = await response.json();
        return result.data || result;
    } catch (error) {
        console.error('Error fetching driver:', error);
        throw error;
    }
}

// Actualizar driver
export async function updateDriver(driverId, driverData) {
    try {
        const url = `${config.api.url}User`;
        console.log('Updating driver at:', url);
        console.log('Driver ID:', driverId);
        
        // Verificar que el driver existe antes de actualizar
        console.log('Verifying driver exists before update...');
        const existingDriver = await getDriverById(driverId);
        if (!existingDriver) {
            throw new Error('Driver not found');
        }
        console.log('Driver exists, proceeding with update...');
        
        const updateDto = {
            id: driverId,
            name: {
                firstName: driverData.name.firstName,
                lastName: driverData.name.lastName,
                middleName: driverData.name.middleName
            },
            email: driverData.email,
            phone: driverData.phone,
            birthDate: driverData.birthDate,
            idTruckDefault: driverData.idTruckDefault
        };
        
        console.log('Driver update DTO (Swagger format):', JSON.stringify(updateDto, null, 2));
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateDto)
        });
        
        console.log('Update response status:', response.status);
        console.log('Update response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            // Intentar obtener el error del response
            let errorMessage = `HTTP error! status: ${response.status}`;
            
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    console.error('Error response JSON:', JSON.stringify(errorData, null, 2));
                    
                    // Extraer información específica del error
                    if (errorData.title) {
                        errorMessage += `: ${errorData.title}`;
                    }
                    if (errorData.detail) {
                        errorMessage += ` - ${errorData.detail}`;
                    }
                    if (errorData.errors) {
                        const errors = Object.entries(errorData.errors)
                            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                            .join('\n');
                        errorMessage += `\nValidation errors:\n${errors}`;
                    }
                    // Para errores de servidor interno
                    if (errorData.message) {
                        errorMessage += ` - ${errorData.message}`;
                    }
                    if (errorData.stackTrace) {
                        console.error('Server stack trace:', errorData.stackTrace);
                    }
                } else {
                    const errorText = await response.text();
                    console.error('Error response text:', errorText);
                    errorMessage += `: ${errorText}`;
                }
            } catch (parseError) {
                console.error('Could not parse error response:', parseError);
                errorMessage += ': Could not parse server error response';
            }
            
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('Update driver success response:', result);
        
        return result.data || result;
    } catch (error) {
        console.error('Error updating driver:', error);
        throw error;
    }
}

export async function deleteDriver(driverId) {
    try {
        const url = `${config.api.url}User/${driverId}`;
        const response = await fetch(url, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to delete driver`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error deleting driver:', error);
        throw error;
    }
}

// Obtener todos los usuarios (administradores)
export async function getAdmins() {
    try {
        const url = config.api.url + "User/Admins";
        console.log('Fetching admins from:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Admins response:', result);
        
        return result.data || result || [];
    } catch (error) {
        console.error('Error fetching admins:', error);
        return [];
    }
}

// Crear nuevo usuario
export async function createUser(userData) {
    try {
        const url = config.api.url + "User";
        console.log('Creating user at:', url);
        console.log('User data being sent:', userData);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        
        console.log('Create user response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Create user error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Create user success response:', result);
        
        return result.data || result;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}