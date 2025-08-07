import { getReadings, getTrucks, getParameters } from './services.js';

let allReadings = [];
let filteredReadings = [];
let trucks = [];
let parameters = null;
let currentFilters = {
    dateRange: 'today',
    startDate: null,
    endDate: null,
    truckId: 'all'
};

export function init() {
    console.log('Initializing enhanced monitoring component...');
    setupEventListeners();
    loadInitialData();
}

function setupEventListeners() {
    // Refresh button
    document.getElementById('refresh-button').addEventListener('click', () => {
        loadInitialData();
    });

    // Date range filter
    document.getElementById('date-range').addEventListener('change', (e) => {
        const customDates = document.getElementById('custom-dates');
        if (e.target.value === 'custom') {
            customDates.style.display = 'flex';
            customDates.style.gap = '15px';
            customDates.style.alignItems = 'end';
        } else {
            customDates.style.display = 'none';
        }
    });

    // Apply filters button
    document.getElementById('apply-filters').addEventListener('click', () => {
        applyFilters();
    });

    // Chart control buttons
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const chart = e.target.dataset.chart;
            const view = e.target.dataset.view;
            
            // Update active state
            const chartBtns = e.target.parentElement.querySelectorAll('.chart-btn');
            chartBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Update chart
            updateChart(chart, view);
        });
    });

    // Fleet chart control buttons
    document.querySelectorAll('.fleet-chart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.dataset.view;
            
            // Update active state
            const chartBtns = e.target.parentElement.querySelectorAll('.fleet-chart-btn');
            chartBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Update fleet chart
            updateFleetChart(view);
        });
    });

    // Search functionality
    document.getElementById('search-input').addEventListener('input', (e) => {
        filterTableData();
    });

    // Status filter
    document.getElementById('status-filter').addEventListener('change', () => {
        filterTableData();
    });
}

async function loadInitialData() {
    showLoading(true);
    
    try {
        // Load data in parallel
        const [readingsResponse, trucksResponse, parametersResponse] = await Promise.all([
            getReadings(),
            getTrucks(),
            getParameters()
        ]);

        // Process readings
        allReadings = readingsResponse.data || [];
        console.log('Loaded readings:', allReadings.length);

        // Process trucks
        trucks = trucksResponse.data || [];
        console.log('Loaded trucks:', trucks.length);

        // Process parameters
        parameters = parametersResponse.data?.[0] || getDefaultParameters();
        console.log('Loaded parameters:', parameters);

        // Populate truck filter
        populateTruckFilter();

        // Update fleet KPIs
        updateFleetKPIs();

        // Apply initial filters and update UI
        applyFilters();

    } catch (error) {
        console.error('Error loading initial data:', error);
        showError('Error loading monitoring data. Please try again.');
    } finally {
        showLoading(false);
    }
}

function updateFleetKPIs() {
    const total = trucks.length;
    const available = trucks.filter(truck => truck.state?.id === 'AV').length;
    const inUse = trucks.filter(truck => truck.state?.id === 'IR').length;
    const inMaintenance = trucks.filter(truck => truck.state?.id === 'IM').length;
    const outOfService = trucks.filter(truck => truck.state?.id === 'OS').length;

    // Update Fleet KPIs
    document.getElementById('fleet-total').textContent = total;
    document.getElementById('fleet-available').textContent = available;
    document.getElementById('fleet-in-use').textContent = inUse;
    document.getElementById('fleet-maintenance').textContent = inMaintenance;
    document.getElementById('fleet-out-service').textContent = outOfService;

    // Add visual indicators for critical states
    updateFleetKPIStyles(available, inUse, inMaintenance, outOfService, total);
    
    // Update fleet chart
    updateFleetChart('donut');
}

function updateFleetKPIStyles(available, inUse, inMaintenance, outOfService, total) {
    // Reset styles
    const cards = document.querySelectorAll('.fleet-kpi-card');
    cards.forEach(card => {
        card.classList.remove('critical', 'warning');
    });

    if (total === 0) return;

    // Apply warning/critical styles based on fleet status
    const totalActive = available + inUse;
    const totalProblematic = inMaintenance + outOfService;

    // Critical: More problematic trucks than active ones
    if (totalProblematic > totalActive) {
        document.querySelector('.fleet-kpi-card.maintenance').classList.add('critical');
        document.querySelector('.fleet-kpi-card.out-of-service').classList.add('critical');
    } else if (inMaintenance > total * 0.3) { // Warning: More than 30% in maintenance
        document.querySelector('.fleet-kpi-card.maintenance').classList.add('warning');
    }

    // Available trucks status
    if (available === 0) {
        document.querySelector('.fleet-kpi-card.available').classList.add('critical');
    } else if (available < total * 0.2) { // Warning: Less than 20% available
        document.querySelector('.fleet-kpi-card.available').classList.add('warning');
    }

    // Out of service status
    if (outOfService > total * 0.2) { // Warning: More than 20% out of service
        document.querySelector('.fleet-kpi-card.out-of-service').classList.add('warning');
    }
}

function populateTruckFilter() {
    const truckSelect = document.getElementById('truck-filter');
    truckSelect.innerHTML = '<option value="all">All Trucks</option>';
    
    trucks.forEach(truck => {
        const option = document.createElement('option');
        option.value = truck.id;
        option.textContent = `${truck.licensePlate} - ${truck.brand} ${truck.model}`;
        truckSelect.appendChild(option);
    });
}

function updateFleetChart(view) {
    const chartElement = document.getElementById('fleet-status-chart');
    
    if (trucks.length === 0) {
        chartElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #6b7280;">No fleet data available</div>';
        return;
    }

    const available = trucks.filter(truck => truck.state?.id === 'AV').length;
    const inUse = trucks.filter(truck => truck.state?.id === 'IR').length;
    const inMaintenance = trucks.filter(truck => truck.state?.id === 'IM').length;
    const outOfService = trucks.filter(truck => truck.state?.id === 'OS').length;

    switch (view) {
        case 'donut':
            renderFleetDonutChart(chartElement, available, inUse, inMaintenance, outOfService);
            break;
        case 'bar':
            renderFleetBarChart(chartElement, available, inUse, inMaintenance, outOfService);
            break;
    }
}

function renderFleetDonutChart(element, available, inUse, inMaintenance, outOfService) {
    const total = available + inUse + inMaintenance + outOfService;
    const data = [
        { label: 'Available', value: available, color: '#16a34a' },
        { label: 'In Use', value: inUse, color: '#dc2626' },
        { label: 'Maintenance', value: inMaintenance, color: '#d97706' },
        { label: 'Out of Service', value: outOfService, color: '#6b7280' }
    ].filter(item => item.value > 0);

    let cumulativePercentage = 0;
    const radius = 80;
    const innerRadius = 50;
    const centerX = 120;
    const centerY = 120;

    element.innerHTML = `
        <div style="height: 100%; display: flex; align-items: center; justify-content: space-between; padding: 20px;">
            <div style="position: relative;">
                <svg width="240" height="240" style="transform: rotate(-90deg);">
                    <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="#e5e7eb" stroke-width="60"/>
                    ${data.map(item => {
                        const percentage = item.value / total;
                        const strokeDasharray = 2 * Math.PI * radius;
                        const strokeDashoffset = strokeDasharray * (1 - percentage);
                        const rotation = cumulativePercentage * 360;
                        
                        const result = `
                            <circle cx="${centerX}" cy="${centerY}" r="${radius}" 
                                    fill="none" stroke="${item.color}" stroke-width="30"
                                    stroke-dasharray="${strokeDasharray}"
                                    stroke-dashoffset="${strokeDashoffset}"
                                    style="transform-origin: ${centerX}px ${centerY}px; transform: rotate(${rotation}deg);"
                                    opacity="0.9"/>
                        `;
                        
                        cumulativePercentage += percentage;
                        return result;
                    }).join('')}
                </svg>
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                    <div style="font-size: 32px; font-weight: bold; color: #000080;">${total}</div>
                    <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Total Trucks</div>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 15px; margin-left: 40px;">
                ${data.map(item => `
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 16px; height: 16px; border-radius: 50%; background: ${item.color};"></div>
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-size: 14px; font-weight: 600; color: #374151;">${item.label}</span>
                            <span style="font-size: 20px; font-weight: 700; color: ${item.color};">${item.value}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderFleetBarChart(element, available, inUse, inMaintenance, outOfService) {
    const data = [
        { label: 'Available', value: available, color: '#16a34a' },
        { label: 'In Use', value: inUse, color: '#dc2626' },
        { label: 'Maintenance', value: inMaintenance, color: '#d97706' },
        { label: 'Out of Service', value: outOfService, color: '#6b7280' }
    ];

    const maxValue = Math.max(...data.map(d => d.value));
    const maxHeight = 180;

    element.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column; padding: 20px;">
            <div style="flex: 1; display: flex; align-items: end; justify-content: space-around; gap: 20px; margin-bottom: 20px;">
                ${data.map(item => `
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 80px;">
                        <div style="font-size: 18px; font-weight: bold; color: ${item.color};">${item.value}</div>
                        <div style="
                            width: 60px; 
                            height: ${maxValue > 0 ? (item.value / maxValue) * maxHeight : 5}px; 
                            background: linear-gradient(to top, ${item.color}, ${item.color}88);
                            border-radius: 6px 6px 0 0;
                            transition: all 0.3s ease;
                            box-shadow: 0 2px 8px ${item.color}33;
                        "></div>
                        <div style="font-size: 12px; color: #6b7280; text-align: center; font-weight: 500;">${item.label}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function applyFilters() {
    // Get filter values
    currentFilters.dateRange = document.getElementById('date-range').value;
    currentFilters.truckId = document.getElementById('truck-filter').value;

    if (currentFilters.dateRange === 'custom') {
        currentFilters.startDate = document.getElementById('start-date').value;
        currentFilters.endDate = document.getElementById('end-date').value;
    }

    // Filter readings
    filteredReadings = filterReadings(allReadings);
    
    // Update all components
    updateKPIs();
    updateCharts();
    updateTable();
}

function filterReadings(readings) {
    let filtered = [...readings];

    // Date filter
    const now = new Date();
    let startDate, endDate;

    switch (currentFilters.dateRange) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            break;
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            endDate = now;
            break;
        case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            endDate = now;
            break;
        case 'custom':
            if (currentFilters.startDate && currentFilters.endDate) {
                startDate = new Date(currentFilters.startDate);
                endDate = new Date(currentFilters.endDate);
                endDate.setDate(endDate.getDate() + 1); // Include end date
            }
            break;
    }

    if (startDate && endDate) {
        filtered = filtered.filter(reading => {
            const readingDate = new Date(reading.date);
            return readingDate >= startDate && readingDate < endDate;
        });
    }

    // Truck filter
    if (currentFilters.truckId !== 'all') {
        filtered = filtered.filter(reading => {
            // Check both possible truck ID fields
            return reading.idTruck === currentFilters.truckId || 
                   reading.truck?.id === currentFilters.truckId;
        });
    }

    return filtered;
}

function updateKPIs() {
    if (filteredReadings.length === 0) {
        // No data available
        document.getElementById('temp-avg').textContent = '--°C';
        document.getElementById('humidity-avg').textContent = '--%';
        document.getElementById('temp-in-range').textContent = '0';
        document.getElementById('temp-out-range').textContent = '0';
        document.getElementById('humidity-in-range').textContent = '0';
        document.getElementById('humidity-out-range').textContent = '0';
        document.getElementById('active-alerts').textContent = '0';
        document.getElementById('temp-alerts').textContent = '0';
        document.getElementById('humidity-alerts').textContent = '0';
        return;
    }

    // Calculate temperature statistics
    const temperatures = filteredReadings.map(r => r.temp || r.temperature).filter(t => t != null);
    const tempAvg = temperatures.length > 0 ? (temperatures.reduce((a, b) => a + b, 0) / temperatures.length).toFixed(1) : 0;
    
    const tempInRange = temperatures.filter(t => 
        t >= parameters.min_temperature && t <= parameters.max_temperature
    ).length;
    const tempOutRange = temperatures.length - tempInRange;

    // Calculate humidity statistics
    const humidities = filteredReadings.map(r => r.percHumidity || r.humidity).filter(h => h != null);
    const humidityAvg = humidities.length > 0 ? (humidities.reduce((a, b) => a + b, 0) / humidities.length).toFixed(1) : 0;
    
    const humidityInRange = humidities.filter(h => 
        h >= parameters.min_humidity && h <= parameters.max_humidity
    ).length;
    const humidityOutRange = humidities.length - humidityInRange;

    // Calculate alerts
    const tempAlerts = temperatures.filter(t => 
        t < parameters.min_temperature || t > parameters.max_temperature
    ).length;
    const humidityAlerts = humidities.filter(h => 
        h < parameters.min_humidity || h > parameters.max_humidity
    ).length;

    // Update KPIs
    document.getElementById('temp-avg').textContent = `${tempAvg}°C`;
    document.getElementById('humidity-avg').textContent = `${humidityAvg}%`;
    document.getElementById('temp-in-range').textContent = tempInRange;
    document.getElementById('temp-out-range').textContent = tempOutRange;
    document.getElementById('humidity-in-range').textContent = humidityInRange;
    document.getElementById('humidity-out-range').textContent = humidityOutRange;
    document.getElementById('active-alerts').textContent = tempAlerts + humidityAlerts;
    document.getElementById('temp-alerts').textContent = tempAlerts;
    document.getElementById('humidity-alerts').textContent = humidityAlerts;
}

function updateCharts() {
    updateChart('temp', 'trend');
    updateChart('humidity', 'trend');
}

function updateChart(type, view) {
    const chartId = `${type === 'temp' ? 'temperature' : 'humidity'}-chart`;
    const chartElement = document.getElementById(chartId);
    
    if (filteredReadings.length === 0) {
        chartElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #6b7280;">No data available for selected filters</div>';
        return;
    }

    switch (view) {
        case 'trend':
            renderTrendChart(chartElement, type);
            break;
        case 'distribution':
            renderDistributionChart(chartElement, type);
            break;
        case 'alerts':
            renderAlertsChart(chartElement, type);
            break;
    }
}

function renderTrendChart(element, type) {
    const field = type === 'temp' ? 'temp' : 'percHumidity';
    const unit = type === 'temp' ? '°C' : '%';
    
    // Group data by hour for better visualization
    const hourlyData = groupDataByHour(filteredReadings, field);
    
    // Simple chart representation
    element.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px; color: #6b7280;">
                <span>Min: ${Math.min(...hourlyData.map(d => d.value)).toFixed(1)}${unit}</span>
                <span>Max: ${Math.max(...hourlyData.map(d => d.value)).toFixed(1)}${unit}</span>
                <span>Avg: ${(hourlyData.reduce((a, b) => a + b.value, 0) / hourlyData.length).toFixed(1)}${unit}</span>
            </div>
            <div style="flex: 1; display: flex; align-items: end; gap: 2px; padding: 10px 0;">
                ${hourlyData.map(d => `
                    <div style="
                        flex: 1; 
                        height: ${(d.value / Math.max(...hourlyData.map(x => x.value))) * 200}px; 
                        background: ${getStatusColor(d.value, type)};
                        border-radius: 2px;
                        position: relative;
                        min-height: 5px;
                    " title="${d.hour}: ${d.value.toFixed(1)}${unit}"></div>
                `).join('')}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; color: #9ca3af; margin-top: 5px;">
                <span>${hourlyData[0]?.hour || ''}</span>
                <span>${hourlyData[Math.floor(hourlyData.length/2)]?.hour || ''}</span>
                <span>${hourlyData[hourlyData.length-1]?.hour || ''}</span>
            </div>
        </div>
    `;
}

function renderDistributionChart(element, type) {
    const field = type === 'temp' ? 'temp' : 'percHumidity';
    const unit = type === 'temp' ? '°C' : '%';
    
    const values = filteredReadings.map(r => r[field]).filter(v => v != null);
    const distribution = calculateDistribution(values);
    
    element.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column;">
            <div style="text-align: center; margin-bottom: 15px; font-size: 14px; color: #374151;">
                Distribution of ${type === 'temp' ? 'Temperature' : 'Humidity'} Values
            </div>
            <div style="flex: 1; display: flex; align-items: end; gap: 3px; padding: 10px;">
                ${distribution.map(d => `
                    <div style="
                        flex: 1; 
                        height: ${(d.count / Math.max(...distribution.map(x => x.count))) * 180}px; 
                        background: ${type === 'temp' ? '#ff6b6b' : '#4ecdc4'};
                        border-radius: 3px;
                        position: relative;
                        min-height: 5px;
                    " title="${d.range}: ${d.count} readings"></div>
                `).join('')}
            </div>
            <div style="font-size: 10px; color: #9ca3af; text-align: center; margin-top: 5px;">
                Range distribution (${unit})
            </div>
        </div>
    `;
}

function renderAlertsChart(element, type) {
    const field = type === 'temp' ? 'temp' : 'percHumidity';
    const minValue = type === 'temp' ? parameters.min_temperature : parameters.min_humidity;
    const maxValue = type === 'temp' ? parameters.max_temperature : parameters.max_humidity;
    
    const values = filteredReadings.map(r => r[field]).filter(v => v != null);
    const alerts = values.filter(v => v < minValue || v > maxValue);
    const normal = values.filter(v => v >= minValue && v <= maxValue);
    
    const alertPercentage = values.length > 0 ? (alerts.length / values.length * 100).toFixed(1) : 0;
    
    element.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <div style="position: relative; width: 150px; height: 150px;">
                <svg width="150" height="150" style="transform: rotate(-90deg);">
                    <circle cx="75" cy="75" r="60" fill="none" stroke="#e5e7eb" stroke-width="8"/>
                    <circle cx="75" cy="75" r="60" fill="none" stroke="${alerts.length > 0 ? '#dc2626' : '#16a34a'}" 
                            stroke-width="8" stroke-dasharray="${2 * Math.PI * 60}" 
                            stroke-dashoffset="${2 * Math.PI * 60 * (1 - alerts.length / values.length)}"
                            style="transition: stroke-dashoffset 0.5s ease;"/>
                </svg>
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: ${alerts.length > 0 ? '#dc2626' : '#16a34a'};">
                        ${alertPercentage}%
                    </div>
                    <div style="font-size: 10px; color: #6b7280;">Out of Range</div>
                </div>
            </div>
            <div style="margin-top: 20px; text-align: center;">
                <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">Status Summary</div>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <div style="text-align: center;">
                        <div style="font-size: 16px; font-weight: bold; color: #16a34a;">${normal.length}</div>
                        <div style="font-size: 10px; color: #6b7280;">Normal</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 16px; font-weight: bold; color: #dc2626;">${alerts.length}</div>
                        <div style="font-size: 10px; color: #6b7280;">Alerts</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function updateTable() {
    const tbody = document.getElementById('readings-tbody');
    
    if (filteredReadings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;">
                    No readings found for the selected filters
                </td>
            </tr>
        `;
        return;
    }

    // Sort by date (newest first)
    const sortedReadings = [...filteredReadings].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Limit to first 100 for performance
    const limitedReadings = sortedReadings.slice(0, 100);
    
    tbody.innerHTML = limitedReadings.map(reading => {
        // Fix truck data access - check both possible structures
        const truck = trucks.find(t => t.id === reading.idTruck) || 
                     trucks.find(t => t.id === reading.truck?.id) || 
                     reading.truck;
        
        const temp = reading.temp || reading.temperature;
        const humidity = reading.percHumidity || reading.humidity;
        const tempStatus = getReadingStatus(temp, 'temp');
        const humidityStatus = getReadingStatus(humidity, 'humidity');
        const overallStatus = tempStatus === 'critical' || humidityStatus === 'critical' ? 'critical' :
                            tempStatus === 'warning' || humidityStatus === 'warning' ? 'warning' : 'normal';
        
        // Fix location access
        const latitude = reading.latitude || reading.location?.latitude;
        const longitude = reading.longitude || reading.location?.longitude;
        
        return `
            <tr>
                <td>${formatDateTime(reading.date)}</td>
                <td>${truck?.licensePlate || 'Unknown'}</td>
                <td>
                    <span style="color: ${getStatusColor(temp, 'temp')}; font-weight: 500;">
                        ${temp?.toFixed(1) || 'N/A'}°C
                    </span>
                </td>
                <td>
                    <span style="color: ${getStatusColor(humidity, 'humidity')}; font-weight: 500;">
                        ${humidity?.toFixed(1) || 'N/A'}%
                    </span>
                </td>
                <td>
                    <span class="status-badge ${overallStatus}">${overallStatus}</span>
                </td>
                <td>${formatLocation(latitude, longitude)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn btn-view" onclick="viewReadingDetails('${reading.id}')">View</button>
                        ${overallStatus !== 'normal' ? `<button class="action-btn btn-alert" onclick="createAlert('${reading.id}')">Alert</button>` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterTableData() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    
    const tbody = document.getElementById('readings-tbody');
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 7) return; // Skip empty state row
        
        const truckText = cells[1].textContent.toLowerCase();
        const statusText = cells[4].textContent.toLowerCase();
        
        const matchesSearch = truckText.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || statusText === statusFilter;
        
        row.style.display = matchesSearch && matchesStatus ? '' : 'none';
    });
}

// Helper functions
function groupDataByHour(readings, field) {
    const grouped = {};
    
    readings.forEach(reading => {
        const date = new Date(reading.date);
        const hour = date.getHours();
        const key = `${hour.toString().padStart(2, '0')}:00`;
        
        if (!grouped[key]) {
            grouped[key] = { values: [], hour: key };
        }
        
        const value = reading[field];
        if (value != null) {
            grouped[key].values.push(value);
        }
    });
    
    // Calculate average for each hour
    return Object.values(grouped).map(group => ({
        hour: group.hour,
        value: group.values.reduce((a, b) => a + b, 0) / group.values.length
    })).sort((a, b) => a.hour.localeCompare(b.hour));
}

function calculateDistribution(values) {
    if (values.length === 0) return [];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const buckets = 10;
    const bucketSize = range / buckets;
    
    const distribution = [];
    for (let i = 0; i < buckets; i++) {
        const start = min + (i * bucketSize);
        const end = min + ((i + 1) * bucketSize);
        const count = values.filter(v => v >= start && (i === buckets - 1 ? v <= end : v < end)).length;
        
        distribution.push({
            range: `${start.toFixed(1)}-${end.toFixed(1)}`,
            count
        });
    }
    
    return distribution;
}

function getReadingStatus(value, type) {
    if (value == null) return 'normal';
    
    const minValue = type === 'temp' ? parameters.min_temperature : parameters.min_humidity;
    const maxValue = type === 'temp' ? parameters.max_temperature : parameters.max_humidity;
    
    if (value < minValue || value > maxValue) {
        // Check if it's severely out of range
        const tempRange = maxValue - minValue;
        const tolerance = tempRange * 0.1; // 10% tolerance
        
        if (value < minValue - tolerance || value > maxValue + tolerance) {
            return 'critical';
        }
        return 'warning';
    }
    
    return 'normal';
}

function getStatusColor(value, type) {
    const status = getReadingStatus(value, type);
    switch (status) {
        case 'critical': return '#dc2626';
        case 'warning': return '#d97706';
        default: return '#16a34a';
    }
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatLocation(lat, lng) {
    if (!lat || !lng) return 'N/A';
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function getDefaultParameters() {
    return {
        min_temperature: -5,
        max_temperature: 5,
        min_humidity: 70,
        max_humidity: 85
    };
}

function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    overlay.style.display = show ? 'flex' : 'none';
}

function showError(message) {
    alert(message); // Replace with proper toast notification
}

// Global functions for table actions
window.viewReadingDetails = function(readingId) {
    const reading = allReadings.find(r => r.id === readingId);
    if (reading) {
        // Fix truck data access
        const truck = trucks.find(t => t.id === reading.idTruck) || 
                     trucks.find(t => t.id === reading.truck?.id) || 
                     reading.truck;
        
        const temp = reading.temp || reading.temperature;
        const humidity = reading.percHumidity || reading.humidity;
        
        // Fix location access
        const latitude = reading.latitude || reading.location?.latitude;
        const longitude = reading.longitude || reading.location?.longitude;
        
        alert(`Reading Details:\n\nTruck: ${truck?.licensePlate || 'Unknown'}\nTimestamp: ${formatDateTime(reading.date)}\nTemperature: ${temp?.toFixed(1) || 'N/A'}°C\nHumidity: ${humidity?.toFixed(1) || 'N/A'}%\nLocation: ${formatLocation(latitude, longitude)}\nDoor State: ${reading.doorState || reading.door_state ? 'Open' : 'Closed'}`);
    }
};

window.createAlert = function(readingId) {
    const reading = allReadings.find(r => r.id === readingId);
    if (reading) {
        // This would typically open a modal or navigate to alert creation
        alert(`Creating alert for reading at ${formatDateTime(reading.date)}`);
    }
};