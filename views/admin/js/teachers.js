requireAdmin();

let teachers = [];
let classes = [];
let subjects = [];

let teacherFilters = {
  search: "",
  subject: "",
};

document.addEventListener("DOMContentLoaded", () => {
  initializeTeachersPage();
});

async function initializeTeachersPage() {
  await Promise.all([
    loadTeachers(),
    loadClasses(),
    loadSubjects(),
    loadSearchData(),
  ]);

  setupTeacherSearch();
  setupGlobalSearch();
  setupTeacherForm();
  setupAddTeacherButton();
  setupSubjectFilter();
  setupLogoutButtons();
  setupMobileMenu();

  setupViewTeacherModal();

  setupEditTeacherModal();
  setupEditTeacherForm();

  // Handle teacher opened from global search
  openTeacherFromSearch();
}
async function openTeacherFromSearch() {
  const params = new URLSearchParams(window.location.search);
  const teacherId = params.get("teacherId");

  if (!teacherId) return;

  await viewTeacher(teacherId);

  // Remove the query parameter from the URL
  window.history.replaceState({}, document.title, window.location.pathname);
}
async function loadTeachers() {
  try {
    const response = await apiRequest("/admin/teachers", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(response.data.message || "Failed to load teachers.");
    }

    teachers = response.data.teachers || [];

    renderTeachers();
    updateTeacherStats();
  } catch (error) {
    console.error("Error loading teachers:", error);

    alert(error.message || "Failed to load teachers.");
  }
}
function renderTeachers(data = teachers) {
  const teachersBody = document.getElementById("teachersBody");

  if (!teachersBody) return;

  teachersBody.innerHTML = "";

  if (data.length === 0) {
    teachersBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center p-6 text-gray-500">
          No teachers found.
        </td>
      </tr>
    `;

    return;
  }

  data.forEach((teacher) => {
    const row = document.createElement("tr");

    row.className = "border-b hover:bg-gray-50";

    const subjectNames = teacher.subjects?.length
      ? teacher.subjects.map((subject) => subject.subjectName).join(", ")
      : "No subject";

    const className = teacher.assignedClass?.className || "No class";

    row.innerHTML = `
      <td class="p-4 font-semibold text-gray-800">
        ${teacher.fullname || "N/A"}
      </td>

      <td class="p-4 text-gray-800">
        ${teacher.email || "N/A"}
      </td>

      <td class="p-4 text-gray-800">
        ${className}
      </td>

      <td class="p-4 text-gray-800">
        ${subjectNames}
      </td>

      <td class="p-4">
        <div class="flex gap-2">

          <button
            class="viewTeacherBtn bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
            data-id="${teacher._id}"
            title="View Teacher"
          >
            <i class="fa-solid fa-eye"></i>
          </button>

          <button
            class="editTeacherBtn bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600"
            data-id="${teacher._id}"
            title="Edit Teacher"
          >
            <i class="fa-solid fa-pen"></i>
          </button>

          ${
            teacher.status === "active"
              ? `
                <button
                  class="deactivateTeacherBtn bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                  data-id="${teacher._id}"
                  title="Deactivate Teacher"
                >
                  <i class="fa-solid fa-user-slash"></i>
                </button>
              `
              : `
                <button
                  class="activateTeacherBtn bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600"
                  data-id="${teacher._id}"
                  title="Activate Teacher"
                >
                  <i class="fa-solid fa-check"></i>
                </button>
              `
          }

        </div>
      </td>
    `;

    teachersBody.appendChild(row);
  });

  attachTeacherActions();
}
function updateTeacherStats() {
  const totalTeachers = teachers.length;

  const activeTeachers = teachers.filter(
    (teacher) => teacher.status === "active",
  ).length;

  const inactiveTeachers = teachers.filter(
    (teacher) => teacher.status === "inactive",
  ).length;

  document.getElementById("totalTeachers").textContent = totalTeachers;

  document.getElementById("totalActiveTeachers").textContent = activeTeachers;

  document.getElementById("totalInactiveTeachers").textContent =
    inactiveTeachers;
}
async function loadClasses() {
  try {
    const response = await apiRequest("/admin/classes", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(response.data.message || "Failed to load classes.");
    }

    classes = response.data.classes || [];

    populateClassSelect();
  } catch (error) {
    console.error("Error loading classes:", error);

    alert(error.message || "Failed to load classes.");
  }
}
function populateClassSelect() {
  const select = document.getElementById("assignedClass");

  if (!select) return;

  select.innerHTML = `
    <option value="">Select Assigned Class</option>
  `;

  classes.forEach((classItem) => {
    const option = document.createElement("option");

    option.value = classItem._id;
    option.textContent = classItem.className;

    select.appendChild(option);
  });
}
async function loadSubjects() {
  try {
    const response = await apiRequest("/admin/subjects", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(response.data.message || "Failed to load subjects.");
    }

    subjects = response.data.subjects || [];

    populateSubjectSelect();
    populateSubjectFilter();
  } catch (error) {
    console.error("Error loading subjects:", error);

    alert(error.message || "Failed to load subjects.");
  }
}
function populateSubjectSelect() {
  const select = document.getElementById("subjects");

  if (!select) return;

  select.innerHTML = "";

  if (subjects.length === 0) {
    const option = document.createElement("option");

    option.disabled = true;
    option.textContent = "No subjects available";

    select.appendChild(option);

    return;
  }

  subjects.forEach((subject) => {
    const option = document.createElement("option");

    option.value = subject._id;
    option.textContent = subject.subjectName;

    select.appendChild(option);
  });
}
function setupTeacherForm() {
  const form = document.getElementById("addNewTeacherForm");

  if (!form) return;

  const submitButton = form.querySelector('button[type="submit"]');

  const messageBox = document.getElementById("teacherFormMessage");

  const createdBox = document.getElementById("teacherCreatedBox");

  const temporaryPassword = document.getElementById("temporaryPassword");

  const copyPasswordBtn = document.getElementById("copyTemporaryPassword");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    hideMessage("teacherFormMessage");

    if (createdBox) {
      createdBox.classList.add("hidden");
    }

    const fullname = document.getElementById("fullname").value.trim();

    const email = document.getElementById("email").value.trim();

    const phone = document.getElementById("phoneNumber").value.trim();

    const assignedClass = document.getElementById("assignedClass").value;

    const subjectSelect = document.getElementById("subjects");

    const selectedSubjects = Array.from(subjectSelect.selectedOptions)
      .map((option) => option.value)
      .filter(Boolean);

    // Validation
    if (!fullname) {
      showMessage(
        "teacherFormMessage",
        "Please enter the teacher's full name.",
      );
      document.getElementById("fullname").focus();
      return;
    }

    if (!email) {
      showMessage(
        "teacherFormMessage",
        "Please enter the teacher's email address.",
      );
      document.getElementById("email").focus();
      return;
    }

    if (!phone) {
      showMessage(
        "teacherFormMessage",
        "Please enter the teacher's phone number.",
      );
      document.getElementById("phoneNumber").focus();
      return;
    }

    if (!assignedClass) {
      showMessage(
        "teacherFormMessage",
        "Please select the teacher's assigned class.",
      );
      document.getElementById("assignedClass").focus();
      return;
    }

    if (selectedSubjects.length === 0) {
      showMessage(
        "teacherFormMessage",
        "Please assign at least one subject to the teacher.",
      );
      subjectSelect.focus();
      return;
    }

    setButtonLoading(submitButton, true, "Creating...");

    try {
      const response = await apiRequest("/admin/teachers", {
        method: "POST",

        body: JSON.stringify({
          fullname,
          email,
          phone,
          assignedClass,
          subjects: selectedSubjects,
        }),
      });

      if (!response.ok) {
        throw new Error(response.data?.message || "Failed to create teacher.");
      }

      const teacher = response.data.teacher;
      const generatedPassword = response.data.temporaryPassword;

      // Show success message
      showMessage(
        "teacherFormMessage",
        `${teacher.fullname} has been added successfully.`,
        "success",
      );

      // Show temporary password
      if (createdBox && temporaryPassword) {
        temporaryPassword.textContent = generatedPassword || "Not provided";

        createdBox.classList.remove("hidden");
      }

      // Reset form
      form.reset();

      // Refresh teacher data
      await loadTeachers();

      // Refresh global search data
      await loadSearchData();
    } catch (error) {
      console.error("Create teacher error:", error);

      showMessage(
        "teacherFormMessage",
        error.message || "Failed to create teacher.",
      );
    } finally {
      setButtonLoading(submitButton, false);
    }
  });

  // Copy temporary password
  if (copyPasswordBtn) {
    copyPasswordBtn.addEventListener("click", async () => {
      const password = temporaryPassword?.textContent?.trim();

      if (!password) return;

      try {
        await navigator.clipboard.writeText(password);

        const originalHTML = copyPasswordBtn.innerHTML;

        copyPasswordBtn.innerHTML = '<i class="fa-solid fa-check"></i>';

        setTimeout(() => {
          copyPasswordBtn.innerHTML = originalHTML;
        }, 1500);
      } catch (error) {
        console.error("Failed to copy password:", error);
      }
    });
  }
}
// function showTeacherFormMessage(message) {
//   const element = document.getElementById("teacherFormMessage");

//   if (!element) return;

//   element.textContent = message;

//   element.classList.remove(
//     "hidden",
//     "bg-green-50",
//     "text-green-700",
//     "border-green-200",
//   );

//   element.classList.add(
//     "bg-red-50",
//     "text-red-700",
//     "border",
//     "border-red-200",
//   );
// }

// function showTeacherFormSuccess(message) {
//   const element = document.getElementById("teacherFormMessage");

//   if (!element) return;

//   element.textContent = message;

//   element.classList.remove(
//     "hidden",
//     "bg-red-50",
//     "text-red-700",
//     "border-red-200",
//   );

//   element.classList.add(
//     "bg-green-50",
//     "text-green-700",
//     "border",
//     "border-green-200",
//   );
// }

// function hideTeacherFormMessage() {
//   const element = document.getElementById("teacherFormMessage");

//   if (!element) return;

//   element.classList.add("hidden");
// }
function setupAddTeacherButton() {
  const addNewTeacherBtn = document.getElementById("addNewTeacherBtn");

  const addNewTeacherFormBox = document.getElementById("addNewTeacherFormBox");

  const closeAddTeacherFormBtn = document.getElementById(
    "closeAddTeacherFormBtn",
  );

  const cancelAddTeacherBtn = document.getElementById("cancelAddTeacherBtn");

  if (!addNewTeacherBtn || !addNewTeacherFormBox) {
    return;
  }

  function closeForm() {
    addNewTeacherFormBox.classList.add("hidden");

    addNewTeacherBtn.innerHTML = `
      <i class="fa-solid fa-user-plus"></i>
      Add New Teacher
    `;

    hideTeacherFormMessage();
  }

  function openForm() {
    addNewTeacherFormBox.classList.remove("hidden");

    addNewTeacherBtn.innerHTML = `
      <i class="fa-solid fa-xmark"></i>
      Close Form
    `;

    // Scroll the form into view
    addNewTeacherFormBox.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  addNewTeacherBtn.addEventListener("click", () => {
    const isHidden = addNewTeacherFormBox.classList.contains("hidden");

    if (isHidden) {
      openForm();
    } else {
      closeForm();
    }
  });

  if (closeAddTeacherFormBtn) {
    closeAddTeacherFormBtn.addEventListener("click", closeForm);
  }

  if (cancelAddTeacherBtn) {
    cancelAddTeacherBtn.addEventListener("click", closeForm);
  }
}
async function deactivateTeacher(id) {
  const confirmed = confirm(
    "Are you sure you want to deactivate this teacher?",
  );

  if (!confirmed) return;

  try {
    const response = await apiRequest(`/admin/teachers/${id}/deactivate`, {
      method: "PATCH",
    });

    if (!response.ok) {
      throw new Error(response.data.message || "Failed to deactivate teacher.");
    }

    alert(response.data.message);

    await loadTeachers();
  } catch (error) {
    console.error(error);

    alert(error.message || "Failed to deactivate teacher.");
  }
}
async function activateTeacher(id) {
  try {
    const response = await apiRequest(`/admin/teachers/${id}/activate`, {
      method: "PATCH",
    });

    if (!response.ok) {
      throw new Error(response.data.message || "Failed to activate teacher.");
    }

    alert(response.data.message);

    await loadTeachers();
  } catch (error) {
    console.error(error);

    alert(error.message || "Failed to activate teacher.");
  }
}
function attachTeacherActions() {
  document.querySelectorAll(".viewTeacherBtn").forEach((button) => {
    button.addEventListener("click", () => {
      viewTeacher(button.dataset.id);
    });
  });

  document.querySelectorAll(".editTeacherBtn").forEach((button) => {
    button.addEventListener("click", () => {
      editTeacher(button.dataset.id);
    });
  });

  document.querySelectorAll(".deactivateTeacherBtn").forEach((button) => {
    button.addEventListener("click", () => {
      deactivateTeacher(button.dataset.id);
    });
  });

  document.querySelectorAll(".activateTeacherBtn").forEach((button) => {
    button.addEventListener("click", () => {
      activateTeacher(button.dataset.id);
    });
  });
}
async function viewTeacher(id) {
  const modal = document.getElementById("viewTeacherModal");
  const loading = document.getElementById("viewTeacherLoading");
  const content = document.getElementById("viewTeacherContent");
  const errorBox = document.getElementById("viewTeacherError");

  if (!modal) return;

  // Open modal
  modal.classList.remove("hidden");

  // Reset states
  loading.classList.remove("hidden");
  content.classList.add("hidden");
  errorBox.classList.add("hidden");
  errorBox.textContent = "";

  try {
    const response = await apiRequest(`/admin/teachers/${id}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(
        response.data?.message || "Failed to load teacher details.",
      );
    }

    const teacher = response.data.teacher;

    // Basic information
    document.getElementById("viewTeacherName").textContent =
      teacher.fullname || "N/A";

    document.getElementById("viewTeacherEmail").textContent =
      teacher.email || "N/A";

    document.getElementById("viewTeacherPhone").textContent =
      teacher.phone || "N/A";

    document.getElementById("viewTeacherClass").textContent =
      teacher.assignedClass?.className || "No class assigned";

    // Status
    const statusElement = document.getElementById("viewTeacherStatus");

    statusElement.textContent =
      teacher.status === "active" ? "Active" : "Inactive";

    statusElement.className =
      teacher.status === "active"
        ? "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700"
        : "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700";

    // Subjects
    const subjectsContainer = document.getElementById("viewTeacherSubjects");

    subjectsContainer.innerHTML = "";

    if (teacher.subjects?.length) {
      teacher.subjects.forEach((subject) => {
        const badge = document.createElement("span");

        badge.className =
          "px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium";

        badge.textContent = subject.subjectName || "Unknown Subject";

        subjectsContainer.appendChild(badge);
      });
    } else {
      subjectsContainer.innerHTML = `
        <span class="text-gray-500 text-sm">
          No subjects assigned.
        </span>
      `;
    }

    // Show content
    loading.classList.add("hidden");
    content.classList.remove("hidden");
  } catch (error) {
    console.error("View teacher error:", error);

    loading.classList.add("hidden");

    errorBox.textContent = error.message || "Failed to load teacher details.";

    errorBox.classList.remove("hidden");
  }
}
function setupViewTeacherModal() {
  const modal = document.getElementById("viewTeacherModal");
  const closeButton = document.getElementById("closeViewTeacherModal");
  const closeButtonFooter = document.getElementById("closeViewTeacherModalBtn");
  const overlay = document.getElementById("viewTeacherModalOverlay");

  if (!modal) return;

  const closeModal = () => {
    modal.classList.add("hidden");
  };

  closeButton?.addEventListener("click", closeModal);

  closeButtonFooter?.addEventListener("click", closeModal);

  overlay?.addEventListener("click", closeModal);

  // Close with Escape
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });
}
function setupTeacherSearch() {
  const teacherSearch = document.getElementById("teacherSearch");

  if (!teacherSearch) return;

  teacherSearch.addEventListener("input", () => {
    teacherFilters.search = teacherSearch.value.toLowerCase().trim();

    applyTeacherFilters();
  });
}
function applyTeacherFilters() {
  const searchTerm = teacherFilters.search;
  const subjectId = teacherFilters.subject;

  const filtered = teachers.filter((teacher) => {
    /*
     * SEARCH FILTER
     */
    const fullname = teacher.fullname?.toLowerCase() || "";

    const email = teacher.email?.toLowerCase() || "";

    const phone = teacher.phone?.toLowerCase() || "";

    const className = teacher.assignedClass?.className?.toLowerCase() || "";

    const teacherSubjects =
      teacher.subjects
        ?.map((subject) => subject.subjectName?.toLowerCase() || "")
        .join(" ") || "";

    const matchesSearch =
      !searchTerm ||
      fullname.includes(searchTerm) ||
      email.includes(searchTerm) ||
      phone.includes(searchTerm) ||
      className.includes(searchTerm) ||
      teacherSubjects.includes(searchTerm);

    /*
     * SUBJECT FILTER
     */
    const matchesSubject =
      !subjectId ||
      teacher.subjects?.some((subject) => subject._id === subjectId);

    return matchesSearch && matchesSubject;
  });

  renderTeachers(filtered);
}
function populateSubjectFilter() {
  const menu = document.getElementById("subjectFilterMenu");
  const button = document.getElementById("subjectFilterBtn");

  if (!menu || !button) return;

  menu.innerHTML = "";

  // All Subjects
  const allButton = document.createElement("button");

  allButton.type = "button";
  allButton.className = "block w-full text-left px-4 py-3 hover:bg-blue-50";

  allButton.textContent = "All Subjects";

  allButton.addEventListener("click", () => {
    teacherFilters.subject = "";

    // Update filter button text
    button.textContent = "All Subjects";

    applyTeacherFilters();

    menu.classList.add("hidden");
  });

  menu.appendChild(allButton);

  // Individual subjects
  subjects.forEach((subject) => {
    const subjectButton = document.createElement("button");

    subjectButton.type = "button";
    subjectButton.className =
      "block w-full text-left px-4 py-3 hover:bg-blue-50";

    subjectButton.textContent = subject.subjectName;

    subjectButton.addEventListener("click", () => {
      teacherFilters.subject = subject._id;

      // Update filter button text
      button.textContent = subject.subjectName;

      applyTeacherFilters();

      menu.classList.add("hidden");
    });

    menu.appendChild(subjectButton);
  });
}
function setupSubjectFilter() {
  const menu = document.getElementById("subjectFilterMenu");
  const button = document.getElementById("subjectFilterBtn");

  if (!menu || !button) return;

  button.addEventListener("click", (event) => {
    event.stopPropagation();

    menu.classList.toggle("hidden");
  });

  // Close when clicking outside
  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target) && !button.contains(event.target)) {
      menu.classList.add("hidden");
    }
  });
}
function setupLogoutButtons() {
  const logoutBtn = document.getElementById("logoutBtn");

  const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener("click", logout);
  }
}
function setupMobileMenu() {
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");

  const mobileMenu = document.getElementById("mobileMenu");

  const closeMobileMenu = document.getElementById("closeMobileMenu");

  const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");

  if (!mobileMenuBtn || !mobileMenu || !closeMobileMenu || !mobileMenuOverlay) {
    return;
  }

  mobileMenuBtn.addEventListener("click", () => {
    mobileMenu.classList.remove("hidden");

    mobileMenuBtn.setAttribute("aria-expanded", "true");
  });

  const closeMenu = () => {
    mobileMenu.classList.add("hidden");

    mobileMenuBtn.setAttribute("aria-expanded", "false");
  };

  closeMobileMenu.addEventListener("click", closeMenu);

  mobileMenuOverlay.addEventListener("click", closeMenu);
}
async function editTeacher(id) {
  const modal = document.getElementById("editTeacherModal");
  const loading = document.getElementById("editTeacherLoading");
  const form = document.getElementById("editTeacherForm");
  const errorBox = document.getElementById("editTeacherError");

  if (!modal) return;

  // Open modal
  modal.classList.remove("hidden");

  // Reset state
  loading.classList.remove("hidden");
  form.classList.add("hidden");
  errorBox.classList.add("hidden");
  errorBox.textContent = "";

  hideEditTeacherMessage();

  try {
    const response = await apiRequest(`/admin/teachers/${id}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to load teacher.");
    }

    const teacher = response.data.teacher;

    // Store teacher ID on the form
    form.dataset.teacherId = teacher._id;

    // Personal information
    document.getElementById("editFullname").value = teacher.fullname || "";

    document.getElementById("editEmail").value = teacher.email || "";

    document.getElementById("editPhone").value = teacher.phone || "";

    // Class
    populateEditClassSelect(teacher.assignedClass?._id);

    // Subjects
    populateEditSubjectSelect(
      teacher.subjects?.map((subject) => subject._id) || [],
    );

    // Status
    document.getElementById("editTeacherStatus").value =
      teacher.status || "active";

    // Show form
    loading.classList.add("hidden");
    form.classList.remove("hidden");
  } catch (error) {
    console.error("Edit teacher load error:", error);

    loading.classList.add("hidden");

    errorBox.textContent = error.message || "Failed to load teacher.";

    errorBox.classList.remove("hidden");
  }
}
function populateEditClassSelect(selectedClassId = "") {
  const select = document.getElementById("editAssignedClass");

  if (!select) return;

  select.innerHTML = `
    <option value="">
      Select Assigned Class
    </option>
  `;

  classes.forEach((classItem) => {
    const option = document.createElement("option");

    option.value = classItem._id;
    option.textContent = classItem.className;

    if (classItem._id === selectedClassId) {
      option.selected = true;
    }

    select.appendChild(option);
  });
}
function populateEditSubjectSelect(selectedSubjectIds = []) {
  const select = document.getElementById("editSubjects");

  if (!select) return;

  select.innerHTML = "";

  if (subjects.length === 0) {
    const option = document.createElement("option");

    option.disabled = true;
    option.textContent = "No subjects available";

    select.appendChild(option);

    return;
  }

  subjects.forEach((subject) => {
    const option = document.createElement("option");

    option.value = subject._id;
    option.textContent = subject.subjectName;

    if (selectedSubjectIds.includes(subject._id)) {
      option.selected = true;
    }

    select.appendChild(option);
  });
}
function setupEditTeacherForm() {
  const form = document.getElementById("editTeacherForm");

  if (!form) return;

  const submitButton = document.getElementById("saveTeacherChangesBtn");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    hideEditTeacherMessage();

    const teacherId = form.dataset.teacherId;

    if (!teacherId) {
      showEditTeacherError("Teacher ID is missing.");
      return;
    }

    const fullname = document.getElementById("editFullname").value.trim();

    const email = document.getElementById("editEmail").value.trim();

    const phone = document.getElementById("editPhone").value.trim();

    const assignedClass = document.getElementById("editAssignedClass").value;

    const subjectSelect = document.getElementById("editSubjects");

    const selectedSubjects = Array.from(subjectSelect.selectedOptions)
      .map((option) => option.value)
      .filter(Boolean);

    const status = document.getElementById("editTeacherStatus").value;

    // Validation
    if (!fullname) {
      showEditTeacherError("Please enter the teacher's full name.");

      document.getElementById("editFullname").focus();

      return;
    }

    if (!email) {
      showEditTeacherError("Please enter the teacher's email address.");

      document.getElementById("editEmail").focus();

      return;
    }

    if (!phone) {
      showEditTeacherError("Please enter the teacher's phone number.");

      document.getElementById("editPhone").focus();

      return;
    }

    if (!assignedClass) {
      showEditTeacherError("Please select the teacher's assigned class.");

      document.getElementById("editAssignedClass").focus();

      return;
    }

    if (selectedSubjects.length === 0) {
      showEditTeacherError(
        "Please assign at least one subject to the teacher.",
      );

      subjectSelect.focus();

      return;
    }

    setButtonLoading(submitButton, true, "Saving...");

    try {
      const response = await apiRequest(`/admin/teachers/${teacherId}`, {
        method: "PUT",

        body: JSON.stringify({
          fullname,
          email,
          phone,
          assignedClass,
          subjects: selectedSubjects,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error(response.data?.message || "Failed to update teacher.");
      }

      showEditTeacherSuccess(
        response.data?.message || "Teacher updated successfully.",
      );

      // Refresh teacher list
      await loadTeachers();

      // Refresh global search data
      await loadSearchData();

      // Close after short delay
      setTimeout(() => {
        closeEditTeacherModal();
      }, 1000);
    } catch (error) {
      console.error("Update teacher error:", error);

      showEditTeacherError(error.message || "Failed to update teacher.");
    } finally {
      setButtonLoading(submitButton, false);
    }
  });
}
function setupEditTeacherModal() {
  const modal = document.getElementById("editTeacherModal");

  const closeButton = document.getElementById("closeEditTeacherModal");

  const cancelButton = document.getElementById("cancelEditTeacherBtn");

  const overlay = document.getElementById("editTeacherModalOverlay");

  if (!modal) return;

  closeButton?.addEventListener("click", closeEditTeacherModal);

  cancelButton?.addEventListener("click", closeEditTeacherModal);

  overlay?.addEventListener("click", closeEditTeacherModal);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) {
      closeEditTeacherModal();
    }
  });
}

function closeEditTeacherModal() {
  const modal = document.getElementById("editTeacherModal");

  const form = document.getElementById("editTeacherForm");

  if (!modal) return;

  modal.classList.add("hidden");

  form?.reset();

  if (form) {
    delete form.dataset.teacherId;
  }

  hideEditTeacherMessage();
}
function showEditTeacherError(message) {
  const element = document.getElementById("editTeacherFormMessage");

  if (!element) return;

  element.textContent = message;

  element.className =
    "p-3 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200";
}

function showEditTeacherSuccess(message) {
  const element = document.getElementById("editTeacherFormMessage");

  if (!element) return;

  element.textContent = message;

  element.className =
    "p-3 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-200";
}

function hideEditTeacherMessage() {
  const element = document.getElementById("editTeacherFormMessage");

  if (!element) return;

  element.className = "hidden p-3 rounded-lg text-sm font-medium";
}
