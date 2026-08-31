requireTeacher();
if (typeof setupLogout === "function") setupLogout();
if (typeof setupMobileMenu === "function") setupMobileMenu();

let allAssessments = [];
let teacherStudents = [];
let editingAssessmentId = null;

/* =========================================================
LOAD INITIAL DATA
========================================================= */
async function loadInitialData() {
  try {
    // Get teacher's dashboard data (includes currentSession, currentTerm, students)
    const dashboardRes = await apiRequest("/teacher/dashboard");
    if (dashboardRes.ok && dashboardRes.data?.dashboard) {
      const dashboard = dashboardRes.data.dashboard;
      teacherStudents = dashboard.students || [];

      // Populate filter dropdowns with current session/term only
      populateSessionTermFilters(
        dashboard.currentSession,
        dashboard.currentTerm,
      );

      // Populate student filter
      populateStudentFilter();

      // Populate modal dropdowns with current session/term only
      populateModalDropdowns(dashboard.currentSession, dashboard.currentTerm);
    }
  } catch (error) {
    console.error("Failed to load initial data:", error);
  }
}

/* =========================================================
POPULATE DROPDOWNS
========================================================= */
function populateSessionTermFilters(currentSession, currentTerm) {
  const sessionSelect = document.getElementById("filterSession");
  const termSelect = document.getElementById("filterTerm");

  if (sessionSelect && currentSession) {
    sessionSelect.innerHTML = `<option value="${currentSession._id}">${currentSession.sessionName}</option>`;
  }

  if (termSelect && currentTerm) {
    termSelect.innerHTML = `<option value="${currentTerm._id}">${currentTerm.termName}</option>`;
  }
}

function populateStudentFilter() {
  const studentSelect = document.getElementById("filterStudent");
  if (!studentSelect) return;

  studentSelect.innerHTML =
    '<option value="">All Students</option>' +
    teacherStudents
      .map(
        (s) =>
          `<option value="${s._id}">${s.fullname} (${s.admissionNumber})</option>`,
      )
      .join("");
}

function populateModalDropdowns(currentSession, currentTerm) {
  const studentSelect = document.getElementById("assessmentStudent");
  const sessionSelect = document.getElementById("assessmentSession");
  const termSelect = document.getElementById("assessmentTerm");

  if (studentSelect) {
    studentSelect.innerHTML =
      '<option value="">Select Student</option>' +
      teacherStudents
        .map(
          (s) =>
            `<option value="${s._id}">${s.fullname} (${s.admissionNumber})</option>`,
        )
        .join("");
  }

  // ✅ Use current session/term from dashboard — NO admin endpoints needed
  if (sessionSelect && currentSession) {
    sessionSelect.innerHTML = `<option value="${currentSession._id}">${currentSession.sessionName}</option>`;
  }

  if (termSelect && currentTerm) {
    termSelect.innerHTML = `<option value="${currentTerm._id}">${currentTerm.termName}</option>`;
  }
}

/* =========================================================
LOAD ASSESSMENTS
========================================================= */
async function loadAssessments() {
  const container = document.getElementById("assessmentsContainer");
  const loading = document.getElementById("assessmentsLoading");

  if (!container) return;
  if (loading) loading.classList.remove("hidden");
  container.innerHTML = "";

  try {
    const sessionId = document.getElementById("filterSession")?.value;
    const termId = document.getElementById("filterTerm")?.value;
    const studentId = document.getElementById("filterStudent")?.value;

    let url = "/admin/assessments?";
    const params = new URLSearchParams();
    if (sessionId) params.append("sessionId", sessionId);
    if (termId) params.append("termId", termId);
    if (studentId) params.append("studentId", studentId);

    const response = await apiRequest(url + params.toString());

    if (!response.ok)
      throw new Error(response.data?.message || "Failed to load assessments.");

    allAssessments = response.data?.assessments || [];
    renderAssessments();
  } catch (error) {
    console.error("Failed to load assessments:", error);
    container.innerHTML = `<div class="col-span-full py-8 text-center text-red-500">${escapeHTML(error.message)}</div>`;
  } finally {
    if (loading) loading.classList.add("hidden");
  }
}

/* =========================================================
RENDER ASSESSMENTS
========================================================= */
function renderAssessments() {
  const container = document.getElementById("assessmentsContainer");
  if (!container) return;

  if (allAssessments.length === 0) {
    container.innerHTML = `<div class="col-span-full py-8 text-center text-gray-500">No assessments found for the selected filters.</div>`;
    return;
  }

  container.innerHTML = allAssessments
    .map((assessment) => createAssessmentCard(assessment))
    .join("");
}

/* =========================================================
CREATE ASSESSMENT CARD
========================================================= */
function createAssessmentCard(assessment) {
  const studentName = assessment.student?.fullname || "N/A";
  const admissionNumber = assessment.student?.admissionNumber || "";
  const sessionName = assessment.session?.sessionName || "N/A";
  const termName = assessment.term?.termName || "N/A";

  return `
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-5 hover:shadow-md transition">
      <div class="flex items-start justify-between gap-3 mb-4">
        <div>
          <p class="text-sm text-gray-500 font-medium">Student</p>
          <h2 class="text-xl font-bold text-blue-500 mt-1">${escapeHTML(studentName)}</h2>
          <p class="text-xs text-gray-500">${escapeHTML(admissionNumber)}</p>
        </div>
        <div class="w-11 h-11 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
          <i class="fa-solid fa-clipboard-check text-yellow-600"></i>
        </div>
      </div>

      <div class="mb-3">
        <p class="text-sm text-gray-500 font-medium">Period</p>
        <p class="text-sm text-gray-800 mt-1">${escapeHTML(sessionName)} - ${escapeHTML(termName)}</p>
      </div>

      ${
        assessment.attendance
          ? `
        <div class="mb-3 pt-3 border-t">
          <p class="text-xs font-semibold text-gray-600 mb-2">Attendance</p>
          <div class="flex gap-2 text-xs">
            <span class="px-2 py-1 bg-gray-100 rounded">Opened: ${assessment.attendance.schoolOpened || 0}</span>
            <span class="px-2 py-1 bg-green-100 text-green-700 rounded">Present: ${assessment.attendance.present || 0}</span>
            <span class="px-2 py-1 bg-red-100 text-red-700 rounded">Absent: ${assessment.attendance.absent || 0}</span>
          </div>
        </div>
      `
          : ""
      }

      <div class="mt-4 pt-4 border-t flex justify-end gap-2">
        <button class="edit-assessment-btn px-3 py-1.5 rounded-lg bg-yellow-500 text-white text-xs font-semibold hover:bg-yellow-600 transition" data-id="${assessment._id}">
          <i class="fa-solid fa-pen mr-1"></i> Edit
        </button>
        <button class="delete-assessment-btn px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition" data-id="${assessment._id}" data-student="${escapeHTML(studentName)}">
          <i class="fa-solid fa-trash mr-1"></i> Delete
        </button>
      </div>
    </div>
  `;
}

/* =========================================================
MODAL & FORM HANDLING
========================================================= */
function openAddAssessmentModal() {
  editingAssessmentId = null;
  document.getElementById("modalTitle").textContent = "Add New Assessment";
  document.getElementById("assessmentForm").reset();
  hideMessage("assessmentFormMessage");

  document.getElementById("assessmentModal").classList.remove("hidden");
  document.getElementById("assessmentModal").classList.add("flex");
}

function openEditAssessmentModal(assessmentId) {
  const assessment = allAssessments.find((a) => a._id === assessmentId);
  if (!assessment) return;

  editingAssessmentId = assessmentId;
  document.getElementById("modalTitle").textContent = "Edit Assessment";

  document.getElementById("assessmentStudent").value = assessment.student?._id;
  document.getElementById("assessmentSession").value = assessment.session?._id;
  document.getElementById("assessmentTerm").value = assessment.term?._id;

  // Attendance
  document.getElementById("schoolOpened").value =
    assessment.attendance?.schoolOpened || "";
  document.getElementById("present").value =
    assessment.attendance?.present || "";
  document.getElementById("absent").value = assessment.attendance?.absent || "";

  // Affective
  document.getElementById("punctuality").value =
    assessment.affective?.punctuality || "";
  document.getElementById("neatness").value =
    assessment.affective?.neatness || "";
  document.getElementById("honesty").value =
    assessment.affective?.honesty || "";
  document.getElementById("politeness").value =
    assessment.affective?.politeness || "";
  document.getElementById("attentiveness").value =
    assessment.affective?.attentiveness || "";
  document.getElementById("leadership").value =
    assessment.affective?.leadership || "";

  // Psychomotor
  document.getElementById("handwriting").value =
    assessment.psychomotor?.handwriting || "";
  document.getElementById("sports").value =
    assessment.psychomotor?.sports || "";
  document.getElementById("handlingTools").value =
    assessment.psychomotor?.handlingTools || "";
  document.getElementById("drawing").value =
    assessment.psychomotor?.drawing || "";

  // Comments
  document.getElementById("classTeacherComment").value =
    assessment.classTeacherComment || "";
  document.getElementById("principalComment").value =
    assessment.principalComment || "";
  document.getElementById("nextTermBegins").value = assessment.nextTermBegins
    ? new Date(assessment.nextTermBegins).toISOString().split("T")[0]
    : "";

  hideMessage("assessmentFormMessage");

  document.getElementById("assessmentModal").classList.remove("hidden");
  document.getElementById("assessmentModal").classList.add("flex");
}

function closeAssessmentModal() {
  document.getElementById("assessmentModal").classList.add("hidden");
  document.getElementById("assessmentModal").classList.remove("flex");
  editingAssessmentId = null;
}

/* =========================================================
SAVE ASSESSMENT
========================================================= */
async function saveAssessment(event) {
  event.preventDefault();
  const saveBtn = document.getElementById("saveAssessmentBtn");

  const student = document.getElementById("assessmentStudent").value;
  const session = document.getElementById("assessmentSession").value;
  const term = document.getElementById("assessmentTerm").value;

  if (!student || !session || !term) {
    showMessage(
      "assessmentFormMessage",
      "Please select student, session, and term.",
      "error",
    );
    return;
  }

  const attendance = {
    schoolOpened: parseInt(document.getElementById("schoolOpened").value) || 0,
    present: parseInt(document.getElementById("present").value) || 0,
    absent: parseInt(document.getElementById("absent").value) || 0,
  };

  const affective = {
    punctuality: parseInt(document.getElementById("punctuality").value) || null,
    neatness: parseInt(document.getElementById("neatness").value) || null,
    honesty: parseInt(document.getElementById("honesty").value) || null,
    politeness: parseInt(document.getElementById("politeness").value) || null,
    attentiveness:
      parseInt(document.getElementById("attentiveness").value) || null,
    leadership: parseInt(document.getElementById("leadership").value) || null,
  };

  const psychomotor = {
    handwriting: parseInt(document.getElementById("handwriting").value) || null,
    sports: parseInt(document.getElementById("sports").value) || null,
    handlingTools:
      parseInt(document.getElementById("handlingTools").value) || null,
    drawing: parseInt(document.getElementById("drawing").value) || null,
  };

  const nextTermBegins =
    document.getElementById("nextTermBegins").value || null;
  const classTeacherComment =
    document.getElementById("classTeacherComment").value || "";
  const principalComment =
    document.getElementById("principalComment").value || "";

  setButtonLoading(saveBtn, true, "Saving...");

  try {
    const payload = {
      student,
      session,
      term,
      attendance,
      affective,
      psychomotor,
      nextTermBegins,
      classTeacherComment,
      principalComment,
    };

    const url = editingAssessmentId
      ? `/admin/assessments/${editingAssessmentId}`
      : "/admin/student-assessments";
    const method = editingAssessmentId ? "PUT" : "POST";

    const response = await apiRequest(url, {
      method,
      body: JSON.stringify(payload),
    });

    if (!response.ok)
      throw new Error(response.data?.message || "Failed to save assessment.");

    showMessage(
      "assessmentFormMessage",
      response.data?.message || "Assessment saved successfully!",
      "success",
    );
    setTimeout(() => {
      closeAssessmentModal();
      loadAssessments();
    }, 1000);
  } catch (error) {
    console.error("Failed to save assessment:", error);
    showMessage(
      "assessmentFormMessage",
      error.message || "Failed to save assessment.",
      "error",
    );
  } finally {
    setButtonLoading(saveBtn, false);
  }
}

/* =========================================================
DELETE ASSESSMENT
========================================================= */
async function deleteAssessment(assessmentId, studentName) {
  if (
    !confirm(
      `Are you sure you want to delete the assessment for "${studentName}"? This cannot be undone.`,
    )
  )
    return;

  try {
    const response = await apiRequest(`/admin/assessments/${assessmentId}`, {
      method: "DELETE",
    });
    if (!response.ok)
      throw new Error(response.data?.message || "Failed to delete assessment.");

    alert(response.data?.message || "Assessment deleted successfully.");
    loadAssessments();
  } catch (error) {
    alert(error.message || "Failed to delete assessment.");
  }
}

/* =========================================================
HELPERS
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

function hideMessage(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add("hidden");
    el.textContent = "";
  }
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
    : `<i class="fa-solid fa-save mr-1"></i> Save Assessment`;
}

/* =========================================================
EVENT LISTENERS
========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
  await loadInitialData();
  await loadAssessments();

  // Filters
  document
    .getElementById("applyFiltersBtn")
    ?.addEventListener("click", loadAssessments);

  // Modal triggers
  document
    .getElementById("addAssessmentBtn")
    ?.addEventListener("click", openAddAssessmentModal);
  document
    .getElementById("closeAssessmentModal")
    ?.addEventListener("click", closeAssessmentModal);
  document
    .getElementById("cancelAssessmentBtn")
    ?.addEventListener("click", closeAssessmentModal);
  document
    .getElementById("assessmentModalOverlay")
    ?.addEventListener("click", closeAssessmentModal);

  // Form
  document
    .getElementById("assessmentForm")
    ?.addEventListener("submit", saveAssessment);

  // Edit/Delete buttons
  document.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".edit-assessment-btn");
    if (editBtn) openEditAssessmentModal(editBtn.dataset.id);

    const deleteBtn = e.target.closest(".delete-assessment-btn");
    if (deleteBtn)
      deleteAssessment(deleteBtn.dataset.id, deleteBtn.dataset.student);
  });
});
