const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
const messageBox = document.getElementById("forgotPasswordMessage");

function showMessage(msg, type) {
  messageBox.textContent = msg;
  messageBox.className = `p-3 rounded-lg text-sm font-medium ${
    type === "error"
      ? "bg-red-50 text-red-700 border border-red-200"
      : "bg-green-50 text-green-700 border border-green-200"
  }`;
  messageBox.classList.remove("hidden");
}

forgotPasswordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  messageBox.classList.add("hidden");

  const email = document.getElementById("email").value.trim();
  if (!email) {
    showMessage("Please enter your email address.", "error");
    return;
  }

  forgotPasswordBtn.disabled = true;
  forgotPasswordBtn.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

    try {
    const response = await apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to process request.");
    }

    // Show the generic success message
    showMessage(response.data?.message || "If an account with that email exists, a reset link has been generated.", "success");
    forgotPasswordForm.reset();

  } catch (error) {
    showMessage(error.message, "error");
    forgotPasswordBtn.disabled = false;
    forgotPasswordBtn.innerHTML = "Send Reset Link";
  }
});
