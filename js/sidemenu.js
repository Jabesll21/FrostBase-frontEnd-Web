//load side menu
async function loadSideMenu(){
    //load json file
    return await fetch('json/menu.json')
    .then( (response) => { return response.json(); })
    .catch( (error) => { console.error(error); });
}
//show side menu
export function showSideMenu(){
    //parent div
    var sideMenu = document.getElementById('side-menu');
    sideMenu.innerHTML = ''; //empty div
    //load json
    loadSideMenu().then( (response) => {
        response.options.forEach(option => {
            sideMenu.appendChild(drawOption(option));
        });
    });
}
//draw menu option
function drawOption(option){
    console.log(option);
    //Option
    var divOption = document.createElement('div');
    divOption.id = 'side-menu-option-' + option.id;
    divOption.className = 'side-menu-option';
    divOption.addEventListener('click', () => { loadComponent(option.component) })
    //Icon
    var divIcon = document.createElement('div');
    divIcon.className = 'side-menu-icon';
    divIcon.style.background = option.color;
    divOption.appendChild(divIcon);
    var icon = document.createElement('i');
    icon.className = 'fas fa-' + option.icon;
    divIcon.appendChild(icon);
    //label
    var divLabel = document.createElement('div');
    divLabel.className = 'side-menu-label';
    divLabel.textContent = option.text;
    divOption.appendChild(divLabel);
   return divOption;
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