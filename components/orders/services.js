import { config } from '../../js/config.js'

// GET all orders
export async function getOrders() {
    const url = config.api.url + "order"
    console.log('Fetching orders from:', url)
    
    try {
        const response = await fetch(url)
        const result = await response.json()
        console.log('Orders response:', result)
        return result
    } catch (error) {
        console.error('Error fetching orders:', error)
        return getMockOrders()
    }
}

// GET order by ID
export async function getOrderById(orderId) {
    try {
        const url = `${config.api.url}order/${orderId}`;
        console.log('Fetching order from:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Order response:', result);
        
        return result.data || result;
    } catch (error) {
        console.error('Error fetching order:', error);
        throw error;
    }
}

// CREATE new order
export async function createOrder(orderData) {
    try {
        const url = config.api.url + "order";
        console.log('Creating order at:', url);
        console.log('Order data being sent:', orderData);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        console.log('Create order response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Create order error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Create order success response:', result);
        
        return result.data || result;
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
}
