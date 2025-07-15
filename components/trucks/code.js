export function init(){
    console.log('Initializing home...')
    printTrucks(trucks)
}

function printTrucks(trucks){
    const list = document.getElementById('truck-list');
    list.innerHTML = '';

    trucks.forEach(truck => {
        const card = document.createElement('div');
        card.className = "card"
        const license = document.createElement('label');
        license.textContent = truck.licensePlate
        const model = document.createElement('label');
        model.textContent = truck.brand + " " +truck.model
        const img = document.createElement('img');
        img.src = 'photos/' + truck.photo
        const status = document.createElement('label');
        status.textContent = truck.status
           
        card.appendChild(license)
        card.appendChild(model)
        card.appendChild(img)
        card.appendChild(status)
        
        list.appendChild(card);
    });
}

const trucks = [
    {
        id: 1,
        brand: "Volvo",
        model: "FH",
        status: "In use",
        licensePlate: "ABC-123-D",
        photo: "volvo-fh.png"
    },
    {
        id: 2,
        brand: "Volvo",
        model: "BE",
        status: "In use",
        licensePlate: "EFG-456-H",
        photo: "volvo-be.png"
    },
    {
        id: 3,
        brand: "Mercedes",
        model: "Sprinter Van",
        status: "Available",
        licensePlate: "IJK-789-L",
        photo: "mercedes-van.png"
    },
    {
        id: 4,
        brand: "Volvo",
        model: "BE",
        status: "In use",
        licensePlate: "MNO-123-P",
        photo: "volvo-be.png"
    },
    {
        id: 5,
        brand: "Volvo",
        model: "BE",
        status: "In use",
        licensePlate: "QRS-456-T",
        photo: "volvo-be.png"
    },
    {
        id: 6,
        brand: "Volvo",
        model: "BE",
        status: "Available",
        licensePlate: "UVW-789-X",
        photo: "volvo-be.png"
    },
];