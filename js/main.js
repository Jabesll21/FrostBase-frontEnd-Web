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