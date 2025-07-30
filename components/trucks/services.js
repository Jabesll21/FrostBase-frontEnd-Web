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

// Obtener camión por ID
export async function getTruckById(truckId) {
    try {
        const url = `${config.api.url}Truck/${truckId}`;
        console.log('Fetching truck from:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Truck response:', result);
        
        return result.data || result;
    } catch (error) {
        console.error('Error fetching truck:', error);
        throw error;
    }
}

// Crear nuevo camión
export async function createTruck(truckData) {
    try {
        const url = config.api.url + "Truck";
        console.log('Creating truck at:', url);
        console.log('Truck data being sent:', truckData);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(truckData)
        });
        
        console.log('Create truck response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Create truck error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Create truck success response:', result);
        
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
        console.log('Updating truck at:', url);
        console.log('Truck data being sent:', truckData);
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(truckData)
        });
        
        console.log('Update truck response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Update truck error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Update truck success response:', result);
        
        return result.data || result;
    } catch (error) {
        console.error('Error updating truck:', error);
        throw error;
    }
}

export async function deleteTruck(id) {
    try {
        const url = config.api.url + "Truck/" + id;
        console.log('Deleting truck at:', url);
        
        const response = await fetch(url, {
            method: 'DELETE'
        });
        
        console.log('Delete truck response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Delete truck error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Delete truck success response:', result);
        
        return result.data || result; 
    } catch (error) {
        console.error('Error deleting truck:', error);
        throw error;
    }
}