requireAdmin();
setupLogout();
setupMobileMenu();
let filteredClasses = [];

let classTeachersMap = {};
let classSubjectsMap = {};

//  LOAD CLASSES

async function loadClasses() {
  const classesContainer = document.getElementById("classesContainer");

  const loadingElement = document.getElementById("classesLoading");

  if (!classesContainer) return;

  if (loadingElement) {
    loadingElement.classList.remove("hidden");
  }

  try {
    const [classesResponse, teachersResponse, assignmentsResponse] =
      await Promise.all([
        apiRequest("/admin/classes"),
        apiRequest("/admin/teachers"),
        apiRequest("/admin/class-subjects"),
      ]);

    //  Validate classes response
    if (!classesResponse.ok) {
      throw new Error(
        classesResponse.data?.message || "Failed to load classes.",
      );
    }

    //  Validate teachers response

    if (!teachersResponse.ok) {
      throw new Error(
        teachersResponse.data?.message || "Failed to load teachers.",
      );
    }

    //  Validate assignments response

    if (!assignmentsResponse.ok) {
      throw new Error(
        assignmentsResponse.data?.message || "Failed to load class subjects.",
      );
    }

    //  Store data

    allClasses = classesResponse.data?.classes || [];

    filteredClasses = [...allClasses];

    allTeachers = teachersResponse.data?.teachers || [];

    const assignments = assignmentsResponse.data?.assignments || [];

    //  Build lookup maps

    buildClassTeachersMap();

    buildClassSubjectsMap(assignments);
    //  Render

    renderClasses();

    updateClassCount();
  } catch (error) {
    console.error("Failed to load classes:", error);

    classesContainer.innerHTML = `
      <div class="col-span-full py-12 text-center">

        <div class="text-red-500 text-3xl mb-3">
          <i class="fa-solid fa-circle-exclamation"></i>
        </div>

        <h3 class="font-bold text-lg text-gray-700">
          Unable to load classes
        </h3>

        <p class="text-gray-500 mt-1">
          ${escapeHTML(error.message || "Something went wrong.")}
        </p>

        <button
          type="button"
          id="retryLoadClassesBtn"
          class="mt-4 px-5 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
        >
          <i class="fa-solid fa-rotate-right mr-2"></i>
          Try Again
        </button>

      </div>
    `;

    document
      .getElementById("retryLoadClassesBtn")
      ?.addEventListener("click", loadClasses);
  } finally {
    if (loadingElement) {
      loadingElement.classList.add("hidden");
    }
  }
}

//  CLASS / TEACHER MAP

function buildClassTeachersMap() {
  classTeachersMap = {};

  allTeachers.forEach((teacher) => {
    const assignedClass = teacher.assignedClass;

    if (!assignedClass) return;

    const classId =
      typeof assignedClass === "object" ? assignedClass._id : assignedClass;

    if (!classId) return;

    if (!classTeachersMap[classId]) {
      classTeachersMap[classId] = [];
    }

    classTeachersMap[classId].push(teacher);
  });
}
//  CLASS / SUBJECT MAP

function buildClassSubjectsMap(assignments) {
  classSubjectsMap = {};

  assignments.forEach((assignment) => {
    if (!assignment.class || !assignment.subject) {
      return;
    }

    const classId =
      typeof assignment.class === "object"
        ? assignment.class._id
        : assignment.class;

    if (!classId) return;

    if (!classSubjectsMap[classId]) {
      classSubjectsMap[classId] = [];
    }

    classSubjectsMap[classId].push(assignment);
  });
}

//  RENDER CLASSES

function renderClasses() {
  const classesContainer = document.getElementById("classesContainer");

  if (!classesContainer) return;

  if (filteredClasses.length === 0) {
    classesContainer.innerHTML = `
      <div class="col-span-full py-12 text-center text-gray-500">

        <i
          class="fa-solid fa-school text-4xl mb-3 text-gray-300"
        ></i>

        <h3 class="font-bold text-lg text-gray-700">
          No classes found
        </h3>

        <p class="mt-1">
          There are no classes to display.
        </p>

      </div>
    `;

    return;
  }

  classesContainer.innerHTML = filteredClasses
    .map((classItem) => createClassCard(classItem))
    .join("");
}

//  CREATE CLASS CARD

function createClassCard(classItem) {
  const classId = classItem._id;

  const teachers = classTeachersMap[classId] || [];

  const subjectAssignments = classSubjectsMap[classId] || [];

  return `
    <div
      class="bg-white border border-gray-200 rounded-xl shadow-sm p-5 hover:shadow-md transition"
    >

        

      <div class="flex items-start justify-between gap-3">

        <div>
          <p class="text-sm text-gray-500 font-medium">
            Class Name
          </p>

          <h2
            class="text-2xl font-bold text-blue-500 mt-1"
          >
            ${escapeHTML(classItem.className || "N/A")}
          </h2>
        </div>

        <div
          class="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0"
        >
          <i
            class="fa-solid fa-school text-blue-500"
          ></i>
        </div>

      </div>


          

      <div class="mt-5 pt-4 border-t">

        <div
          class="flex items-center justify-between"
        >

          <p
            class="text-sm text-gray-500 font-medium"
          >
            Class Teacher
          </p>

        </div>

        ${
          classItem.classTeacher
            ? `
              <div class="mt-2 flex items-center gap-2">

                <div
                  class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0"
                >
                  <i
                    class="fa-solid fa-chalkboard-user text-blue-500 text-sm"
                  ></i>
                </div>

                <div class="min-w-0">

                  <p
                    class="font-semibold text-gray-800 truncate"
                  >
                    ${escapeHTML(
                      classItem.classTeacher.fullname || "Unknown teacher",
                    )}
                  </p>

                  ${
                    classItem.classTeacher.email
                      ? `
                        <p
                          class="text-xs text-gray-500 truncate"
                        >
                          ${escapeHTML(classItem.classTeacher.email)}
                        </p>
                      `
                      : ""
                  }

                </div>

              </div>
            `
            : `
              <p
                class="text-sm text-gray-400 mt-2"
              >
                No class teacher assigned
              </p>
            `
        }

      </div>

         

      <div class="mt-5 pt-4 border-t">

        <div
          class="flex items-center justify-between"
        >

          <p
            class="text-sm text-gray-500 font-medium"
          >
            Subjects
          </p>

          <span
            class="text-xs font-semibold bg-green-100 text-green-600 px-2 py-1 rounded-full"
          >
            ${subjectAssignments.length}
          </span>

        </div>

        ${
          subjectAssignments.length > 0
            ? `
              <div
                class="mt-2 flex flex-wrap gap-2"
              >

                ${subjectAssignments
                  .map(
                    (assignment) => `
                      <span
                        class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                      >
                        ${escapeHTML(
                          assignment.subject?.subjectName || "Unknown subject",
                        )}
                      </span>
                    `,
                  )
                  .join("")}

              </div>
            `
            : `
              <p
                class="text-sm text-gray-400 mt-2"
              >
                No subjects assigned
              </p>
            `
        }

      </div>


          

      <div
        class="mt-5 pt-4 border-t flex justify-end gap-2"
      >
<button
    type="button"
    class="delete-class-btn px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition"
    data-id="${classId}"
    data-name="${escapeHTML(classItem.className)}"
  >
    <i class="fa-solid fa-trash mr-1"></i>
    Delete
  </button>
        <button
          type="button"
          class="edit-class-btn px-4 py-2 rounded-lg bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition"
          data-id="${classId}"
        >
          <i class="fa-solid fa-pen mr-1"></i>
          Edit
        </button>

      </div>

    </div>
  `;
}

//  CREATE CLASS

async function createClass() {
  const form = document.getElementById("addNewClassForm");
  const classNameInput = document.getElementById("className");
  const teacherSelect = document.getElementById("classTeacherSelect"); // NEW
  const createButton = document.getElementById("createClassBtn");

  if (!form || !classNameInput) {
    return;
  }

  const className = classNameInput.value.trim();
  const teacherId = teacherSelect ? teacherSelect.value : ""; // NEW

  hideMessage("classFormMessage");

  if (!className) {
    showMessage("classFormMessage", "Class name is required.", "error");
    classNameInput.focus();
    return;
  }

  try {
    setButtonLoading(createButton, true, "Creating class...");

    const response = await apiRequest("/admin/classes", {
      method: "POST",
      body: JSON.stringify({
        className,
        teacherId: teacherId || undefined, // NEW: Only send if a teacher is selected
      }),
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to create class.");
    }

    showMessage(
      "classFormMessage",
      response.data?.message || "Class created successfully.",
      "success",
    );

    form.reset();

    const createdBox = document.getElementById("classCreatedBox");
    if (createdBox) {
      createdBox.classList.remove("hidden");
    }

    await loadClasses();

    setTimeout(() => {
      closeAddClassForm();
    }, 1000);
  } catch (error) {
    console.error("Failed to create class:", error);
    showMessage(
      "classFormMessage",
      error.message || "Failed to create class.",
      "error",
    );
  } finally {
    setButtonLoading(createButton, false);
  }
}

//  EDIT CLASS

async function openEditClassModal(classId) {
  const modal = document.getElementById("editClassModal");
  const loading = document.getElementById("editClassLoading");
  const errorBox = document.getElementById("editClassError");
  const form = document.getElementById("editClassForm");
  const classNameInput = document.getElementById("editClassName");
  const teacherSelect = document.getElementById("editClassTeacher"); // NEW

  if (
    !modal ||
    !loading ||
    !errorBox ||
    !form ||
    !classNameInput ||
    !teacherSelect
  ) {
    return;
  }

  errorBox.classList.add("hidden");
  errorBox.textContent = "";
  form.classList.add("hidden");
  loading.classList.remove("hidden");
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  try {
    const response = await apiRequest(`/admin/classes/${classId}`);
    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to load class.");
    }

    const classData = response.data?.class;
    if (!classData) {
      throw new Error("Class information not found.");
    }

    classNameInput.value = classData.className || "";
    form.dataset.classId = classId;

    form.dataset.oldTeacherId = classData.classTeacher
      ? classData.classTeacher._id
      : "";

    teacherSelect.innerHTML = '<option value="">No Class Teacher</option>';
    allTeachers.forEach((teacher) => {
      if (teacher.status === "active") {
        const option = document.createElement("option");
        option.value = teacher._id;
        option.textContent = teacher.fullname;

        if (
          classData.classTeacher &&
          classData.classTeacher._id === teacher._id
        ) {
          option.selected = true;
        }
        teacherSelect.appendChild(option);
      }
    });

    loading.classList.add("hidden");
    form.classList.remove("hidden");
    classNameInput.focus();
  } catch (error) {
    console.error("Failed to load class:", error);
    loading.classList.add("hidden");
    errorBox.textContent = error.message || "Failed to load class information.";
    errorBox.classList.remove("hidden");
  }
}

//  UPDATE CLASS

async function updateClass(event) {
  event.preventDefault();
  const form = document.getElementById("editClassForm");
  const classNameInput = document.getElementById("editClassName");
  const teacherSelect = document.getElementById("editClassTeacher"); // NEW
  const saveButton = document.getElementById("saveClassChangesBtn");

  if (!form || !classNameInput || !teacherSelect) {
    return;
  }

  const classId = form.dataset.classId;
  const className = classNameInput.value.trim();
  const newTeacherId = teacherSelect.value; // Empty string if "No Class Teacher"
  const oldTeacherId = form.dataset.oldTeacherId || ""; // NEW

  hideMessage("editClassFormMessage");

  if (!classId) {
    showMessage("editClassFormMessage", "Class ID is missing.", "error");
    return;
  }
  if (!className) {
    showMessage("editClassFormMessage", "Class name is required.", "error");
    classNameInput.focus();
    return;
  }

  try {
    setButtonLoading(saveButton, true, "Saving...");

    const classResponse = await apiRequest(`/admin/classes/${classId}`, {
      method: "PUT",
      body: JSON.stringify({ className }),
    });

    if (!classResponse.ok) {
      throw new Error(
        classResponse.data?.message || "Failed to update class name.",
      );
    }

    if (newTeacherId !== oldTeacherId) {
      if (newTeacherId === "") {
        const removeResponse = await apiRequest(
          `/admin/classes/${classId}/teacher`,
          {
            method: "DELETE",
          },
        );
        if (!removeResponse.ok) {
          throw new Error(
            removeResponse.data?.message || "Failed to remove class teacher.",
          );
        }
      } else {
        const assignResponse = await apiRequest(
          `/admin/classes/${classId}/class-teacher`,
          {
            method: "PATCH",
            body: JSON.stringify({ teacherId: newTeacherId }),
          },
        );
        if (!assignResponse.ok) {
          throw new Error(
            assignResponse.data?.message || "Failed to assign class teacher.",
          );
        }
      }
    }

    showMessage(
      "editClassFormMessage",
      "Class updated successfully.",
      "success",
    );
    await loadClasses();
    setTimeout(() => {
      closeEditClassModal();
    }, 700);
  } catch (error) {
    console.error("Failed to update class:", error);
    showMessage(
      "editClassFormMessage",
      error.message || "Failed to update class.",
      "error",
    );
  } finally {
    setButtonLoading(saveButton, false);
  }
}

//  ADD CLASS FORM

function openAddClassForm() {
  const formBox = document.getElementById("addNewClassFormBox");
  const form = document.getElementById("addNewClassForm");
  const createdBox = document.getElementById("classCreatedBox");
  const teacherSelect = document.getElementById("classTeacherSelect"); // NEW

  hideMessage("classFormMessage");

  if (createdBox) {
    createdBox.classList.add("hidden");
  }
  if (form) {
    form.reset();
  }

  // NEW: Populate teacher dropdown
  if (teacherSelect) {
    teacherSelect.innerHTML = '<option value="">No Class Teacher</option>';

    allTeachers.forEach((teacher) => {
      if (teacher.status !== "active") return;

      // Check if this teacher is already assigned to a class
      const isAlreadyAssigned = allClasses.some(
        (cls) =>
          cls.classTeacher &&
          (cls.classTeacher._id === teacher._id ||
            cls.classTeacher === teacher._id),
      );

      if (isAlreadyAssigned) return;

      const option = document.createElement("option");
      option.value = teacher._id;
      option.textContent = teacher.fullname;
      teacherSelect.appendChild(option);
    });
  }

  if (formBox) {
    formBox.classList.remove("hidden");
    formBox.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  document.getElementById("className")?.focus();
}

function closeAddClassForm() {
  const formBox = document.getElementById("addNewClassFormBox");

  const form = document.getElementById("addNewClassForm");

  const createdBox = document.getElementById("classCreatedBox");

  if (formBox) {
    formBox.classList.add("hidden");
  }

  if (form) {
    form.reset();
  }

  if (createdBox) {
    createdBox.classList.add("hidden");
  }

  hideMessage("classFormMessage");
}

async function deleteClass(classId, className) {
  if (
    !confirm(
      `Are you sure you want to delete the class "${className}"? This action cannot be undone.`,
    )
  ) {
    return;
  }

  try {
    const response = await apiRequest(`/admin/classes/${classId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to delete class.");
    }

    showMessage(
      "classFormMessage",
      response.data?.message || "Class deleted successfully.",
      "success",
    );
    await loadClasses();
  } catch (error) {
    console.error("Failed to delete class:", error);
    alert(error.message || "Failed to delete class.");
  }
}
//  EDIT MODAL

function closeEditClassModal() {
  const modal = document.getElementById("editClassModal");

  const form = document.getElementById("editClassForm");

  const loading = document.getElementById("editClassLoading");

  const errorBox = document.getElementById("editClassError");

  if (!modal) return;

  modal.classList.add("hidden");

  modal.classList.remove("flex");

  if (form) {
    form.classList.add("hidden");

    form.reset();

    delete form.dataset.classId;
  }

  if (loading) {
    loading.classList.add("hidden");
  }

  if (errorBox) {
    errorBox.classList.add("hidden");

    errorBox.textContent = "";
  }

  hideMessage("editClassFormMessage");
}

//  SEARCH

function setupClassSearch() {
  const classSearch = document.getElementById("classSearch");

  if (!classSearch) return;

  classSearch.addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();

    if (!query) {
      filteredClasses = [...allClasses];

      renderClasses();

      return;
    }

    filteredClasses = allClasses.filter((classItem) => {
      const className = classItem.className?.toLowerCase() || "";

      const teachers = classTeachersMap[classItem._id] || [];

      const teacherMatch = teachers.some(
        (teacher) =>
          teacher.fullname?.toLowerCase().includes(query) ||
          teacher.email?.toLowerCase().includes(query),
      );

      const subjects = classSubjectsMap[classItem._id] || [];

      const subjectMatch = subjects.some((assignment) =>
        assignment.subject?.subjectName?.toLowerCase().includes(query),
      );

      return className.includes(query) || teacherMatch || subjectMatch;
    });

    renderClasses();
  });
}

//  CLASS COUNT

function updateClassCount() {
  const totalClasses = document.getElementById("totalClasses");

  if (!totalClasses) return;

  totalClasses.textContent = `Total Classes: ${allClasses.length}`;
}

document.addEventListener("click", (event) => {
  const deleteButton = event.target.closest(".delete-class-btn");
  if (!deleteButton) return;

  const classId = deleteButton.dataset.id;
  const className = deleteButton.dataset.name;
  if (!classId) return;

  deleteClass(classId, className);
});

function setupClassEvents() {
  document
    .getElementById("addNewClassBtn")
    ?.addEventListener("click", openAddClassForm);

  document
    .getElementById("cancelAddClassBtn")
    ?.addEventListener("click", closeAddClassForm);

  document
    .getElementById("closeAddClassFormBtn")
    ?.addEventListener("click", closeAddClassForm);

  document
    .getElementById("addNewClassForm")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();

      createClass();
    });

  document.addEventListener("click", (event) => {
    const editButton = event.target.closest(".edit-class-btn");

    if (!editButton) return;

    const classId = editButton.dataset.id;

    if (!classId) return;

    openEditClassModal(classId);
  });

  document
    .getElementById("editClassForm")
    ?.addEventListener("submit", updateClass);

  document
    .getElementById("closeEditClassModal")
    ?.addEventListener("click", closeEditClassModal);

  document
    .getElementById("cancelEditClassBtn")
    ?.addEventListener("click", closeEditClassModal);

  document
    .getElementById("editClassModalOverlay")
    ?.addEventListener("click", closeEditClassModal);
}

function escapeHTML(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", async () => {
  setupClassEvents();

  setupClassSearch();

  await loadClasses();
  await loadCurrentSessionDisplay(); 
});
