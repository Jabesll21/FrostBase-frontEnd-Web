import { config } from '../../js/config.js'

// Obtener todos los camiones
export async function getTrucks() {
    try {
        const url = config.api.url + "Truck";
        console.log('Fetching trucks from:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Trucks response:', result);
        
        return result.data || [];
    } catch (error) {
        console.error('Error fetching trucks:', error);
        return [];
    }
}

// Crear nuevo camión
export async function createTruck(truckData) {
    try {
        const url = config.api.url + "Truck";
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(truckData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error creating truck:', error);
        throw error;
    }
}

// Actualizar camión
export async function updateTruck(truckData) {
    try {
        const url = config.api.url + "Truck";
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(truckData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error updating truck:', error);
        throw error;
    }
}

// Eliminar camión
export async function deleteTruck(id) {
    try {
        const url = config.api.url + "Truck/" + id;
        
        const response = await fetch(url, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result.data; // Devuelve el camión actualizado
    } catch (error) {
        console.error('Error deleting truck:', error);
        throw error;
    }
}
