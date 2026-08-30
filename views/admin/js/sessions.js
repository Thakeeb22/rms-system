requireAdmin();
setupLogout();
setupMobileMenu();

let allSessions = [];
let filteredSessions = [];
let currentSessionId = null;

/* =========================================================
LOAD SESSIONS
========================================================= */
async function loadSessions() {
  // FIXED: Changed to "sessionContainer" to match HTML
  const sessionsContainer = document.getElementById("sessionContainer");
  const loadingElement = document.getElementById("sessionLoading");

  if (!sessionsContainer) return;

  if (loadingElement) {
    loadingElement.classList.remove("hidden");
  }

  try {
    const response = await apiRequest("/admin/sessions");

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to load sessions.");
    }

    allSessions = response.data?.sessions || [];
    filteredSessions = [...allSessions];

    // Find current session
    const currentSession = allSessions.find((session) => session.isCurrent);
    currentSessionId = currentSession ? currentSession._id : null;

    renderSessions();
    updateSessionCount();
    updateCurrentSessionDisplay();
  } catch (error) {
    console.error("Failed to load sessions:", error);
    sessionsContainer.innerHTML = `
      <div class="col-span-full py-12 text-center">
        <div class="text-red-500 text-3xl mb-3">
          <i class="fa-solid fa-circle-exclamation"></i>
        </div>
        <h3 class="font-bold text-lg text-gray-700">Unable to load sessions</h3>
        <p class="text-gray-500 mt-1">
          ${escapeHTML(error.message || "Something went wrong.")}
        </p>
        <button
          type="button"
          id="retryLoadSessionsBtn"
          class="mt-4 px-5 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
        >
          <i class="fa-solid fa-rotate-right mr-2"></i>
          Try Again
        </button>
      </div>
    `;
    document.getElementById("retryLoadSessionsBtn")?.addEventListener("click", loadSessions);
  } finally {
    if (loadingElement) {
      loadingElement.classList.add("hidden");
    }
  }
}

/* =========================================================
RENDER SESSIONS
========================================================= */
function renderSessions() {
  const sessionsContainer = document.getElementById("sessionContainer");
  if (!sessionsContainer) return;

  if (filteredSessions.length === 0) {
    sessionsContainer.innerHTML = `
      <div class="col-span-full py-12 text-center text-gray-500">
        <i class="fa-solid fa-calendar text-4xl mb-3 text-gray-300"></i>
        <h3 class="font-bold text-lg text-gray-700">No sessions found</h3>
        <p class="mt-1">There are no sessions to display.</p>
      </div>
    `;
    return;
  }

  // FIXED: Now renders cards instead of table rows
  sessionsContainer.innerHTML = filteredSessions.map((session) => createSessionCard(session)).join("");
}

/* =========================================================
CREATE SESSION CARD
========================================================= */
function createSessionCard(session) {
  const sessionId = session._id;
  const isCurrent = session.isCurrent;

  return `
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-5 hover:shadow-md transition flex flex-col justify-between">
      <div class="flex items-start justify-between gap-3 mb-4">
        <div>
          <p class="text-sm text-gray-500 font-medium">Session Name</p>
          <h2 class="text-2xl font-bold text-blue-500 mt-1">
            ${escapeHTML(session.sessionName || "N/A")}
          </h2>
        </div>
        <div class="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <i class="fa-solid fa-calendar text-blue-500"></i>
        </div>
      </div>

      <div class="mb-4">
        ${
          isCurrent
            ? `<span class="px-3 py-1 text-xs font-semibold bg-green-100 text-green-600 rounded-full">Current Session</span>`
            : `<span class="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">Inactive</span>`
        }
      </div>

      <div class="mt-4 pt-4 border-t flex justify-end gap-2">
        ${
          !isCurrent
            ? `
              <button
                type="button"
                class="set-current-btn px-4 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition text-sm"
                data-id="${sessionId}"
                data-name="${escapeHTML(session.sessionName)}"
              >
                <i class="fa-solid fa-check mr-1"></i>
                Set Current
              </button>
            `
            : ""
        }
        <button
          type="button"
          class="delete-session-btn px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition text-sm"
          data-id="${sessionId}"
          data-name="${escapeHTML(session.sessionName)}"
          ${isCurrent ? "disabled title='Cannot delete current session'" : ""}
        >
          <i class="fa-solid fa-trash mr-1"></i>
          Delete
        </button>
        <button
          type="button"
          class="edit-session-btn px-4 py-2 rounded-lg bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition text-sm"
          data-id="${sessionId}"
        >
          <i class="fa-solid fa-pen mr-1"></i>
          Edit
        </button>
      </div>
    </div>
  `;
}

/* =========================================================
CREATE SESSION
========================================================= */
async function createSession() {
  const form = document.getElementById("addNewSessionForm");
  const sessionNameInput = document.getElementById("sessionName");
  const createButton = document.getElementById("createSessionBtn");

  if (!form || !sessionNameInput) return;

  const sessionName = sessionNameInput.value.trim();
  hideMessage("sessionFormMessage");

  if (!sessionName) {
    showMessage("sessionFormMessage", "Session name is required.", "error");
    sessionNameInput.focus();
    return;
  }

  try {
    setButtonLoading(createButton, true, "Creating session...");

    const response = await apiRequest("/admin/sessions", {
      method: "POST",
      body: JSON.stringify({ sessionName }),
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to create session.");
    }

    showMessage("sessionFormMessage", response.data?.message || "Session created successfully.", "success");
    form.reset();

    const createdBox = document.getElementById("sessionCreatedBox");
    if (createdBox) {
      createdBox.classList.remove("hidden");
    }

    await loadSessions();

    setTimeout(() => {
      closeAddSessionForm();
    }, 1000);
  } catch (error) {
    console.error("Failed to create session:", error);
    showMessage("sessionFormMessage", error.message || "Failed to create session.", "error");
  } finally {
    setButtonLoading(createButton, false);
  }
}

/* =========================================================
EDIT SESSION
========================================================= */
async function openEditSessionModal(sessionId) {
  const modal = document.getElementById("editSessionModal");
  const loading = document.getElementById("editSessionLoading");
  const errorBox = document.getElementById("editSessionError");
  const form = document.getElementById("editSessionForm");
  const sessionNameInput = document.getElementById("editSessionName");

  if (!modal || !loading || !errorBox || !form || !sessionNameInput) return;

  errorBox.classList.add("hidden");
  errorBox.textContent = "";
  form.classList.add("hidden");
  loading.classList.remove("hidden");
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  try {
    const response = await apiRequest(`/admin/sessions/${sessionId}`);

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to load session.");
    }

    const sessionData = response.data?.session;
    if (!sessionData) {
      throw new Error("Session information not found.");
    }

    sessionNameInput.value = sessionData.sessionName || "";
    form.dataset.sessionId = sessionId;

    loading.classList.add("hidden");
    form.classList.remove("hidden");
    sessionNameInput.focus();
  } catch (error) {
    console.error("Failed to load session:", error);
    loading.classList.add("hidden");
    errorBox.textContent = error.message || "Failed to load session information.";
    errorBox.classList.remove("hidden");
  }
}

async function updateSession(event) {
  event.preventDefault();
  const form = document.getElementById("editSessionForm");
  const sessionNameInput = document.getElementById("editSessionName");
  const saveButton = document.getElementById("saveSessionChangesBtn");

  if (!form || !sessionNameInput) return;

  const sessionId = form.dataset.sessionId;
  const sessionName = sessionNameInput.value.trim();

  hideMessage("editSessionFormMessage");

  if (!sessionId) {
    showMessage("editSessionFormMessage", "Session ID is missing.", "error");
    return;
  }
  if (!sessionName) {
    showMessage("editSessionFormMessage", "Session name is required.", "error");
    sessionNameInput.focus();
    return;
  }

  try {
    setButtonLoading(saveButton, true, "Saving...");

    const response = await apiRequest(`/admin/sessions/${sessionId}`, {
      method: "PUT",
      body: JSON.stringify({ sessionName }),
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to update session.");
    }

    showMessage("editSessionFormMessage", response.data?.message || "Session updated successfully.", "success");
    await loadSessions();

    setTimeout(() => {
      closeEditSessionModal();
    }, 700);
  } catch (error) {
    console.error("Failed to update session:", error);
    showMessage("editSessionFormMessage", error.message || "Failed to update session.", "error");
  } finally {
    setButtonLoading(saveButton, false);
  }
}

/* =========================================================
SET CURRENT SESSION
========================================================= */
async function setCurrentSession(sessionId, sessionName) {
  if (!confirm(`Are you sure you want to set "${sessionName}" as the current session?`)) {
    return;
  }

  try {
    const response = await apiRequest(`/admin/sessions/${sessionId}/set-current`, {
      method: "PATCH",
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to set current session.");
    }

    showMessage("sessionFormMessage", response.data?.message || "Current session updated successfully.", "success");
    await loadSessions();
  } catch (error) {
    console.error("Failed to set current session:", error);
    alert(error.message || "Failed to set current session.");
  }
}

/* =========================================================
DELETE SESSION
========================================================= */
async function deleteSession(sessionId, sessionName) {
  if (!confirm(`Are you sure you want to delete the session "${sessionName}"? This action cannot be undone.`)) {
    return;
  }

  try {
    const response = await apiRequest(`/admin/sessions/${sessionId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to delete session.");
    }

    showMessage("sessionFormMessage", response.data?.message || "Session deleted successfully.", "success");
    await loadSessions();
  } catch (error) {
    console.error("Failed to delete session:", error);
    alert(error.message || "Failed to delete session.");
  }
}

/* =========================================================
FORM CONTROLS
========================================================= */
function openAddSessionForm() {
  const formBox = document.getElementById("addNewSessionFormBox");
  const form = document.getElementById("addNewSessionForm");
  const createdBox = document.getElementById("sessionCreatedBox");

  hideMessage("sessionFormMessage");

  if (createdBox) createdBox.classList.add("hidden");
  if (form) form.reset();

  if (formBox) {
    formBox.classList.remove("hidden");
    formBox.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.getElementById("sessionName")?.focus();
}

function closeAddSessionForm() {
  const formBox = document.getElementById("addNewSessionFormBox");
  const form = document.getElementById("addNewSessionForm");
  const createdBox = document.getElementById("sessionCreatedBox");

  if (formBox) formBox.classList.add("hidden");
  if (form) form.reset();
  if (createdBox) createdBox.classList.add("hidden");
  hideMessage("sessionFormMessage");
}

function closeEditSessionModal() {
  const modal = document.getElementById("editSessionModal");
  const form = document.getElementById("editSessionForm");
  const loading = document.getElementById("editSessionLoading");
  const errorBox = document.getElementById("editSessionError");

  if (!modal) return;

  modal.classList.add("hidden");
  modal.classList.remove("flex");

  if (form) {
    form.classList.add("hidden");
    form.reset();
    delete form.dataset.sessionId;
  }
  if (loading) loading.classList.add("hidden");
  if (errorBox) {
    errorBox.classList.add("hidden");
    errorBox.textContent = "";
  }
  hideMessage("editSessionFormMessage");
}

/* =========================================================
SEARCH
========================================================= */
function setupSessionSearch() {
  const sessionSearch = document.getElementById("sessionSearch");
  if (!sessionSearch) return;

  sessionSearch.addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();

    if (!query) {
      filteredSessions = [...allSessions];
      renderSessions();
      return;
    }

    filteredSessions = allSessions.filter((session) => {
      const sessionName = session.sessionName?.toLowerCase() || "";
      return sessionName.includes(query);
    });

    renderSessions();
  });
}

/* =========================================================
COUNT & CURRENT SESSION DISPLAY
========================================================= */
function updateSessionCount() {
  // FIXED: Changed to "totalSession" to match HTML
  const totalSessions = document.getElementById("totalSession");
  if (!totalSessions) return;
  totalSessions.textContent = allSessions.length;
}

function updateCurrentSessionDisplay() {
  // FIXED: Changed to "currentSession" to match HTML
  const currentSessionDisplay = document.getElementById("currentSession");
  if (!currentSessionDisplay) return;

  const currentSession = allSessions.find((session) => session.isCurrent);
  if (currentSession) {
    currentSessionDisplay.textContent = currentSession.sessionName;
  } else {
    currentSessionDisplay.textContent = "Not set";
  }
}

/* =========================================================
EVENT LISTENERS
========================================================= */
function setupSessionEvents() {
  document.getElementById("addNewSessionBtn")?.addEventListener("click", openAddSessionForm);
  document.getElementById("cancelAddSessionBtn")?.addEventListener("click", closeAddSessionForm);
  document.getElementById("closeAddSessionFormBtn")?.addEventListener("click", closeAddSessionForm);

  document.getElementById("addNewSessionForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    createSession();
  });

  document.addEventListener("click", (event) => {
    const editButton = event.target.closest(".edit-session-btn");
    if (!editButton) return;
    const sessionId = editButton.dataset.id;
    if (!sessionId) return;
    openEditSessionModal(sessionId);
  });

  document.getElementById("editSessionForm")?.addEventListener("submit", updateSession);

  document.getElementById("closeEditSessionModal")?.addEventListener("click", closeEditSessionModal);
  document.getElementById("cancelEditSessionBtn")?.addEventListener("click", closeEditSessionModal);
  document.getElementById("editSessionModalOverlay")?.addEventListener("click", closeEditSessionModal);

  document.addEventListener("click", (event) => {
    const setCurrentButton = event.target.closest(".set-current-btn");
    if (!setCurrentButton) return;
    const sessionId = setCurrentButton.dataset.id;
    const sessionName = setCurrentButton.dataset.name;
    if (!sessionId) return;
    setCurrentSession(sessionId, sessionName);
  });

  document.addEventListener("click", (event) => {
    const deleteButton = event.target.closest(".delete-session-btn");
    if (!deleteButton || deleteButton.disabled) return;
    const sessionId = deleteButton.dataset.id;
    const sessionName = deleteButton.dataset.name;
    if (!sessionId) return;
    deleteSession(sessionId, sessionName);
  });
}

/* =========================================================
HTML ESCAPE
========================================================= */
function escapeHTML(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
INITIALIZE
========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
  setupSessionEvents();
  setupSessionSearch();
  await loadSessions();
  await loadCurrentTermDisplay();
});