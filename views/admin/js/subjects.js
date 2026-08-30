requireAdmin();
setupLogout();
setupMobileMenu();
let filteredSubjects = [];

// LOAD SUBJECTS
async function loadSubjects() {
  const subjectsContainer = document.getElementById("subjectsContainer");
  const loadingElement = document.getElementById("subjectsLoading");

  if (!subjectsContainer) return;

  if (loadingElement) {
    loadingElement.classList.remove("hidden");
  }

  try {
    const response = await apiRequest("/admin/subjects");

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to load subjects.");
    }

    allSubjects = response.data?.subjects || [];
    filteredSubjects = [...allSubjects];

    renderSubjects();
    updateSubjectCount();
  } catch (error) {
    console.error("Failed to load subjects:", error);
    subjectsContainer.innerHTML = `
      <div class="col-span-full py-12 text-center">
        <div class="text-red-500 text-3xl mb-3">
          <i class="fa-solid fa-circle-exclamation"></i>
        </div>
        <h3 class="font-bold text-lg text-gray-700">Unable to load subjects</h3>
        <p class="text-gray-500 mt-1">
          ${escapeHTML(error.message || "Something went wrong.")}
        </p>
        <button
          type="button"
          id="retryLoadSubjectsBtn"
          class="mt-4 px-5 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
        >
          <i class="fa-solid fa-rotate-right mr-2"></i>
          Try Again
        </button>
      </div>
    `;
    document.getElementById("retryLoadSubjectsBtn")?.addEventListener("click", loadSubjects);
  } finally {
    if (loadingElement) {
      loadingElement.classList.add("hidden");
    }
  }
}

// RENDER SUBJECTS
function renderSubjects() {
  const subjectsContainer = document.getElementById("subjectsContainer");
  if (!subjectsContainer) return;

  if (filteredSubjects.length === 0) {
    subjectsContainer.innerHTML = `
      <div class="col-span-full py-12 text-center text-gray-500">
        <i class="fa-solid fa-book-open text-4xl mb-3 text-gray-300"></i>
        <h3 class="font-bold text-lg text-gray-700">No subjects found</h3>
        <p class="mt-1">There are no subjects to display.</p>
      </div>
    `;
    return;
  }

  subjectsContainer.innerHTML = filteredSubjects.map((subject) => createSubjectCard(subject)).join("");
}

// CREATE SUBJECT CARD
function createSubjectCard(subject) {
  const subjectId = subject._id;

  return `
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-5 hover:shadow-md transition">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-500 font-medium">Subject Name</p>
          <h2 class="text-2xl font-bold text-blue-500 mt-1 truncate">
            ${escapeHTML(subject.subjectName || "N/A")}
          </h2>
        </div>
        <div class="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <i class="fa-solid fa-book text-blue-500"></i>
        </div>
      </div>

      <div class="mt-5 pt-4 border-t flex justify-end gap-2">
        <button
          type="button"
          class="delete-subject-btn px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition"
          data-id="${subjectId}"
          data-name="${escapeHTML(subject.subjectName)}"
        >
          <i class="fa-solid fa-trash mr-1"></i>
          Delete
        </button>
        <button
          type="button"
          class="edit-subject-btn px-4 py-2 rounded-lg bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition"
          data-id="${subjectId}"
        >
          <i class="fa-solid fa-pen mr-1"></i>
          Edit
        </button>
      </div>
    </div>
  `;
}

// CREATE SUBJECT
async function createSubject() {
  const form = document.getElementById("addNewSubjectForm");
  const subjectNameInput = document.getElementById("subjectName");
  const createButton = document.getElementById("createSubjectBtn");

  if (!form || !subjectNameInput) return;

  const subjectName = subjectNameInput.value.trim();

  hideMessage("subjectFormMessage");

  if (!subjectName) {
    showMessage("subjectFormMessage", "Subject name is required.", "error");
    subjectNameInput.focus();
    return;
  }

  try {
    setButtonLoading(createButton, true, "Creating subject...");

    const response = await apiRequest("/admin/subjects", {
      method: "POST",
      body: JSON.stringify({ subjectName }),
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to create subject.");
    }

    showMessage("subjectFormMessage", response.data?.message || "Subject created successfully.", "success");
    form.reset();

    const createdBox = document.getElementById("subjectCreatedBox");
    if (createdBox) {
      createdBox.classList.remove("hidden");
    }

    await loadSubjects();

    setTimeout(() => {
      closeAddSubjectForm();
    }, 1000);
  } catch (error) {
    console.error("Failed to create subject:", error);
    showMessage("subjectFormMessage", error.message || "Failed to create subject.", "error");
  } finally {
    setButtonLoading(createButton, false);
  }
}

// EDIT SUBJECT
async function openEditSubjectModal(subjectId) {
  const modal = document.getElementById("editSubjectModal");
  const loading = document.getElementById("editSubjectLoading");
  const errorBox = document.getElementById("editSubjectError");
  const form = document.getElementById("editSubjectForm");
  const subjectNameInput = document.getElementById("editSubjectName");

  if (!modal || !loading || !errorBox || !form || !subjectNameInput) return;

  errorBox.classList.add("hidden");
  errorBox.textContent = "";
  form.classList.add("hidden");
  loading.classList.remove("hidden");
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  try {
    const response = await apiRequest(`/admin/subjects/${subjectId}`);

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to load subject.");
    }

    const subjectData = response.data?.subject;
    if (!subjectData) {
      throw new Error("Subject information not found.");
    }

    subjectNameInput.value = subjectData.subjectName || "";
    form.dataset.subjectId = subjectId;

    loading.classList.add("hidden");
    form.classList.remove("hidden");
    subjectNameInput.focus();
  } catch (error) {
    console.error("Failed to load subject:", error);
    loading.classList.add("hidden");
    errorBox.textContent = error.message || "Failed to load subject information.";
    errorBox.classList.remove("hidden");
  }
}

async function updateSubject(event) {
  event.preventDefault();
  const form = document.getElementById("editSubjectForm");
  const subjectNameInput = document.getElementById("editSubjectName");
  const saveButton = document.getElementById("saveSubjectChangesBtn");

  if (!form || !subjectNameInput) return;

  const subjectId = form.dataset.subjectId;
  const subjectName = subjectNameInput.value.trim();

  hideMessage("editSubjectFormMessage");

  if (!subjectId) {
    showMessage("editSubjectFormMessage", "Subject ID is missing.", "error");
    return;
  }
  if (!subjectName) {
    showMessage("editSubjectFormMessage", "Subject name is required.", "error");
    subjectNameInput.focus();
    return;
  }

  try {
    setButtonLoading(saveButton, true, "Saving...");

    const response = await apiRequest(`/admin/subjects/${subjectId}`, {
      method: "PUT",
      body: JSON.stringify({ subjectName }),
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to update subject.");
    }

    showMessage("editSubjectFormMessage", response.data?.message || "Subject updated successfully.", "success");
    await loadSubjects();

    setTimeout(() => {
      closeEditSubjectModal();
    }, 700);
  } catch (error) {
    console.error("Failed to update subject:", error);
    showMessage("editSubjectFormMessage", error.message || "Failed to update subject.", "error");
  } finally {
    setButtonLoading(saveButton, false);
  }
}

// DELETE SUBJECT
async function deleteSubject(subjectId, subjectName) {
  if (!confirm(`Are you sure you want to delete the subject "${subjectName}"? This action cannot be undone.`)) {
    return;
  }

  try {
    const response = await apiRequest(`/admin/subjects/${subjectId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to delete subject.");
    }

    showMessage("subjectFormMessage", response.data?.message || "Subject deleted successfully.", "success");
    await loadSubjects();
  } catch (error) {
    console.error("Failed to delete subject:", error);
    alert(error.message || "Failed to delete subject.");
  }
}

// FORM CONTROLS
function openAddSubjectForm() {
  const formBox = document.getElementById("addNewSubjectFormBox");
  const form = document.getElementById("addNewSubjectForm");
  const createdBox = document.getElementById("subjectCreatedBox");

  hideMessage("subjectFormMessage");

  if (createdBox) createdBox.classList.add("hidden");
  if (form) form.reset();

  if (formBox) {
    formBox.classList.remove("hidden");
    formBox.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.getElementById("subjectName")?.focus();
}

function closeAddSubjectForm() {
  const formBox = document.getElementById("addNewSubjectFormBox");
  const form = document.getElementById("addNewSubjectForm");
  const createdBox = document.getElementById("subjectCreatedBox");

  if (formBox) formBox.classList.add("hidden");
  if (form) form.reset();
  if (createdBox) createdBox.classList.add("hidden");
  hideMessage("subjectFormMessage");
}

function closeEditSubjectModal() {
  const modal = document.getElementById("editSubjectModal");
  const form = document.getElementById("editSubjectForm");
  const loading = document.getElementById("editSubjectLoading");
  const errorBox = document.getElementById("editSubjectError");

  if (!modal) return;

  modal.classList.add("hidden");
  modal.classList.remove("flex");

  if (form) {
    form.classList.add("hidden");
    form.reset();
    delete form.dataset.subjectId;
  }
  if (loading) loading.classList.add("hidden");
  if (errorBox) {
    errorBox.classList.add("hidden");
    errorBox.textContent = "";
  }
  hideMessage("editSubjectFormMessage");
}

// SEARCH
function setupSubjectSearch() {
  const subjectSearch = document.getElementById("subjectSearch");
  if (!subjectSearch) return;

  subjectSearch.addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();

    if (!query) {
      filteredSubjects = [...allSubjects];
      renderSubjects();
      return;
    }

    filteredSubjects = allSubjects.filter((subject) => {
      const subjectName = subject.subjectName?.toLowerCase() || "";
      return subjectName.includes(query);
    });

    renderSubjects();
  });
}

// COUNT
function updateSubjectCount() {
  const totalSubjects = document.getElementById("totalSubjects");
  if (!totalSubjects) return;
  totalSubjects.textContent = allSubjects.length;
}

// EVENT LISTENERS
function setupSubjectEvents() {
  // Add subject
  document.getElementById("addNewSubjectBtn")?.addEventListener("click", openAddSubjectForm);
  document.getElementById("cancelAddSubjectBtn")?.addEventListener("click", closeAddSubjectForm);
  document.getElementById("closeAddSubjectFormBtn")?.addEventListener("click", closeAddSubjectForm);

  // Create subject
  document.getElementById("addNewSubjectForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    createSubject();
  });

  // Edit subject buttons
  document.addEventListener("click", (event) => {
    const editButton = event.target.closest(".edit-subject-btn");
    if (!editButton) return;
    const subjectId = editButton.dataset.id;
    if (!subjectId) return;
    openEditSubjectModal(subjectId);
  });

  // Edit form submit
  document.getElementById("editSubjectForm")?.addEventListener("submit", updateSubject);

  // Close edit modal
  document.getElementById("closeEditSubjectModal")?.addEventListener("click", closeEditSubjectModal);
  document.getElementById("cancelEditSubjectBtn")?.addEventListener("click", closeEditSubjectModal);
  document.getElementById("editSubjectModalOverlay")?.addEventListener("click", closeEditSubjectModal);

  // Delete subject buttons
  document.addEventListener("click", (event) => {
    const deleteButton = event.target.closest(".delete-subject-btn");
    if (!deleteButton) return;
    const subjectId = deleteButton.dataset.id;
    const subjectName = deleteButton.dataset.name;
    if (!subjectId) return;
    deleteSubject(subjectId, subjectName);
  });
}

// HTML ESCAPE
function escapeHTML(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// INITIALIZE
document.addEventListener("DOMContentLoaded", async () => {
  setupSubjectEvents();
  setupSubjectSearch();
  await loadSubjects();
  await loadCurrentSessionDisplay(); 
  await loadCurrentTermDisplay();
});