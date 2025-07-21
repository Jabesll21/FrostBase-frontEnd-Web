const trucks = [
    {
        id: 1,
        brand: "Volvo",
        model: "FH",
        status: "In use",
        licensePlate: "ABC-123-D",
        photo: ""
    },
    {
        id: 2,
        brand: "Volvo",
        model: "BE",
        status: "In use",
        licensePlate: "EFG-456-H",
        photo: ""
    },
    {
        id: 3,
        brand: "Mercedes",
        model: "Sprinter Van",
        status: "Available",
        licensePlate: "IJK-789-L",
        photo: ""
    },
    {
        id: 4,
        brand: "Volvo",
        model: "BE",
        status: "In use",
        licensePlate: "MNO-123-P",
        photo: ""
    },
    {
        id: 5,
        brand: "Volvo",
        model: "BE",
        status: "In use",
        licensePlate: "QRS-456-T",
        photo: ""
    },
    {
        id: 6,
        brand: "Volvo",
        model: "BE",
        status: "Available",
        licensePlate: "UVW-789-X",
        photo: ""
    },
     {
        id: 1,
        brand: "Volvo",
        model: "FH",
        status: "In use",
        licensePlate: "ABC-123-D",
        photo: ""
    },
    {
        id: 2,
        brand: "Volvo",
        model: "BE",
        status: "In use",
        licensePlate: "EFG-456-H",
        photo: ""
    },
    {
        id: 3,
        brand: "Mercedes",
        model: "Sprinter Van",
        status: "Available",
        licensePlate: "IJK-789-L",
        photo: ""
    },
     {
        id: 1,
        brand: "Volvo",
        model: "FH",
        status: "In use",
        licensePlate: "ABC-123-D",
        photo: ""
    },
    {
        id: 2,
        brand: "Volvo",
        model: "BE",
        status: "In use",
        licensePlate: "EFG-456-H",
        photo: ""
    },
    {
        id: 3,
        brand: "Mercedes",
        model: "Sprinter Van",
        status: "Available",
        licensePlate: "IJK-789-L",
        photo: ""
    },
     {
        id: 1,
        brand: "Volvo",
        model: "FH",
        status: "In use",
        licensePlate: "ABC-123-D",
        photo: ""
    },
    {
        id: 2,
        brand: "Volvo",
        model: "BE",
        status: "In use",
        licensePlate: "EFG-456-H",
        photo: ""
    },
    {
        id: 3,
        brand: "Mercedes",
        model: "Sprinter Van",
        status: "Available",
        licensePlate: "IJK-789-L",
        photo:  ""
    },
];

let filteredTrucks = [...trucks];
let currentFilter = 'all';



export function init() {
    console.log('Initializing trucks interface...');
    updateStats();
    renderTrucks(filteredTrucks);
    setupEventListeners();
}

function updateStats() {
    const total = trucks.length;
    const inUse = trucks.filter(truck => truck.status.toLowerCase().replace(' ', '-') === 'in-use').length;
    const available = trucks.filter(truck => truck.status.toLowerCase() === 'available').length;

    document.getElementById('total-trucks').textContent = total;
    document.getElementById('in-use-trucks').textContent = inUse;
    document.getElementById('available-trucks').textContent = available;
}

function renderTrucks(trucksArray) {
    const grid = document.getElementById('trucks-grid');
    const emptyState = document.getElementById('empty-state');
    
    grid.innerHTML = '';

    if (trucksArray.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    trucksArray.forEach(truck => {
        const card = document.createElement('div');
        card.className = "truck-card";
        
        const statusClass = truck.status.toLowerCase().replace(' ', '-');
        
        card.innerHTML = `
            <div class="truck-header">
                <div class="license-plate">${truck.licensePlate}</div>
                <div class="truck-model">${truck.brand} ${truck.model}</div>
            </div>
            <div class="truck-image">
                <img src="${truck.photo}" alt="${truck.brand} ${truck.model}">
            </div>
            <div class="truck-status">
                <span class="status-badge ${statusClass}">${truck.status}</span>
            </div>
            <div class="truck-actions">
                <button class="action-btn btn-edit" onclick="editTruck(${truck.id})">Edit</button>
                <button class="action-btn btn-delete" onclick="deleteTruck(${truck.id})">Delete</button>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filteredTrucks = trucks.filter(truck => 
            truck.licensePlate.toLowerCase().includes(searchTerm) ||
            truck.brand.toLowerCase().includes(searchTerm) ||
            truck.model.toLowerCase().includes(searchTerm)
        );
        applyFilter();
    });

    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            applyFilter();
        });
    });

    document.getElementById('add-button').addEventListener('click', () => {
    loadComponent('components/trucks/register'); 
});
    
}

function applyFilter() {
    let filtered = [...filteredTrucks];
    
    if (currentFilter !== 'all') {
        filtered = filtered.filter(truck => 
            truck.status.toLowerCase().replace(' ', '-') === currentFilter
        );
    }
    
    renderTrucks(filtered);
}

window.editTruck = function(id) {
    alert(`Edit truck ID: ${id}`);
}

window.deleteTruck = function(id) {
    if (confirm('Are you sure you want to delete this truck?')) {
        alert(`Delete truck ID: ${id}`);
    }
}




//load component
export function loadComponent(component){
    console.log(component);
    var url = component + '/index.html';
    var urlCode = '../../' + component + '/code.js'
    fetch(url)
        .then((response) => { return response.text(); })
        .then( (html) => { loadHtml(html) } )
        .then( () => { importModule(urlCode) })
        .catch( (error) => {console.error('Invalid HTML file'); })
}

//loading html
async function loadHtml(html) {
    console.log('Loading HTML...')
    document.getElementById('content').innerHTML = html
}

//import module
async function importModule(moduleUrl) {
    console.log('Importing Module ' + moduleUrl)
    let { init } = await import(moduleUrl)
    init()
}