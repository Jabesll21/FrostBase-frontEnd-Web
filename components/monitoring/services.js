import { config } from '../../js/config.js'

// GET all readings
export async function getReadings() {
    try {
        const url = config.api.url + "Reading";
        console.log('Fetching readings from:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Readings response:', result);
        
        return result;
    } catch (error) {
        console.error('Error fetching readings:', error);
        throw error;
    }
}

// GET readings by truck ID
export async function getReadingsByTruck(truckId) {
    try {
        const url = `${config.api.url}Reading/Truck/${truckId}`;
        console.log('Fetching readings for truck:', url);
        
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

// GET all trucks
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
        
        return result;
    } catch (error) {
        console.error('Error fetching trucks:', error);
        throw error;
    }
}

// GET parameters
export async function getParameters() {
    try {
        const url = config.api.url + "Parameter";
        console.log('Fetching parameters from:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Parameters response:', result);
        
        return result;
    } catch (error) {
        console.error('Error fetching parameters:', error);
        throw error;
    }
}

// GET alerts
export async function getAlerts() {
    try {
        const url = config.api.url + "Alert";
        console.log('Fetching alerts from:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Alerts response:', result);
        
        return result;
    } catch (error) {
        console.error('Error fetching alerts:', error);
        throw error;
    }
}

// CREATE alert
export async function createAlert(alertData) {
    try {
        const url = config.api.url + "Alert";
        console.log('Creating alert at:', url);
        console.log('Alert data being sent:', alertData);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(alertData)
        });
        
        console.log('Create alert response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Create alert error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Create alert success response:', result);
        
        return result;
    } catch (error) {
        console.error('Error creating alert:', error);
        throw error;
    }
}

// Helper function to get readings with enhanced filtering
export async function getFilteredReadings(filters = {}) {
    try {
        let url = config.api.url + "Reading";
        const params = new URLSearchParams();
        
        // Add query parameters based on filters
        if (filters.truckId && filters.truckId !== 'all') {
            url = `${config.api.url}Reading/Truck/${filters.truckId}`;
        }
        
        if (filters.startDate) {
            params.append('startDate', filters.startDate);
        }
        
        if (filters.endDate) {
            params.append('endDate', filters.endDate);
        }
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        console.log('Fetching filtered readings from:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error fetching filtered readings:', error);
        throw error;
    }
}

// Analyze readings for statistics
export function analyzeReadings(readings, parameters) {
    if (!readings || readings.length === 0) {
        return {
            temperature: { avg: 0, min: 0, max: 0, inRange: 0, outOfRange: 0, alerts: 0 },
            humidity: { avg: 0, min: 0, max: 0, inRange: 0, outOfRange: 0, alerts: 0 },
            totalAlerts: 0
        };
    }
    
    // Extract temperature and humidity values
    const temperatures = readings
        .map(r => r.temp || r.temperature)
        .filter(t => t != null && !isNaN(t));
    
    const humidities = readings
        .map(r => r.perc_humidity || r.humidity)
        .filter(h => h != null && !isNaN(h));
    
    // Temperature analysis
    const tempStats = {
        avg: temperatures.length > 0 ? temperatures.reduce((a, b) => a + b, 0) / temperatures.length : 0,
        min: temperatures.length > 0 ? Math.min(...temperatures) : 0,
        max: temperatures.length > 0 ? Math.max(...temperatures) : 0,
        inRange: 0,
        outOfRange: 0,
        alerts: 0
    };
    
    if (parameters && temperatures.length > 0) {
        tempStats.inRange = temperatures.filter(t => 
            t >= parameters.min_temperature && t <= parameters.max_temperature
        ).length;
        tempStats.outOfRange = temperatures.length - tempStats.inRange;
        tempStats.alerts = temperatures.filter(t => 
            t < parameters.min_temperature || t > parameters.max_temperature
        ).length;
    }
    
    // Humidity analysis
    const humidityStats = {
        avg: humidities.length > 0 ? humidities.reduce((a, b) => a + b, 0) / humidities.length : 0,
        min: humidities.length > 0 ? Math.min(...humidities) : 0,
        max: humidities.length > 0 ? Math.max(...humidities) : 0,
        inRange: 0,
        outOfRange: 0,
        alerts: 0
    };
    
    if (parameters && humidities.length > 0) {
        humidityStats.inRange = humidities.filter(h => 
            h >= parameters.min_humidity && h <= parameters.max_humidity
        ).length;
        humidityStats.outOfRange = humidities.length - humidityStats.inRange;
        humidityStats.alerts = humidities.filter(h => 
            h < parameters.min_humidity || h > parameters.max_humidity
        ).length;
    }
    
    return {
        temperature: tempStats,
        humidity: humidityStats,
        totalAlerts: tempStats.alerts + humidityStats.alerts
    };
}

// Generate monitoring report
export function generateReport(readings, trucks, parameters, dateRange) {
    const analysis = analyzeReadings(readings, parameters);
    const trucksWithData = trucks.filter(truck => 
        readings.some(reading => reading.idTruck === truck.id)
    );
    
    return {
        summary: {
            totalReadings: readings.length,
            activeTrucks: trucksWithData.length,
            totalTrucks: trucks.length,
            dateRange: dateRange,
            generatedAt: new Date().toISOString()
        },
        temperature: {
            average: analysis.temperature.avg,
            minimum: analysis.temperature.min,
            maximum: analysis.temperature.max,
            inRangeCount: analysis.temperature.inRange,
            outOfRangeCount: analysis.temperature.outOfRange,
            alertsCount: analysis.temperature.alerts,
            compliance: readings.length > 0 ? 
                (analysis.temperature.inRange / readings.length * 100) : 0
        },
        humidity: {
            average: analysis.humidity.avg,
            minimum: analysis.humidity.min,
            maximum: analysis.humidity.max,
            inRangeCount: analysis.humidity.inRange,
            outOfRangeCount: analysis.humidity.outOfRange,
            alertsCount: analysis.humidity.alerts,
            compliance: readings.length > 0 ? 
                (analysis.humidity.inRange / readings.length * 100) : 0
        },
        trucks: trucksWithData.map(truck => {
            const truckReadings = readings.filter(r => r.idTruck === truck.id);
            const truckAnalysis = analyzeReadings(truckReadings, parameters);
            
            return {
                id: truck.id,
                licensePlate: truck.licensePlate,
                brand: truck.brand,
                model: truck.model,
                readingsCount: truckReadings.length,
                temperatureAvg: truckAnalysis.temperature.avg,
                humidityAvg: truckAnalysis.humidity.avg,
                alerts: truckAnalysis.totalAlerts,
                lastReading: truckReadings.length > 0 ? 
                    new Date(Math.max(...truckReadings.map(r => new Date(r.date)))).toISOString() : null
            };
        }),
        parameters: parameters
    };
}