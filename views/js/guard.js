requiresAuth()

const currentUser = getUser()
if(!currentUser){
    logout()
}

function requireAdmin(){
    requireRole("admin")
}
function requireTeacher(){
    requireRole("teacher")
}
