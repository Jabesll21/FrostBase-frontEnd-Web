document.addEventListener('DOMContentLoaded', function() {
   
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });

    
    const timeOptions = document.querySelectorAll('.time-option');
    timeOptions.forEach(option => {
        option.addEventListener('click', function() {
            timeOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });

    const cardMenus = document.querySelectorAll('.card-menu');
    cardMenus.forEach(menu => {
        menu.addEventListener('click', function() {
            console.log('Card menu clicked');
        });
    });

    const sidebar = document.querySelector('.sidebar');
    const headerTitle = document.querySelector('.header h1');
    if (window.innerWidth <= 480) {
        headerTitle.addEventListener('click', function() {
            sidebar.classList.toggle('open');
        });
    }

    // Expansión y colapso de tarjetas del dashboard
    const cards = document.querySelectorAll('.dashboard-card');
    cards.forEach(card => {
        card.addEventListener('click', function (e) {
            // Evita que el click en el menú de la tarjeta (los tres puntos) expanda/colapse
            if (e.target.closest('.card-menu')) return;
            cards.forEach(c => c.classList.remove('expanded'));
            this.classList.add('expanded');
        });
    });
});
