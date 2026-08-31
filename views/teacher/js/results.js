requireTeacher();
if (typeof setupLogout === "function") setupLogout();
if (typeof setupMobileMenu === "function") setupMobileMenu();

let allResults = [];
let teacherAssignments = [];
let classStudents = {};

/* =========================================================
LOAD INITIAL DATA
========================================================= */
async function loadInitialData() {
  try {
    // 1. Get teacher's dashboard data (includes sessions, terms, assignments)
    const dashboardRes = await apiRequest("/teacher/dashboard");
    if (dashboardRes.ok && dashboardRes.data?.dashboard) {
      const dashboard = dashboardRes.data.dashboard;
      teacherAssignments = dashboard.myAssignments || [];

      // Populate class/subject dropdowns from assignments
      populateAssignmentDropdowns();

      // Populate session/term filters from dashboard data
      populateSessionTermFilters(
        dashboard.currentSession,
        dashboard.currentTerm,
      );
    }
  } catch (error) {
    console.error("Failed to load initial data:", error);
  }
}

/* =========================================================
POPULATE SESSION/TERM FILTERS
========================================================= */
function populateSessionTermFilters(currentSession, currentTerm) {
  const sessionSelect = document.getElementById("filterSession");
  const termSelect = document.getElementById("filterTerm");

  // For now, we only have the current session/term from the dashboard
  // In the future, you could create teacher-specific endpoints to get all sessions/terms
  if (sessionSelect && currentSession) {
    sessionSelect.innerHTML = `<option value="${currentSession._id}">${currentSession.sessionName}</option>`;
  }

  if (termSelect && currentTerm) {
    termSelect.innerHTML = `<option value="${currentTerm._id}">${currentTerm.termName}</option>`;
  }
}

/* =========================================================
POPULATE DROPDOWNS
========================================================= */
function populateAssignmentDropdowns() {
  const classSelect = document.getElementById("filterClass");
  const subjectSelect = document.getElementById("filterSubject");
  const modalClassSelect = document.getElementById("resultClass");
  const modalSubjectSelect = document.getElementById("resultSubject");

  const classes = [
    ...new Set(
      teacherAssignments.map((a) =>
        JSON.stringify({ id: a.class._id, name: a.class.className }),
      ),
    ),
  ].map((s) => JSON.parse(s));
  const subjects = [
    ...new Set(
      teacherAssignments.map((a) =>
        JSON.stringify({ id: a.subject._id, name: a.subject.subjectName }),
      ),
    ),
  ].map((s) => JSON.parse(s));

  const classOptions =
    '<option value="">All Classes</option>' +
    classes.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
  const subjectOptions =
    '<option value="">All Subjects</option>' +
    subjects.map((s) => `<option value="${s.id}">${s.name}</option>`).join("");

  if (classSelect) classSelect.innerHTML = classOptions;
  if (subjectSelect) subjectSelect.innerHTML = subjectOptions;
  if (modalClassSelect)
    modalClassSelect.innerHTML =
      '<option value="">Select Class</option>' +
      classes.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
  if (modalSubjectSelect)
    modalSubjectSelect.innerHTML =
      '<option value="">Select Subject</option>' +
      subjects
        .map((s) => `<option value="${s.id}">${s.name}</option>`)
        .join("");
}

/* =========================================================
LOAD STUDENTS FOR CLASS
========================================================= */
async function loadStudentsForClass(classId) {
  const studentSelect = document.getElementById("resultStudent");
  studentSelect.innerHTML = '<option value="">Loading students...</option>';

  if (!classId) {
    studentSelect.innerHTML = '<option value="">Select a class first</option>';
    return;
  }

  try {
    // ✅ Pass classId as query parameter
    const response = await apiRequest(`/teacher/students?classId=${classId}`);
    
    if (response.ok) {
      const students = response.data?.students || [];
      classStudents[classId] = students;
      
      if (students.length === 0) {
        studentSelect.innerHTML = '<option value="">No students in this class</option>';
        return;
      }
      
      studentSelect.innerHTML = '<option value="">Select Student</option>' + 
        students.map(s => `<option value="${s._id}">${s.fullname} (${s.admissionNumber})</option>`).join("");
    } else {
      throw new Error(response.data?.message || "Failed to load students.");
    }
  } catch (error) {
    console.error("Failed to load students:", error);
    studentSelect.innerHTML = `<option value="">${escapeHTML(error.message || "Error loading students")}</option>`;
  }
}

/* =========================================================
LOAD RESULTS
========================================================= */
async function loadResults() {
  const container = document.getElementById("resultsContainer");
  const loading = document.getElementById("resultsLoading");

  if (!container) return;
  if (loading) loading.classList.remove("hidden");
  container.innerHTML = "";

  try {
    const sessionId = document.getElementById("filterSession")?.value;
    const termId = document.getElementById("filterTerm")?.value;
    const classId = document.getElementById("filterClass")?.value;
    const subjectId = document.getElementById("filterSubject")?.value;

    let url = "/admin/results?";
    const params = new URLSearchParams();
    if (sessionId) params.append("sessionId", sessionId);
    if (termId) params.append("termId", termId);
    if (classId) params.append("classId", classId);
    if (subjectId) params.append("subjectId", subjectId);

    const response = await apiRequest(url + params.toString());

    if (!response.ok)
      throw new Error(response.data?.message || "Failed to load results.");

    allResults = response.data?.results || [];
    renderResults();
  } catch (error) {
    console.error("Failed to load results:", error);
    container.innerHTML = `<tr><td colspan="8" class="px-6 py-8 text-center text-red-500">${escapeHTML(error.message)}</td></tr>`;
  } finally {
    if (loading) loading.classList.add("hidden");
  }
}

/* =========================================================
RENDER RESULTS
========================================================= */
function renderResults() {
  const container = document.getElementById("resultsContainer");
  if (!container) return;

  if (allResults.length === 0) {
    container.innerHTML = `<tr><td colspan="8" class="px-6 py-8 text-center text-gray-500">No results found for the selected filters.</td></tr>`;
    return;
  }

  container.innerHTML = allResults
    .map((result) => {
      const isPublished = result.published;
      return `
      <tr class="hover:bg-gray-50 transition">
        <td class="px-6 py-4">
          <p class="font-semibold text-gray-800">${escapeHTML(result.student?.fullname || "N/A")}</p>
          <p class="text-xs text-gray-500">${escapeHTML(result.student?.admissionNumber || "")}</p>
        </td>
        <td class="px-6 py-4 text-center text-sm text-gray-700">${result.test1}</td>
        <td class="px-6 py-4 text-center text-sm text-gray-700">${result.test2}</td>
        <td class="px-6 py-4 text-center text-sm text-gray-700">${result.exam}</td>
        <td class="px-6 py-4 text-center text-sm font-bold text-gray-900">${result.total}</td>
        <td class="px-6 py-4 text-center">
          <span class="px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(result.grade)}">${result.grade}</span>
        </td>
        <td class="px-6 py-4 text-center">
          ${
            isPublished
              ? '<span class="px-2 py-1 text-xs font-semibold bg-green-100 text-green-600 rounded-full">Published</span>'
              : '<span class="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-600 rounded-full">Pending</span>'
          }
        </td>
        <td class="px-6 py-4 text-right">
          <button class="edit-result-btn px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition mr-2" 
            data-id="${result._id}" ${isPublished ? "disabled title='Cannot edit published results'" : ""}>
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="delete-result-btn px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition" 
            data-id="${result._id}" ${isPublished ? "disabled title='Cannot delete published results'" : ""}>
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
    })
    .join("");
}

/* =========================================================
MODAL & FORM HANDLING
========================================================= */
let editingResultId = null;

function openAddResultModal() {
  editingResultId = null;
  document.getElementById("modalTitle").textContent = "Add New Result";
  document.getElementById("resultForm").reset();
  document.getElementById("previewTotal").textContent = "0";
  document.getElementById("previewGrade").textContent = "-";
  document.getElementById("previewRemark").textContent = "-";
  hideMessage("resultFormMessage");

  document.getElementById("resultModal").classList.remove("hidden");
  document.getElementById("resultModal").classList.add("flex");
}

function openEditResultModal(resultId) {
  const result = allResults.find((r) => r._id === resultId);
  if (!result) return;

  editingResultId = resultId;
  document.getElementById("modalTitle").textContent = "Edit Result";

  document.getElementById("resultClass").value = result.class._id;
  loadStudentsForClass(result.class._id).then(() => {
    document.getElementById("resultStudent").value = result.student._id;
  });

  document.getElementById("resultSubject").value = result.subject._id;
  document.getElementById("resultTest1").value = result.test1;
  document.getElementById("resultTest2").value = result.test2;
  document.getElementById("resultExam").value = result.exam;

  updatePreview();
  hideMessage("resultFormMessage");

  document.getElementById("resultModal").classList.remove("hidden");
  document.getElementById("resultModal").classList.add("flex");
}

function closeResultModal() {
  document.getElementById("resultModal").classList.add("hidden");
  document.getElementById("resultModal").classList.remove("flex");
  editingResultId = null;
}

/* =========================================================
LIVE PREVIEW CALCULATION
========================================================= */
function updatePreview() {
  const t1 = parseInt(document.getElementById("resultTest1").value) || 0;
  const t2 = parseInt(document.getElementById("resultTest2").value) || 0;
  const exam = parseInt(document.getElementById("resultExam").value) || 0;

  const total = t1 + t2 + exam;
  document.getElementById("previewTotal").textContent = total;

  let grade = "-",
    remark = "-";
  if (total >= 70) {
    grade = "A";
    remark = "Excellent";
  } else if (total >= 60) {
    grade = "B";
    remark = "Very Good";
  } else if (total >= 50) {
    grade = "C";
    remark = "Good";
  } else if (total >= 45) {
    grade = "D";
    remark = "Fair";
  } else if (total >= 40) {
    grade = "E";
    remark = "Pass";
  } else if (total > 0) {
    grade = "F";
    remark = "Fail";
  }

  document.getElementById("previewGrade").textContent = grade;
  document.getElementById("previewRemark").textContent = remark;
}

/* =========================================================
SAVE RESULT
========================================================= */
async function saveResult(event) {
  event.preventDefault();
  const saveBtn = document.getElementById("saveResultBtn");

  const classId = document.getElementById("resultClass").value;
  const subjectId = document.getElementById("resultSubject").value;
  const studentId = document.getElementById("resultStudent").value;
  const test1 = parseInt(document.getElementById("resultTest1").value);
  const test2 = parseInt(document.getElementById("resultTest2").value);
  const exam = parseInt(document.getElementById("resultExam").value);
  const sessionId = document.getElementById("filterSession").value;
  const termId = document.getElementById("filterTerm").value;

  if (!classId || !subjectId || !studentId || !sessionId || !termId) {
    showMessage(
      "resultFormMessage",
      "Please fill in all required fields.",
      "error",
    );
    return;
  }

  setButtonLoading(saveBtn, true, "Saving...");

  try {
    const payload = {
      classId,
      subjectId,
      studentId,
      sessionId,
      termId,
      test1,
      test2,
      exam,
    };
    const url = editingResultId
      ? `/admin/results/${editingResultId}`
      : "/admin/results";
    const method = editingResultId ? "PUT" : "POST";

    const response = await apiRequest(url, {
      method,
      body: JSON.stringify(payload),
    });

    if (!response.ok)
      throw new Error(response.data?.message || "Failed to save result.");

    showMessage(
      "resultFormMessage",
      response.data?.message || "Result saved successfully!",
      "success",
    );
    setTimeout(() => {
      closeResultModal();
      loadResults();
    }, 1000);
  } catch (error) {
    console.error("Failed to save result:", error);
    showMessage(
      "resultFormMessage",
      error.message || "Failed to save result.",
      "error",
    );
  } finally {
    setButtonLoading(saveBtn, false);
  }
}

/* =========================================================
DELETE RESULT
========================================================= */
async function deleteResult(resultId) {
  if (
    !confirm(
      "Are you sure you want to delete this result? This cannot be undone.",
    )
  )
    return;

  try {
    const response = await apiRequest(`/admin/results/${resultId}`, {
      method: "DELETE",
    });
    if (!response.ok)
      throw new Error(response.data?.message || "Failed to delete result.");

    alert(response.data?.message || "Result deleted successfully.");
    loadResults();
  } catch (error) {
    alert(error.message || "Failed to delete result.");
  }
}

/* =========================================================
HELPERS
========================================================= */
function getGradeColor(grade) {
  const colors = {
    A: "bg-green-100 text-green-600",
    B: "bg-blue-100 text-blue-600",
    C: "bg-yellow-100 text-yellow-600",
    D: "bg-orange-100 text-orange-600",
    E: "bg-red-100 text-red-600",
    F: "bg-red-200 text-red-700",
  };
  return colors[grade] || "bg-gray-100 text-gray-600";
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
    : `<i class="fa-solid fa-save mr-1"></i> Save Result`;
}

/* =========================================================
EVENT LISTENERS
========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
  await loadInitialData();
  await loadResults();

  // Filters
  document
    .getElementById("applyFiltersBtn")
    ?.addEventListener("click", loadResults);

  // Modal triggers
  document
    .getElementById("addResultBtn")
    ?.addEventListener("click", openAddResultModal);
  document
    .getElementById("closeResultModal")
    ?.addEventListener("click", closeResultModal);
  document
    .getElementById("cancelResultBtn")
    ?.addEventListener("click", closeResultModal);
  document
    .getElementById("resultModalOverlay")
    ?.addEventListener("click", closeResultModal);

  // Form
  document.getElementById("resultForm")?.addEventListener("submit", saveResult);

  // Live preview
  ["resultTest1", "resultTest2", "resultExam"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", updatePreview);
  });

  // Load students when class changes in modal
  document.getElementById("resultClass")?.addEventListener("change", (e) => {
    loadStudentsForClass(e.target.value);
  });

  // Edit/Delete buttons
  document.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".edit-result-btn");
    if (editBtn && !editBtn.disabled) openEditResultModal(editBtn.dataset.id);

    const deleteBtn = e.target.closest(".delete-result-btn");
    if (deleteBtn && !deleteBtn.disabled) deleteResult(deleteBtn.dataset.id);
  });
  // When class changes in modal, filter subjects for that class
document.getElementById("resultClass")?.addEventListener("change", (e) => {
  const classId = e.target.value;
  loadStudentsForClass(classId);
  filterSubjectsByClass(classId);
});

function filterSubjectsByClass(classId) {
  const subjectSelect = document.getElementById("resultSubject");
  if (!subjectSelect) return;
  
  if (!classId) {
    // Show all subjects
    const subjects = [...new Set(teacherAssignments.map(a => JSON.stringify({ id: a.subject._id, name: a.subject.subjectName })))].map(s => JSON.parse(s));
    subjectSelect.innerHTML = '<option value="">Select Subject</option>' + 
      subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join("");
    return;
  }
  
  // Filter to only subjects teacher teaches in this class
  const subjectsInClass = teacherAssignments
    .filter(a => a.class._id === classId)
    .map(a => ({ id: a.subject._id, name: a.subject.subjectName }));
  
  // Remove duplicates
  const uniqueSubjects = [...new Map(subjectsInClass.map(s => [s.id, s])).values()];
  
  if (uniqueSubjects.length === 0) {
    subjectSelect.innerHTML = '<option value="">No subjects assigned to this class</option>';
    return;
  }
  
  subjectSelect.innerHTML = '<option value="">Select Subject</option>' + 
    uniqueSubjects.map(s => `<option value="${s.id}">${s.name}</option>`).join("");
}
});
