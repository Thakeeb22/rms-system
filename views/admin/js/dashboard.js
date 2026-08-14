requireAdmin();
const user = getUser();

document.getElementById("adminName").textContent =
  user.fullname || "Administrator";

let recentStudents = [];
let recentTeachers = [];
let recentResults = [];

async function loadDashboardSummary() {
  const response = await apiRequest("/dashboard/summary");
  if (!response.ok) {
    console.error(response.data.message);
    return;
  }

  const data = response.data;

  document.getElementById("students").textContent = data.totalStudents;
  document.getElementById("teachers").textContent = data.totalTeachers;
  document.getElementById("classes").textContent = data.totalClasses;
  document.getElementById("subject").textContent = data.totalSubjects;
  document.getElementById("terms").textContent = data.totalTerms;
  document.getElementById("totalResults").textContent = data.totalResults;
}

async function loadRecentActivities() {
  const response = await apiRequest("/dashboard/recent-activities");

  if (!response.ok) {
    console.error(response.data.message);
    return;
  }

  recentStudents = response.data.latestStudents;
  recentTeachers = response.data.latestTeachers;
  recentResults = response.data.latestResults;

  renderTable("students");
  setActiveTab(document.getElementById("studentsTab"));
}
function renderTable(type) {
  const tableHead = document.getElementById("recentActivitiesHead");
  const tableBody = document.getElementById("recentActivitiesBody");
  tableHead.innerHTML = "";
  tableBody.innerHTML = "";

  if (type === "students") {
    renderStudentsTable(tableHead, tableBody);
  }

  if (type === "teachers") {
    renderTeacherTable(tableHead, tableBody);
  }
  if (type === "results") {
    renderResultTable(tableHead, tableBody);
  }
}
function renderStudentsTable(tableHead, tableBody) {
  tableHead.innerHTML = `
    <tr>
    <th>Student Name</th>
    <th>Admission Number</th>
    <th>Created</th>
    <th>Actions</th>
    </tr>
    `;
  recentStudents.forEach((student) => {
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${student.fullname}</td>
        <td>${student.admissionNumber}</td>
        <td>${formatDate(student.createdAt)}</td>
        <td>
        <button class="w-9 h-9 rounded-full hover:bg-gray-100 transition">
        <i class="fa-solid fa-ellipsis"></i>
        </button>
        </td>
        `;
    tableBody.appendChild(row);
  });
}
function renderTeacherTable(tableHead, tableBody) {
  tableHead.innerHTML = `
    <tr>
    <th>Teacher Name</th>
    <th>Email</th>
    <th>Created</th>
    <th>Actions</th>
    </tr>
    `;
  recentTeachers.forEach((teacher) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${teacher.fullname}</td>
        <td>${teacher.email}</td>
        <td>${formatDate(teacher.createdAt)}</td>
        <td>
        <button class="w-9 h-9 rounded-full hover:bg-gray-100 transition">
        <i class="fa-solid fa-ellipsis"></i>
        </button>
        </td>
        `;
    tableBody.appendChild(row);
  });
}
function renderResultTable(tableHead, tableBody) {
  tableHead.innerHTML = `
    <tr>
    <th>Student</th>
    <th>Subject</th>
    <th>Class</th>
    <th>Total</th>
    <th>Grade</th>
    <th>Status</th>
    <th>Actions</th>
    </tr>
    `;
  recentResults.forEach((result) => {
    const row = document.createElement("tr");

    const StatusClass = result.published
      ? "bg-green-100 text-green-700"
      : "bg-yellow-100 text-yellow-700";
    const statusText = result.published ? "Published" : "Unpublished";

    row.innerHTML = `
        <td>${result.student?.fullname || "N/A"}</td>
        <td>${result.subject?.subjectName || "N/A"}</td>
        <td>${result.class?.className || "N/A"}</td>
        <td>${result.total ?? "N/A"}</td>
        <td>${result.grade || "N/A"}</td>
        <td>
        <span class="px-3 py-1 rounded-full text-sm ${StatusClass} font-medium">
        ${statusText}
        </span>
        </td>
        <td>
        <button class="w-9 h-9 rounded-full hover:bg-gray-100 transition">
        <i class="fa-solid fa-ellipsis"></i>
        </button>
        </td>
        `;
    tableBody.appendChild(row);
  });
}
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

document.getElementById("studentsTab").addEventListener("click", () => {
  renderTable("students");
  setActiveTab(document.getElementById("studentsTab"));
});

document.getElementById("teachersTab").addEventListener("click", () => {
  renderTable("teachers");
  setActiveTab(document.getElementById("teachersTab"));
});

document.getElementById("resultsTab").addEventListener("click", () => {
  renderTable("results");
  setActiveTab(document.getElementById("resultsTab"));
});

function setActiveTab(activeTab) {
  const tabs = [
    document.getElementById("studentsTab"),
    document.getElementById("teachersTab"),
    document.getElementById("resultsTab"),
  ];
  tabs.forEach((tab) => {
    tab.classList.remove("border-b-2", "border-blue-500", "text-blue-600");
  });
  activeTab.classList.add("border-b-2", "border-blue-500", "text-blue-600");
}

const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", () => {
  logout();
});
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mobileMenu = document.getElementById("mobileMenu");
const closeMobileMenu = document.getElementById("closeMobileMenu");
const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");
const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");

function openMobileMenu() {
  mobileMenu.classList.remove("hidden");
  mobileMenuBtn.setAttribute("aria-expanded", "true");
}

function closeMobileNavigation() {
  mobileMenu.classList.add("hidden");
  mobileMenuBtn.setAttribute("aria-expanded", "false");
}

mobileMenuBtn.addEventListener("click", openMobileMenu);

closeMobileMenu.addEventListener("click", closeMobileNavigation);

mobileMenuOverlay.addEventListener("click", closeMobileNavigation);

mobileLogoutBtn.addEventListener("click", () => {
  logout();
});
loadDashboardSummary();
loadRecentActivities();

async function initializeDashboard() {
  await loadSearchData();
  setupGlobalSearch();
}

initializeDashboard();