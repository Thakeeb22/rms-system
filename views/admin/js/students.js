requireAdmin();
setupLogout();
setupMobileMenu();
let students = [];
let classes = [];

const studentsBody = document.getElementById("studentsBody");

const totalStudents = document.getElementById("totalStudents");
const totalActiveStudents = document.getElementById("totalActiveStudents");
const totalTransferredStudents = document.getElementById(
  "totalTransferredStudents",
);
const totalGraduatedStudents = document.getElementById(
  "totalGraduatedStudents",
);
const totalInactiveStudents = document.getElementById("totalInactiveStudents");

const classIdSelect = document.getElementById("classId");
const editClassIdSelect = document.getElementById("editClassId");

const studentSearch = document.getElementById("studentSearch");
const classFilterBtn = document.getElementById("classFilterBtn");
const classFilterMenu = document.getElementById("classFilterMenu");

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await Promise.all([loadStudents(), loadClasses()]);

    setupStudentSearch();
    setupClassFilter();
    // Handle student opened from global search
    await openStudentFromSearch();
    await loadCurrentSessionDisplay();
    await loadCurrentTermDisplay();
  } catch (error) {
    console.error("Student Management initialization error:", error);
  }
});
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
async function loadStudents() {
  if (!studentsBody) return;

  studentsBody.innerHTML = `
    <tr>
      <td colspan="9" class="p-8 text-center text-gray-500">
        <i class="fa-solid fa-spinner fa-spin text-blue-500 text-2xl mb-2"></i>
        <p>Loading students...</p>
      </td>
    </tr>
  `;

  try {
    const response = await apiRequest("/admin/students", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to load students.");
    }

    students = response.data?.students || [];

    updateStudentStatistics(students);
    renderStudents(students);
  } catch (error) {
    console.error("Load students error:", error);

    studentsBody.innerHTML = `
      <tr>
        <td colspan="9" class="p-8 text-center text-red-500">
          <i class="fa-solid fa-circle-exclamation text-2xl mb-2"></i>
          <p>${escapeHtml(error.message || "Failed to load students.")}</p>
        </td>
      </tr>
    `;
  }
}

async function loadClasses() {
  try {
    const response = await apiRequest("/admin/classes", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to load classes.");
    }

    classes = response.data?.classes || [];

    populateClassSelect(classIdSelect);
    populateClassSelect(editClassIdSelect);
    populateClassFilter();
  } catch (error) {
    console.error("Load classes error:", error);

    if (classIdSelect) {
      classIdSelect.innerHTML = `
        <option value="">Unable to load classes</option>
      `;
    }

    if (editClassIdSelect) {
      editClassIdSelect.innerHTML = `
        <option value="">Unable to load classes</option>
      `;
    }
  }
}

function populateClassSelect(selectElement) {
  if (!selectElement) return;

  selectElement.innerHTML = `
    <option value="">Select assigned class</option>
  `;

  classes.forEach((classItem) => {
    const option = document.createElement("option");

    option.value = classItem._id;
    option.textContent = classItem.className;

    selectElement.appendChild(option);
  });
}

function updateStudentStatistics(studentList) {
  const total = studentList.length;

  const active = studentList.filter(
    (student) => student.isActive === true,
  ).length;

  const transferred = studentList.filter(
    (student) => student.status === "Transferred",
  ).length;

  const graduated = studentList.filter(
    (student) => student.status === "Graduated",
  ).length;

  const inactive = studentList.filter(
    (student) => student.isActive === false,
  ).length;

  if (totalStudents) {
    totalStudents.textContent = total;
  }

  if (totalActiveStudents) {
    totalActiveStudents.textContent = active;
  }

  if (totalTransferredStudents) {
    totalTransferredStudents.textContent = transferred;
  }

  if (totalGraduatedStudents) {
    totalGraduatedStudents.textContent = graduated;
  }

  if (totalInactiveStudents) {
    totalInactiveStudents.textContent = inactive;
  }
}

function renderStudents(studentList) {
  if (!studentsBody) return;

  if (!studentList.length) {
    studentsBody.innerHTML = `
      <tr>
        <td colspan="9" class="p-8 text-center text-gray-500">
          <div class="flex flex-col items-center gap-2">
            <i class="fa-solid fa-user-graduate text-4xl text-gray-300"></i>
            <p class="font-medium">No students found.</p>
          </div>
        </td>
      </tr>
    `;

    return;
  }

  studentsBody.innerHTML = studentList
    .map((student) => {
      const studentId = student._id || student.id;

      const fullname = student.fullname || "—";
      const admissionNumber = student.admissionNumber || "—";
      const guardianName = student.guardianName || "—";
      const gender = student.gender || "—";
      const guardianPhone = student.guardianPhone || "—";

      const className = student.class?.className || student.className || "—";

      const dateOfBirth = formatDate(student.dateOfBirth);

      const status = student.status || "Active";

      const statusClass = getStudentStatusClass(student);

      return `
        <tr
          class="border-b hover:bg-gray-50 transition"
          data-student-id="${escapeHtml(studentId)}"
        >
        <td class="p-4">
      <input type="checkbox" class="student-checkbox w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" value="${escapeHtml(studentId)}" />
    </td>
          <td class="p-4 font-semibold text-gray-800">
            ${escapeHtml(fullname)}
          </td>

          <td class="p-4 text-gray-700">
            ${escapeHtml(admissionNumber)}
          </td>

          <td class="p-4 text-gray-700">
            ${escapeHtml(guardianName)}
          </td>

          <td class="p-4 text-gray-700">
            ${escapeHtml(gender)}
          </td>

          <td class="p-4 text-gray-700">
            ${escapeHtml(guardianPhone)}
          </td>

          <td class="p-4 text-gray-700">
            ${escapeHtml(className)}
          </td>

          <td class="p-4 text-gray-700">
            ${escapeHtml(dateOfBirth)}
          </td>

          <td class="p-4">
            <span class="${statusClass}">
              ${escapeHtml(getStudentDisplayStatus(student))}
            </span>
          </td>

          <td class="p-4">
  <div class="flex items-center gap-2">

    <!-- View -->
    <button
      type="button"
      class="view-student-btn px-3 py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
      data-id="${escapeHtml(studentId)}"
      title="View student"
    >
      <i class="fa-solid fa-eye"></i>
    </button>

    <!-- Edit -->
    <button
      type="button"
      class="edit-student-btn px-3 py-2 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition"
      data-id="${escapeHtml(studentId)}"
      title="Edit student"
    >
      <i class="fa-solid fa-pen-to-square"></i>
    </button>

    <!-- Lifecycle actions -->
    <div class="relative">

      <button
        type="button"
        class="student-actions-btn px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
        data-id="${escapeHtml(studentId)}"
        title="Student actions"
      >
        <i class="fa-solid fa-ellipsis-vertical"></i>
      </button>

      <div
        class="student-actions-menu hidden absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50"
        data-menu-id="${escapeHtml(studentId)}"
      >

        ${
          getStudentDisplayStatus(student) === "Active"
            ? `
              <button
                type="button"
                class="student-action-item deactivate-student-btn w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700"
                data-id="${escapeHtml(studentId)}"
              >
                <i class="fa-solid fa-user-slash mr-2 text-gray-500"></i>
                Deactivate
              </button>
           <button
             type="button"
             class="student-action-item promote-student-btn w-full text-left px-4 py-3 hover:bg-gray-50 text-indigo-600"
             data-id="${escapeHtml(studentId)}"
           >
             <i class="fa-solid fa-arrow-up mr-2"></i>
             Promote
           </button>
              <button
                type="button"
                class="student-action-item transfer-student-btn w-full text-left px-4 py-3 hover:bg-gray-50 text-orange-600"
                data-id="${escapeHtml(studentId)}"
              >
                <i class="fa-solid fa-right-left mr-2"></i>
                Transfer
              </button>

              <button
                type="button"
                class="student-action-item graduate-student-btn w-full text-left px-4 py-3 hover:bg-gray-50 text-purple-600"
                data-id="${escapeHtml(studentId)}"
              >
                <i class="fa-solid fa-graduation-cap mr-2"></i>
                Graduate
              </button>
            `
            : ""
        }

        ${
          ["Inactive", "Transferred", "Graduated"].includes(
            getStudentDisplayStatus(student),
          )
            ? `
      <button
        type="button"
        class="student-action-item activate-student-btn w-full text-left px-4 py-3 hover:bg-gray-50 text-green-600"
        data-id="${escapeHtml(studentId)}"
      >
        <i class="fa-solid fa-user-check mr-2"></i>
        Activate
      </button>
    `
            : ""
        }
      </div>
    </div>

  </div>
</td>
        </tr>
      `;
    })
    .join("");

  setupStudentActionButtons();
}

function getStudentDisplayStatus(student) {
  if (student.status === "Graduated") {
    return "Graduated";
  }

  if (student.status === "Transferred") {
    return "Transferred";
  }

  if (student.isActive === false) {
    return "Inactive";
  }

  return "Active";
}

function getStudentStatusClass(student) {
  const status = getStudentDisplayStatus(student);

  const base =
    "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold";

  if (status === "Active") {
    return `${base} bg-green-100 text-green-700`;
  }

  if (status === "Inactive") {
    return `${base} bg-gray-100 text-gray-700`;
  }

  if (status === "Graduated") {
    return `${base} bg-purple-100 text-purple-700`;
  }

  if (status === "Transferred") {
    return `${base} bg-orange-100 text-orange-700`;
  }

  return `${base} bg-gray-100 text-gray-700`;
}

function setupStudentActionButtons() {
  const viewButtons = document.querySelectorAll(".view-student-btn");
  const editButtons = document.querySelectorAll(".edit-student-btn");
  const actionButtons = document.querySelectorAll(".student-actions-btn");

  const deactivateButtons = document.querySelectorAll(
    ".deactivate-student-btn",
  );

  const activateButtons = document.querySelectorAll(".activate-student-btn");

  const transferButtons = document.querySelectorAll(".transfer-student-btn");

  const graduateButtons = document.querySelectorAll(".graduate-student-btn");

  const promoteButtons = document.querySelectorAll(".promote-student-btn");

  // VIEW
  viewButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const studentId = button.dataset.id;

      if (!studentId) return;

      await viewStudent(studentId);
    });
  });

  // EDIT
  editButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const studentId = button.dataset.id;

      if (!studentId) return;

      await editStudent(studentId);
    });
  });

  // THREE-DOT ACTION BUTTON
  actionButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();

      const studentId = button.dataset.id;

      if (!studentId) return;

      const menu = document.querySelector(
        `.student-actions-menu[data-menu-id="${studentId}"]`,
      );

      if (!menu) {
        console.error("Student action menu not found for:", studentId);
        return;
      }

      // Close every other menu
      closeAllStudentActionMenus(studentId);

      // If this menu is already visible, close it
      if (!menu.classList.contains("hidden")) {
        menu.classList.add("hidden");
        return;
      }

      // Move menu to body so table overflow cannot hide it
      if (menu.parentElement !== document.body) {
        document.body.appendChild(menu);
      }

      const buttonRect = button.getBoundingClientRect();

      menu.classList.remove("hidden");

      // Position below the three-dot button
      let top = buttonRect.bottom + 8;
      let left = buttonRect.right - menu.offsetWidth;

      // Prevent menu from going outside right side
      if (left + menu.offsetWidth > window.innerWidth - 10) {
        left = window.innerWidth - menu.offsetWidth - 10;
      }

      // Prevent menu from going outside left side
      if (left < 10) {
        left = 10;
      }

      // If there isn't enough space below, show above
      if (top + menu.offsetHeight > window.innerHeight - 10) {
        top = buttonRect.top - menu.offsetHeight - 8;
      }

      menu.style.position = "fixed";
      menu.style.top = `${top}px`;
      menu.style.left = `${left}px`;
      menu.style.zIndex = "99999";
    });
  });

  // DEACTIVATE
  deactivateButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();

      const studentId = button.dataset.id;

      if (!studentId) return;

      closeAllStudentActionMenus();

      await deactivateStudent(studentId);
    });
  });

  // ACTIVATE
  activateButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();

      const studentId = button.dataset.id;

      if (!studentId) return;

      closeAllStudentActionMenus();

      await activateStudent(studentId);
    });
  });

  // TRANSFER
  transferButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();

      const studentId = button.dataset.id;

      if (!studentId) return;

      closeAllStudentActionMenus();

      await transferStudent(studentId);
    });
  });

  // GRADUATE
  graduateButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();

      const studentId = button.dataset.id;

      if (!studentId) return;

      closeAllStudentActionMenus();

      await graduateStudent(studentId);
    });
  });
  // PROMOTE
  promoteButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      const studentId = button.dataset.id;
      if (!studentId) return;
      closeAllStudentActionMenus();
      await openPromoteStudentModal(studentId);
    });
  });
}

function closeAllStudentActionMenus(exceptStudentId = null) {
  const menus = document.querySelectorAll(".student-actions-menu");

  menus.forEach((menu) => {
    const menuId = menu.dataset.menuId;

    if (menuId !== exceptStudentId) {
      menu.classList.add("hidden");

      // Return menu to its original container
      const originalContainer = document.querySelector(
        `[data-menu-container="${menuId}"]`,
      );

      if (originalContainer && menu.parentElement === document.body) {
        originalContainer.appendChild(menu);
        menu.style.position = "";
        menu.style.top = "";
        menu.style.left = "";
        menu.style.zIndex = "";
      }
    }
  });
}
document.addEventListener("click", () => {
  closeAllStudentActionMenus();
});

async function activateStudent(studentId) {
  const student = students.find(
    (item) => String(item._id || item.id) === String(studentId),
  );

  if (!student) return;

  const currentStatus = getStudentDisplayStatus(student);

  const confirmed = confirm(
    `Are you sure you want to restore ${student.fullname} to Active status?\n\n` +
      `Current status: ${currentStatus}\n\n` +
      `This will change the student's status to Active.`,
  );

  if (!confirmed) return;

  try {
    const response = await apiRequest(`/admin/students/${studentId}/activate`, {
      method: "PATCH",
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to activate student.");
    }

    alert(response.data?.message || "Student activated successfully.");

    await loadStudents();
  } catch (error) {
    console.error("Activate student error:", error);

    alert(error.message || "Failed to activate student.");
  }
}

async function deactivateStudent(studentId) {
  const student = students.find(
    (item) => String(item._id || item.id) === String(studentId),
  );

  if (!student) return;

  const confirmed = confirm(
    `Are you sure you want to deactivate ${student.fullname}?`,
  );

  if (!confirmed) return;

  try {
    const response = await apiRequest(
      `/admin/students/${studentId}/deactivate`,
      {
        method: "PATCH",
      },
    );

    if (!response.ok) {
      throw new Error(
        response.data?.message || "Failed to deactivate student.",
      );
    }

    alert(response.data?.message || "Student deactivated successfully.");

    await loadStudents();
  } catch (error) {
    console.error("Deactivate student error:", error);

    alert(error.message || "Failed to deactivate student.");
  }
}

async function transferStudent(studentId) {
  const student = students.find(
    (item) => String(item._id || item.id) === String(studentId),
  );

  if (!student) return;

  const confirmed = confirm(
    `Are you sure you want to mark ${student.fullname} as transferred?`,
  );

  if (!confirmed) return;

  try {
    const response = await apiRequest(`/admin/students/${studentId}/transfer`, {
      method: "PATCH",
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to transfer student.");
    }

    alert(response.data?.message || "Student transferred successfully.");

    await loadStudents();
  } catch (error) {
    console.error("Transfer student error:", error);

    alert(error.message || "Failed to transfer student.");
  }
}

async function graduateStudent(studentId) {
  const student = students.find(
    (item) => String(item._id || item.id) === String(studentId),
  );

  if (!student) return;

  const confirmed = confirm(
    `Are you sure you want to mark ${student.fullname} as graduated?`,
  );

  if (!confirmed) return;

  try {
    const response = await apiRequest(`/admin/students/${studentId}/graduate`, {
      method: "PATCH",
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to graduate student.");
    }

    alert(response.data?.message || "Student graduated successfully.");

    await loadStudents();
  } catch (error) {
    console.error("Graduate student error:", error);

    alert(error.message || "Failed to graduate student.");
  }
}

const viewStudentModal = document.getElementById("viewStudentModal");
const viewStudentModalOverlay = document.getElementById(
  "viewStudentModalOverlay",
);

const closeViewStudentModal = document.getElementById("closeViewStudentModal");

const closeViewStudentModalBtn = document.getElementById(
  "closeViewStudentModalBtn",
);

const viewStudentLoading = document.getElementById("viewStudentLoading");

const viewStudentError = document.getElementById("viewStudentError");

const viewStudentContent = document.getElementById("viewStudentContent");

const viewStudentName = document.getElementById("viewStudentName");

const viewStudentAdmissionNumber = document.getElementById(
  "viewStudentAdmissionNumber",
);

const viewStudentStatus = document.getElementById("viewStudentStatus");

const viewStudentGender = document.getElementById("viewStudentGender");

const viewStudentClass = document.getElementById("viewStudentClass");

const viewStudentDateOfBirth = document.getElementById(
  "viewStudentDateOfBirth",
);

const viewGuardianName = document.getElementById("viewGuardianName");

const viewGuardianNumber = document.getElementById("viewGuardianNumber");

async function viewStudent(studentId) {
  if (!viewStudentModal) return;

  openViewStudentModal();

  showViewStudentLoading();

  try {
    const response = await apiRequest(`/admin/students/${studentId}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(
        response.data?.message || "Failed to load student information.",
      );
    }

    const student = response.data?.student || response.data?.data;

    if (!student) {
      throw new Error("Student information was not returned by the server.");
    }

    populateViewStudentModal(student);

    showViewStudentContent();
  } catch (error) {
    console.error("View student error:", error);

    showViewStudentError(
      error.message || "Failed to load student information.",
    );
  }
}
const editStudentModal = document.getElementById("editStudentModal");

const editStudentModalOverlay = document.getElementById(
  "editStudentModalOverlay",
);

const closeEditStudentModal = document.getElementById("closeEditStudentModal");

const cancelEditStudentBtn = document.getElementById("cancelEditStudentBtn");

const editStudentLoading = document.getElementById("editStudentLoading");

const editStudentError = document.getElementById("editStudentError");

const editStudentForm = document.getElementById("editStudentForm");

const editStudentFormMessage = document.getElementById(
  "editStudentFormMessage",
);

const editFullname = document.getElementById("editFullname");

const editAdmissionNumber = document.getElementById("editAdmissionNumber");

const editDateOfBirth = document.getElementById("editDateOfBirth");

const editGuardianName = document.getElementById("editGuardianName");

const editGuardianPhoneNumber = document.getElementById(
  "editGuardianPhoneNumber",
);

const editClassId = document.getElementById("editClassId");

const saveStudentChangesBtn = document.getElementById("saveStudentChangesBtn");

let currentEditingStudentId = null;
function openViewStudentModal() {
  if (!viewStudentModal) return;

  viewStudentModal.classList.remove("hidden");
  viewStudentModal.classList.add("flex");

  document.body.classList.add("overflow-hidden");
}

function closeViewStudent() {
  if (!viewStudentModal) return;

  viewStudentModal.classList.add("hidden");
  viewStudentModal.classList.remove("flex");

  document.body.classList.remove("overflow-hidden");

  resetViewStudentModal();
}

function resetViewStudentModal() {
  if (viewStudentLoading) {
    viewStudentLoading.classList.add("hidden");
  }

  if (viewStudentError) {
    viewStudentError.classList.add("hidden");
    viewStudentError.textContent = "";
  }

  if (viewStudentContent) {
    viewStudentContent.classList.add("hidden");
  }
}

function showViewStudentLoading() {
  if (viewStudentLoading) {
    viewStudentLoading.classList.remove("hidden");
  }

  if (viewStudentError) {
    viewStudentError.classList.add("hidden");
    viewStudentError.textContent = "";
  }

  if (viewStudentContent) {
    viewStudentContent.classList.add("hidden");
  }
}

function showViewStudentContent() {
  if (viewStudentLoading) {
    viewStudentLoading.classList.add("hidden");
  }

  if (viewStudentError) {
    viewStudentError.classList.add("hidden");
  }

  if (viewStudentContent) {
    viewStudentContent.classList.remove("hidden");
  }
}

function showViewStudentError(message) {
  if (viewStudentLoading) {
    viewStudentLoading.classList.add("hidden");
  }

  if (viewStudentContent) {
    viewStudentContent.classList.add("hidden");
  }

  if (viewStudentError) {
    viewStudentError.textContent = message;
    viewStudentError.classList.remove("hidden");
  }
}

function populateViewStudentModal(student) {
  const fullname = student.fullname || "—";

  const admissionNumber = student.admissionNumber || "—";

  const gender = student.gender || "—";

  const guardianName = student.guardianName || "—";

  const guardianPhone = student.guardianPhone || "—";

  const className = student.class?.className || student.className || "—";

  const dateOfBirth = formatDate(student.dateOfBirth);

  if (viewStudentName) {
    viewStudentName.textContent = fullname;
  }

  if (viewStudentAdmissionNumber) {
    viewStudentAdmissionNumber.textContent = admissionNumber;
  }

  if (viewStudentGender) {
    viewStudentGender.textContent = gender;
  }

  if (viewStudentClass) {
    viewStudentClass.textContent = className;
  }

  if (viewStudentDateOfBirth) {
    viewStudentDateOfBirth.textContent = dateOfBirth;
  }

  if (viewGuardianName) {
    viewGuardianName.textContent = guardianName;
  }

  if (viewGuardianNumber) {
    viewGuardianNumber.textContent = guardianPhone;
  }

  if (viewStudentStatus) {
    const displayStatus = getStudentDisplayStatus(student);

    viewStudentStatus.textContent = displayStatus;

    viewStudentStatus.className = getStudentStatusClass(student);
  }
}
if (closeViewStudentModal) {
  closeViewStudentModal.addEventListener("click", closeViewStudent);
}

if (closeViewStudentModalBtn) {
  closeViewStudentModalBtn.addEventListener("click", closeViewStudent);
}

if (viewStudentModalOverlay) {
  viewStudentModalOverlay.addEventListener("click", closeViewStudent);
}

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    viewStudentModal &&
    !viewStudentModal.classList.contains("hidden")
  ) {
    closeViewStudent();
  }
});
function setupStudentSearch() {
  if (!studentSearch) return;

  studentSearch.addEventListener("input", () => {
    const searchTerm = studentSearch.value.trim().toLowerCase();

    if (!searchTerm) {
      renderStudents(students);
      return;
    }

    const filteredStudents = students.filter((student) => {
      const fullname = String(student.fullname || "").toLowerCase();

      const admissionNumber = String(
        student.admissionNumber || "",
      ).toLowerCase();

      return (
        fullname.includes(searchTerm) || admissionNumber.includes(searchTerm)
      );
    });

    renderStudents(filteredStudents);
  });
}

async function editStudent(studentId) {
  if (!editStudentModal) return;

  currentEditingStudentId = studentId;

  openEditStudentModal();

  showEditStudentLoading();

  try {
    const response = await apiRequest(`/admin/students/${studentId}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(
        response.data?.message || "Failed to load student information.",
      );
    }

    const student = response.data?.student || response.data?.data;

    if (!student) {
      throw new Error("Student information was not returned by the server.");
    }

    populateEditStudentForm(student);

    showEditStudentForm();
  } catch (error) {
    console.error("Edit student load error:", error);

    showEditStudentError(
      error.message || "Failed to load student information.",
    );
  }
}

function populateEditStudentForm(student) {
  if (editFullname) {
    editFullname.value = student.fullname || "";
  }

  if (editAdmissionNumber) {
    editAdmissionNumber.value = student.admissionNumber || "";
  }

  if (editDateOfBirth) {
    editDateOfBirth.value = formatDateForInput(student.dateOfBirth);
  }

  if (editGuardianName) {
    editGuardianName.value = student.guardianName || "";
  }

  if (editGuardianPhoneNumber) {
    editGuardianPhoneNumber.value = student.guardianPhone || "";
  }

  if (editClassId) {
    const classId = student.class?._id || student.class || "";

    editClassId.value = classId;
  }

  const genderInputs = editStudentForm?.querySelectorAll(
    'input[name="gender"]',
  );

  genderInputs?.forEach((input) => {
    input.checked = input.value === student.gender;
  });
}

function formatDateForInput(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

if (editStudentForm) {
  editStudentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentEditingStudentId) {
      return;
    }

let photoBase64 = "";
    if (editStudentPhotoInput.files && editStudentPhotoInput.files[0]) {
      if (editStudentPhotoInput.files[0].size > 2 * 1024 * 1024) {
        showEditFormMessage("Photo must be less than 2MB.", "error");
        setEditStudentSaving(false);
        return;
      }
      photoBase64 = await convertToBase64(editStudentPhotoInput.files[0]);
    }

    const selectedGender = editStudentForm.querySelector(
      'input[name="gender"]:checked',
    );

    const payload = {
      fullname: editFullname?.value.trim(),
      admissionNumber: editAdmissionNumber?.value.trim(),
      gender: selectedGender?.value,
      dateOfBirth: editDateOfBirth?.value,
      guardianName: editGuardianName?.value.trim(),
      guardianPhone: editGuardianPhoneNumber?.value.trim(),
      classId: editClassId?.value,
      photo: photoBase64,
    };

    if (
      !payload.fullname ||
      !payload.admissionNumber ||
      !payload.gender ||
      !payload.dateOfBirth ||
      !payload.guardianName ||
      !payload.guardianPhone ||
      !payload.classId
    ) {
      showEditFormMessage("Please fill in all required fields.", "error");

      return;
    }

    setEditStudentSaving(true);

    try {
      const response = await apiRequest(
        `/admin/students/${currentEditingStudentId}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error(response.data?.message || "Failed to update student.");
      }

      showEditFormMessage(
        response.data?.message || "Student updated successfully.",
        "success",
      );

      await loadStudents();

      setTimeout(() => {
        closeEditStudent();
      }, 1000);
    } catch (error) {
      console.error("Update student error:", error);

      showEditFormMessage(
        error.message || "Failed to update student.",
        "error",
      );
    } finally {
      setEditStudentSaving(false);
    }
  });
}

function setEditStudentSaving(isSaving) {
  if (!saveStudentChangesBtn) return;

  saveStudentChangesBtn.disabled = isSaving;

  if (isSaving) {
    saveStudentChangesBtn.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin mr-2"></i>
      Saving Changes...
    `;
  } else {
    saveStudentChangesBtn.innerHTML = `
      <i class="fa-solid fa-floppy-disk mr-2"></i>
      Save Changes
    `;
  }
}

function showEditFormMessage(message, type) {
  if (!editStudentFormMessage) return;

  editStudentFormMessage.textContent = message;

  editStudentFormMessage.className = "p-3 rounded-lg text-sm font-medium";

  if (type === "success") {
    editStudentFormMessage.classList.add(
      "bg-green-50",
      "text-green-700",
      "border",
      "border-green-200",
    );
  } else {
    editStudentFormMessage.classList.add(
      "bg-red-50",
      "text-red-700",
      "border",
      "border-red-200",
    );
  }

  editStudentFormMessage.classList.remove("hidden");
}

if (closeEditStudentModal) {
  closeEditStudentModal.addEventListener("click", closeEditStudent);
}

if (cancelEditStudentBtn) {
  cancelEditStudentBtn.addEventListener("click", closeEditStudent);
}

if (editStudentModalOverlay) {
  editStudentModalOverlay.addEventListener("click", closeEditStudent);
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  if (viewStudentModal && !viewStudentModal.classList.contains("hidden")) {
    closeViewStudent();
    return;
  }

  if (editStudentModal && !editStudentModal.classList.contains("hidden")) {
    closeEditStudent();
  }
});

function openEditStudentModal() {
  editStudentModal.classList.remove("hidden");
  editStudentModal.classList.add("flex");

  document.body.classList.add("overflow-hidden");
}

function closeEditStudent() {
  if (!editStudentModal) return;

  editStudentModal.classList.add("hidden");
  editStudentModal.classList.remove("flex");

  document.body.classList.remove("overflow-hidden");

  currentEditingStudentId = null;

  resetEditStudentModal();
}

function resetEditStudentModal() {
  if (editStudentLoading) {
    editStudentLoading.classList.add("hidden");
  }

  if (editStudentError) {
    editStudentError.classList.add("hidden");
    editStudentError.textContent = "";
  }

  if (editStudentForm) {
    editStudentForm.classList.add("hidden");
  }

  if (editStudentFormMessage) {
    editStudentFormMessage.classList.add("hidden");
    editStudentFormMessage.textContent = "";
  }
}

function showEditStudentLoading() {
  if (editStudentLoading) {
    editStudentLoading.classList.remove("hidden");
  }

  if (editStudentError) {
    editStudentError.classList.add("hidden");
  }

  if (editStudentForm) {
    editStudentForm.classList.add("hidden");
  }
}

function showEditStudentForm() {
  if (editStudentLoading) {
    editStudentLoading.classList.add("hidden");
  }

  if (editStudentError) {
    editStudentError.classList.add("hidden");
  }

  if (editStudentForm) {
    editStudentForm.classList.remove("hidden");
  }
}

function showEditStudentError(message) {
  if (editStudentLoading) {
    editStudentLoading.classList.add("hidden");
  }

  if (editStudentForm) {
    editStudentForm.classList.add("hidden");
  }

  if (editStudentError) {
    editStudentError.textContent = message;
    editStudentError.classList.remove("hidden");
  }
}

function populateClassFilter() {
  if (!classFilterMenu) return;

  classFilterMenu.innerHTML = "";

  const allClassesButton = document.createElement("button");

  allClassesButton.type = "button";
  allClassesButton.className =
    "block w-full text-left px-4 py-3 hover:bg-gray-100 transition";

  allClassesButton.textContent = "All Classes";

  allClassesButton.addEventListener("click", () => {
    if (classFilterBtn) {
      classFilterBtn.textContent = "All Classes";
    }

    renderStudents(students);
    classFilterMenu.classList.add("hidden");
  });

  classFilterMenu.appendChild(allClassesButton);

  classes.forEach((classItem) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className =
      "block w-full text-left px-4 py-3 hover:bg-gray-100 transition";

    button.textContent = classItem.className;

    button.addEventListener("click", () => {
      if (classFilterBtn) {
        classFilterBtn.textContent = classItem.className;
      }

      const filteredStudents = students.filter(
        (student) =>
          student.class?._id === classItem._id ||
          student.class === classItem._id,
      );

      renderStudents(filteredStudents);

      classFilterMenu.classList.add("hidden");
    });

    classFilterMenu.appendChild(button);
  });
}

// ============================================================
// ADD NEW STUDENT
// ============================================================

const addNewStudentBtn = document.getElementById("addNewStudentBtn");
const addNewStudentFormBox = document.getElementById("addNewStudentFormBox");
const closeAddStudentFormBtn = document.getElementById(
  "closeAddStudentFormBtn",
);
const cancelAddStudentBtn = document.getElementById("cancelAddStudentBtn");

const addNewStudentForm = document.getElementById("addNewStudentForm");
const studentFormMessage = document.getElementById("studentFormMessage");
const studentCreatedBox = document.getElementById("studentCreatedBox");

const admissionNumberInput = document.getElementById("admissionNumber");

const fullnameInput = document.getElementById("fullname");

const guardianNameInput = document.getElementById("guardianName");

const dateOfBirthInput = document.getElementById("dateOfBirth");

const guardianPhoneInput = document.getElementById("guardianPhone");

const classIdInput = document.getElementById("classId");

const createStudentBtn = document.getElementById("createStudentBtn");

const studentPhotoInput = document.getElementById("studentPhoto");
const editStudentPhotoInput = document.getElementById("editStudentPhoto");
// ------------------------------------------------------------
// Open Add Student Form
// ------------------------------------------------------------

function openAddStudentForm() {
  if (!addNewStudentFormBox) return;

  addNewStudentFormBox.classList.remove("hidden");

  // Scroll the form into view
  addNewStudentFormBox.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  // Focus first input
  setTimeout(() => {
    admissionNumberInput?.focus();
  }, 300);
}

// ------------------------------------------------------------
// Close Add Student Form
// ------------------------------------------------------------

function closeAddStudentForm() {
  if (!addNewStudentFormBox) return;

  addNewStudentFormBox.classList.add("hidden");

  resetAddStudentForm();
}

// ------------------------------------------------------------
// Reset Form
// ------------------------------------------------------------

function resetAddStudentForm() {
  if (addNewStudentForm) {
    addNewStudentForm.reset();
  }

  hideStudentFormMessage();

  if (studentCreatedBox) {
    studentCreatedBox.classList.add("hidden");
  }

  // Restore create button
  if (createStudentBtn) {
    createStudentBtn.disabled = false;

    createStudentBtn.innerHTML = `
      <i class="fa-solid fa-user-plus mr-2"></i>
      Create Student
    `;
  }
}

// ------------------------------------------------------------
// Show Form Message
// ------------------------------------------------------------

function showStudentFormMessage(message, type = "error") {
  if (!studentFormMessage) return;

  studentFormMessage.textContent = message;

  studentFormMessage.className = "p-3 rounded-lg text-sm font-medium";

  if (type === "success") {
    studentFormMessage.classList.add(
      "bg-green-50",
      "text-green-700",
      "border",
      "border-green-200",
    );
  } else {
    studentFormMessage.classList.add(
      "bg-red-50",
      "text-red-700",
      "border",
      "border-red-200",
    );
  }

  studentFormMessage.classList.remove("hidden");
}

// ------------------------------------------------------------
// Hide Form Message
// ------------------------------------------------------------

function hideStudentFormMessage() {
  if (!studentFormMessage) return;

  studentFormMessage.className = "hidden p-3 rounded-lg text-sm font-medium";

  studentFormMessage.textContent = "";
}

// ------------------------------------------------------------
// Set Create Button Loading State
// ------------------------------------------------------------

function setCreateStudentSaving(isSaving) {
  if (!createStudentBtn) return;

  createStudentBtn.disabled = isSaving;

  if (isSaving) {
    createStudentBtn.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin mr-2"></i>
      Creating Student...
    `;
  } else {
    createStudentBtn.innerHTML = `
      <i class="fa-solid fa-user-plus mr-2"></i>
      Create Student
    `;
  }
}

// ------------------------------------------------------------
// Add Button
// ------------------------------------------------------------

if (addNewStudentBtn) {
  addNewStudentBtn.addEventListener("click", openAddStudentForm);
}

// ------------------------------------------------------------
// Close Button
// ------------------------------------------------------------

if (closeAddStudentFormBtn) {
  closeAddStudentFormBtn.addEventListener("click", closeAddStudentForm);
}

// ------------------------------------------------------------
// Cancel Button
// ------------------------------------------------------------

if (cancelAddStudentBtn) {
  cancelAddStudentBtn.addEventListener("click", closeAddStudentForm);
}

// ------------------------------------------------------------
// Submit Form
// ------------------------------------------------------------

if (addNewStudentForm) {
  addNewStudentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    hideStudentFormMessage();

    let photoBase64 = "";
    if (studentPhotoInput.files && studentPhotoInput.files[0]) {
      if (studentPhotoInput.files[0].size > 2 * 1024 * 1024) {
        showStudentFormMessage("Photo must be less than 2MB.", "error");
        setCreateStudentSaving(false);
        return;
      }
      photoBase64 = await convertToBase64(studentPhotoInput.files[0]);
    }

    // Get selected gender
    const selectedGender = addNewStudentForm.querySelector(
      'input[name="gender"]:checked',
    );

    const payload = {
      admissionNumber: admissionNumberInput?.value.trim(),

      fullname: fullnameInput?.value.trim(),

      guardianName: guardianNameInput?.value.trim(),

      gender: selectedGender?.value,

      dateOfBirth: dateOfBirthInput?.value,

      guardianPhone: guardianPhoneInput?.value.trim(),

      classId: classIdInput?.value,
      photo: photoBase64,
    };

    // ------------------------------------------------------
    // Client-side validation
    // ------------------------------------------------------

    if (!payload.admissionNumber) {
      showStudentFormMessage("Please enter the admission number.");

      admissionNumberInput?.focus();
      return;
    }

    if (!payload.fullname) {
      showStudentFormMessage("Please enter the student's full name.");

      fullnameInput?.focus();
      return;
    }

    if (!payload.guardianName) {
      showStudentFormMessage("Please enter the guardian's name.");

      guardianNameInput?.focus();
      return;
    }

    if (!payload.gender) {
      showStudentFormMessage("Please select the student's gender.");

      return;
    }

    if (!payload.dateOfBirth) {
      showStudentFormMessage("Please select the student's date of birth.");

      dateOfBirthInput?.focus();
      return;
    }

    if (!payload.guardianPhone) {
      showStudentFormMessage("Please enter the guardian's phone number.");

      guardianPhoneInput?.focus();
      return;
    }

    if (!payload.classId) {
      showStudentFormMessage("Please select the student's assigned class.");

      classIdInput?.focus();
      return;
    }

    // ------------------------------------------------------
    // Send request
    // ------------------------------------------------------

    setCreateStudentSaving(true);

    try {
      const response = await apiRequest("/admin/students", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // ----------------------------------------------------
      // Handle API error
      // ----------------------------------------------------

      if (!response.ok) {
        throw new Error(response.data?.message || "Failed to create student.");
      }

      // ----------------------------------------------------
      // Success
      // ----------------------------------------------------

      showStudentFormMessage(
        response.data?.message || "Student created successfully.",
        "success",
      );

      // Show success box
      if (studentCreatedBox) {
        studentCreatedBox.classList.remove("hidden");
      }

      // Reload students
      await loadStudents();

      // Close after a short delay
      setTimeout(() => {
        closeAddStudentForm();
      }, 1200);
    } catch (error) {
      console.error("Create student error:", error);

      showStudentFormMessage(
        error.message || "Failed to create student.",
        "error",
      );
    } finally {
      setCreateStudentSaving(false);
    }
  });
}

// PROMOTE STUDENT MODAL
const promoteStudentModal = document.getElementById("promoteStudentModal");
const promoteStudentModalOverlay = document.getElementById(
  "promoteStudentModalOverlay",
);
const closePromoteStudentModal = document.getElementById(
  "closePromoteStudentModal",
);
const cancelPromoteStudentBtn = document.getElementById(
  "cancelPromoteStudentBtn",
);
const promoteStudentForm = document.getElementById("promoteStudentForm");
const promoteStudentFormMessage = document.getElementById(
  "promoteStudentFormMessage",
);
const nextClassIdSelect = document.getElementById("nextClassId");
const confirmPromoteStudentBtn = document.getElementById(
  "confirmPromoteStudentBtn",
);
const promoteStudentName = document.getElementById("promoteStudentName");
const promoteCurrentClass = document.getElementById("promoteCurrentClass");
const promoteStudentLoading = document.getElementById("promoteStudentLoading");
const promoteStudentError = document.getElementById("promoteStudentError");

let currentPromotingStudentId = null;

function openPromoteStudentModal(studentId) {
  if (!promoteStudentModal) return;
  currentPromotingStudentId = studentId;
  const student = students.find(
    (item) => String(item._id || item.id) === String(studentId),
  );
  if (!student) return;

  promoteStudentModal.classList.remove("hidden");
  promoteStudentModal.classList.add("flex");
  document.body.classList.add("overflow-hidden");

  if (promoteStudentName) promoteStudentName.textContent = student.fullname;
  if (promoteCurrentClass)
    promoteCurrentClass.textContent =
      student.class?.className || "Unknown Class";

  showPromoteStudentLoading();
  populateNextClassSelect(student.class?._id);
}

function closePromoteStudent() {
  if (!promoteStudentModal) return;
  promoteStudentModal.classList.add("hidden");
  promoteStudentModal.classList.remove("flex");
  document.body.classList.remove("overflow-hidden");
  currentPromotingStudentId = null;
  resetPromoteStudentModal();
}

function resetPromoteStudentModal() {
  if (promoteStudentLoading) promoteStudentLoading.classList.add("hidden");
  if (promoteStudentError) {
    promoteStudentError.classList.add("hidden");
    promoteStudentError.textContent = "";
  }
  if (promoteStudentForm) promoteStudentForm.classList.add("hidden");
  if (promoteStudentFormMessage) {
    promoteStudentFormMessage.classList.add("hidden");
    promoteStudentFormMessage.textContent = "";
  }
  if (promoteStudentForm) promoteStudentForm.reset();
}

function showPromoteStudentLoading() {
  if (promoteStudentLoading) promoteStudentLoading.classList.remove("hidden");
  if (promoteStudentError) promoteStudentError.classList.add("hidden");
  if (promoteStudentForm) promoteStudentForm.classList.add("hidden");
}

function showPromoteStudentForm() {
  if (promoteStudentLoading) promoteStudentLoading.classList.add("hidden");
  if (promoteStudentError) promoteStudentError.classList.add("hidden");
  if (promoteStudentForm) promoteStudentForm.classList.remove("hidden");
}

function populateNextClassSelect(currentClassId) {
  if (!nextClassIdSelect) return;
  nextClassIdSelect.innerHTML = `<option value="">Select next class</option>`;
  classes.forEach((classItem) => {
    if (classItem._id !== currentClassId) {
      const option = document.createElement("option");
      option.value = classItem._id;
      option.textContent = classItem.className;
      nextClassIdSelect.appendChild(option);
    }
  });
  showPromoteStudentForm();
}

if (promoteStudentForm) {
  promoteStudentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentPromotingStudentId) return;

    const nextClassId = nextClassIdSelect?.value;
    if (!nextClassId) {
      showPromoteFormMessage("Please select a next class.", "error");
      return;
    }

    setPromoteStudentSaving(true);
    try {
      const response = await apiRequest(
        `/admin/students/${currentPromotingStudentId}/promote`,
        {
          method: "PATCH",
          body: JSON.stringify({ nextClassId }),
        },
      );
      if (!response.ok) {
        throw new Error(response.data?.message || "Failed to promote student.");
      }
      showPromoteFormMessage(
        response.data?.message || "Student promoted successfully.",
        "success",
      );
      await loadStudents();
      setTimeout(() => {
        closePromoteStudent();
      }, 1500);
    } catch (error) {
      console.error("Promote student error:", error);
      showPromoteFormMessage(
        error.message || "Failed to promote student.",
        "error",
      );
    } finally {
      setPromoteStudentSaving(false);
    }
  });
}

function showPromoteFormMessage(message, type) {
  if (!promoteStudentFormMessage) return;
  promoteStudentFormMessage.textContent = message;
  promoteStudentFormMessage.className = "p-3 rounded-lg text-sm font-medium";
  if (type === "success") {
    promoteStudentFormMessage.classList.add(
      "bg-green-50",
      "text-green-700",
      "border",
      "border-green-200",
    );
  } else {
    promoteStudentFormMessage.classList.add(
      "bg-red-50",
      "text-red-700",
      "border",
      "border-red-200",
    );
  }
  promoteStudentFormMessage.classList.remove("hidden");
}

function setPromoteStudentSaving(isSaving) {
  if (!confirmPromoteStudentBtn) return;
  confirmPromoteStudentBtn.disabled = isSaving;
  if (isSaving) {
    confirmPromoteStudentBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Promoting...`;
  } else {
    confirmPromoteStudentBtn.innerHTML = `<i class="fa-solid fa-arrow-up mr-2"></i> Confirm Promotion`;
  }
}

if (closePromoteStudentModal)
  closePromoteStudentModal.addEventListener("click", closePromoteStudent);
if (cancelPromoteStudentBtn)
  cancelPromoteStudentBtn.addEventListener("click", closePromoteStudent);
if (promoteStudentModalOverlay)
  promoteStudentModalOverlay.addEventListener("click", closePromoteStudent);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (
    promoteStudentModal &&
    !promoteStudentModal.classList.contains("hidden")
  ) {
    closePromoteStudent();
  }
});

function setupClassFilter() {
  if (!classFilterBtn || !classFilterMenu) return;

  classFilterBtn.addEventListener("click", (event) => {
    event.stopPropagation();

    classFilterMenu.classList.toggle("hidden");
  });

  document.addEventListener("click", (event) => {
    if (
      !classFilterMenu.contains(event.target) &&
      !classFilterBtn.contains(event.target)
    ) {
      classFilterMenu.classList.add("hidden");
    }
  });
}

function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function openStudentFromSearch() {
  const params = new URLSearchParams(window.location.search);
  const studentId = params.get("studentId");

  if (!studentId) return;

  await viewStudent(studentId);

  // Remove the query parameter from the URL
  window.history.replaceState({}, document.title, window.location.pathname);
}
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
  bulkPromoteBtn.addEventListener("click", () => {
    const selectedIds = Array.from(
      document.querySelectorAll(".student-checkbox:checked"),
    ).map((cb) => cb.value);
    if (selectedIds.length === 0) return;

    if (bulkPromoteCount) bulkPromoteCount.textContent = selectedIds.length;
    if (bulkPromoteFormMessage) bulkPromoteFormMessage.classList.add("hidden");

    // Populate classes dropdown
    if (bulkNextClassIdSelect) {
      bulkNextClassIdSelect.innerHTML = `<option value="">Select target class</option>`;
      classes.forEach((classItem) => {
        const option = document.createElement("option");
        option.value = classItem._id;
        option.textContent = classItem.className;
        bulkNextClassIdSelect.appendChild(option);
      });
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
// Helper function to convert File to Base64
const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};
