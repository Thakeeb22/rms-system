// 1. Enforce teacher role using the existing guard system
requireTeacher();

// 2. Setup generic utilities (assuming setupLogout and setupMobileMenu are in auth.js or a shared utils file)
// If they are in auth.js, ensure they are imported or available globally.
if (typeof setupLogout === 'function') setupLogout();
if (typeof setupMobileMenu === 'function') setupMobileMenu();

let dashboardData = null;

/* =========================================================
LOAD DASHBOARD
========================================================= */
async function loadDashboard() {
  try {
    // This endpoint needs to be created in the backend (see Step 3 below)
    const response = await apiRequest("/teacher/dashboard");

    if (!response.ok) {
      throw new Error(response.data?.message || "Failed to load dashboard.");
    }

    dashboardData = response.data?.dashboard;

    renderTeacherInfo();
    renderStats();
    renderAssignments();
    renderRecentResults();
  } catch (error) {
    console.error("Failed to load dashboard:", error);
    alert(error.message || "Failed to load dashboard. Please try again or contact admin.");
  }
}

/* =========================================================
RENDER TEACHER INFO
========================================================= */
function renderTeacherInfo() {
  if (!dashboardData) return;
  const { teacher, currentSession, currentTerm, myAssignments } = dashboardData;
  
  document.getElementById("teacherName").textContent = teacher.fullname || "Teacher";
  document.getElementById("currentSession").textContent = currentSession?.sessionName || "Not Set";
  document.getElementById("currentTerm").textContent = currentTerm?.termName || "Not Set";

  const assignedClassEl = document.getElementById("assignedClass");
  
  // ✅ Check if they are a Class Teacher (Homeroom)
  if (teacher.assignedClass && teacher.assignedClass.className) {
    assignedClassEl.textContent = teacher.assignedClass.className;
    assignedClassEl.title = "You are the Class Teacher for this class";
    assignedClassEl.className = "text-blue-600 font-semibold";
  } 
  // ✅ Fallback: If they are only a Subject Teacher
  else if (myAssignments && myAssignments.length > 0) {
    // Get unique classes they teach in
    const uniqueClasses = [...new Set(myAssignments.map(a => a.class?.className))];
    assignedClassEl.textContent = `Subject Teacher (${uniqueClasses.join(', ')})`;
    assignedClassEl.title = "You are a Subject Teacher, not a Class Teacher";
    assignedClassEl.className = "text-gray-600";
  } 
  // ✅ Fallback: No assignments at all
  else {
    assignedClassEl.textContent = "None";
    assignedClassEl.className = "text-gray-400";
  }
}

/* =========================================================
RENDER STATS
========================================================= */
function renderStats() {
  if (!dashboardData) return;

  document.getElementById("statStudents").textContent = dashboardData.totalStudents || 0;
  document.getElementById("statSubjects").textContent = dashboardData.totalAssignments || 0;
  document.getElementById("statResults").textContent = dashboardData.totalResults || 0;
  document.getElementById("statPublished").textContent = dashboardData.publishedResults || 0;
  document.getElementById("statUnpublished").textContent = dashboardData.unpublishedResults || 0;
  document.getElementById("statAssessments").textContent = dashboardData.totalAssessments || 0;
}

/* =========================================================
RENDER ASSIGNMENTS
========================================================= */
function renderAssignments() {
  const container = document.getElementById("assignmentsContainer");
  const loading = document.getElementById("assignmentsLoading");

  if (!container) return;
  if (loading) loading.classList.add("hidden");

  if (!dashboardData || !dashboardData.myAssignments || dashboardData.myAssignments.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fa-solid fa-book-open text-4xl mb-3 text-gray-300"></i>
        <p class="font-semibold">No subject assignments</p>
        <p class="text-sm mt-1">Contact admin to assign subjects to you.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = dashboardData.myAssignments
    .map(
      (assignment) => `
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <i class="fa-solid fa-book text-blue-500"></i>
          </div>
          <div>
            <p class="font-semibold text-gray-800">${escapeHTML(assignment.subject?.subjectName || "N/A")}</p>
            <p class="text-xs text-gray-500">Class: ${escapeHTML(assignment.class?.className || "N/A")}</p>
          </div>
        </div>
        <a href="./results.html?subjectId=${assignment.subject?._id}&classId=${assignment.class?._id}" class="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition">
          Enter Marks
        </a>
      </div>
    `
    )
    .join("");
}

/* =========================================================
RENDER RECENT RESULTS
========================================================= */
function renderRecentResults() {
  const container = document.getElementById("recentResultsContainer");
  const loading = document.getElementById("recentResultsLoading");

  if (!container) return;
  if (loading) loading.classList.add("hidden");

  if (!dashboardData || !dashboardData.recentResults || dashboardData.recentResults.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fa-solid fa-chart-column text-4xl mb-3 text-gray-300"></i>
        <p class="font-semibold">No recent results</p>
        <p class="text-sm mt-1">Start entering results for your students.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = dashboardData.recentResults
    .map(
      (result) => `
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <i class="fa-solid fa-user-graduate text-purple-500"></i>
          </div>
          <div>
            <p class="font-semibold text-gray-800">${escapeHTML(result.student?.fullname || "N/A")}</p>
            <p class="text-xs text-gray-500">${escapeHTML(result.subject?.subjectName || "N/A")} • ${result.total}/100</p>
          </div>
        </div>
        <div class="text-right">
          <span class="px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(result.grade)}">
            ${result.grade}
          </span>
          <p class="text-xs mt-1 ${result.published ? "text-green-600" : "text-yellow-600"}">
            ${result.published ? "Published" : "Pending"}
          </p>
        </div>
      </div>
    `
    )
    .join("");
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

/* =========================================================
INITIALIZE
========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
  await loadDashboard();
});