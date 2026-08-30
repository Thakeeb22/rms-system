const user = getUser();
if (user) {
  if (user.role === "admin") {
    window.location.href = "admin/dashboard.html";
  }
  if (user.role === "teacher") {
    window.location.href = "teacher/dashboard.html";
  }
}
const togglePasswordBtn = document.getElementById("togglePasswordBtn");
const passwordInput = document.getElementById("password");
const togglePasswordIcon = document.getElementById("togglePasswordIcon");

if (togglePasswordBtn && passwordInput && togglePasswordIcon) {
  togglePasswordBtn.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";

    // Toggle the icon class
    togglePasswordIcon.classList.toggle("fa-eye");
    togglePasswordIcon.classList.toggle("fa-eye-slash");
  });
}
const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  hideMessage("loginError");

  setButtonLoading(loginBtn, true, "Signing In...");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const remember = document.getElementById("remember").checked;
  if (!email || !password) {
    showMessage("loginError", "Email and password are required.");
  }

  const response = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  setButtonLoading(loginBtn, false);

  if (!response.ok) {
    showMessage("loginError", response.data.message || "Login failed.");
    return;
  }

  saveAuth(response.data.user, response.data.token, remember);

  if (response.data.user.mustChangePassword) {
    window.location.href = "change-password.html";
    return;
  }

  if (response.data.user.role === "admin") {
    window.location.href = "admin/dashboard.html";
    return;
  }

  if (response.data.user.role === "teacher") {
    window.location.href = "teacher/dashboard.html";
    return;
  }

  showMessage("loginError", "Unknown user role.");
});
