requireAdmin();
setupLogout();
setupMobileMenu();


let allSessions = [];
let currentAnnualReport = null;

/* =========================================================
LOAD INITIAL DATA
========================================================= */
async function loadInitialData() {
  try {
    const [studentsRes, sessionsRes] = await Promise.all([
      apiRequest("/admin/students"),
      apiRequest("/admin/sessions"),
    ]);

    if (studentsRes.ok) allStudents = studentsRes.data?.students || [];
    if (sessionsRes.ok) allSessions = sessionsRes.data?.sessions || [];

    populateDropdowns();
  } catch (error) {
    console.error("Failed to load initial data:", error);
  }
}

/* =========================================================
POPULATE DROPDOWNS
========================================================= */
function populateDropdowns() {
  const studentSelect = document.getElementById("annualStudent");
  const sessionSelect = document.getElementById("annualSession");

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
}

/* =========================================================
GENERATE ANNUAL REPORT
========================================================= */
async function generateAnnualReport() {
  const studentId = document.getElementById("annualStudent")?.value;
  const sessionId = document.getElementById("annualSession")?.value;
  const downloadBtn = document.getElementById("downloadAnnualPdfBtn");
  const loading = document.getElementById("annualLoading");
  const preview = document.getElementById("annualPreview");

  hideMessage("annualMessage");

  if (!studentId || !sessionId) {
    showMessage("annualMessage", "Please select a student and session.", "error");
    return;
  }

  if (loading) loading.classList.remove("hidden");
  if (preview) preview.classList.add("hidden");
  if (downloadBtn) downloadBtn.classList.add("hidden");

  try {
    const response = await apiRequest(
      `/admin/annual-report?studentId=${studentId}&sessionId=${sessionId}`
    );

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to generate annual report.");
    }

    currentAnnualReport = response.data;
    renderAnnualPreview(currentAnnualReport);

    if (preview) preview.classList.remove("hidden");
    if (downloadBtn) downloadBtn.classList.remove("hidden");

    showMessage("annualMessage", "Annual report generated successfully.", "success");
  } catch (error) {
    console.error("Failed to generate annual report:", error);
    showMessage("annualMessage", error.message || "Failed to generate annual report.", "error");
  } finally {
    if (loading) loading.classList.add("hidden");
  }
}

/* =========================================================
RENDER ANNUAL PREVIEW
========================================================= */
function renderAnnualPreview(report) {
  const preview = document.getElementById("annualPreview");
  if (!preview) return;

  const student = report.student || {};
  const session = report.session || {};
  const termReports = report.termReports || [];
  const summary = report.summary || {};

  preview.innerHTML = `
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center border-b-2 border-purple-500 pb-4 mb-6">
        <h1 class="text-3xl font-bold text-purple-600">ANNUAL REPORT CARD</h1>
        <p class="text-gray-600 mt-2">Edulog Academy</p>
      </div>

      <!-- Student Info -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p class="text-sm text-gray-500">Student Name</p>
          <p class="font-semibold text-gray-800">${escapeHTML(student.fullname)}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500">Admission Number</p>
          <p class="font-semibold text-gray-800">${escapeHTML(student.admissionNumber)}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500">Class</p>
          <p class="font-semibold text-gray-800">${escapeHTML(student.className)}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500">Session</p>
          <p class="font-semibold text-gray-800">${escapeHTML(session.sessionName)}</p>
        </div>
      </div>

      <!-- Term-by-Term Breakdown -->
      ${termReports.length > 0 ? `
        <div class="mb-6">
          <h2 class="text-xl font-bold text-gray-800 mb-3">Term-by-Term Performance</h2>

          ${termReports.map((termReport) => `
            <div class="mb-6 border border-gray-200 rounded-lg overflow-hidden">
              <div class="bg-purple-50 px-4 py-3 border-b border-gray-200">
                <h3 class="text-lg font-bold text-purple-700">${escapeHTML(termReport.termName)}</h3>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full border-collapse">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-600">Subject</th>
                      <th class="border border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-600">Test 1</th>
                      <th class="border border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-600">Test 2</th>
                      <th class="border border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-600">Exam</th>
                      <th class="border border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-600">Total</th>
                      <th class="border border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-600">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(termReport.results || []).map((result) => `
                      <tr class="hover:bg-gray-50">
                        <td class="border border-gray-200 px-3 py-2 text-sm text-gray-800">${escapeHTML(result.subject?.subjectName || "N/A")}</td>
                        <td class="border border-gray-200 px-3 py-2 text-center text-sm text-gray-700">${result.test1}</td>
                        <td class="border border-gray-200 px-3 py-2 text-center text-sm text-gray-700">${result.test2}</td>
                        <td class="border border-gray-200 px-3 py-2 text-center text-sm text-gray-700">${result.exam}</td>
                        <td class="border border-gray-200 px-3 py-2 text-center text-sm font-semibold text-gray-900">${result.total}</td>
                        <td class="border border-gray-200 px-3 py-2 text-center">
                          <span class="px-2 py-0.5 text-xs font-semibold rounded-full ${getGradeColor(result.grade)}">
                            ${result.grade}
                          </span>
                        </td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>

              <div class="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-4">
                <p class="text-sm text-gray-600">Total: <span class="font-bold text-gray-800">${termReport.grandTotal || 0}</span></p>
                <p class="text-sm text-gray-600">Average: <span class="font-bold text-gray-800">${termReport.average || 0}</span></p>
                <p class="text-sm text-gray-600">Position: <span class="font-bold text-gray-800">${escapeHTML(termReport.positionDisplay || "N/A")}</span></p>
              </div>
            </div>
          `).join("")}
        </div>
      ` : `
        <div class="mb-6 p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
          <i class="fa-solid fa-file-circle-xmark text-4xl mb-3 text-gray-300"></i>
          <p class="font-semibold text-gray-700">No term data available</p>
          <p class="text-sm mt-1">No published results found for this student in the selected session.</p>
        </div>
      `}

      <!-- Annual Summary -->
      <div class="mb-6 p-5 bg-purple-50 rounded-lg border border-purple-200">
        <h2 class="text-xl font-bold text-purple-700 mb-4">Annual Summary</h2>

        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p class="text-sm text-gray-600">Annual Average</p>
            <p class="text-2xl font-bold text-purple-600">${summary.annualAverage || 0}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Annual Position</p>
            <p class="text-2xl font-bold text-purple-600">${escapeHTML(summary.annualPositionDisplay || "N/A")}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Overall Grade</p>
            <p class="text-2xl font-bold text-purple-600">${escapeHTML(summary.annualGrade || "N/A")}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Total Subjects</p>
            <p class="text-2xl font-bold text-purple-600">${summary.totalSubjects || 0}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Terms Completed</p>
            <p class="text-2xl font-bold text-purple-600">${termReports.length}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Promotion Status</p>
            <p class="text-lg font-bold ${summary.promoted ? "text-green-600" : "text-red-600"}">
              ${summary.promoted ? "Promoted" : "Not Promoted"}
            </p>
          </div>
        </div>
      </div>

      <!-- Promotion Remark -->
      ${summary.promotionRemark ? `
        <div class="mb-6 p-4 ${summary.promoted ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} rounded-lg border">
          <p class="text-sm ${summary.promoted ? "text-green-600" : "text-red-600"} mb-1">Promotion Remark</p>
          <p class="text-gray-800 font-medium">${escapeHTML(summary.promotionRemark)}</p>
        </div>
      ` : ""}

      <!-- Principal Remark -->
      ${summary.principalRemark ? `
        <div class="border-t-2 border-gray-300 pt-4">
          <p class="text-sm text-gray-600 mb-1">Principal's Remark</p>
          <p class="text-gray-800 italic">${escapeHTML(summary.principalRemark)}</p>
        </div>
      ` : ""}
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

/* =========================================================
DOWNLOAD PDF
========================================================= */
function downloadPDF() {
  const studentId = document.getElementById("annualStudent")?.value;
  const sessionId = document.getElementById("annualSession")?.value;

  if (!studentId || !sessionId) {
    showMessage("annualMessage", "Please generate the report first.", "error");
    return;
  }

  const pdfUrl = `${API_URL}/api/annual-report/pdf?studentId=${studentId}&sessionId=${sessionId}`;
  window.open(pdfUrl, "_blank");
}

/* =========================================================
EVENT LISTENERS
========================================================= */
function setupEvents() {
  document.getElementById("generateAnnualBtn")?.addEventListener("click", generateAnnualReport);
  document.getElementById("downloadAnnualPdfBtn")?.addEventListener("click", downloadPDF);
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