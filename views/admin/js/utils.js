function showMessage(elementId, message, type = "error") {
  const element = document.getElementById(elementId);

  if (!element) return;

  element.textContent = message;
  element.classList.remove("hidden");

  if (type === "error") {
    element.classList.remove("text-green-600");
    element.classList.add("text-red-600");
  } else {
    element.classList.remove("text-red-600");
    element.classList.add("text-green-600");
  }
}

function hideMessage(elementId) {
  const element = document.getElementById(elementId);

  if (!element) return;

  element.classList.add("hidden");
}

function setButtonLoading(button, loading, text = "Loading...") {
  if (!button) return;

  if (loading) {
    button.disabled = true;
    button.dataset.originalHTML = button.innerHTML;

    button.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin mr-2"></i>
      ${text}
    `;
  } else {
    button.disabled = false;

    if (button.dataset.originalHTML) {
      button.innerHTML = button.dataset.originalHTML;
      delete button.dataset.originalHTML;
    }
  }
}
function setupLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");

  // Desktop logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logout();
    });
  }

  // Mobile logout
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener("click", () => {
      logout();
    });
  }
}
function setupMobileMenu() {
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  const closeMobileMenu = document.getElementById("closeMobileMenu");
  const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");

  if (!mobileMenuBtn || !mobileMenu) return;

  function openMobileMenu() {
    mobileMenu.classList.remove("hidden");
    mobileMenuBtn.setAttribute("aria-expanded", "true");
  }

  function closeMobileNavigation() {
    mobileMenu.classList.add("hidden");
    mobileMenuBtn.setAttribute("aria-expanded", "false");
  }

  mobileMenuBtn.addEventListener("click", openMobileMenu);

  if (closeMobileMenu) {
    closeMobileMenu.addEventListener("click", closeMobileNavigation);
  }

  if (mobileMenuOverlay) {
    mobileMenuOverlay.addEventListener("click", closeMobileNavigation);
  }
}
/**
 * Fetches the current session and updates the UI element.
 * Call this function on any page that needs to display the current session.
 */
async function loadCurrentSessionDisplay() {
  // Change "currentSession" to whatever ID you used in your HTML if it's different
  const sessionDisplay = document.getElementById("currentSession");

  if (!sessionDisplay) return;

  try {
    const response = await apiRequest("/admin/sessions");

    if (response.ok && response.data?.sessions) {
      const currentSession = response.data.sessions.find((s) => s.isCurrent);
      sessionDisplay.textContent = currentSession
        ? currentSession.sessionName
        : "Not Set";
    } else {
      sessionDisplay.textContent = "Not Set";
    }
  } catch (error) {
    console.error("Failed to load current session:", error);
    sessionDisplay.textContent = "Not Set";
  }
}
/**
 * Fetches the current term and updates the UI element.
 * Call this function on any page that needs to display the current term.
 */
async function loadCurrentTermDisplay() {
  const termDisplay = document.getElementById("currentTerm");

  if (!termDisplay) return;

  try {
    const response = await apiRequest("/admin/terms");

    if (response.ok && response.data?.terms) {
      const currentTerm = response.data.terms.find((t) => t.isCurrent);
      termDisplay.textContent = currentTerm ? currentTerm.termName : "Not Set";
    } else {
      termDisplay.textContent = "Not Set";
    }
  } catch (error) {
    console.error("Failed to load current term:", error);
    termDisplay.textContent = "Not Set";
  }
}
