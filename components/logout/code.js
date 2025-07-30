export function init(){
    console.log('Initializing logout...')
    logout()
}

function logout(){
    //clear credentials
    sessionStorage.removeItem('userData');
    window.location.href = 'index.html'
}