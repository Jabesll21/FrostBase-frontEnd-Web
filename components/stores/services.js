import { config } from '../../js/config.js'

// GET all stores
export async function getStores() {
    const url = config.api.url + "store"
    console.log('Fetching stores from:', url)
    
    try {
        const response = await fetch(url)
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        console.log('Stores response:', result)
        return result
    } catch (error) {
        console.error('Error fetching stores:', error)
        throw error
    }
}

// GET store by ID
export async function getStoreById(storeId) {
    try {
        const url = `${config.api.url}store/${storeId}`;
        console.log('Fetching store from:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Get store error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Store response detailed:', JSON.stringify(result, null, 2));
        
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
        console.log('Store data being sent:', JSON.stringify(storeData, null, 2));
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(storeData)
        });
        
        console.log('Create store response status:', response.status);
        console.log('Create store response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Create store error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Create store success response:', JSON.stringify(result, null, 2));
        
        return result.data || result;
    } catch (error) {
        console.error('Error creating store:', error);
        throw error;
    }
}

// UPDATE store
export async function updateStore(storeId, storeData) {
    try {
        const url = config.api.url + "store";
        console.log('Updating store at:', url);
        console.log('Store ID:', storeId);
        console.log('Store data being sent:', JSON.stringify(storeData, null, 2));
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(storeData)
        });
        
        console.log('Update store response status:', response.status);
        console.log('Update store response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    console.error('Update store error JSON:', JSON.stringify(errorData, null, 2));
                    
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
                } else {
                    const errorText = await response.text();
                    console.error('Update store error text:', errorText);
                    errorMessage += `: ${errorText}`;
                }
            } catch (parseError) {
                console.error('Could not parse error response:', parseError);
            }
            
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('Update store success response:', JSON.stringify(result, null, 2));
        
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
        
        console.log('Delete store response status:', response.status);
        console.log('Delete store response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Delete store error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Delete store success response:', JSON.stringify(result, null, 2));
        
        return result.data || result;
    } catch (error) {
        console.error('Error deleting store:', error);
        throw error;
    }
}