import { config } from '../../js/config.js'

export async function getTruckReadings() {
    try {
        const url = config.api.url + "Reading";
        console.log('Fetching truck readings from:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Truck readings response:', result);
        
        return result;
    } catch (error) {
        console.error('Error fetching truck readings:', error);
        throw error;
    }
}

let driversCache = null;

export async function getDrivers() {
    if (driversCache) return driversCache;
    
    try {
        const response = await fetch(config.api.url + 'User/Drivers');
        const data = await response.json();
        driversCache = data.data || [];
        return driversCache;
    } catch (error) {
        console.error('Error fetching drivers:', error);
        return [];
    }
}