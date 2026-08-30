// Check if user is authenticated
const user = getUser();
if (!user) {
  window.location.href = "login.html";
}

const changePasswordForm = document.getElementById("changePasswordForm");
const changePasswordBtn = document.getElementById("changePasswordBtn");
const changePasswordError = document.getElementById("changePasswordError");
const changePasswordSuccess = document.getElementById("changePasswordSuccess");

// Password toggle functionality
document.querySelectorAll(".toggle-password").forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.getAttribute("data-target");
    const input = document.getElementById(targetId);
    const icon = button.querySelector("i");

    if (input.type === "password") {
      input.type = "text";
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      input.type = "password";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  });
});

// Form submission
changePasswordForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Hide messages
  changePasswordError.classList.add("hidden");
  changePasswordSuccess.classList.add("hidden");

  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    changePasswordError.textContent = "All fields are required.";
    changePasswordError.classList.remove("hidden");
    return;
  }

  if (newPassword.length < 6) {
    changePasswordError.textContent = "New password must be at least 6 characters long.";
    changePasswordError.classList.remove("hidden");
    return;
  }

  if (newPassword !== confirmPassword) {
    changePasswordError.textContent = "New passwords do not match.";
    changePasswordError.classList.remove("hidden");
    return;
  }

  if (currentPassword === newPassword) {
    changePasswordError.textContent = "New password must be different from current password.";
    changePasswordError.classList.remove("hidden");
    return;
  }

  // Disable button and show loading
  changePasswordBtn.disabled = true;
  changePasswordBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Changing Password...';

  try {
    const response = await apiRequest("/admin/change-password", {
      method: "PATCH",
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to change password.");
    }

    // Show success message
    changePasswordSuccess.textContent = response.data?.message || "Password changed successfully! Redirecting...";
    changePasswordSuccess.classList.remove("hidden");

    // Clear form
    changePasswordForm.reset();

    // Redirect after 2 seconds
    setTimeout(() => {
      // Clear auth data since password changed
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      // Redirect to login
      window.location.href = "login.html";
    }, 2000);
  } catch (error) {
    console.error("Change password error:", error);
    changePasswordError.textContent = error.message || "Failed to change password. Please try again.";
    changePasswordError.classList.remove("hidden");

    // Re-enable button
    changePasswordBtn.disabled = false;
    changePasswordBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Change Password';
  }
});