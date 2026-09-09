requireAdmin();
setupLogout();
setupMobileMenu();

let allSessions = [];
let allTerms = [];
let currentReport = null;

/* =========================================================
LOAD INITIAL DATA
========================================================= */
async function loadInitialData() {
  try {
    const [studentsRes, sessionsRes, termsRes] = await Promise.all([
      apiRequest("/admin/students"),
      apiRequest("/admin/sessions"),
      apiRequest("/admin/terms"),
    ]);

    if (studentsRes.ok) allStudents = studentsRes.data?.students || [];
    if (sessionsRes.ok) allSessions = sessionsRes.data?.sessions || [];
    if (termsRes.ok) allTerms = termsRes.data?.terms || [];

    populateDropdowns();
  } catch (error) {
    console.error("Failed to load initial data:", error);
  }
}

/* =========================================================
POPULATE DROPDOWNS
========================================================= */
function populateDropdowns() {
  const studentSelect = document.getElementById("reportStudent");
  const sessionSelect = document.getElementById("reportSession");
  const termSelect = document.getElementById("reportTerm");

  if (studentSelect) {
    studentSelect.innerHTML = '<option value="">Select a student</option>';
    allStudents
      .filter((s) => s.isActive)
      .forEach((student) => {
        const opt = document.createElement("option");
        opt.value = student._id;
        opt.textContent = `${student.fullname} (${student.admissionNumber})`;
        studentSelect.appendChild(opt);
      });
  }

  if (sessionSelect) {
    sessionSelect.innerHTML = '<option value="">Select a session</option>';
    allSessions.forEach((session) => {
      const opt = document.createElement("option");
      opt.value = session._id;
      opt.textContent = session.sessionName;
      if (session.isCurrent) opt.selected = true;
      sessionSelect.appendChild(opt);
    });
  }

  if (termSelect) {
    termSelect.innerHTML = '<option value="">Select a term</option>';
    allTerms.forEach((term) => {
      const opt = document.createElement("option");
      opt.value = term._id;
      opt.textContent = term.termName;
      if (term.isCurrent) opt.selected = true;
      termSelect.appendChild(opt);
    });
  }
}

/* =========================================================
GENERATE REPORT
========================================================= */
async function generateReport() {
  const studentId = document.getElementById("reportStudent")?.value;
  const sessionId = document.getElementById("reportSession")?.value;
  const termId = document.getElementById("reportTerm")?.value;
  const downloadBtn = document.getElementById("downloadPdfBtn");
  const loading = document.getElementById("reportLoading");
  const preview = document.getElementById("reportPreview");

  hideMessage("reportMessage");

  if (!studentId || !sessionId || !termId) {
    showMessage(
      "reportMessage",
      "Please select student, session, and term.",
      "error",
    );
    return;
  }

  if (loading) loading.classList.remove("hidden");
  if (preview) preview.classList.add("hidden");
  if (downloadBtn) downloadBtn.classList.add("hidden");

  try {
    const response = await apiRequest(
      `/admin/report-card?studentId=${studentId}&sessionId=${sessionId}&termId=${termId}`,
    );

    if (!response.ok) {
      throw new Error(
        response.data?.message || "Failed to generate report card.",
      );
    }

    currentReport = response.data;
    renderReportPreview(currentReport);

    if (preview) preview.classList.remove("hidden");
    if (downloadBtn) downloadBtn.classList.remove("hidden");

    showMessage(
      "reportMessage",
      "Report card generated successfully.",
      "success",
    );
  } catch (error) {
    console.error("Failed to generate report:", error);
    showMessage(
      "reportMessage",
      error.message || "Failed to generate report card.",
      "error",
    );
  } finally {
    if (loading) loading.classList.add("hidden");
  }
}

/* =========================================================
RENDER REPORT PREVIEW
========================================================= */
function renderReportPreview(report) {
  const preview = document.getElementById("reportPreview");
  if (!preview) return;

  preview.innerHTML = `
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center border-b-2 border-blue-500 pb-4 mb-6">
        <h1 class="text-3xl font-bold text-blue-600">STUDENT REPORT CARD</h1>
        <p class="text-gray-600 mt-2">Edulog Academy</p>
      </div>

      <!-- Student Info -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p class="text-sm text-gray-500">Student Name</p>
          <p class="font-semibold text-gray-800">${escapeHTML(report.student.fullname)}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500">Admission Number</p>
          <p class="font-semibold text-gray-800">${escapeHTML(report.student.admissionNumber)}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500">Class</p>
          <p class="font-semibold text-gray-800">${escapeHTML(report.student.class)}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500">Session</p>
          <p class="font-semibold text-gray-800">${escapeHTML(report.session.sessionName)}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500">Term</p>
          <p class="font-semibold text-gray-800">${escapeHTML(report.term.termName)}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500">Class Teacher</p>
          <p class="font-semibold text-gray-800">${escapeHTML(report.summary.classTeacher)}</p>
        </div>
      </div>

      <!-- Results Table -->
      <div class="mb-6">
        <h2 class="text-xl font-bold text-gray-800 mb-3">Academic Performance</h2>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse border border-gray-300">
            <thead class="bg-blue-50">
              <tr>
                <th class="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Subject</th>
                <th class="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">Test 1</th>
                <th class="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">Test 2</th>
                <th class="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">Exam</th>
                <th class="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">Total</th>
                <th class="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">Grade</th>
                <th class="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700">Remark</th>
              </tr>
            </thead>
            <tbody>
              ${report.results
                .map(
                  (result) => `
                <tr class="hover:bg-gray-50">
                  <td class="border border-gray-300 px-4 py-2 text-sm text-gray-800">${escapeHTML(result.subject.subjectName)}</td>
                  <td class="border border-gray-300 px-4 py-2 text-center text-sm text-gray-800">${result.test1}</td>
                  <td class="border border-gray-300 px-4 py-2 text-center text-sm text-gray-800">${result.test2}</td>
                  <td class="border border-gray-300 px-4 py-2 text-center text-sm text-gray-800">${result.exam}</td>
                  <td class="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900">${result.total}</td>
                  <td class="border border-gray-300 px-4 py-2 text-center">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(result.grade)}">
                      ${result.grade}
                    </span>
                  </td>
                  <td class="border border-gray-300 px-4 py-2 text-center text-sm text-gray-700">${escapeHTML(result.remark)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Summary -->
      <div class="grid grid-cols-2 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
        <div>
          <p class="text-sm text-gray-600">Total Subjects</p>
          <p class="text-2xl font-bold text-blue-600">${report.summary.totalSubjects}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">Grand Total</p>
          <p class="text-2xl font-bold text-blue-600">${report.summary.grandTotal}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">Average</p>
          <p class="text-2xl font-bold text-blue-600">${report.summary.average}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">Position</p>
          <p class="text-2xl font-bold text-blue-600">${escapeHTML(report.summary.positionDisplay)}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">Overall Grade</p>
          <p class="text-2xl font-bold text-blue-600">${report.summary.overallGrade}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">Overall Remark</p>
          <p class="text-lg font-semibold text-blue-600">${escapeHTML(report.summary.overallRemark)}</p>
        </div>
      </div>

      <!-- Assessment -->
      ${
        report.assessment
          ? `
        <div class="mb-6">
          <h2 class="text-xl font-bold text-gray-800 mb-3">Assessment</h2>
          
          <!-- Attendance -->
          <div class="mb-4">
            <h3 class="text-lg font-semibold text-gray-700 mb-2">Attendance</h3>
            <div class="grid grid-cols-3 gap-4">
              <div class="p-3 bg-gray-50 rounded">
                <p class="text-sm text-gray-600">School Opened</p>
                <p class="text-xl font-bold text-gray-800">${report.assessment.attendance?.schoolOpened || 0}</p>
              </div>
              <div class="p-3 bg-green-50 rounded">
                <p class="text-sm text-gray-600">Present</p>
                <p class="text-xl font-bold text-green-600">${report.assessment.attendance?.present || 0}</p>
              </div>
              <div class="p-3 bg-red-50 rounded">
                <p class="text-sm text-gray-600">Absent</p>
                <p class="text-xl font-bold text-red-600">${report.assessment.attendance?.absent || 0}</p>
              </div>
            </div>
          </div>

          <!-- Affective -->
          <div class="mb-4">
            <h3 class="text-lg font-semibold text-gray-700 mb-2">Affective Traits</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              ${
                report.assessment.affective
                  ? Object.entries(report.assessment.affective)
                      .map(
                        ([key, value]) => `
                  <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span class="text-sm text-gray-700 capitalize">${key}</span>
                    <span class="font-semibold text-blue-600">${value}/5</span>
                  </div>
                `,
                      )
                      .join("")
                  : ""
              }
            </div>
          </div>

          <!-- Psychomotor -->
          <div class="mb-4">
            <h3 class="text-lg font-semibold text-gray-700 mb-2">Psychomotor Skills</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              ${
                report.assessment.psychomotor
                  ? Object.entries(report.assessment.psychomotor)
                      .map(
                        ([key, value]) => `
                  <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span class="text-sm text-gray-700 capitalize">${key.replace(/([A-Z])/g, " $1").trim()}</span>
                    <span class="font-semibold text-blue-600">${value}/5</span>
                  </div>
                `,
                      )
                      .join("")
                  : ""
              }
            </div>
          </div>

          <!-- Comments -->
          <div class="space-y-3">
            ${
              report.assessment.classTeacherComment
                ? `
              <div class="p-3 bg-yellow-50 rounded">
                <p class="text-sm text-gray-600 mb-1">Class Teacher's Comment</p>
                <p class="text-gray-800">${escapeHTML(report.assessment.classTeacherComment)}</p>
              </div>
            `
                : ""
            }
            ${
              report.assessment.principalComment
                ? `
              <div class="p-3 bg-purple-50 rounded">
                <p class="text-sm text-gray-600 mb-1">Principal's Comment</p>
                <p class="text-gray-800">${escapeHTML(report.assessment.principalComment)}</p>
              </div>
            `
                : ""
            }
          </div>
        </div>
      `
          : ""
      }

      <!-- Remarks -->
      <div class="border-t-2 border-gray-300 pt-4 space-y-3">
        <div>
          <p class="text-sm text-gray-600 mb-1">Teacher's Remark</p>
          <p class="text-gray-800 italic">${escapeHTML(report.summary.teacherRemark)}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600 mb-1">Principal's Remark</p>
          <p class="text-gray-800 italic">${escapeHTML(report.summary.principalRemark)}</p>
        </div>
      </div>
    </div>
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

function downloadPDF() {
  const studentId = document.getElementById("reportStudent")?.value;
  const sessionId = document.getElementById("reportSession")?.value;
  const termId = document.getElementById("reportTerm")?.value;

  if (!studentId || !sessionId || !termId) {
    showMessage("reportMessage", "Please generate the report first.", "error");
    return;
  }

  // ✅ Get token from localStorage (same as teacher endpoint)
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  
  // ✅ Use CONFIG.BASE_URL and append token
  const pdfUrl = `${CONFIG.BASE_URL}/pdf/student-report?studentId=${studentId}&sessionId=${sessionId}&termId=${termId}&token=${token}`;
  
  window.open(pdfUrl, "_blank");
}
/* =========================================================
EVENT LISTENERS
========================================================= */
function setupEvents() {
  document
    .getElementById("generateReportBtn")
    ?.addEventListener("click", generateReport);
  document
    .getElementById("downloadPdfBtn")
    ?.addEventListener("click", downloadPDF);
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
});
