import { config } from '../../js/config.js'

// Obtener todos los usuarios (conductores)
// export async function getDrivers() {
//     try {
//         const url = config.api.url + "User/Drivers";
//         console.log('Fetching drivers from:', url);
        
//         const response = await fetch(url);
//         console.log('Response status:', response.status);
//         console.log('Response ok:', response.ok);
        
//         if (!response.ok) {
//             const errorText = await response.text();
//             console.error('Error response:', errorText);
//             throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
//         }
        
//         const result = await response.json();
//         console.log('Raw API response:', result);
        
        
//         if (result && result.data) {
//             console.log('Drivers data found:', result.data);
//             console.log('Number of drivers:', result.data.length);
            
//             if (result.data.length > 0) {
//                 console.log('Sample driver structure:', result.data[0]);
//                 console.log('All drivers:', result.data);
//             }
            
//             return result.data;
//         } else if (Array.isArray(result)) {
//             console.log('Direct array response:', result);
//             return result;
//         } else {
//             console.log('No data property found, returning empty array');
//             return [];
//         }
        
//     } catch (error) {
//         console.error('Error fetching drivers:', error);
        
//         console.log('Attempting direct fetch for debugging...');
//         try {
//             const directResponse = await fetch(config.api.url + "User/Drivers");
//             const directText = await directResponse.text();
//             console.log('Direct response text:', directText);
//         } catch (directError) {
//             console.error('Direct fetch also failed:', directError);
//         }
        
//         return [];
//     }
// }

export async function getDrivers() {
    try {
        const url = config.api.url + "User/Drivers";
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Normalizar la respuesta para siempre devolver un array
        return Array.isArray(result) ? result : (result.data || []);
        
    } catch (error) {
        console.error('Error fetching drivers:', error);
        throw error; // Re-lanzamos el error para manejarlo en el componente
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