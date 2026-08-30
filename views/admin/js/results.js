requireAdmin();
setupLogout();
setupMobileMenu();

let allSessions = [];
let allTerms = [];

/* =========================================================
LOAD INITIAL DATA
========================================================= */
async function loadInitialData() {
  try {
    const [classesRes, sessionsRes, termsRes, subjectsRes, studentsRes] = await Promise.all([
      apiRequest("/admin/classes"),
      apiRequest("/admin/sessions"),
      apiRequest("/admin/terms"),
      apiRequest("/admin/subjects"),
      apiRequest("/admin/students"),
    ]);

    if (classesRes.ok) allClasses = classesRes.data?.classes || [];
    if (sessionsRes.ok) allSessions = sessionsRes.data?.sessions || [];
    if (termsRes.ok) allTerms = termsRes.data?.terms || [];
    if (subjectsRes.ok) allSubjects = subjectsRes.data?.subjects || [];
    if (studentsRes.ok) allStudents = studentsRes.data?.students || [];

    populateFilterDropdowns();
    populateBulkActionDropdowns();
  } catch (error) {
    console.error("Failed to load initial data:", error);
  }
}

/* =========================================================
POPULATE DROPDOWNS
========================================================= */
function populateFilterDropdowns() {
  const classSelect = document.getElementById("filterClass");
  const sessionSelect = document.getElementById("filterSession");
  const termSelect = document.getElementById("filterTerm");
  const subjectSelect = document.getElementById("filterSubject");
  const studentSelect = document.getElementById("filterStudent");

  if (classSelect) {
    classSelect.innerHTML = '<option value="">All Classes</option>';
    allClasses.forEach((cls) => {
      const opt = document.createElement("option");
      opt.value = cls._id;
      opt.textContent = cls.className;
      classSelect.appendChild(opt);
    });
  }

  if (sessionSelect) {
    sessionSelect.innerHTML = '<option value="">All Sessions</option>';
    allSessions.forEach((session) => {
      const opt = document.createElement("option");
      opt.value = session._id;
      opt.textContent = session.sessionName;
      sessionSelect.appendChild(opt);
    });
  }

  if (termSelect) {
    termSelect.innerHTML = '<option value="">All Terms</option>';
    allTerms.forEach((term) => {
      const opt = document.createElement("option");
      opt.value = term._id;
      opt.textContent = term.termName;
      termSelect.appendChild(opt);
    });
  }

  if (subjectSelect) {
    subjectSelect.innerHTML = '<option value="">All Subjects</option>';
    allSubjects.forEach((subject) => {
      const opt = document.createElement("option");
      opt.value = subject._id;
      opt.textContent = subject.subjectName;
      subjectSelect.appendChild(opt);
    });
  }

  if (studentSelect) {
    studentSelect.innerHTML = '<option value="">All Students</option>';
    allStudents.forEach((student) => {
      const opt = document.createElement("option");
      opt.value = student._id;
      opt.textContent = `${student.fullname} (${student.admissionNumber})`;
      studentSelect.appendChild(opt);
    });
  }
}

function populateBulkActionDropdowns() {
  const bulkClass = document.getElementById("bulkClass");
  const bulkSession = document.getElementById("bulkSession");
  const bulkTerm = document.getElementById("bulkTerm");

  if (bulkClass) {
    bulkClass.innerHTML = '<option value="">Select Class</option>';
    allClasses.forEach((cls) => {
      const opt = document.createElement("option");
      opt.value = cls._id;
      opt.textContent = cls.className;
      bulkClass.appendChild(opt);
    });
  }

  if (bulkSession) {
    bulkSession.innerHTML = '<option value="">Select Session</option>';
    allSessions.forEach((session) => {
      const opt = document.createElement("option");
      opt.value = session._id;
      opt.textContent = session.sessionName;
      bulkSession.appendChild(opt);
    });
  }

  if (bulkTerm) {
    bulkTerm.innerHTML = '<option value="">Select Term</option>';
    allTerms.forEach((term) => {
      const opt = document.createElement("option");
      opt.value = term._id;
      opt.textContent = term.termName;
      bulkTerm.appendChild(opt);
    });
  }
}

/* =========================================================
LOAD RESULTS
========================================================= */
async function loadResults() {
  const resultsContainer = document.getElementById("resultsContainer");
  const loadingElement = document.getElementById("resultsLoading");

  if (!resultsContainer) return;

  if (loadingElement) loadingElement.classList.remove("hidden");

  try {
    const classId = document.getElementById("filterClass")?.value;
    const sessionId = document.getElementById("filterSession")?.value;
    const termId = document.getElementById("filterTerm")?.value;
    const subjectId = document.getElementById("filterSubject")?.value;
    const studentId = document.getElementById("filterStudent")?.value;

    let url = "/admin/results";
    const params = new URLSearchParams();
    if (classId) params.append("classId", classId);
    if (sessionId) params.append("sessionId", sessionId);
    if (termId) params.append("termId", termId);
    if (subjectId) params.append("subjectId", subjectId);
    if (studentId) params.append("studentId", studentId);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await apiRequest(url);

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to load results.");
    }

    allResults = response.data?.results || [];

    renderResults();
    updateStats();
  } catch (error) {
    console.error("Failed to load results:", error);
    resultsContainer.innerHTML = `
      <tr>
        <td colspan="10" class="px-6 py-12 text-center">
          <div class="text-red-500 text-3xl mb-3">
            <i class="fa-solid fa-circle-exclamation"></i>
          </div>
          <h3 class="font-bold text-lg text-gray-700">Unable to load results</h3>
          <p class="text-gray-500 mt-1">${escapeHTML(error.message || "Something went wrong.")}</p>
        </td>
      </tr>
    `;
  } finally {
    if (loadingElement) loadingElement.classList.add("hidden");
  }
}

/* =========================================================
RENDER RESULTS
========================================================= */
function renderResults() {
  const resultsContainer = document.getElementById("resultsContainer");
  if (!resultsContainer) return;

  if (allResults.length === 0) {
    resultsContainer.innerHTML = `
      <tr>
        <td colspan="10" class="px-6 py-12 text-center text-gray-500">
          <i class="fa-solid fa-chart-column text-4xl mb-3 text-gray-300"></i>
          <h3 class="font-bold text-lg text-gray-700">No results found</h3>
          <p class="mt-1">There are no results to display.</p>
        </td>
      </tr>
    `;
    return;
  }

  resultsContainer.innerHTML = allResults.map((result) => createResultRow(result)).join("");
}

/* =========================================================
CREATE RESULT ROW
========================================================= */
function createResultRow(result) {
  const resultId = result._id;
  const studentName = result.student?.fullname || "N/A";
  const admissionNumber = result.student?.admissionNumber || "";
  const subjectName = result.subject?.subjectName || "N/A";
  const teacherName = result.teacher?.fullname || "N/A";
  const isPublished = result.published;

  return `
    <tr class="hover:bg-gray-50 transition">
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">${escapeHTML(studentName)}</div>
        <div class="text-xs text-gray-500">${escapeHTML(admissionNumber)}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${escapeHTML(subjectName)}</td>
      <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">${result.test1}</td>
      <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">${result.test2}</td>
      <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">${result.exam}</td>
      <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-gray-900">${result.total}</td>
      <td class="px-6 py-4 whitespace-nowrap text-center">
        <span class="px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(result.grade)}">
          ${result.grade}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-center">
        ${
          isPublished
            ? '<span class="px-2 py-1 text-xs font-semibold bg-green-100 text-green-600 rounded-full">Published</span>'
            : '<span class="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-600 rounded-full">Unpublished</span>'
        }
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${escapeHTML(teacherName)}</td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          type="button"
          class="delete-result-btn px-3 py-1.5 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition text-xs"
          data-id="${resultId}"
          data-student="${escapeHTML(studentName)}"
          data-subject="${escapeHTML(subjectName)}"
          ${isPublished ? "disabled title='Cannot delete published result'" : ""}
        >
          <i class="fa-solid fa-trash mr-1"></i>
          Delete
        </button>
      </td>
    </tr>
  `;
}

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

/* =========================================================
UPDATE STATS
========================================================= */
function updateStats() {
  const total = allResults.length;
  const published = allResults.filter((r) => r.published).length;
  const unpublished = total - published;
  const average = total > 0 ? (allResults.reduce((sum, r) => sum + r.total, 0) / total).toFixed(2) : 0;

  document.getElementById("totalResults").textContent = total;
  document.getElementById("statTotal").textContent = total;
  document.getElementById("statPublished").textContent = published;
  document.getElementById("statUnpublished").textContent = unpublished;
  document.getElementById("statAverage").textContent = average;
}

/* =========================================================
DELETE RESULT
========================================================= */
async function deleteResult(resultId, studentName, subjectName) {
  if (!confirm(`Are you sure you want to delete the result for "${studentName}" in "${subjectName}"? This action cannot be undone.`)) {
    return;
  }

  try {
    const response = await apiRequest(`/admin/results/${resultId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to delete result.");
    }

    alert(response.data?.message || "Result deleted successfully.");
    await loadResults();
  } catch (error) {
    console.error("Failed to delete result:", error);
    alert(error.message || "Failed to delete result.");
  }
}

/* =========================================================
BULK PUBLISH/UNPUBLISH
========================================================= */
async function publishAll() {
  const classId = document.getElementById("bulkClass")?.value;
  const sessionId = document.getElementById("bulkSession")?.value;
  const termId = document.getElementById("bulkTerm")?.value;

  if (!classId || !sessionId || !termId) {
    showMessage("bulkActionMessage", "Please select Class, Session, and Term.", "error");
    return;
  }

  if (!confirm("Are you sure you want to publish all results for this class, session, and term?")) {
    return;
  }

  try {
    const response = await apiRequest("/admin/results/publish", {
      method: "PATCH",
      body: JSON.stringify({ classId, sessionId, termId }),
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to publish results.");
    }

    showMessage("bulkActionMessage", response.data?.message || "Results published successfully.", "success");
    await loadResults();
  } catch (error) {
    console.error("Failed to publish results:", error);
    showMessage("bulkActionMessage", error.message || "Failed to publish results.", "error");
  }
}

async function unpublishAll() {
  const classId = document.getElementById("bulkClass")?.value;
  const sessionId = document.getElementById("bulkSession")?.value;
  const termId = document.getElementById("bulkTerm")?.value;

  if (!classId || !sessionId || !termId) {
    showMessage("bulkActionMessage", "Please select Class, Session, and Term.", "error");
    return;
  }

  if (!confirm("Are you sure you want to unpublish all results for this class, session, and term?")) {
    return;
  }

  try {
    const response = await apiRequest("/admin/results/unpublish", {
      method: "PATCH",
      body: JSON.stringify({ classId, sessionId, termId }),
    });

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to unpublish results.");
    }

    showMessage("bulkActionMessage", response.data?.message || "Results unpublished successfully.", "success");
    await loadResults();
  } catch (error) {
    console.error("Failed to unpublish results:", error);
    showMessage("bulkActionMessage", error.message || "Failed to unpublish results.", "error");
  }
}

/* =========================================================
EVENT LISTENERS
========================================================= */
function setupEvents() {
  document.getElementById("applyFiltersBtn")?.addEventListener("click", loadResults);
  document.getElementById("clearFiltersBtn")?.addEventListener("click", () => {
    document.getElementById("filterClass").value = "";
    document.getElementById("filterSession").value = "";
    document.getElementById("filterTerm").value = "";
    document.getElementById("filterSubject").value = "";
    document.getElementById("filterStudent").value = "";
    loadResults();
  });

  document.getElementById("publishAllBtn")?.addEventListener("click", publishAll);
  document.getElementById("unpublishAllBtn")?.addEventListener("click", unpublishAll);

  document.addEventListener("click", (event) => {
    const deleteButton = event.target.closest(".delete-result-btn");
    if (!deleteButton || deleteButton.disabled) return;
    const resultId = deleteButton.dataset.id;
    const studentName = deleteButton.dataset.student;
    const subjectName = deleteButton.dataset.subject;
    if (!resultId) return;
    deleteResult(resultId, studentName, subjectName);
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
  setupEvents();
  await loadCurrentSessionDisplay();
  await loadCurrentTermDisplay();
  await loadInitialData();
  await loadResults();
});