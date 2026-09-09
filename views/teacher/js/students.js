requireTeacher();
if (typeof setupLogout === "function") setupLogout();
if (typeof setupMobileMenu === "function") setupMobileMenu();

let isClassTeacher = false;

// LOAD INITIAL DATA

async function loadInitialData() {
  try {
    const dashboardRes = await apiRequest("/teacher/dashboard");
    if (dashboardRes.ok && dashboardRes.data?.dashboard) {
      const assignedClass = dashboardRes.data.dashboard.teacher.assignedClass;
      const classSpan = document.getElementById("myClassName");
      const addBtn = document.getElementById("addNewStudentBtn");
      const warning = document.getElementById("subjectTeacherWarning");

      if (assignedClass) {
        isClassTeacher = true;
        classSpan.textContent = assignedClass.className;
        addBtn.classList.remove("hidden"); // Show button for Class Teachers
        warning.classList.add("hidden");
      } else {
        isClassTeacher = false;
        classSpan.textContent = "Not Assigned";
        addBtn.classList.add("hidden"); // Hide button for Subject Teachers
        warning.classList.remove("hidden"); // Show warning
      }
    }
    await loadStudents();
  } catch (error) {
    console.error("Failed to load initial data:", error);
  }
}

// Bulk Selection Variables
const selectAllCheckbox = document.getElementById("selectAllStudents");
const bulkActionsBar = document.getElementById("bulkActionsBar");
const selectedCountSpan = document.getElementById("selectedCount");
const clearSelectionBtn = document.getElementById("clearSelectionBtn");

function updateBulkSelection() {
  const checkboxes = document.querySelectorAll(".student-checkbox:checked");
  const count = checkboxes.length;

  if (selectedCountSpan) selectedCountSpan.textContent = count;

  if (count > 0) {
    bulkActionsBar?.classList.remove("hidden");
  } else {
    bulkActionsBar?.classList.add("hidden");
  }

  // Update "Select All" state
  const allCheckboxes = document.querySelectorAll(".student-checkbox");
  if (selectAllCheckbox) {
    selectAllCheckbox.checked =
      allCheckboxes.length > 0 && count === allCheckboxes.length;
  }
}

// Select All Event
if (selectAllCheckbox) {
  selectAllCheckbox.addEventListener("change", (e) => {
    const checkboxes = document.querySelectorAll(".student-checkbox");
    checkboxes.forEach((cb) => (cb.checked = e.target.checked));
    updateBulkSelection();
  });
}

// Clear Selection Event
if (clearSelectionBtn) {
  clearSelectionBtn.addEventListener("click", () => {
    const checkboxes = document.querySelectorAll(".student-checkbox");
    checkboxes.forEach((cb) => (cb.checked = false));
    if (selectAllCheckbox) selectAllCheckbox.checked = false;
    updateBulkSelection();
  });
}

// Delegate click events for dynamically created checkboxes
document.addEventListener("change", (e) => {
  if (e.target.classList.contains("student-checkbox")) {
    updateBulkSelection();
  }
});

/* =========================================================
LOAD STUDENTS
========================================================= */
async function loadStudents() {
  const container = document.getElementById("studentsContainer");
  const loading = document.getElementById("studentsLoading");

  if (!container) return;
  if (loading) loading.classList.remove("hidden");
  container.innerHTML = "";

  try {
    // The backend automatically filters this to the teacher's assigned class
    const response = await apiRequest("/admin/students");

    if (!response.ok)
      throw new Error(response.data?.message || "Failed to load students.");

    const students = response.data?.students || [];
    renderStudents(students);
  } catch (error) {
    console.error("Failed to load students:", error);
    container.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-red-500">${escapeHTML(error.message)}</td></tr>`;
  } finally {
    if (loading) loading.classList.add("hidden");
  }
}

/* =========================================================
RENDER STUDENTS
========================================================= */
function renderStudents(students) {
  const container = document.getElementById("studentsContainer");
  if (!container) return;
  if (students.length === 0) {
    container.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No students in your class yet.</td></tr>`;
    return;
  }

  container.innerHTML = students
    .map((student) => {
      const isGraduated = student.status === "Graduated";
      const isTransferred = student.status === "Transferred";
      const isInactive = !student.isActive;
      const canPromote = !isGraduated && !isTransferred && !isInactive;

      return `
    <tr class="hover:bg-gray-50 transition">
      <td class="p-4">
<input type="checkbox" class="student-checkbox w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" value="${escapeHTML(student._id)}" />
      </td>
      <td class="px-6 py-4 text-sm font-medium text-gray-900">${escapeHTML(student.admissionNumber)}</td>
      <td class="px-6 py-4 text-sm text-gray-700">${escapeHTML(student.fullname)}</td>
      <td class="px-6 py-4 text-sm text-gray-700">${escapeHTML(student.guardianName)}<br><span class="text-xs text-gray-500">${escapeHTML(student.guardianPhone)}</span></td>
      <td class="px-6 py-4 text-sm text-gray-700">${escapeHTML(student.gender)}</td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.status)}">
          ${escapeHTML(student.status)}
        </span>
      </td>
      <td class="px-6 py-4 text-right">
        ${
          canPromote
            ? `
          <button class="promote-student-btn text-indigo-600 hover:text-indigo-800 text-sm font-semibold" data-id="${student._id}">
            <i class="fa-solid fa-arrow-up mr-1"></i> Promote
          </button>
        `
            : '<span class="text-xs text-gray-400">No actions</span>'
        }
      </td>
    </tr>
  `;
    })
    .join("");
}

/* =========================================================
PROMOTE STUDENT MODAL LOGIC
========================================================= */
const promoteModal = document.getElementById("promoteStudentModal");
const promoteModalOverlay = document.getElementById(
  "promoteStudentModalOverlay",
);
const closePromoteModalBtn = document.getElementById(
  "closePromoteStudentModal",
);
const cancelPromoteModalBtn = document.getElementById(
  "cancelPromoteStudentBtn",
);
const promoteForm = document.getElementById("promoteStudentForm");
const promoteFormMessage = document.getElementById("promoteStudentFormMessage");
const nextClassSelect = document.getElementById("nextClassId");
const confirmPromoteBtn = document.getElementById("confirmPromoteStudentBtn");
const promoteStudentNameEl = document.getElementById("promoteStudentName");
const promoteCurrentClassEl = document.getElementById("promoteCurrentClass");
const promoteLoading = document.getElementById("promoteStudentLoading");
const promoteError = document.getElementById("promoteStudentError");

let currentPromotingStudentId = null;

// Use event delegation for the dynamically created promote buttons
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".promote-student-btn");
  if (btn) {
    const studentId = btn.dataset.id;
    const student = window.teacherStudents?.find((s) => s._id === studentId);
    // Note: If you don't have a global 'teacherStudents' array, we can fetch it or pass data.
    // For simplicity, let's just pass the ID and fetch details if needed, but the backend handles security.
    openPromoteModal(studentId);
  }
});

async function openPromoteModal(studentId) {
  if (!promoteModal) return;
  currentPromotingStudentId = studentId;

  promoteModal.classList.remove("hidden");
  promoteModal.classList.add("flex");
  promoteLoading.classList.remove("hidden");
  promoteForm.classList.add("hidden");
  promoteError.classList.add("hidden");
  promoteFormMessage.classList.add("hidden");
  promoteForm.reset();

  try {
    // Fetch student details to show name and current class
    const studentRes = await apiRequest(`/admin/students/${studentId}`);
    if (!studentRes.ok) throw new Error("Failed to load student details.");
    const student = studentRes.data?.student;

    promoteStudentNameEl.textContent = student.fullname;
    promoteCurrentClassEl.textContent =
      student.class?.className || "Unknown Class";

    // Fetch all classes for the dropdown
    const classesRes = await apiRequest("/admin/classes");
    if (!classesRes.ok) throw new Error("Failed to load classes.");

    const classes = classesRes.data?.classes || [];
    nextClassSelect.innerHTML = '<option value="">Select next class</option>';

    classes.forEach((cls) => {
      // Don't show the current class in the dropdown
      if (cls._id !== student.class?._id) {
        const option = document.createElement("option");
        option.value = cls._id;
        option.textContent = cls.className;
        nextClassSelect.appendChild(option);
      }
    });

    promoteLoading.classList.add("hidden");
    promoteForm.classList.remove("hidden");
  } catch (error) {
    promoteLoading.classList.add("hidden");
    promoteError.textContent = error.message || "Failed to load data.";
    promoteError.classList.remove("hidden");
  }
}

function closePromoteModal() {
  if (!promoteModal) return;
  promoteModal.classList.add("hidden");
  promoteModal.classList.remove("flex");
  currentPromotingStudentId = null;
}

if (closePromoteModalBtn)
  closePromoteModalBtn.addEventListener("click", closePromoteModal);
if (cancelPromoteModalBtn)
  cancelPromoteModalBtn.addEventListener("click", closePromoteModal);
if (promoteModalOverlay)
  promoteModalOverlay.addEventListener("click", closePromoteModal);

if (promoteForm) {
  promoteForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentPromotingStudentId) return;

    const nextClassId = nextClassSelect.value;
    if (!nextClassId) {
      showPromoteMessage("Please select a next class.", "error");
      return;
    }

    confirmPromoteBtn.disabled = true;
    confirmPromoteBtn.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Promoting...';

    try {
      const response = await apiRequest(
        `/admin/students/${currentPromotingStudentId}/promote`,
        {
          method: "PATCH",
          body: JSON.stringify({ nextClassId }),
        },
      );

      if (!response.ok)
        throw new Error(response.data?.message || "Failed to promote student.");

      showPromoteMessage(
        response.data?.message || "Student promoted successfully!",
        "success",
      );

      setTimeout(() => {
        closePromoteModal();
        loadStudents(); // Refresh the table
      }, 1500);
    } catch (error) {
      showPromoteMessage(
        error.message || "Failed to promote student.",
        "error",
      );
      confirmPromoteBtn.disabled = false;
      confirmPromoteBtn.innerHTML =
        '<i class="fa-solid fa-arrow-up mr-2"></i> Confirm Promotion';
    }
  });
}

function showPromoteMessage(msg, type) {
  if (!promoteFormMessage) return;
  promoteFormMessage.textContent = msg;
  promoteFormMessage.className = `p-3 rounded-lg text-sm font-medium ${
    type === "error"
      ? "bg-red-50 text-red-700 border border-red-200"
      : "bg-green-50 text-green-700 border border-green-200"
  }`;
  promoteFormMessage.classList.remove("hidden");
}

function getStatusColor(status) {
  const colors = {
    Active: "bg-green-100 text-green-600",
    Graduated: "bg-blue-100 text-blue-600",
    Transferred: "bg-yellow-100 text-yellow-600",
  };
  return colors[status] || "bg-gray-100 text-gray-600";
}

/* =========================================================
CREATE STUDENT
========================================================= */
async function createStudent(event) {
  event.preventDefault();
  const saveBtn = document.getElementById("createStudentBtn");

  const payload = {
    admissionNumber: document.getElementById("admissionNumber").value.trim(),
    fullname: document.getElementById("fullname").value.trim(),
    guardianName: document.getElementById("guardianName").value.trim(),
    guardianPhone: document.getElementById("guardianPhone").value.trim(),
    gender: document.getElementById("gender").value,
    dateOfBirth: document.getElementById("dateOfBirth").value,
  };

  if (
    !payload.admissionNumber ||
    !payload.fullname ||
    !payload.guardianName ||
    !payload.gender ||
    !payload.dateOfBirth ||
    !payload.guardianPhone
  ) {
    showMessage(
      "studentFormMessage",
      "Please fill in all required fields.",
      "error",
    );
    return;
  }

  setButtonLoading(saveBtn, true, "Adding...");

  try {
    const response = await apiRequest("/admin/students", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok)
      throw new Error(response.data?.message || "Failed to add student.");

    showMessage(
      "studentFormMessage",
      response.data?.message || "Student added successfully!",
      "success",
    );
    document.getElementById("addNewStudentForm").reset();

    setTimeout(() => {
      closeAddStudentForm();
      loadStudents();
    }, 1000);
  } catch (error) {
    console.error("Failed to add student:", error);
    showMessage(
      "studentFormMessage",
      error.message || "Failed to add student.",
      "error",
    );
  } finally {
    setButtonLoading(saveBtn, false);
  }
}

/* =========================================================
UI HELPERS
========================================================= */
function closeAddStudentForm() {
  document.getElementById("addNewStudentFormBox").classList.add("hidden");
  document.getElementById("studentFormMessage").classList.add("hidden");
}

function showMessage(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `p-3 rounded-lg text-sm font-medium ${type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`;
  el.classList.remove("hidden");
}

function setButtonLoading(btn, isLoading, text) {
  if (!btn) return;
  btn.disabled = isLoading;
  btn.innerHTML = isLoading
    ? `<i class="fa-solid fa-spinner fa-spin mr-1"></i> ${text}`
    : `Add Student`;
}

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
EVENT LISTENERS
========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
  await loadInitialData();

  document.getElementById("addNewStudentBtn")?.addEventListener("click", () => {
    document.getElementById("addNewStudentFormBox").classList.remove("hidden");
  });

  document
    .getElementById("cancelAddStudentBtn")
    ?.addEventListener("click", closeAddStudentForm);
  document
    .getElementById("addNewStudentForm")
    ?.addEventListener("submit", createStudent);
});
// Bulk Promote Modal Variables
const bulkPromoteModal = document.getElementById("bulkPromoteModal");
const bulkPromoteModalOverlay = document.getElementById(
  "bulkPromoteModalOverlay",
);
const closeBulkPromoteModal = document.getElementById("closeBulkPromoteModal");
const cancelBulkPromoteBtn = document.getElementById("cancelBulkPromoteBtn");
const bulkPromoteBtn = document.getElementById("bulkPromoteBtn");
const bulkPromoteForm = document.getElementById("bulkPromoteForm");
const bulkPromoteFormMessage = document.getElementById(
  "bulkPromoteFormMessage",
);
const bulkNextClassIdSelect = document.getElementById("bulkNextClassId");
const confirmBulkPromoteBtn = document.getElementById("confirmBulkPromoteBtn");
const bulkPromoteCount = document.getElementById("bulkPromoteCount");
const bulkPromoteLoading = document.getElementById("bulkPromoteLoading");

// Open Modal
if (bulkPromoteBtn) {
  bulkPromoteBtn.addEventListener("click", async () => {
    const selectedIds = Array.from(
      document.querySelectorAll(".student-checkbox:checked"),
    ).map((cb) => cb.value);
    if (selectedIds.length === 0) return;

    if (bulkPromoteCount) bulkPromoteCount.textContent = selectedIds.length;
    if (bulkPromoteFormMessage) bulkPromoteFormMessage.classList.add("hidden");

    // ✅ CORRECT (Fetches classes dynamically)
    if (bulkNextClassIdSelect) {
      bulkNextClassIdSelect.innerHTML = `<option value="">Loading classes...</option>`;
      try {
        const classesRes = await apiRequest("/admin/classes");
        if (classesRes.ok) {
          const classesList = classesRes.data?.classes || [];
          bulkNextClassIdSelect.innerHTML = `<option value="">Select target class</option>`;
          classesList.forEach((classItem) => {
            const option = document.createElement("option");
            option.value = classItem._id;
            option.textContent = classItem.className;
            bulkNextClassIdSelect.appendChild(option);
          });
        } else {
          bulkNextClassIdSelect.innerHTML = `<option value="">Error loading classes</option>`;
        }
      } catch (error) {
        console.error("Failed to load classes for bulk promote:", error);
        bulkNextClassIdSelect.innerHTML = `<option value="">Error loading classes</option>`;
      }
    }

    bulkPromoteModal?.classList.remove("hidden");
    bulkPromoteModal?.classList.add("flex");
    bulkPromoteLoading?.classList.add("hidden");
    bulkPromoteForm?.classList.remove("hidden");
  });
}

// Close Modal functions
function closeBulkPromote() {
  bulkPromoteModal?.classList.add("hidden");
  bulkPromoteModal?.classList.remove("flex");
}
if (closeBulkPromoteModal)
  closeBulkPromoteModal.addEventListener("click", closeBulkPromote);
if (cancelBulkPromoteBtn)
  cancelBulkPromoteBtn.addEventListener("click", closeBulkPromote);
if (bulkPromoteModalOverlay)
  bulkPromoteModalOverlay.addEventListener("click", closeBulkPromote);

// Submit Bulk Promote
if (bulkPromoteForm) {
  bulkPromoteForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nextClassId = bulkNextClassIdSelect?.value;
    if (!nextClassId) {
      showBulkPromoteMessage("Please select a target class.", "error");
      return;
    }

    const selectedIds = Array.from(
      document.querySelectorAll(".student-checkbox:checked"),
    ).map((cb) => cb.value);

    confirmBulkPromoteBtn.disabled = true;
    confirmBulkPromoteBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Promoting...`;
    bulkPromoteForm.classList.add("hidden");
    bulkPromoteLoading.classList.remove("hidden");

    try {
      const response = await apiRequest("/admin/students/bulk-promote", {
        method: "POST",
        body: JSON.stringify({ studentIds: selectedIds, nextClassId }),
      });

      if (!response.ok)
        throw new Error(
          response.data?.message || "Failed to promote students.",
        );

      showBulkPromoteMessage(
        response.data?.message || "Students promoted successfully!",
        "success",
      );
      await loadStudents(); // Refresh table

      // Clear selection after success
      document
        .querySelectorAll(".student-checkbox")
        .forEach((cb) => (cb.checked = false));
      if (selectAllCheckbox) selectAllCheckbox.checked = false;
      updateBulkSelection();

      setTimeout(closeBulkPromote, 2000);
    } catch (error) {
      showBulkPromoteMessage(
        error.message || "Failed to promote students.",
        "error",
      );
      bulkPromoteLoading.classList.add("hidden");
      bulkPromoteForm.classList.remove("hidden");
    } finally {
      confirmBulkPromoteBtn.disabled = false;
      confirmBulkPromoteBtn.innerHTML = `<i class="fa-solid fa-arrow-up mr-2"></i> Confirm Promotion`;
    }
  });
}

function showBulkPromoteMessage(message, type) {
  if (!bulkPromoteFormMessage) return;
  bulkPromoteFormMessage.textContent = message;
  bulkPromoteFormMessage.className = "p-3 rounded-lg text-sm font-medium";
  if (type === "success") {
    bulkPromoteFormMessage.classList.add(
      "bg-green-50",
      "text-green-700",
      "border",
      "border-green-200",
    );
  } else {
    bulkPromoteFormMessage.classList.add(
      "bg-red-50",
      "text-red-700",
      "border",
      "border-red-200",
    );
  }
  bulkPromoteFormMessage.classList.remove("hidden");
}
