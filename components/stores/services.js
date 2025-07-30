import { config } from '../../js/config.js'

// GET all stores
export async function getStores() {
    const url = config.api.url + "store"
    console.log('Fetching stores from:', url)
    
    try {
        const response = await fetch(url)
        const result = await response.json()
        console.log('Stores response:', result)
        return result
    } catch (error) {
        console.error('Error fetching stores:', error)
        return getMockStores()
    }
}

// GET store by ID
export async function getStoreById(storeId) {
    try {
        const url = `${config.api.url}store/${storeId}`;
        console.log('Fetching store from:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Store response:', result);
        
        return result.data || result;
    } catch (error) {
        console.error('Error fetching store:', error);
        throw error;
    }
}

// CREATE new store
export async function createStore(storeData) {
    try {
        const url = config.api.url + "store";
        console.log('Creating store at:', url);
        console.log('Store data being sent:', storeData);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(storeData)
        });
        
        console.log('Create store response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Create store error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Create store success response:', result);
        
        return result.data || result;
    } catch (error) {
        console.error('Error creating store:', error);
        throw error;
    }
}

// UPDATE store
export async function updateStore(storeId, storeData) {
    try {
        const url = `${config.api.url}store/${storeId}`;
        console.log('Updating store at:', url);
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(storeData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        return result.data || result;
    } catch (error) {
        console.error('Error updating store:', error);
        throw error;
    }
}

// DELETE store
export async function deleteStore(storeId) {
    try {
        const url = `${config.api.url}store/${storeId}`;
        console.log('Deleting store at:', url);
        
        const response = await fetch(url, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        return result.data || result;
    } catch (error) {
        console.error('Error deleting store:', error);
        throw error;
    }
}
