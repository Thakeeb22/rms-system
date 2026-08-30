requireAdmin();
setupLogout();
setupMobileMenu();

let allAssignments = [];
let filteredAssignments = [];


/* =========================================================
LOAD ASSIGNMENTS
========================================================= */
async function loadAssignments() {
  const assignmentsContainer = document.getElementById("assignmentsContainer");
  const loadingElement = document.getElementById("assignmentsLoading");

  if (!assignmentsContainer) return;

  if (loadingElement) loadingElement.classList.remove("hidden");

  try {
    const [assignmentsResponse, classesResponse, subjectsResponse, teachersResponse] = await Promise.all([
      apiRequest("/admin/class-subjects"),
      apiRequest("/admin/classes"),
      apiRequest("/admin/subjects"),
      apiRequest("/admin/teachers"),
    ]);

    if (!assignmentsResponse.ok) throw new Error(assignmentsResponse.data?.message || "Failed to load assignments.");
    if (!classesResponse.ok) throw new Error(classesResponse.data?.message || "Failed to load classes.");
    if (!subjectsResponse.ok) throw new Error(subjectsResponse.data?.message || "Failed to load subjects.");
    if (!teachersResponse.ok) throw new Error(teachersResponse.data?.message || "Failed to load teachers.");

    allAssignments = assignmentsResponse.data?.assignments || [];
    allClasses = classesResponse.data?.classes || [];
    allSubjects = subjectsResponse.data?.subjects || [];
    allTeachers = teachersResponse.data?.teachers || [];

    filteredAssignments = [...allAssignments];

    populateDropdowns();
    renderAssignments();
    updateAssignmentCount();
  } catch (error) {
    console.error("Failed to load assignments:", error);
    assignmentsContainer.innerHTML = `
      <div class="col-span-full py-12 text-center">
        <div class="text-red-500 text-3xl mb-3"><i class="fa-solid fa-circle-exclamation"></i></div>
        <h3 class="font-bold text-lg text-gray-700">Unable to load assignments</h3>
        <p class="text-gray-500 mt-1">${escapeHTML(error.message || "Something went wrong.")}</p>
        <button type="button" id="retryLoadAssignmentsBtn" class="mt-4 px-5 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition">
          <i class="fa-solid fa-rotate-right mr-2"></i>Try Again
        </button>
      </div>
    `;
    document.getElementById("retryLoadAssignmentsBtn")?.addEventListener("click", loadAssignments);
  } finally {
    if (loadingElement) loadingElement.classList.add("hidden");
  }
}

/* =========================================================
POPULATE DROPDOWNS
========================================================= */
function populateDropdowns() {
  // Class dropdowns
  const classSelect = document.getElementById("assignmentClass");
  if (classSelect) {
    classSelect.innerHTML = '<option value="">Select a class</option>';
    allClasses.forEach((cls) => {
      const option = document.createElement("option");
      option.value = cls._id;
      option.textContent = cls.className;
      classSelect.appendChild(option);
    });
  }

  // Subject dropdowns
  const subjectSelect = document.getElementById("assignmentSubject");
  if (subjectSelect) {
    subjectSelect.innerHTML = '<option value="">Select a subject</option>';
    allSubjects.forEach((subject) => {
      const option = document.createElement("option");
      option.value = subject._id;
      option.textContent = subject.subjectName;
      subjectSelect.appendChild(option);
    });
  }

  // Teacher dropdowns
  const teacherSelect = document.getElementById("assignmentTeacher");
  const editTeacherSelect = document.getElementById("editAssignmentTeacher");
  
  [teacherSelect, editTeacherSelect].forEach((select) => {
    if (select) {
      select.innerHTML = '<option value="">No teacher assigned</option>';
      allTeachers
        .filter((teacher) => teacher.status === "active")
        .forEach((teacher) => {
          const option = document.createElement("option");
          option.value = teacher._id;
          option.textContent = teacher.fullname;
          select.appendChild(option);
        });
    }
  });
}

/* =========================================================
RENDER ASSIGNMENTS
========================================================= */
function renderAssignments() {
  const assignmentsContainer = document.getElementById("assignmentsContainer");
  if (!assignmentsContainer) return;

  if (filteredAssignments.length === 0) {
    assignmentsContainer.innerHTML = `
      <div class="col-span-full py-12 text-center text-gray-500">
        <i class="fa-solid fa-diagram-project text-4xl mb-3 text-gray-300"></i>
        <h3 class="font-bold text-lg text-gray-700">No assignments found</h3>
        <p class="mt-1">There are no subject assignments to display.</p>
      </div>
    `;
    return;
  }

  assignmentsContainer.innerHTML = filteredAssignments.map((assignment) => createAssignmentCard(assignment)).join("");
}

/* =========================================================
CREATE ASSIGNMENT CARD
========================================================= */
function createAssignmentCard(assignment) {
  const assignmentId = assignment._id;
  const className = assignment.class?.className || "Unknown Class";
  const subjectName = assignment.subject?.subjectName || "Unknown Subject";
  const teacherName = assignment.subjectTeacher?.fullname || "No teacher assigned";
  const teacherEmail = assignment.subjectTeacher?.email || "";

  return `
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-5 hover:shadow-md transition flex flex-col justify-between">
      <div class="flex items-start justify-between gap-3 mb-4">
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-500 font-medium">Class</p>
          <h2 class="text-xl font-bold text-blue-500 mt-1 truncate">${escapeHTML(className)}</h2>
        </div>
        <div class="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <i class="fa-solid fa-school text-blue-500"></i>
        </div>
      </div>

      <div class="mb-3">
        <p class="text-sm text-gray-500 font-medium">Subject</p>
        <p class="text-lg font-semibold text-gray-800 mt-1">${escapeHTML(subjectName)}</p>
      </div>

      <div class="mb-4 pt-3 border-t">
        <p class="text-sm text-gray-500 font-medium">Subject Teacher</p>
        <div class="mt-2 flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <i class="fa-solid fa-chalkboard-user text-green-600 text-sm"></i>
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-gray-800 truncate text-sm">${escapeHTML(teacherName)}</p>
            ${teacherEmail ? `<p class="text-xs text-gray-500 truncate">${escapeHTML(teacherEmail)}</p>` : ""}
          </div>
        </div>
      </div>

      <div class="mt-4 pt-4 border-t flex justify-end gap-2">
        <button
          type="button"
          class="delete-assignment-btn px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition text-sm"
          data-id="${assignmentId}"
          data-class="${escapeHTML(className)}"
          data-subject="${escapeHTML(subjectName)}"
        >
          <i class="fa-solid fa-trash mr-1"></i>
          Delete
        </button>
        <button
          type="button"
          class="edit-assignment-btn px-4 py-2 rounded-lg bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition text-sm"
          data-id="${assignmentId}"
        >
          <i class="fa-solid fa-pen mr-1"></i>
          Edit
        </button>
      </div>
    </div>
  `;
}

/* =========================================================
CREATE ASSIGNMENT
========================================================= */
async function createAssignment() {
  const form = document.getElementById("addNewAssignmentForm");
  const classSelect = document.getElementById("assignmentClass");
  const subjectSelect = document.getElementById("assignmentSubject");
  const teacherSelect = document.getElementById("assignmentTeacher");
  const createButton = document.getElementById("createAssignmentBtn");

  if (!form || !classSelect || !subjectSelect) return;

  const classId = classSelect.value;
  const subjectId = subjectSelect.value;
  const subjectTeacher = teacherSelect?.value || null;

  hideMessage("assignmentFormMessage");

  if (!classId) {
    showMessage("assignmentFormMessage", "Please select a class.", "error");
    classSelect.focus();
    return;
  }
  if (!subjectId) {
    showMessage("assignmentFormMessage", "Please select a subject.", "error");
    subjectSelect.focus();
    return;
  }

  try {
    setButtonLoading(createButton, true, "Assigning subject...");

    const response = await apiRequest("/admin/class-subjects", {
      method: "POST",
      body: JSON.stringify({ classId, subjectId, subjectTeacher: subjectTeacher || undefined }),
    });

    if (!response.ok) throw new Error(response.data?.message || "Failed to assign subject.");

    showMessage("assignmentFormMessage", response.data?.message || "Subject assigned successfully.", "success");
    form.reset();

    const createdBox = document.getElementById("assignmentCreatedBox");
    if (createdBox) createdBox.classList.remove("hidden");

    await loadAssignments();

    setTimeout(() => closeAddAssignmentForm(), 1000);
  } catch (error) {
    console.error("Failed to assign subject:", error);
    showMessage("assignmentFormMessage", error.message || "Failed to assign subject.", "error");
  } finally {
    setButtonLoading(createButton, false);
  }
}

/* =========================================================
EDIT ASSIGNMENT
========================================================= */
async function openEditAssignmentModal(assignmentId) {
  const modal = document.getElementById("editAssignmentModal");
  const loading = document.getElementById("editAssignmentLoading");
  const errorBox = document.getElementById("editAssignmentError");
  const form = document.getElementById("editAssignmentForm");
  const classDisplay = document.getElementById("editAssignmentClass");
  const subjectDisplay = document.getElementById("editAssignmentSubject");
  const teacherSelect = document.getElementById("editAssignmentTeacher");

  if (!modal || !loading || !errorBox || !form || !classDisplay || !subjectDisplay || !teacherSelect) return;

  errorBox.classList.add("hidden");
  errorBox.textContent = "";
  form.classList.add("hidden");
  loading.classList.remove("hidden");
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  try {
    const response = await apiRequest(`/admin/class-subjects/${assignmentId}`);

    if (!response.ok) throw new Error(response.data?.message || "Failed to load assignment.");

    const assignmentData = response.data?.assignment;
    if (!assignmentData) throw new Error("Assignment information not found.");

    classDisplay.textContent = assignmentData.class?.className || "—";
    subjectDisplay.textContent = assignmentData.subject?.subjectName || "—";
    teacherSelect.value = assignmentData.subjectTeacher?._id || "";
    form.dataset.assignmentId = assignmentId;

    loading.classList.add("hidden");
    form.classList.remove("hidden");
    teacherSelect.focus();
  } catch (error) {
    console.error("Failed to load assignment:", error);
    loading.classList.add("hidden");
    errorBox.textContent = error.message || "Failed to load assignment information.";
    errorBox.classList.remove("hidden");
  }
}

async function updateAssignment(event) {
  event.preventDefault();
  const form = document.getElementById("editAssignmentForm");
  const teacherSelect = document.getElementById("editAssignmentTeacher");
  const saveButton = document.getElementById("saveAssignmentChangesBtn");

  if (!form || !teacherSelect) return;

  const assignmentId = form.dataset.assignmentId;
  const subjectTeacher = teacherSelect.value;

  hideMessage("editAssignmentFormMessage");

  if (!assignmentId) {
    showMessage("editAssignmentFormMessage", "Assignment ID is missing.", "error");
    return;
  }
  if (!subjectTeacher) {
    showMessage("editAssignmentFormMessage", "Please select a teacher.", "error");
    teacherSelect.focus();
    return;
  }

  try {
    setButtonLoading(saveButton, true, "Saving...");

    const response = await apiRequest(`/admin/class-subjects/${assignmentId}/subject-teacher`, {
      method: "PATCH",
      body: JSON.stringify({ subjectTeacher }),
    });

    if (!response.ok) throw new Error(response.data?.message || "Failed to update assignment.");

    showMessage("editAssignmentFormMessage", response.data?.message || "Assignment updated successfully.", "success");
    await loadAssignments();

    setTimeout(() => closeEditAssignmentModal(), 700);
  } catch (error) {
    console.error("Failed to update assignment:", error);
    showMessage("editAssignmentFormMessage", error.message || "Failed to update assignment.", "error");
  } finally {
    setButtonLoading(saveButton, false);
  }
}

/* =========================================================
DELETE ASSIGNMENT
========================================================= */
async function deleteAssignment(assignmentId, className, subjectName) {
  if (!confirm(`Are you sure you want to remove "${subjectName}" from "${className}"? This action cannot be undone.`)) {
    return;
  }

  try {
    const response = await apiRequest(`/admin/class-subjects/${assignmentId}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error(response.data?.message || "Failed to delete assignment.");

    showMessage("assignmentFormMessage", response.data?.message || "Assignment deleted successfully.", "success");
    await loadAssignments();
  } catch (error) {
    console.error("Failed to delete assignment:", error);
    alert(error.message || "Failed to delete assignment.");
  }
}

/* =========================================================
FORM CONTROLS
========================================================= */
function openAddAssignmentForm() {
  const formBox = document.getElementById("addNewAssignmentFormBox");
  const form = document.getElementById("addNewAssignmentForm");
  const createdBox = document.getElementById("assignmentCreatedBox");

  hideMessage("assignmentFormMessage");
  if (createdBox) createdBox.classList.add("hidden");
  if (form) form.reset();

  if (formBox) {
    formBox.classList.remove("hidden");
    formBox.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  document.getElementById("assignmentClass")?.focus();
}

function closeAddAssignmentForm() {
  const formBox = document.getElementById("addNewAssignmentFormBox");
  const form = document.getElementById("addNewAssignmentForm");
  const createdBox = document.getElementById("assignmentCreatedBox");

  if (formBox) formBox.classList.add("hidden");
  if (form) form.reset();
  if (createdBox) createdBox.classList.add("hidden");
  hideMessage("assignmentFormMessage");
}

function closeEditAssignmentModal() {
  const modal = document.getElementById("editAssignmentModal");
  const form = document.getElementById("editAssignmentForm");
  const loading = document.getElementById("editAssignmentLoading");
  const errorBox = document.getElementById("editAssignmentError");

  if (!modal) return;

  modal.classList.add("hidden");
  modal.classList.remove("flex");

  if (form) {
    form.classList.add("hidden");
    form.reset();
    delete form.dataset.assignmentId;
  }
  if (loading) loading.classList.add("hidden");
  if (errorBox) {
    errorBox.classList.add("hidden");
    errorBox.textContent = "";
  }
  hideMessage("editAssignmentFormMessage");
}

/* =========================================================
SEARCH
========================================================= */
function setupAssignmentSearch() {
  const assignmentSearch = document.getElementById("assignmentSearch");
  if (!assignmentSearch) return;

  assignmentSearch.addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();

    if (!query) {
      filteredAssignments = [...allAssignments];
      renderAssignments();
      return;
    }

    filteredAssignments = allAssignments.filter((assignment) => {
      const className = assignment.class?.className?.toLowerCase() || "";
      const subjectName = assignment.subject?.subjectName?.toLowerCase() || "";
      const teacherName = assignment.subjectTeacher?.fullname?.toLowerCase() || "";
      const teacherEmail = assignment.subjectTeacher?.email?.toLowerCase() || "";

      return (
        className.includes(query) ||
        subjectName.includes(query) ||
        teacherName.includes(query) ||
        teacherEmail.includes(query)
      );
    });

    renderAssignments();
  });
}

/* =========================================================
COUNT
========================================================= */
function updateAssignmentCount() {
  const totalAssignments = document.getElementById("totalAssignments");
  if (!totalAssignments) return;
  totalAssignments.textContent = allAssignments.length;
}

/* =========================================================
EVENT LISTENERS
========================================================= */
function setupAssignmentEvents() {
  document.getElementById("addNewAssignmentBtn")?.addEventListener("click", openAddAssignmentForm);
  document.getElementById("cancelAddAssignmentBtn")?.addEventListener("click", closeAddAssignmentForm);
  document.getElementById("closeAddAssignmentFormBtn")?.addEventListener("click", closeAddAssignmentForm);

  document.getElementById("addNewAssignmentForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    createAssignment();
  });

  document.addEventListener("click", (event) => {
    const editButton = event.target.closest(".edit-assignment-btn");
    if (!editButton) return;
    const assignmentId = editButton.dataset.id;
    if (!assignmentId) return;
    openEditAssignmentModal(assignmentId);
  });

  document.getElementById("editAssignmentForm")?.addEventListener("submit", updateAssignment);

  document.getElementById("closeEditAssignmentModal")?.addEventListener("click", closeEditAssignmentModal);
  document.getElementById("cancelEditAssignmentBtn")?.addEventListener("click", closeEditAssignmentModal);
  document.getElementById("editAssignmentModalOverlay")?.addEventListener("click", closeEditAssignmentModal);

  document.addEventListener("click", (event) => {
    const deleteButton = event.target.closest(".delete-assignment-btn");
    if (!deleteButton) return;
    const assignmentId = deleteButton.dataset.id;
    const className = deleteButton.dataset.class;
    const subjectName = deleteButton.dataset.subject;
    if (!assignmentId) return;
    deleteAssignment(assignmentId, className, subjectName);
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
  setupAssignmentEvents();
  setupAssignmentSearch();
  await loadCurrentSessionDisplay();
  await loadCurrentTermDisplay();
  await loadAssignments();
});