requireAdmin();
setupLogout();
setupMobileMenu();
let teachers = [];

let teacherFilters = {
  search: "",
};

document.addEventListener("DOMContentLoaded", () => {
  initializeTeachersPage();
  loadCurrentSessionDisplay(); 
});

async function initializeTeachersPage() {
  await Promise.all([
    loadTeachers(),
    loadSearchData(),
  ]);

  setupTeacherSearch();
  setupGlobalSearch();
  setupTeacherForm();
  setupAddTeacherButton();
  setupLogoutButtons();
  setupMobileMenu();

  setupViewTeacherModal();

  setupEditTeacherModal();
  setupEditTeacherForm();

  // Handle teacher opened from global search
  openTeacherFromSearch();
}

/* =========================================================
   GLOBAL SEARCH → OPEN TEACHER
========================================================= */

async function openTeacherFromSearch() {
  const params = new URLSearchParams(window.location.search);
  const teacherId = params.get("teacherId");

  if (!teacherId) return;

  await viewTeacher(teacherId);

  // Remove query parameter from URL
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname,
  );
}

/* =========================================================
   LOAD TEACHERS
========================================================= */

async function loadTeachers() {
  try {
    const response = await apiRequest("/admin/teachers", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(
        response.data?.message || "Failed to load teachers.",
      );
    }

    teachers = response.data.teachers || [];

    renderTeachers();
    updateTeacherStats();
  } catch (error) {
    console.error("Error loading teachers:", error);

    alert(error.message || "Failed to load teachers.");
  }
}

/* =========================================================
   RENDER TEACHERS
========================================================= */

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

    row.innerHTML = `
      <td class="p-4 font-semibold text-gray-800">
        ${teacher.fullname || "N/A"}
      </td>

      <td class="p-4 text-gray-800">
        ${teacher.email || "N/A"}
      </td>

      <td class="p-4 text-gray-800">
        ${teacher.phone || "N/A"}
      </td>

      <td class="p-4">
        ${
          teacher.status === "active"
            ? `
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                <span class="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                Active
              </span>
            `
            : `
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                <span class="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                Inactive
              </span>
            `
        }
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

/* =========================================================
   TEACHER STATISTICS
========================================================= */

function updateTeacherStats() {
  const totalTeachers = teachers.length;

  const activeTeachers = teachers.filter(
    (teacher) => teacher.status === "active",
  ).length;

  const inactiveTeachers = teachers.filter(
    (teacher) => teacher.status === "inactive",
  ).length;

  const totalElement = document.getElementById("totalTeachers");
  const activeElement = document.getElementById(
    "totalActiveTeachers",
  );
  const inactiveElement = document.getElementById(
    "totalInactiveTeachers",
  );

  if (totalElement) {
    totalElement.textContent = totalTeachers;
  }

  if (activeElement) {
    activeElement.textContent = activeTeachers;
  }

  if (inactiveElement) {
    inactiveElement.textContent = inactiveTeachers;
  }
}

/* =========================================================
   CREATE TEACHER
========================================================= */

function setupTeacherForm() {
  const form = document.getElementById("addNewTeacherForm");

  if (!form) return;

  const submitButton = form.querySelector(
    'button[type="submit"]',
  );

  const messageBox = document.getElementById(
    "teacherFormMessage",
  );

  const createdBox = document.getElementById(
    "teacherCreatedBox",
  );

  const temporaryPassword = document.getElementById(
    "temporaryPassword",
  );

  const copyPasswordBtn = document.getElementById(
    "copyTemporaryPassword",
  );

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    hideMessage("teacherFormMessage");

    if (createdBox) {
      createdBox.classList.add("hidden");
    }

    const fullname =
      document.getElementById("fullname")?.value.trim();

    const email =
      document.getElementById("email")?.value.trim();

    const phone =
      document.getElementById("phoneNumber")?.value.trim();

    /* -------------------------
       Validation
    ------------------------- */

    if (!fullname) {
      showMessage(
        "teacherFormMessage",
        "Please enter the teacher's full name.",
      );

      document.getElementById("fullname")?.focus();

      return;
    }

    if (!email) {
      showMessage(
        "teacherFormMessage",
        "Please enter the teacher's email address.",
      );

      document.getElementById("email")?.focus();

      return;
    }

    if (!phone) {
      showMessage(
        "teacherFormMessage",
        "Please enter the teacher's phone number.",
      );

      document.getElementById("phoneNumber")?.focus();

      return;
    }

    /* -------------------------
       Submit
    ------------------------- */

    setButtonLoading(submitButton, true, "Creating...");

    try {
      const response = await apiRequest("/admin/teachers", {
        method: "POST",

        body: JSON.stringify({
          fullname,
          email,
          phone,
        }),
      });

      if (!response.ok) {
        throw new Error(
          response.data?.message ||
            "Failed to create teacher.",
        );
      }

      const teacher = response.data.teacher;

      const generatedPassword =
        response.data.temporaryPassword;

      /* -------------------------
         Success
      ------------------------- */

      showMessage(
        "teacherFormMessage",
        `${teacher.fullname} has been added successfully.`,
        "success",
      );

      /* -------------------------
         Temporary password
      ------------------------- */

      if (createdBox && temporaryPassword) {
        temporaryPassword.textContent =
          generatedPassword || "Not provided";

        createdBox.classList.remove("hidden");
      }

      /* -------------------------
         Reset form
      ------------------------- */

      form.reset();

      /* -------------------------
         Refresh teacher list
      ------------------------- */

      await loadTeachers();

      /* -------------------------
         Refresh global search
      ------------------------- */

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

  /* =====================================================
     COPY TEMPORARY PASSWORD
  ===================================================== */

  if (copyPasswordBtn) {
    copyPasswordBtn.addEventListener(
      "click",
      async () => {
        const password =
          temporaryPassword?.textContent?.trim();

        if (!password) return;

        try {
          await navigator.clipboard.writeText(password);

          const originalHTML =
            copyPasswordBtn.innerHTML;

          copyPasswordBtn.innerHTML =
            '<i class="fa-solid fa-check"></i>';

          setTimeout(() => {
            copyPasswordBtn.innerHTML =
              originalHTML;
          }, 1500);
        } catch (error) {
          console.error(
            "Failed to copy password:",
            error,
          );
        }
      },
    );
  }
}

/* =========================================================
   ADD TEACHER FORM TOGGLE
========================================================= */

function setupAddTeacherButton() {
  const addNewTeacherBtn = document.getElementById(
    "addNewTeacherBtn",
  );

  const addNewTeacherFormBox = document.getElementById(
    "addNewTeacherFormBox",
  );

  const closeAddTeacherFormBtn =
    document.getElementById(
      "closeAddTeacherFormBtn",
    );

  const cancelAddTeacherBtn =
    document.getElementById("cancelAddTeacherBtn");

  if (!addNewTeacherBtn || !addNewTeacherFormBox) {
    return;
  }

  function closeForm() {
    addNewTeacherFormBox.classList.add("hidden");

    addNewTeacherBtn.innerHTML = `
      <i class="fa-solid fa-user-plus"></i>
      Add New Teacher
    `;

    hideMessage("teacherFormMessage");
  }

  function openForm() {
    addNewTeacherFormBox.classList.remove("hidden");

    addNewTeacherBtn.innerHTML = `
      <i class="fa-solid fa-xmark"></i>
      Close Form
    `;

    addNewTeacherFormBox.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  addNewTeacherBtn.addEventListener("click", () => {
    const isHidden =
      addNewTeacherFormBox.classList.contains(
        "hidden",
      );

    if (isHidden) {
      openForm();
    } else {
      closeForm();
    }
  });

  closeAddTeacherFormBtn?.addEventListener(
    "click",
    closeForm,
  );

  cancelAddTeacherBtn?.addEventListener(
    "click",
    closeForm,
  );
}

/* =========================================================
   DEACTIVATE TEACHER
========================================================= */

async function deactivateTeacher(id) {
  const confirmed = confirm(
    "Are you sure you want to deactivate this teacher?",
  );

  if (!confirmed) return;

  try {
    const response = await apiRequest(
      `/admin/teachers/${id}/deactivate`,
      {
        method: "PATCH",
      },
    );

    if (!response.ok) {
      throw new Error(
        response.data?.message ||
          "Failed to deactivate teacher.",
      );
    }

    alert(response.data.message);

    await loadTeachers();
    await loadSearchData();
  } catch (error) {
    console.error("Deactivate teacher error:", error);

    alert(
      error.message ||
        "Failed to deactivate teacher.",
    );
  }
}

/* =========================================================
   ACTIVATE TEACHER
========================================================= */

async function activateTeacher(id) {
  try {
    const response = await apiRequest(
      `/admin/teachers/${id}/activate`,
      {
        method: "PATCH",
      },
    );

    if (!response.ok) {
      throw new Error(
        response.data?.message ||
          "Failed to activate teacher.",
      );
    }

    alert(response.data.message);

    await loadTeachers();
    await loadSearchData();
  } catch (error) {
    console.error("Activate teacher error:", error);

    alert(
      error.message ||
        "Failed to activate teacher.",
    );
  }
}

/* =========================================================
   TEACHER ACTION BUTTONS
========================================================= */

function attachTeacherActions() {
  document
    .querySelectorAll(".viewTeacherBtn")
    .forEach((button) => {
      button.addEventListener("click", () => {
        viewTeacher(button.dataset.id);
      });
    });

  document
    .querySelectorAll(".editTeacherBtn")
    .forEach((button) => {
      button.addEventListener("click", () => {
        editTeacher(button.dataset.id);
      });
    });

  document
    .querySelectorAll(".deactivateTeacherBtn")
    .forEach((button) => {
      button.addEventListener("click", () => {
        deactivateTeacher(button.dataset.id);
      });
    });

  document
    .querySelectorAll(".activateTeacherBtn")
    .forEach((button) => {
      button.addEventListener("click", () => {
        activateTeacher(button.dataset.id);
      });
    });
}

/* =========================================================
   VIEW TEACHER
========================================================= */

async function viewTeacher(id) {
  const modal =
    document.getElementById("viewTeacherModal");

  const loading = document.getElementById(
    "viewTeacherLoading",
  );

  const content = document.getElementById(
    "viewTeacherContent",
  );

  const errorBox = document.getElementById(
    "viewTeacherError",
  );

  if (!modal) return;

  modal.classList.remove("hidden");

  loading?.classList.remove("hidden");
  content?.classList.add("hidden");

  errorBox?.classList.add("hidden");

  if (errorBox) {
    errorBox.textContent = "";
  }

  try {
    const response = await apiRequest(
      `/admin/teachers/${id}`,
      {
        method: "GET",
      },
    );

    if (!response.ok) {
      throw new Error(
        response.data?.message ||
          "Failed to load teacher details.",
      );
    }

    const teacher = response.data.teacher;

    /* -------------------------
       Basic information
    ------------------------- */

    document.getElementById(
      "viewTeacherName",
    ).textContent = teacher.fullname || "N/A";

    document.getElementById(
      "viewTeacherEmail",
    ).textContent = teacher.email || "N/A";

    document.getElementById(
      "viewTeacherPhone",
    ).textContent = teacher.phone || "N/A";

    /* -------------------------
       Status
    ------------------------- */

    const statusElement =
      document.getElementById(
        "viewTeacherStatus",
      );

    if (statusElement) {
      statusElement.textContent =
        teacher.status === "active"
          ? "Active"
          : "Inactive";

      statusElement.className =
        teacher.status === "active"
          ? "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700"
          : "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700";
    }

    /* -------------------------
       Show content
    ------------------------- */

    loading?.classList.add("hidden");
    content?.classList.remove("hidden");
  } catch (error) {
    console.error(
      "View teacher error:",
      error,
    );

    loading?.classList.add("hidden");

    if (errorBox) {
      errorBox.textContent =
        error.message ||
        "Failed to load teacher details.";

      errorBox.classList.remove("hidden");
    }
  }
}

/* =========================================================
   VIEW TEACHER MODAL
========================================================= */

function setupViewTeacherModal() {
  const modal =
    document.getElementById("viewTeacherModal");

  const closeButton = document.getElementById(
    "closeViewTeacherModal",
  );

  const closeButtonFooter =
    document.getElementById(
      "closeViewTeacherModalBtn",
    );

  const overlay = document.getElementById(
    "viewTeacherModalOverlay",
  );

  if (!modal) return;

  const closeModal = () => {
    modal.classList.add("hidden");
  };

  closeButton?.addEventListener(
    "click",
    closeModal,
  );

  closeButtonFooter?.addEventListener(
    "click",
    closeModal,
  );

  overlay?.addEventListener(
    "click",
    closeModal,
  );

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      !modal.classList.contains("hidden")
    ) {
      closeModal();
    }
  });
}

/* =========================================================
   TEACHER SEARCH
========================================================= */

function setupTeacherSearch() {
  const teacherSearch =
    document.getElementById("teacherSearch");

  if (!teacherSearch) return;

  teacherSearch.addEventListener("input", () => {
    teacherFilters.search =
      teacherSearch.value
        .toLowerCase()
        .trim();

    applyTeacherFilters();
  });
}

function applyTeacherFilters() {
  const searchTerm = teacherFilters.search;

  const filtered = teachers.filter(
    (teacher) => {
      const fullname =
        teacher.fullname?.toLowerCase() || "";

      const email =
        teacher.email?.toLowerCase() || "";

      const phone =
        teacher.phone?.toLowerCase() || "";

      return (
        !searchTerm ||
        fullname.includes(searchTerm) ||
        email.includes(searchTerm) ||
        phone.includes(searchTerm)
      );
    },
  );

  renderTeachers(filtered);
}

/* =========================================================
   EDIT TEACHER
========================================================= */

async function editTeacher(id) {
  const modal =
    document.getElementById("editTeacherModal");

  const loading =
    document.getElementById(
      "editTeacherLoading",
    );

  const form =
    document.getElementById("editTeacherForm");

  const errorBox =
    document.getElementById(
      "editTeacherError",
    );

  if (!modal) return;

  modal.classList.remove("hidden");

  loading?.classList.remove("hidden");
  form?.classList.add("hidden");

  errorBox?.classList.add("hidden");

  if (errorBox) {
    errorBox.textContent = "";
  }

  hideEditTeacherMessage();

  try {
    const response = await apiRequest(
      `/admin/teachers/${id}`,
      {
        method: "GET",
      },
    );

    if (!response.ok) {
      throw new Error(
        response.data?.message ||
          "Failed to load teacher.",
      );
    }

    const teacher = response.data.teacher;

    /* -------------------------
       Store teacher ID
    ------------------------- */

    if (form) {
      form.dataset.teacherId = teacher._id;
    }

    /* -------------------------
       Personal information
    ------------------------- */

    const fullnameInput =
      document.getElementById("editFullname");

    const emailInput =
      document.getElementById("editEmail");

    const phoneInput =
      document.getElementById("editPhone");

    const statusInput =
      document.getElementById(
        "editTeacherStatus",
      );

    if (fullnameInput) {
      fullnameInput.value =
        teacher.fullname || "";
    }

    if (emailInput) {
      emailInput.value =
        teacher.email || "";
    }

    if (phoneInput) {
      phoneInput.value =
        teacher.phone || "";
    }

    if (statusInput) {
      statusInput.value =
        teacher.status || "active";
    }

    /* -------------------------
       Show form
    ------------------------- */

    loading?.classList.add("hidden");
    form?.classList.remove("hidden");
  } catch (error) {
    console.error(
      "Edit teacher load error:",
      error,
    );

    loading?.classList.add("hidden");

    if (errorBox) {
      errorBox.textContent =
        error.message ||
        "Failed to load teacher.";

      errorBox.classList.remove("hidden");
    }
  }
}

/* =========================================================
   EDIT TEACHER FORM
========================================================= */

function setupEditTeacherForm() {
  const form =
    document.getElementById("editTeacherForm");

  if (!form) return;

  const submitButton =
    document.getElementById(
      "saveTeacherChangesBtn",
    );

  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      hideEditTeacherMessage();

      const teacherId =
        form.dataset.teacherId;

      if (!teacherId) {
        showEditTeacherError(
          "Teacher ID is missing.",
        );

        return;
      }

      const fullname =
        document.getElementById(
          "editFullname",
        )?.value.trim();

      const email =
        document.getElementById(
          "editEmail",
        )?.value.trim();

      const phone =
        document.getElementById(
          "editPhone",
        )?.value.trim();

      const status =
        document.getElementById(
          "editTeacherStatus",
        )?.value;

      /* -------------------------
         Validation
      ------------------------- */

      if (!fullname) {
        showEditTeacherError(
          "Please enter the teacher's full name.",
        );

        document
          .getElementById("editFullname")
          ?.focus();

        return;
      }

      if (!email) {
        showEditTeacherError(
          "Please enter the teacher's email address.",
        );

        document
          .getElementById("editEmail")
          ?.focus();

        return;
      }

      if (!phone) {
        showEditTeacherError(
          "Please enter the teacher's phone number.",
        );

        document
          .getElementById("editPhone")
          ?.focus();

        return;
      }

      if (
        !status ||
        !["active", "inactive"].includes(
          status,
        )
      ) {
        showEditTeacherError(
          "Please select a valid teacher status.",
        );

        document
          .getElementById(
            "editTeacherStatus",
          )
          ?.focus();

        return;
      }

      /* -------------------------
         Submit
      ------------------------- */

      setButtonLoading(
        submitButton,
        true,
        "Saving...",
      );

      try {
        const response = await apiRequest(
          `/admin/teachers/${teacherId}`,
          {
            method: "PUT",

            body: JSON.stringify({
              fullname,
              email,
              phone,
              status,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(
            response.data?.message ||
              "Failed to update teacher.",
          );
        }

        showEditTeacherSuccess(
          response.data?.message ||
            "Teacher updated successfully.",
        );

        /* -------------------------
           Refresh teacher list
        ------------------------- */

        await loadTeachers();

        /* -------------------------
           Refresh global search
        ------------------------- */

        await loadSearchData();

        /* -------------------------
           Close modal
        ------------------------- */

        setTimeout(() => {
          closeEditTeacherModal();
        }, 1000);
      } catch (error) {
        console.error(
          "Update teacher error:",
          error,
        );

        showEditTeacherError(
          error.message ||
            "Failed to update teacher.",
        );
      } finally {
        setButtonLoading(
          submitButton,
          false,
        );
      }
    },
  );
}

/* =========================================================
   EDIT TEACHER MODAL
========================================================= */

function setupEditTeacherModal() {
  const modal =
    document.getElementById(
      "editTeacherModal",
    );

  const closeButton =
    document.getElementById(
      "closeEditTeacherModal",
    );

  const cancelButton =
    document.getElementById(
      "cancelEditTeacherBtn",
    );

  const overlay =
    document.getElementById(
      "editTeacherModalOverlay",
    );

  if (!modal) return;

  closeButton?.addEventListener(
    "click",
    closeEditTeacherModal,
  );

  cancelButton?.addEventListener(
    "click",
    closeEditTeacherModal,
  );

  overlay?.addEventListener(
    "click",
    closeEditTeacherModal,
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        !modal.classList.contains("hidden")
      ) {
        closeEditTeacherModal();
      }
    },
  );
}

function closeEditTeacherModal() {
  const modal =
    document.getElementById(
      "editTeacherModal",
    );

  const form =
    document.getElementById(
      "editTeacherForm",
    );

  if (!modal) return;

  modal.classList.add("hidden");

  form?.reset();

  if (form) {
    delete form.dataset.teacherId;
  }

  hideEditTeacherMessage();
}

/* =========================================================
   EDIT TEACHER MESSAGES
========================================================= */

function showEditTeacherError(message) {
  const element =
    document.getElementById(
      "editTeacherFormMessage",
    );

  if (!element) return;

  element.textContent = message;

  element.className =
    "p-3 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200";
}

function showEditTeacherSuccess(message) {
  const element =
    document.getElementById(
      "editTeacherFormMessage",
    );

  if (!element) return;

  element.textContent = message;

  element.className =
    "p-3 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-200";
}

function hideEditTeacherMessage() {
  const element =
    document.getElementById(
      "editTeacherFormMessage",
    );

  if (!element) return;

  element.className =
    "hidden p-3 rounded-lg text-sm font-medium";

  element.textContent = "";
}

/* =========================================================
   LOGOUT
========================================================= */

function setupLogoutButtons() {
  const logoutBtn =
    document.getElementById("logoutBtn");

  const mobileLogoutBtn =
    document.getElementById(
      "mobileLogoutBtn",
    );

  logoutBtn?.addEventListener(
    "click",
    logout,
  );

  mobileLogoutBtn?.addEventListener(
    "click",
    logout,
  );
}

/* =========================================================
   MOBILE MENU
========================================================= */

function setupMobileMenu() {
  const mobileMenuBtn =
    document.getElementById(
      "mobileMenuBtn",
    );

  const mobileMenu =
    document.getElementById(
      "mobileMenu",
    );

  const closeMobileMenu =
    document.getElementById(
      "closeMobileMenu",
    );

  const mobileMenuOverlay =
    document.getElementById(
      "mobileMenuOverlay",
    );

  if (
    !mobileMenuBtn ||
    !mobileMenu ||
    !closeMobileMenu ||
    !mobileMenuOverlay
  ) {
    return;
  }

  mobileMenuBtn.addEventListener(
    "click",
    () => {
      mobileMenu.classList.remove(
        "hidden",
      );

      mobileMenuBtn.setAttribute(
        "aria-expanded",
        "true",
      );
    },
  );

  const closeMenu = () => {
    mobileMenu.classList.add("hidden");

    mobileMenuBtn.setAttribute(
      "aria-expanded",
      "false",
    );
  };

  closeMobileMenu.addEventListener(
    "click",
    closeMenu,
  );

  mobileMenuOverlay.addEventListener(
    "click",
    closeMenu,
  );
}