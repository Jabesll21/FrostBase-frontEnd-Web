//load side menu 

async function loadSideMenu() {
    //load json file
    return await fetch ('json/menu.json')
    .then((response) => { return response.json();} )
    .catch((error) => {console.error(error);});
    
}

//show side menu

export function showSideMenu(){
    //parent div 
    var sideMenu = document.getElementById('side-menu');
    sideMenu.innerHTML = '';//empty div 
    //load json 
    loadSideMenu().then((response) => {
        response.option.array.forEach(option => {
            sideMenu.aooendChild(drawOption(option));
        });
    });

}

//draw menu option 
function drawOption(menuOption) {
    console.log(option);
    var divOption =document.createElement('div');
    divOption.id = 'side-menu-option-' + Option.id;
    divOption.className = 'side-menu-option';
    divOption.addEventListener('click', () => {loadComponent(option.component)});
    //icon
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
    divLabel.innerHTML = option.label;
    divOption.appendChild(divLabel);
   return divOption;
}

//load component 
function loadComponents (component){
    console.log(component);
    var url = component + '/index.html';
    fetch(url)
        .then( (response) => {return response.text();})
        .then((html)=> {document.getElementById('content').innerHTML= html;})
        .catch((error)=>{console.error('Invalid HTML file')})


}