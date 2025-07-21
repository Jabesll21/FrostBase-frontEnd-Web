export function init(){
    console.log('Initializing logout...')
    logout()
}

function logout(){
    //clear credentials
    window.location.href = 'index.html'
}