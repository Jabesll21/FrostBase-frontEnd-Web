export function init(){
    console.log('Initializing home...')

    const drivers = [
        {
            id: 1,
            name: "Andres Cuevas",
            email: "cuevas@frost.com",
            route: "Otay",
            truck: "Mercedes",
            licensePlate: "ABC-123-D"
        },
        {
            id: 2,
            name: "Jabes Llamas",
            email: "llamas@frost.com",
            route: "El Refugio",
            truck: "Mercedes",
            licensePlate: "EFG-456-H"
        },
        {
            id: 3,
            name: "Neyzer Toledo",
            email: "toledo@frost.com",
            route: "Zona Río",
            truck: "Volvo",
            licensePlate: "IJK-789-L"
        },
        {
            id: 4,
            name: "Genesis Brito",
            email: "brito@frost.com",
            route: "Villa del Real",
            truck: "Volvo",
            licensePlate: "MNO-123-P"
        },
        {
            id: 5,
            name: "Daniel Diaz",
            email: "diaz@frost.com",
            route: "El Nido",
            truck: "Mercedes",
            licensePlate: "QRS-456-T"
        },
    ];

    printDrivers(drivers)

}

function printDrivers(drivers) {
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';

        drivers.forEach(driver => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${driver.id}</td>
                <td>${driver.name}</td>
                <td>${driver.email}</td>
                <td>${driver.route}</td>
                <td>${driver.truck}</td>
                <td>${driver.licensePlate}</td>
            `;
            
            tableBody.appendChild(row);
        });
    }