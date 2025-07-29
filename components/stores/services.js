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
