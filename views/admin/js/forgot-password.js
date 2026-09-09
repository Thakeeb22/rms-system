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
  forgotPasswordBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
  
  try {
    // ✅ FIX: Use apiRequest (or CONFIG.BASE_URL) so it hits the backend on Port 5000!
    // If apiRequest is not defined in your HTML, it will fallback to the explicit localhost:5000 URL.
    const baseUrl = (typeof apiRequest === 'function') ? null : (typeof CONFIG !== 'undefined' ? CONFIG.BASE_URL : "http://localhost:5000/api");
    
    let response;
    if (typeof apiRequest === 'function') {
      response = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error(response.data?.message || "Failed to process request.");
      }
      
      showMessage(response.data?.message || "If an account with that email exists, a reset link has been sent.", "success");
    } else {
      response = await fetch(`${baseUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to process request.");
      
      showMessage(data.message || "If an account with that email exists, a reset link has been sent.", "success");
    }
    
    forgotPasswordForm.reset();
    
  } catch (error) {
    console.error("Frontend Error:", error);
    showMessage(error.message || "An error occurred. Please try again.", "error");
  } finally {
    forgotPasswordBtn.disabled = false;
    forgotPasswordBtn.innerHTML = "Send Reset Link";
  }
});