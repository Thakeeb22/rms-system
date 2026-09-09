// Get token from URL query parameter
const urlParams = new URLSearchParams(window.location.search);
const resetToken = urlParams.get("token");

const resetPasswordForm = document.getElementById("resetPasswordForm");
const resetPasswordBtn = document.getElementById("resetPasswordBtn");
const messageBox = document.getElementById("resetPasswordMessage");

function showMessage(msg, type) {
  messageBox.textContent = msg;
  messageBox.className = `p-3 rounded-lg text-sm font-medium ${
    type === "error"
      ? "bg-red-50 text-red-700 border border-red-200"
      : "bg-green-50 text-green-700 border border-green-200"
  }`;
  messageBox.classList.remove("hidden");
}

// Check if token exists on page load
if (!resetToken) {
  showMessage(
    "Invalid or missing reset token. Please request a new link from the login page.",
    "error"
  );
  resetPasswordBtn.disabled = true;
}

resetPasswordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  messageBox.classList.add("hidden");

  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (newPassword.length < 8) {
    showMessage("Password must be at least 8 characters long.", "error");
    return;
  }

  if (newPassword !== confirmPassword) {
    showMessage("Passwords do not match.", "error");
    return;
  }

  resetPasswordBtn.disabled = true;
  resetPasswordBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Resetting...';

  try {
    const response = await apiRequest("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token: resetToken, newPassword }),
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to reset password.");
    }

    showMessage(
      response.data?.message || "Password reset successfully! Redirecting to login...",
      "success"
    );
    resetPasswordForm.reset();

    setTimeout(() => {
      window.location.href = "./login.html";
    }, 2000);
  } catch (error) {
    showMessage(error.message, "error");
    resetPasswordBtn.disabled = false;
    resetPasswordBtn.innerHTML = "Reset Password";
  }
});