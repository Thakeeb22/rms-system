requireAdmin();
setupLogout();
setupMobileMenu();

let allTerms = [];
let filteredTerms = [];
let currentTermId = null;

const ALL_TERM_OPTIONS = ["First Term", "Second Term", "Third Term"];

/* =========================================================
LOAD TERMS
========================================================= */
async function loadTerms() {
  const termsContainer = document.getElementById("termsContainer");
  const loadingElement = document.getElementById("termsLoading");

  if (!termsContainer) return;

  if (loadingElement) loadingElement.classList.remove("hidden");

  try {
    const response = await apiRequest("/admin/terms");

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to load terms.");
    }

    allTerms = response.data?.terms || [];
    filteredTerms = [...allTerms];

    const currentTerm = allTerms.find((t) => t.isCurrent);
    currentTermId = currentTerm ? currentTerm._id : null;

    renderTerms();
    updateTermCount();
    updateCurrentTermDisplay();
  } catch (error) {
    console.error("Failed to load terms:", error);
    termsContainer.innerHTML = `
      <div class="col-span-full py-12 text-center">
        <div class="text-red-500 text-3xl mb-3"><i class="fa-solid fa-circle-exclamation"></i></div>
        <h3 class="font-bold text-lg text-gray-700">Unable to load terms</h3>
        <p class="text-gray-500 mt-1">${escapeHTML(error.message || "Something went wrong.")}</p>
        <button type="button" id="retryLoadTermsBtn" class="mt-4 px-5 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition">
          <i class="fa-solid fa-rotate-right mr-2"></i>Try Again
        </button>
      </div>
    `;
    document.getElementById("retryLoadTermsBtn")?.addEventListener("click", loadTerms);
  } finally {
    if (loadingElement) loadingElement.classList.add("hidden");
  }
}

/* =========================================================
RENDER TERMS
========================================================= */
function renderTerms() {
  const termsContainer = document.getElementById("termsContainer");
  if (!termsContainer) return;

  if (filteredTerms.length === 0) {
    termsContainer.innerHTML = `
      <div class="col-span-full py-12 text-center text-gray-500">
        <i class="fa-solid fa-calendar-check text-4xl mb-3 text-gray-300"></i>
        <h3 class="font-bold text-lg text-gray-700">No terms found</h3>
        <p class="mt-1">There are no terms to display.</p>
      </div>
    `;
    return;
  }

  termsContainer.innerHTML = filteredTerms.map((term) => createTermCard(term)).join("");
}

/* =========================================================
CREATE TERM CARD
========================================================= */
function createTermCard(term) {
  const termId = term._id;
  const isCurrent = term.isCurrent;

  return `
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-5 hover:shadow-md transition flex flex-col justify-between">
      <div class="flex items-start justify-between gap-3 mb-4">
        <div>
          <p class="text-sm text-gray-500 font-medium">Term Name</p>
          <h2 class="text-2xl font-bold text-blue-500 mt-1">${escapeHTML(term.termName || "N/A")}</h2>
        </div>
        <div class="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <i class="fa-solid fa-calendar-check text-blue-500"></i>
        </div>
      </div>

      <div class="mb-4">
        ${
          isCurrent
            ? `<span class="px-3 py-1 text-xs font-semibold bg-green-100 text-green-600 rounded-full">Current Term</span>`
            : `<span class="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">Inactive</span>`
        }
      </div>

      <div class="mt-4 pt-4 border-t flex justify-end gap-2">
        ${
          !isCurrent
            ? `<button type="button" class="set-current-term-btn px-4 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition text-sm" data-id="${termId}" data-name="${escapeHTML(term.termName)}">
                <i class="fa-solid fa-check mr-1"></i>Set Current
              </button>`
            : ""
        }
        <button type="button" class="delete-term-btn px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition text-sm" data-id="${termId}" data-name="${escapeHTML(term.termName)}" ${isCurrent ? "disabled title='Cannot delete current term'" : ""}>
          <i class="fa-solid fa-trash mr-1"></i>Delete
        </button>
        <button type="button" class="edit-term-btn px-4 py-2 rounded-lg bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition text-sm" data-id="${termId}">
          <i class="fa-solid fa-pen mr-1"></i>Edit
        </button>
      </div>
    </div>
  `;
}

/* =========================================================
CREATE TERM
========================================================= */
async function createTerm() {
  const form = document.getElementById("addNewTermForm");
  const termNameSelect = document.getElementById("termName");
  const createButton = document.getElementById("createTermBtn");

  if (!form || !termNameSelect) return;

  const termName = termNameSelect.value;
  hideMessage("termFormMessage");

  if (!termName) {
    showMessage("termFormMessage", "Please select a term.", "error");
    termNameSelect.focus();
    return;
  }

  try {
    setButtonLoading(createButton, true, "Creating term...");

    const response = await apiRequest("/admin/terms", {
      method: "POST",
      body: JSON.stringify({ termName }),
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to create term.");
    }

    showMessage("termFormMessage", response.data?.message || "Term created successfully.", "success");
    form.reset();

    const createdBox = document.getElementById("termCreatedBox");
    if (createdBox) createdBox.classList.remove("hidden");

    await loadTerms();
    updateTermNameDropdown();

    setTimeout(() => closeAddTermForm(), 1000);
  } catch (error) {
    console.error("Failed to create term:", error);
    showMessage("termFormMessage", error.message || "Failed to create term.", "error");
  } finally {
    setButtonLoading(createButton, false);
  }
}

/* =========================================================
EDIT TERM
========================================================= */
async function openEditTermModal(termId) {
  const modal = document.getElementById("editTermModal");
  const loading = document.getElementById("editTermLoading");
  const errorBox = document.getElementById("editTermError");
  const form = document.getElementById("editTermForm");
  const termNameSelect = document.getElementById("editTermName");

  if (!modal || !loading || !errorBox || !form || !termNameSelect) return;

  errorBox.classList.add("hidden");
  errorBox.textContent = "";
  form.classList.add("hidden");
  loading.classList.remove("hidden");
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  try {
    const response = await apiRequest(`/admin/terms/${termId}`);

    if (!response.ok) throw new Error(response.data?.message || "Failed to load term.");

    const termData = response.data?.term;
    if (!termData) throw new Error("Term information not found.");

    termNameSelect.value = termData.termName || "";
    form.dataset.termId = termId;

    loading.classList.add("hidden");
    form.classList.remove("hidden");
    termNameSelect.focus();
  } catch (error) {
    console.error("Failed to load term:", error);
    loading.classList.add("hidden");
    errorBox.textContent = error.message || "Failed to load term information.";
    errorBox.classList.remove("hidden");
  }
}

async function updateTerm(event) {
  event.preventDefault();
  const form = document.getElementById("editTermForm");
  const termNameSelect = document.getElementById("editTermName");
  const saveButton = document.getElementById("saveTermChangesBtn");

  if (!form || !termNameSelect) return;

  const termId = form.dataset.termId;
  const termName = termNameSelect.value;

  hideMessage("editTermFormMessage");

  if (!termId) {
    showMessage("editTermFormMessage", "Term ID is missing.", "error");
    return;
  }
  if (!termName) {
    showMessage("editTermFormMessage", "Please select a term.", "error");
    termNameSelect.focus();
    return;
  }

  try {
    setButtonLoading(saveButton, true, "Saving...");

    const response = await apiRequest(`/admin/terms/${termId}`, {
      method: "PUT",
      body: JSON.stringify({ termName }),
    });

    if (!response.ok) throw new Error(response.data?.message || "Failed to update term.");

    showMessage("editTermFormMessage", response.data?.message || "Term updated successfully.", "success");
    await loadTerms();
    updateTermNameDropdown();

    setTimeout(() => closeEditTermModal(), 700);
  } catch (error) {
    console.error("Failed to update term:", error);
    showMessage("editTermFormMessage", error.message || "Failed to update term.", "error");
  } finally {
    setButtonLoading(saveButton, false);
  }
}

/* =========================================================
SET CURRENT TERM
========================================================= */
async function setCurrentTerm(termId, termName) {
  if (!confirm(`Are you sure you want to set "${termName}" as the current term?`)) return;

  try {
    const response = await apiRequest(`/admin/terms/${termId}/set-current`, {
      method: "PATCH",
    });

    if (!response.ok) throw new Error(response.data?.message || "Failed to set current term.");

    showMessage("termFormMessage", response.data?.message || "Current term updated successfully.", "success");
    await loadTerms();
  } catch (error) {
    console.error("Failed to set current term:", error);
    alert(error.message || "Failed to set current term.");
  }
}

/* =========================================================
DELETE TERM
========================================================= */
async function deleteTerm(termId, termName) {
  if (!confirm(`Are you sure you want to delete the term "${termName}"? This action cannot be undone.`)) return;

  try {
    const response = await apiRequest(`/admin/terms/${termId}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error(response.data?.message || "Failed to delete term.");

    showMessage("termFormMessage", response.data?.message || "Term deleted successfully.", "success");
    await loadTerms();
    updateTermNameDropdown();
  } catch (error) {
    console.error("Failed to delete term:", error);
    alert(error.message || "Failed to delete term.");
  }
}

/* =========================================================
UPDATE CREATE DROPDOWN (Hides already-created terms)
========================================================= */
function updateTermNameDropdown() {
  const termNameSelect = document.getElementById("termName");
  if (!termNameSelect) return;

  const existingTermNames = allTerms.map((t) => t.termName);
  const currentValue = termNameSelect.value;

  termNameSelect.innerHTML = '<option value="">Select a term</option>';

  ALL_TERM_OPTIONS.forEach((option) => {
    if (!existingTermNames.includes(option)) {
      const opt = document.createElement("option");
      opt.value = option;
      opt.textContent = option;
      termNameSelect.appendChild(opt);
    }
  });

  termNameSelect.value = currentValue;
}

/* =========================================================
FORM CONTROLS
========================================================= */
function openAddTermForm() {
  const formBox = document.getElementById("addNewTermFormBox");
  const form = document.getElementById("addNewTermForm");
  const createdBox = document.getElementById("termCreatedBox");

  hideMessage("termFormMessage");
  if (createdBox) createdBox.classList.add("hidden");
  if (form) form.reset();

  updateTermNameDropdown();

  if (formBox) {
    formBox.classList.remove("hidden");
    formBox.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  document.getElementById("termName")?.focus();
}

function closeAddTermForm() {
  const formBox = document.getElementById("addNewTermFormBox");
  const form = document.getElementById("addNewTermForm");
  const createdBox = document.getElementById("termCreatedBox");

  if (formBox) formBox.classList.add("hidden");
  if (form) form.reset();
  if (createdBox) createdBox.classList.add("hidden");
  hideMessage("termFormMessage");
}

function closeEditTermModal() {
  const modal = document.getElementById("editTermModal");
  const form = document.getElementById("editTermForm");
  const loading = document.getElementById("editTermLoading");
  const errorBox = document.getElementById("editTermError");

  if (!modal) return;

  modal.classList.add("hidden");
  modal.classList.remove("flex");

  if (form) {
    form.classList.add("hidden");
    form.reset();
    delete form.dataset.termId;
  }
  if (loading) loading.classList.add("hidden");
  if (errorBox) {
    errorBox.classList.add("hidden");
    errorBox.textContent = "";
  }
  hideMessage("editTermFormMessage");
}

/* =========================================================
SEARCH
========================================================= */
function setupTermSearch() {
  const termSearch = document.getElementById("termSearch");
  if (!termSearch) return;

  termSearch.addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();

    if (!query) {
      filteredTerms = [...allTerms];
      renderTerms();
      return;
    }

    filteredTerms = allTerms.filter((term) => {
      const termName = term.termName?.toLowerCase() || "";
      return termName.includes(query);
    });

    renderTerms();
  });
}

/* =========================================================
COUNT & CURRENT TERM DISPLAY
========================================================= */
function updateTermCount() {
  const totalTerms = document.getElementById("totalTerms");
  if (!totalTerms) return;
  totalTerms.textContent = allTerms.length;
}

function updateCurrentTermDisplay() {
  const currentTermDisplay = document.getElementById("currentTerm");
  if (!currentTermDisplay) return;

  const currentTerm = allTerms.find((t) => t.isCurrent);
  currentTermDisplay.textContent = currentTerm ? currentTerm.termName : "Not set";
}

/* =========================================================
EVENT LISTENERS
========================================================= */
function setupTermEvents() {
  document.getElementById("addNewTermBtn")?.addEventListener("click", openAddTermForm);
  document.getElementById("cancelAddTermBtn")?.addEventListener("click", closeAddTermForm);
  document.getElementById("closeAddTermFormBtn")?.addEventListener("click", closeAddTermForm);

  document.getElementById("addNewTermForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    createTerm();
  });

  document.addEventListener("click", (event) => {
    const editButton = event.target.closest(".edit-term-btn");
    if (!editButton) return;
    const termId = editButton.dataset.id;
    if (!termId) return;
    openEditTermModal(termId);
  });

  document.getElementById("editTermForm")?.addEventListener("submit", updateTerm);

  document.getElementById("closeEditTermModal")?.addEventListener("click", closeEditTermModal);
  document.getElementById("cancelEditTermBtn")?.addEventListener("click", closeEditTermModal);
  document.getElementById("editTermModalOverlay")?.addEventListener("click", closeEditTermModal);

  document.addEventListener("click", (event) => {
    const setCurrentButton = event.target.closest(".set-current-term-btn");
    if (!setCurrentButton) return;
    const termId = setCurrentButton.dataset.id;
    const termName = setCurrentButton.dataset.name;
    if (!termId) return;
    setCurrentTerm(termId, termName);
  });

  document.addEventListener("click", (event) => {
    const deleteButton = event.target.closest(".delete-term-btn");
    if (!deleteButton || deleteButton.disabled) return;
    const termId = deleteButton.dataset.id;
    const termName = deleteButton.dataset.name;
    if (!termId) return;
    deleteTerm(termId, termName);
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
  setupTermEvents();
  setupTermSearch();
  await loadTerms();
  await loadCurrentSessionDisplay();
  await loadCurrentTermDisplay();
});