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
    showSideMenu(); //show side menu
    loadComponent('components\\trucks'); //show component at start
}

//toggle side menu
export function toggleSideMenu(){
    //togglevisibility
    sideMenuVisible = !sideMenuVisible;
    //is sideMenuVisible
    if (sideMenuVisible) {
        document.getElementById('side-menu').style.display = 'block';
        document.getElementById('content').style.width = 'calc(100% - 150px)'
    }
    else{
        document.getElementById('side-menu').style.display = 'none';
        document.getElementById('content').style.width = '100%'
    }
}

//load component
export function loadComponent(component){
    console.log(component);
    var url = component + '/index.html';
    var urlCode = '../' + component + '/code.js'
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