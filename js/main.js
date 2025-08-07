//import
import { showSideMenu } from '../js/sidemenu.js';
//event
window.addEventListener('load', init);
//variables
var sideMenuVisible = false;
//initialize document
function init() {
    console.log('Initializing document...');
    //event
    document.getElementById('icon-side-menu').addEventListener('click', () => {
        toggleSideMenu();
    })
    toggleSideMenu()
    showSideMenu(); //show side menu
    loadComponent('components\\monitoring'); //show component at start
}
window.loadComponent = loadComponent;


//toggle side menu
export function toggleSideMenu(){
    //togglevisibility
    sideMenuVisible = !sideMenuVisible;
    //is sideMenuVisible
    if (sideMenuVisible) {
        document.getElementById('side-menu').classList.add('visible');
        document.body.classList.add('menu-visible');
    }
    else{
        document.getElementById('side-menu').classList.remove('visible');
        document.body.classList.remove('menu-visible');
    }
}
   
export function loadComponent(component) {
    console.log('Loading component:', component);
    var url = component + '/index.html';
    var urlCode = '../' + component + '/code.js';
    
    fetch(url)
        .then((response) => { return response.text(); })
        .then((html) => { loadHtml(html) })
        .then(() => { importModule(urlCode) })
        .catch((error) => { console.error('Invalid HTML file:', error); });
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

document.addEventListener('DOMContentLoaded', () => {
    const userData = sessionStorage.getItem('userData');
    if (!userData) {
        window.location.href = 'index.html';
    }
    // Opcional: Mostrar datos del usuario en la interfaz
    const user = JSON.parse(userData);
    console.log('Usuario logueado:', user);
});