import { config } from '../../js/config.js'

// GET all routes
export async function getRoutes() {
    try {
        const url = config.api.url + "Route";
        console.log('Fetching routes from:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Routes response:', result);
        
        return result;
    } catch (error) {
        console.error('Error fetching routes:', error);
        throw error;
    }
}

// GET route by ID
export async function getRouteById(routeId) {
    try {
        const url = `${config.api.url}Route/${routeId}`;
        console.log('Fetching route from:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Route response:', result);
        
        return result.data || result;
    } catch (error) {
        console.error('Error fetching route:', error);
        throw error;
    }
}

// GET today's routes
export async function getTodayRoutes() {
    try {
        const url = `${config.api.url}Route/today/`;
        console.log('Fetching today routes from:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Today routes response:', result);
        
        return result;
    } catch (error) {
        console.error('Error fetching today routes:', error);
        throw error;
    }
}

// GET routes by day
export async function getRoutesByDay(day) {
    try {
        const url = `${config.api.url}Route/days/${day}`;
        console.log('Fetching routes by day from:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Routes by day response:', result);
        
        return result;
    } catch (error) {
        console.error('Error fetching routes by day:', error);
        throw error;
    }
}

// CREATE new route
export async function createRoute(routeData) {
    try {
        const url = config.api.url + "Route";
        console.log('Creating route at:', url);
        console.log('Route data being sent:', JSON.stringify(routeData, null, 2));
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(routeData)
        });
        
        console.log('Create route response status:', response.status);
        
        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    console.error('Create route error JSON:', JSON.stringify(errorData, null, 2));
                    
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
                    if (errorData.message) {
                        errorMessage += ` - ${errorData.message}`;
                    }
                } else {
                    const errorText = await response.text();
                    console.error('Create route error text:', errorText);
                    errorMessage += `: ${errorText}`;
                }
            } catch (parseError) {
                console.error('Could not parse error response:', parseError);
            }
            
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('Create route success response:', result);
        
        return result.data || result;
    } catch (error) {
        console.error('Error creating route:', error);
        throw error;
    }
}

// UPDATE route
export async function updateRoute(routeData) {
    try {
        const url = config.api.url + "Route";
        console.log('Updating route at:', url);
        console.log('Route data being sent:', routeData);
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(routeData)
        });
        
        console.log('Update route response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Update route error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Update route success response:', result);
        
        return result.data || result;
    } catch (error) {
        console.error('Error updating route:', error);
        throw error;
    }
}

// DELETE route
export async function deleteRoute(routeId) {
    try {
        const url = `${config.api.url}Route/${routeId}`;
        console.log('Deleting route at:', url);
        
        const response = await fetch(url, {
            method: 'DELETE'
        });
        
        console.log('Delete route response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Delete route error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Delete route success response:', result);
        
        return result.data || result;
    } catch (error) {
        console.error('Error deleting route:', error);
        throw error;
    }
}

// GET all drivers (for route assignment)
export async function getDrivers() {
    try {
        const url = config.api.url + "User/Drivers";
        console.log('Fetching drivers from:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Drivers response:', result);
        
        return result;
    } catch (error) {
        console.error('Error fetching drivers:', error);
        throw error;
    }
}

// GET all stores (for route creation)
export async function getStores() {
    try {
        const url = config.api.url + "Store";
        console.log('Fetching stores from:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Stores response:', result);
        
        return result;
    } catch (error) {
        console.error('Error fetching stores:', error);
        throw error;
    }
}