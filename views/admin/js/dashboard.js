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

let allStudents = [];
let allTeachers = [];
let allClasses = [];
let allSubjects = [];
let allResults = [];

async function loadSearchData() {
  try {
    const [
      studentsResponse,
      teachersResponse,
      classesResponse,
      subjectsResponse,
      resultsResponse,
    ] = await Promise.all([
      apiRequest("/admin/students"),
      apiRequest("/admin/teachers"),
      apiRequest("/admin/classes"),
      apiRequest("/admin/subjects"),
      apiRequest("/admin/results"),
    ]);

    if (studentsResponse.ok) {
      allStudents = studentsResponse.data.students || [];
    }

    if (teachersResponse.ok) {
      allTeachers = teachersResponse.data.teachers || [];
    }

    if (classesResponse.ok) {
      allClasses = classesResponse.data.classes || [];
    }

    if (subjectsResponse.ok) {
      allSubjects = subjectsResponse.data.subjects || [];
    }

    if (resultsResponse.ok) {
      allResults = resultsResponse.data.results || [];
    }

    console.log("Search data loaded:", {
      students: allStudents.length,
      teachers: allTeachers.length,
      classes: allClasses.length,
      subjects: allSubjects.length,
      results: allResults.length,
    });
  } catch (error) {
    console.error("Failed to load search data:", error);
  }
}

function performGlobalSearch(query) {
  const searchResults = document.getElementById("searchResults");

  query = query.trim().toLowerCase();

  if (!query) {
    searchResults.classList.add("hidden");
    searchResults.innerHTML = "";
    return;
  }

  const matchedStudents = allStudents.filter((student) => {
    return (
      student.fullname?.toLowerCase().includes(query) ||
      student.admissionNumber?.toLowerCase().includes(query) ||
      student.guardianName?.toLowerCase().includes(query) ||
      student.guardianPhone?.toLowerCase().includes(query) ||
      student.gender?.toLowerCase().includes(query) ||
      student.class?.className?.toLowerCase().includes(query)
    );
  });

  // =========================
  // TEACHERS
  // =========================
  const matchedTeachers = allTeachers.filter((teacher) => {
    return (
      teacher.fullname?.toLowerCase().includes(query) ||
      teacher.email?.toLowerCase().includes(query) ||
      teacher.phone?.toLowerCase().includes(query) ||
      teacher.assignedClass?.className?.toLowerCase().includes(query) ||
      teacher.subjects?.some((subject) =>
        subject.subjectName?.toLowerCase().includes(query),
      )
    );
  });

  const matchedClasses = allClasses.filter((classItem) => {
    return classItem.className?.toLowerCase().includes(query);
  });

  const matchedSubjects = allSubjects.filter((subject) => {
    return subject.subjectName?.toLowerCase().includes(query);
  });

  const matchedResults = allResults.filter((result) => {
    return (
      result.student?.fullname?.toLowerCase().includes(query) ||
      result.student?.admissionNumber?.toLowerCase().includes(query) ||
      result.subject?.subjectName?.toLowerCase().includes(query) ||
      result.teacher?.fullname?.toLowerCase().includes(query) ||
      result.class?.className?.toLowerCase().includes(query) ||
      result.session?.sessionName?.toLowerCase().includes(query) ||
      result.term?.termName?.toLowerCase().includes(query) ||
      String(result.test1 ?? "").includes(query) ||
      String(result.test2 ?? "").includes(query) ||
      String(result.exam ?? "").includes(query) ||
      String(result.total ?? "").includes(query) ||
      result.grade?.toLowerCase().includes(query)
    );
  });

  renderSearchResults({
    students: matchedStudents,
    teachers: matchedTeachers,
    classes: matchedClasses,
    subjects: matchedSubjects,
    results: matchedResults,
  });
}

function renderSearchResults(data) {
  const searchResults = document.getElementById("searchResults");

  const totalMatches =
    data.students.length +
    data.teachers.length +
    data.classes.length +
    data.subjects.length +
    data.results.length;

  searchResults.innerHTML = "";

  if (totalMatches === 0) {
    searchResults.innerHTML = `
      <div class="p-4 text-center text-gray-500">
        <i class="fa-solid fa-magnifying-glass mb-2 text-xl"></i>
        <p>No records found</p>
      </div>
    `;

    searchResults.classList.remove("hidden");
    return;
  }

  // =========================
  // STUDENTS
  // =========================

  if (data.students.length > 0) {
    searchResults.innerHTML += `
      <div class="px-4 py-2 bg-gray-100 font-semibold text-blue-600">
        <i class="fa-solid fa-user-graduate mr-2"></i>
        Students (${data.students.length})
      </div>
    `;

    data.students.slice(0, 10).forEach((student) => {
      searchResults.innerHTML += `
        <div
          class="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b"
          onclick="openSearchResult('/admin/students.html?id=${student._id}')"
        >
          <p class="font-semibold">
            ${student.fullname || "Unknown student"}
          </p>

          <p class="text-sm text-gray-500">
            Admission No: ${student.admissionNumber || "N/A"}
          </p>
        </div>
      `;
    });
  }

  // =========================
  // TEACHERS
  // =========================

  if (data.teachers.length > 0) {
    searchResults.innerHTML += `
      <div class="px-4 py-2 bg-gray-100 font-semibold text-blue-600">
        <i class="fa-solid fa-chalkboard-user mr-2"></i>
        Teachers (${data.teachers.length})
      </div>
    `;

    data.teachers.slice(0, 10).forEach((teacher) => {
      searchResults.innerHTML += `
        <div
          class="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b"
          onclick="openSearchResult('/admin/teachers.html?id=${teacher._id}')"
        >
          <p class="font-semibold">
            ${teacher.fullname || "Unknown teacher"}
          </p>

          <p class="text-sm text-gray-500">
            ${teacher.email || "No email"}
          </p>
        </div>
      `;
    });
  }

  // =========================
  // CLASSES
  // =========================

  if (data.classes.length > 0) {
    searchResults.innerHTML += `
      <div class="px-4 py-2 bg-gray-100 font-semibold text-blue-600">
        <i class="fa-solid fa-school mr-2"></i>
        Classes (${data.classes.length})
      </div>
    `;

    data.classes.slice(0, 10).forEach((classItem) => {
      searchResults.innerHTML += `
        <div
          class="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b"
          onclick="openSearchResult('/admin/classes.html?id=${classItem._id}')"
        >
          <p class="font-semibold">
            ${classItem.className || "Unknown class"}
          </p>

          <p class="text-sm text-gray-500">
            Class
          </p>
        </div>
      `;
    });
  }

  // =========================
  // SUBJECTS
  // =========================

  if (data.subjects.length > 0) {
    searchResults.innerHTML += `
      <div class="px-4 py-2 bg-gray-100 font-semibold text-blue-600">
        <i class="fa-solid fa-book mr-2"></i>
        Subjects (${data.subjects.length})
      </div>
    `;

    data.subjects.slice(0, 10).forEach((subject) => {
      searchResults.innerHTML += `
        <div
          class="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b"
          onclick="openSearchResult('/admin/subjects.html?id=${subject._id}')"
        >
          <p class="font-semibold">
            ${subject.subjectName || "Unknown subject"}
          </p>

          <p class="text-sm text-gray-500">
            Subject
          </p>
        </div>
      `;
    });
  }

  // =========================
  // RESULTS
  // =========================

  if (data.results.length > 0) {
    searchResults.innerHTML += `
      <div class="px-4 py-2 bg-gray-100 font-semibold text-blue-600">
        <i class="fa-solid fa-chart-column mr-2"></i>
        Results (${data.results.length})
      </div>
    `;

    data.results.slice(0, 10).forEach((result) => {
      searchResults.innerHTML += `
        <div
          class="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b"
          onclick="openSearchResult('/admin/results.html?id=${result._id}')"
        >
          <p class="font-semibold">
            ${result.student?.fullname || "Unknown student"}
          </p>

          <p class="text-sm text-gray-500">
            ${result.subject?.subjectName || "N/A"}
            •
            ${result.class?.className || "N/A"}
          </p>
        </div>
      `;
    });
  }

  searchResults.classList.remove("hidden");
}
function openSearchResult(url) {
  window.location.href = url;
}

const globalSearch = document.getElementById("globalSearch");

globalSearch.addEventListener("input", (event) => {
  performGlobalSearch(event.target.value);
});
document.addEventListener("click", (event) => {
  const searchContainer = globalSearch.closest(".relative");

  if (!searchContainer.contains(event.target)) {
    document.getElementById("searchResults").classList.add("hidden");
  }
});
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
loadSearchData();
