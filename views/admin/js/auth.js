function saveAuth(user, token, remember = false) {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  
  const storage = remember ? localStorage : sessionStorage;

  storage.setItem("token", token);
  storage.setItem("user", JSON.stringify(user));
}
function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}
function getUser() {
  const user = localStorage.getItem("user") || sessionStorage.getItem("user");

  return user ? JSON.parse(user) : null;
}
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = "../login.html";
  }
}
function requireRole(role) {
  const user = getUser();
  if (!user || !isAuthenticated()) {
    logout();
    return
  }
  if (user.role !== role){
    logout()
    return
  }
}
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  window.location.href = "../login.html";
}
function isAuthenticated() {
  return !!getToken();
}
