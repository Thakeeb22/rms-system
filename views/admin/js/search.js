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

  if (!searchResults) return;

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

  if (!searchResults) return;

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
          onclick="openSearchResult('./students.html?studentId=${student._id}')"
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
        onclick="openSearchResult('./teachers.html?teacherId=${teacher._id}')"
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
          // Classes
onclick="openSearchResult('./classes.html?id=${classItem._id}')"
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
        onclick="openSearchResult('./subjects.html?id=${subject._id}')"
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
          // Results
onclick="openSearchResult('./results.html?id=${result._id}')"
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

function setupGlobalSearch() {
  const globalSearch = document.getElementById("globalSearch");
  const searchResults = document.getElementById("searchResults");

  if (!globalSearch || !searchResults) return;

  globalSearch.addEventListener("input", (event) => {
    performGlobalSearch(event.target.value);
  });

  document.addEventListener("click", (event) => {
    const searchContainer = globalSearch.closest(".relative");

    if (searchContainer && !searchContainer.contains(event.target)) {
      searchResults.classList.add("hidden");
    }
  });
}
document.addEventListener("DOMContentLoaded", async () => {
  await loadSearchData();
  setupGlobalSearch();
});
