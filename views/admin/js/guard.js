requireAuth()

function requireAdmin(){
    requireRole("admin")
}
function requireTeacher(){
    requireRole("teacher")
}
