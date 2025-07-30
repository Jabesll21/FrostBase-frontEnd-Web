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

// Obtener ubicaciones de camiones
export async function getTruckLocations() {
    try {
        // ejemplo
        return await getMockTruckData();
        
          const url = config.api.url + "truck/locations";
          const response = await fetch(url);
          return await response.json();
    } catch (error) {
        console.error('Error fetching truck locations:', error);
        return [];
    }
}

// Datos para pruebas
async function getMockTruckData() {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
        {
            id: "674a4001000000000000001a",
            licensePlate: "TIJ-001-RF",
            brand: "Freightliner",
            model: "Cascadia 2022",
            state: { id: "IR", message: "In Route" },
            lastReading: {
                temperature: 2.5,
                humidity: 78,
                date: new Date().toISOString(),
                latitude: 32.5149,
                longitude: -117.0382
            }
        },
        {
            id: "674a4001000000000000001b", 
            licensePlate: "TIJ-002-RF",
            brand: "Volvo",
            model: "VNL 860 2021",
            state: { id: "AV", message: "Available" },
            lastReading: {
                temperature: 1.8,
                humidity: 76,
                date: new Date().toISOString(),
                latitude: 32.5420,
                longitude: -116.9800
            }
        },
        {
            id: "674a4001000000000000001c",
            licensePlate: "TIJ-003-RF", 
            brand: "Kenworth",
            model: "T680 2023",
            state: { id: "IR", message: "In Route" },
            lastReading: {
                temperature: 3.2,
                humidity: 80,
                date: new Date().toISOString(),
                latitude: 32.4700,
                longitude: -117.1200
            }
        },
        {
            id: "674a4001000000000000001d",
            licensePlate: "TIJ-004-RF",
            brand: "Peterbilt", 
            model: "579 2022",
            state: { id: "IM", message: "In Maintenance" },
            lastReading: {
                temperature: 2.1,
                humidity: 77,
                date: new Date().toISOString(),
                latitude: 32.5020,
                longitude: -117.0800
            }
        }
    ];
}